from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr, validator
import hashlib
import secrets
import os
from jose import JWTError, jwt
from typing import Optional
import logging

from database import get_db
from models import User, UserProfile, UserRole

# ИСПРАВЛЕНО: Добавлен логгер для отладки
logger = logging.getLogger(__name__)

router = APIRouter()
security = HTTPBearer()

# JWT Config
SECRET_KEY = os.getenv("SECRET_KEY", "medical_secret_key_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Password hashing config
SALT = os.getenv("SALT", "your-salt-here")


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    phone: str
    birth_date: Optional[str] = None  # Формат: YYYY-MM-DD
    gender: str = "other"
    patronymic: Optional[str] = None
    address: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Пароль должен содержать минимум 6 символов')
        return v

    @validator('gender')
    def validate_gender(cls, v):
        if v not in ['male', 'female', 'other']:
            return 'other'
        return v


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None


def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hmac('sha256', (password + SALT).encode(), SALT.encode(), 100000).hex()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access"):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        token_type_check: str = payload.get("type")

        if user_id is None or token_type_check != token_type:
            return None

        return TokenData(user_id=user_id)
    except JWTError:
        return None


def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Извлекаем токен из Authorization header
        token = credentials.credentials

        # Проверяем токен
        token_data = verify_token(token, "access")
        if token_data is None or token_data.user_id is None:
            raise credentials_exception

    except Exception:
        raise credentials_exception

    # Получаем пользователя из базы
    user = db.query(User).filter(
        User.id == token_data.user_id,
        User.is_active == True
    ).first()

    if user is None:
        raise credentials_exception

    return user


# ИСПРАВЛЕНО: Улучшаем optional авторизацию
def get_current_user_optional(
        db: Session = Depends(get_db),
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[User]:
    """Опциональная авторизация - не выбрасывает исключение если токен невалидный"""
    if not credentials:
        return None

    try:
        token = credentials.credentials
        token_data = verify_token(token, "access")
        if token_data is None or token_data.user_id is None:
            return None

        user = db.query(User).filter(
            User.id == token_data.user_id,
            User.is_active == True
        ).first()

        return user
    except Exception:
        return None


@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    logger.info(f"🔐 Login attempt for email: {request.email}")

    # Проверяем пользователя
    user = db.query(User).filter(
        User.email == request.email.lower()
    ).first()

    if not user or not verify_password(request.password, user.password_hash):
        logger.warning(f"❌ Login failed for email: {request.email} - invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )

    if not user.is_active:
        logger.warning(f"❌ Login failed for email: {request.email} - account inactive")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Аккаунт деактивирован"
        )

    # Обновляем время последнего входа
    user.last_login = datetime.now()
    db.commit()

    # Создаем токены
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    logger.info(f"✅ Login successful for user ID: {user.id}")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Проверяем refresh token
        token_data = verify_token(credentials.credentials, "refresh")
        if token_data is None or token_data.user_id is None:
            raise credentials_exception

    except Exception:
        raise credentials_exception

    # Проверяем что пользователь существует и активен
    user = db.query(User).filter(
        User.id == token_data.user_id,
        User.is_active == True
    ).first()

    if user is None:
        raise credentials_exception

    # Создаем новые токены
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


# ИСПРАВЛЕНО: Улучшена обработка дат
def parse_birth_date(date_string: Optional[str]) -> datetime:
    """Безопасная обработка даты рождения"""
    if not date_string:
        # Если дата не указана, используем дату по умолчанию (1990-01-01)
        return datetime(1990, 1, 1)

    try:
        # Пытаемся разобрать дату в формате YYYY-MM-DD
        return datetime.strptime(date_string, "%Y-%m-%d")
    except ValueError:
        try:
            # Пытаемся разобрать дату в формате DD.MM.YYYY
            return datetime.strptime(date_string, "%d.%m.%Y")
        except ValueError:
            try:
                # Пытаемся разобрать дату в формате DD/MM/YYYY
                return datetime.strptime(date_string, "%d/%m/%Y")
            except ValueError:
                logger.warning(f"⚠️ Invalid birth date format: {date_string}")
                # В случае неудачи возвращаем дату по умолчанию
                return datetime(1990, 1, 1)


@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""

    logger.info(f"📝 Registration attempt for email: {request.email}")

    # Проверяем существование пользователя
    existing = db.query(User).filter(
        User.email == request.email.lower()
    ).first()

    if existing:
        logger.warning(f"❌ Registration failed - user already exists: {request.email}")
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует"
        )

    try:
        logger.info(f"🔧 Creating user record for: {request.email}")

        # Создаем пользователя
        user = User(
            username=request.email.split('@')[0],
            email=request.email.lower(),
            password_hash=hash_password(request.password),
            role=UserRole.PATIENT,
            is_active=True,
            created_at=datetime.utcnow()
        )

        db.add(user)
        db.flush()  # Получаем ID пользователя

        logger.info(f"✅ User created with ID: {user.id}")

        # ИСПРАВЛЕНО: Улучшена обработка даты рождения
        birth_date = parse_birth_date(request.birth_date)
        logger.info(f"📅 Birth date parsed: {birth_date}")

        logger.info(f"🔧 Creating user profile for user ID: {user.id}")

        # Создаем профиль
        profile = UserProfile(
            user_id=user.id,
            first_name=request.first_name.strip(),
            last_name=request.last_name.strip(),
            patronymic=request.patronymic.strip() if request.patronymic else None,
            phone_number=request.phone.strip(),
            birth_date=birth_date,
            gender=request.gender,
            address=request.address.strip() if request.address else None
        )

        db.add(profile)
        db.commit()

        logger.info(f"✅ Registration completed successfully for user ID: {user.id}")

        return {
            "message": "Регистрация успешна",
            "user_id": user.id,
            "email": user.email
        }

    except Exception as e:
        logger.error(f"❌ Registration failed for {request.email}: {str(e)}")
        logger.error(f"❌ Exception type: {type(e).__name__}")

        # ИСПРАВЛЕНО: Добавлен rollback в случае ошибки
        db.rollback()

        # Проверяем тип ошибки для более информативного сообщения
        if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Пользователь с таким email уже существует"
            )
        elif "NOT NULL constraint failed" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Не все обязательные поля заполнены"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при создании аккаунта: {str(e)}"
            )


@router.post("/register-and-login", response_model=Token)
async def register_and_login(request: RegisterRequest, db: Session = Depends(get_db)):
    """Регистрация нового пользователя с автоматическим входом в систему"""

    logger.info(f"📝🔐 Registration with auto-login attempt for email: {request.email}")

    # Проверяем существование пользователя
    existing = db.query(User).filter(
        User.email == request.email.lower()
    ).first()

    if existing:
        logger.warning(f"❌ Registration failed - user already exists: {request.email}")
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует"
        )

    try:
        logger.info(f"🔧 Creating user record for: {request.email}")

        # Создаем пользователя
        user = User(
            username=request.email.split('@')[0],
            email=request.email.lower(),
            password_hash=hash_password(request.password),
            role=UserRole.PATIENT,
            is_active=True,
            created_at=datetime.utcnow(),
            last_login=datetime.utcnow()  # Устанавливаем время первого входа
        )

        db.add(user)
        db.flush()  # Получаем ID пользователя

        logger.info(f"✅ User created with ID: {user.id}")

        # ИСПРАВЛЕНО: Улучшена обработка даты рождения
        birth_date = parse_birth_date(request.birth_date)
        logger.info(f"📅 Birth date parsed: {birth_date}")

        logger.info(f"🔧 Creating user profile for user ID: {user.id}")

        # Создаем профиль
        profile = UserProfile(
            user_id=user.id,
            first_name=request.first_name.strip(),
            last_name=request.last_name.strip(),
            patronymic=request.patronymic.strip() if request.patronymic else None,
            phone_number=request.phone.strip(),
            birth_date=birth_date,
            gender=request.gender,
            address=request.address.strip() if request.address else None
        )

        db.add(profile)
        db.commit()

        logger.info(f"✅ Registration completed, creating tokens for user ID: {user.id}")

        # Создаем токены для автоматического входа
        access_token = create_access_token(data={"sub": str(user.id)})
        refresh_token = create_refresh_token(data={"sub": str(user.id)})

        logger.info(f"✅ Registration and login completed successfully for user ID: {user.id}")

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    except Exception as e:
        logger.error(f"❌ Registration and login failed for {request.email}: {str(e)}")
        logger.error(f"❌ Exception type: {type(e).__name__}")

        # ИСПРАВЛЕНО: Добавлен rollback в случае ошибки
        db.rollback()

        # Проверяем тип ошибки для более информативного сообщения
        if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Пользователь с таким email уже существует"
            )
        elif "NOT NULL constraint failed" in str(e):
            raise HTTPException(
                status_code=400,
                detail="Не все обязательные поля заполнены"
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Ошибка при создании аккаунта: {str(e)}"
            )


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    logger.info(f"👤 User info requested for user ID: {current_user.id}")

    try:
        return {
            "id": current_user.id,
            "email": current_user.email,
            "username": current_user.username,
            "role": current_user.role.value,
            "full_name": f"{current_user.profile.first_name} {current_user.profile.last_name}" if current_user.profile else None,
            "first_name": current_user.profile.first_name if current_user.profile else None,
            "last_name": current_user.profile.last_name if current_user.profile else None,
            "phone": current_user.profile.phone_number if current_user.profile else None,
            "is_active": current_user.is_active,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
            "last_login": current_user.last_login.isoformat() if current_user.last_login else None
        }
    except Exception as e:
        logger.error(f"❌ Error getting user info for user ID {current_user.id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Ошибка получения данных пользователя"
        )


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    В случае с JWT логаут обычно обрабатывается на клиенте
    удалением токенов из storage. На сервере можно вести blacklist токенов,
    но для простоты пока просто возвращаем успех.
    """
    logger.info(f"👋 Logout for user ID: {current_user.id}")
    return {"message": "Вы успешно вышли из системы"}


@router.get("/verify")
async def verify_token_endpoint(current_user: User = Depends(get_current_user)):
    """Эндпоинт для проверки валидности токена"""
    return {"valid": True, "user_id": current_user.id}


# ИСПРАВЛЕНО: Добавлен отладочный endpoint
@router.get("/debug/user-count")
async def debug_user_count(db: Session = Depends(get_db)):
    """
    Отладочный endpoint для проверки количества пользователей
    Удалить в продакшене!
    """
    try:
        user_count = db.query(User).count()
        profile_count = db.query(UserProfile).count()

        logger.info(f"🔍 Debug: Users in database: {user_count}, Profiles: {profile_count}")

        return {
            "total_users": user_count,
            "total_profiles": profile_count,
            "users_with_profiles": profile_count  # Должно совпадать с количеством пользователей
        }
    except Exception as e:
        logger.error(f"❌ Debug user count error: {e}")
        return {"error": str(e)}