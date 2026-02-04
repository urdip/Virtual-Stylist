"""
Simple authentication system for Virtual Stylist
Uses session-based auth with local JSON storage
"""

import json
import uuid
import hashlib
import os
from pathlib import Path
from typing import Optional, Dict
from pydantic import BaseModel
from fastapi import HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

USERS_FILE = Path("uploads/users.json")
SESSIONS_FILE = Path("uploads/sessions.json")

# Ensure files exist
def _init_storage():
    USERS_FILE.parent.mkdir(exist_ok=True)
    if not USERS_FILE.exists():
        USERS_FILE.write_text("{}")
    if not SESSIONS_FILE.exists():
        SESSIONS_FILE.write_text("{}")

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text())
    except:
        return {}

def _save_json(path: Path, data: dict):
    path.write_text(json.dumps(data, indent=2))

# Models
class User(BaseModel):
    id: str
    email: str
    name: str
    photo_url: Optional[str] = None
    created_at: str

class UserCreate(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Session(BaseModel):
    token: str
    user_id: str
    email: str
    created_at: str

# Auth functions
def register_user(user_data: UserCreate) -> User:
    _init_storage()
    users = _load_json(USERS_FILE)
    
    if user_data.email in users:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": _hash_password(user_data.password),
        "photo_url": None,
        "created_at": str(uuid.uuid1())  # Using UUID timestamp
    }
    
    users[user_data.email] = user
    _save_json(USERS_FILE, users)
    
    return User(id=user_id, email=user_data.email, name=user_data.name, photo_url=None, created_at=user["created_at"])

def login_user(credentials: UserLogin) -> Session:
    _init_storage()
    users = _load_json(USERS_FILE)
    sessions = _load_json(SESSIONS_FILE)
    
    user = users.get(credentials.email)
    if not user or user["password_hash"] != _hash_password(credentials.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    token = str(uuid.uuid4())
    session = {
        "token": token,
        "user_id": user["id"],
        "email": user["email"],
        "created_at": str(uuid.uuid1())
    }
    sessions[token] = session
    _save_json(SESSIONS_FILE, sessions)
    
    return Session(**session)

def get_current_user(token: str) -> Optional[User]:
    _init_storage()
    sessions = _load_json(SESSIONS_FILE)
    users = _load_json(USERS_FILE)
    
    session = sessions.get(token)
    if not session:
        return None
    
    user = users.get(session["email"])
    if not user:
        return None
    
    return User(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        photo_url=user.get("photo_url"),
        created_at=user["created_at"]
    )

def update_user_photo(email: str, photo_url: str):
    _init_storage()
    users = _load_json(USERS_FILE)
    
    if email in users:
        users[email]["photo_url"] = photo_url
        _save_json(USERS_FILE, users)

def delete_user_photo(email: str) -> bool:
    """Delete user's photo URL from database"""
    _init_storage()
    users = _load_json(USERS_FILE)
    
    if email in users:
        users[email]["photo_url"] = None
        _save_json(USERS_FILE, users)
        return True
    return False

def update_user_profile(email: str, name: str = None, photo_url: str = None):
    """Update user profile (name and/or photo)"""
    _init_storage()
    users = _load_json(USERS_FILE)
    
    if email not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    if name is not None:
        users[email]["name"] = name
    if photo_url is not None:
        users[email]["photo_url"] = photo_url
    
    _save_json(USERS_FILE, users)
    
    return User(
        id=users[email]["id"],
        email=users[email]["email"],
        name=users[email]["name"],
        photo_url=users[email].get("photo_url"),
        created_at=users[email]["created_at"]
    )

def logout_user(token: str):
    _init_storage()
    sessions = _load_json(SESSIONS_FILE)
    if token in sessions:
        del sessions[token]
        _save_json(SESSIONS_FILE, sessions)

# FastAPI dependency
security = HTTPBearer(auto_error=False)

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user
