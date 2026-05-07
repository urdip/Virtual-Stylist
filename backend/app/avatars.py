"""
Multiple Avatars Management System
Users can create, store, and switch between multiple AI avatars
"""

import json
import os
import uuid
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import HTTPException

class Avatar(BaseModel):
    id: str
    name: str
    photo_url: str
    is_active: bool = False
    created_at: str

class AvatarCreate(BaseModel):
    name: str

class AvatarUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

# Use /tmp on Vercel (serverless), local uploads dir for development
BASE_UPLOADS = Path(os.getenv("UPLOADS_DIR", "/tmp/uploads" if os.getenv("VERCEL") else "uploads"))
AVATARS_FILE = BASE_UPLOADS / "avatars.json"

def _init_storage():
    AVATARS_FILE.parent.mkdir(exist_ok=True)
    if not AVATARS_FILE.exists():
        AVATARS_FILE.write_text("{}")

def _load_json() -> dict:
    try:
        return json.loads(AVATARS_FILE.read_text())
    except:
        return {}

def _save_json(data: dict):
    AVATARS_FILE.write_text(json.dumps(data, indent=2))

def get_user_avatars(user_id: str) -> List[Avatar]:
    """Get all avatars for a user"""
    _init_storage()
    data = _load_json()
    user_avatars = data.get(user_id, [])
    return [Avatar(**avatar) for avatar in user_avatars]

def get_active_avatar(user_id: str) -> Optional[Avatar]:
    """Get the currently active avatar for a user"""
    avatars = get_user_avatars(user_id)
    for avatar in avatars:
        if avatar.is_active:
            return avatar
    # Return first avatar if none is active
    return avatars[0] if avatars else None

def create_avatar(user_id: str, name: str, photo_url: str) -> Avatar:
    """Create a new avatar for a user"""
    _init_storage()
    data = _load_json()
    
    if user_id not in data:
        data[user_id] = []
    
    # If this is the first avatar, make it active
    is_active = len(data[user_id]) == 0
    
    # If setting this as active, deactivate others
    if is_active:
        for avatar in data[user_id]:
            avatar["is_active"] = False
    
    avatar = Avatar(
        id=str(uuid.uuid4()),
        name=name,
        photo_url=photo_url,
        is_active=is_active,
        created_at=str(uuid.uuid1())
    )
    
    data[user_id].append(avatar.dict())
    _save_json(data)
    
    return avatar

def update_avatar(user_id: str, avatar_id: str, name: Optional[str] = None, is_active: Optional[bool] = None) -> Avatar:
    """Update an avatar's name or active status"""
    _init_storage()
    data = _load_json()
    
    if user_id not in data:
        raise HTTPException(status_code=404, detail="No avatars found")
    
    for avatar in data[user_id]:
        if avatar["id"] == avatar_id:
            if name is not None:
                avatar["name"] = name
            if is_active is not None:
                avatar["is_active"] = is_active
                # If activating this one, deactivate others
                if is_active:
                    for other in data[user_id]:
                        if other["id"] != avatar_id:
                            other["is_active"] = False
            _save_json(data)
            return Avatar(**avatar)
    
    raise HTTPException(status_code=404, detail="Avatar not found")

def delete_avatar(user_id: str, avatar_id: str) -> bool:
    """Delete an avatar"""
    _init_storage()
    data = _load_json()
    
    if user_id not in data:
        return False
    
    avatars = data[user_id]
    for i, avatar in enumerate(avatars):
        if avatar["id"] == avatar_id:
            was_active = avatar["is_active"]
            del avatars[i]
            # If we deleted the active one, make the first one active
            if was_active and avatars:
                avatars[0]["is_active"] = True
            _save_json(data)
            return True
    
    return False

def set_active_avatar(user_id: str, avatar_id: str) -> Avatar:
    """Set an avatar as the active one"""
    return update_avatar(user_id, avatar_id, is_active=True)
