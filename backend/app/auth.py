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

# Use /tmp on Vercel (serverless), local uploads dir for development
BASE_UPLOADS = Path(os.getenv("UPLOADS_DIR", "/tmp/uploads" if os.getenv("VERCEL") else "uploads"))
USERS_FILE = BASE_UPLOADS / "users.json"
SESSIONS_FILE = BASE_UPLOADS / "sessions.json"

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

def google_login_user(id_token_str: str) -> Session:
    """Verify a Google ID token and create/find the user, returning a session."""
    import os
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google sign-in not configured")

    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        idinfo = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), client_id
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}")

    email = idinfo["email"]
    name = idinfo.get("name", email.split("@")[0])

    _init_storage()
    users = _load_json(USERS_FILE)

    if email not in users:
        user_id = str(uuid.uuid4())
        users[email] = {
            "id": user_id,
            "email": email,
            "name": name,
            "password_hash": None,
            "photo_url": idinfo.get("picture"),
            "created_at": str(uuid.uuid1()),
        }
        _save_json(USERS_FILE, users)

    user = users[email]
    sessions = _load_json(SESSIONS_FILE)
    token = str(uuid.uuid4())
    session = {
        "token": token,
        "user_id": user["id"],
        "email": user["email"],
        "created_at": str(uuid.uuid1()),
    }
    sessions[token] = session
    _save_json(SESSIONS_FILE, sessions)

    return Session(**session)


def logout_user(token: str):
    _init_storage()
    sessions = _load_json(SESSIONS_FILE)
    if token in sessions:
        del sessions[token]
        _save_json(SESSIONS_FILE, sessions)

def change_password(email: str, current_password: str, new_password: str):
    """Change user password"""
    _init_storage()
    users = _load_json(USERS_FILE)
    
    if email not in users:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify current password
    if users[email]["password_hash"] != _hash_password(current_password):
        raise HTTPException(status_code=401, detail="Current password is incorrect")
    
    # Update password
    users[email]["password_hash"] = _hash_password(new_password)
    _save_json(USERS_FILE, users)
    
    return True

# FastAPI dependency
security = HTTPBearer(auto_error=False)

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = get_current_user(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
    
    return user
