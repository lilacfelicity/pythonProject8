from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pydantic import BaseModel
import hashlib
import secrets
import os
from jose import JWTError, jwt
from typing import Optional

from database import get_db
from models import User, UserProfile, UserRole

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
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    phone: str


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


def get_current_user_optional(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
) -> Optional[User]:
    """Опциональная авторизация - не выбрасывает исключение если токен невалидный"""
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


@router.post("/login", response_model=Token)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Проверяем пользователя
    user = db.query(User).filter(
        User.email == request.email.lower()
    ).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль"
        )

    if not user.is_active:
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


@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Проверяем существование пользователя
    existing = db.query(User).filter(
        User.email == request.email.lower()
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Пользователь с таким email уже существует"
        )

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
    db.flush()

    # Создаем профиль
    profile = UserProfile(
        user_id=user.id,
        first_name=request.first_name,
        last_name=request.last_name,
        phone_number=request.phone,
        birth_date=datetime(2000, 1, 1),
        gender="other"
    )

    db.add(profile)
    db.commit()

    return {"message": "Регистрация успешна", "user_id": user.id}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role.value,
        "full_name": f"{current_user.profile.first_name} {current_user.profile.last_name}" if current_user.profile else None,
        "is_active": current_user.is_active
    }


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """
    В случае с JWT логаут обычно обрабатывается на клиенте
    удалением токенов из storage. На сервере можно вести blacklist токенов,
    но для простоты пока просто возвращаем успех.
    """
    return {"message": "Вы успешно вышли из системы"}


@router.get("/verify")
async def verify_token_endpoint(current_user: User = Depends(get_current_user)):
    """Эндпоинт для проверки валидности токена"""
    return {"valid": True, "user_id": current_user.id}