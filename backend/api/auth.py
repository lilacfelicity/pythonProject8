from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
import hashlib
import secrets

from database import get_db
from models import User, UserProfile, UserRole

router = APIRouter()
security = HTTPBearer()

# Config
SECRET_KEY = "medical_secret_key_2024"
SALT = secrets.token_hex(32)


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    phone: str


def hash_password(password: str) -> str:
    return hashlib.pbkdf2_hex(password + SALT, SALT.encode(), 100000)


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_token(user_id: int) -> str:
    timestamp = str(int(datetime.now().timestamp()))
    data = f"{user_id}:{timestamp}:{SECRET_KEY}"
    return hashlib.sha256(data.encode()).hexdigest()


def get_current_user(
        credentials: HTTPAuthorizationCredentials = Depends(security),
        db: Session = Depends(get_db)
) -> User:
    # Simple auth - in production use JWT
    user = db.query(User).filter(User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    return user


@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        User.email == request.email.lower()
    ).first()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    user.last_login = datetime.now()
    db.commit()

    token = create_token(user.id)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username
        }
    }


@router.post("/register")
async def register(request: RegisterRequest, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.query(User).filter(
        User.email == request.email.lower()
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    # Create user
    user = User(
        username=request.email.split('@')[0],
        email=request.email.lower(),
        password_hash=hash_password(request.password),
        role=UserRole.PATIENT,
        is_active=True
    )

    db.add(user)
    db.flush()

    # Create profile
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

    return {"message": "Registration successful", "user_id": user.id}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "role": current_user.role.value
    }