"""
Saved Outfits Management
Stores AI-generated try-on results with their garment combinations
"""

import json
import os
import uuid
from pathlib import Path
from typing import List, Optional
from pydantic import BaseModel
from fastapi import HTTPException
from datetime import datetime


class OutfitItem(BaseModel):
    """A garment item in an outfit"""
    id: str
    url: str
    filename: str
    category: str


class SavedOutfit(BaseModel):
    """A saved outfit with AI-generated result"""
    id: str
    name: str
    result_url: str
    garments: List[OutfitItem]
    created_at: str


class OutfitCreate(BaseModel):
    name: str
    result_url: str
    garments: List[OutfitItem]


# Use /tmp on Vercel (serverless), local uploads dir for development
BASE_UPLOADS = Path(os.getenv("UPLOADS_DIR", "/tmp/uploads" if os.getenv("VERCEL") else "uploads"))
OUTFITS_FILE = BASE_UPLOADS / "outfits.json"


def _init_storage():
    """Initialize outfits storage file"""
    OUTFITS_FILE.parent.mkdir(exist_ok=True)
    if not OUTFITS_FILE.exists():
        OUTFITS_FILE.write_text("{}")


def _load_json() -> dict:
    """Load outfits from JSON file"""
    try:
        return json.loads(OUTFITS_FILE.read_text())
    except:
        return {}


def _save_json(data: dict):
    """Save outfits to JSON file"""
    OUTFITS_FILE.write_text(json.dumps(data, indent=2))


def get_user_outfits(user_id: str) -> List[SavedOutfit]:
    """Get all saved outfits for a user"""
    _init_storage()
    data = _load_json()
    user_outfits = data.get(user_id, [])
    # Sort by created_at (newest first)
    user_outfits.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return [SavedOutfit(**outfit) for outfit in user_outfits]


def save_outfit(user_id: str, name: str, result_url: str, garments: List[dict]) -> SavedOutfit:
    """Save a new outfit with its AI-generated result"""
    _init_storage()
    data = _load_json()
    
    if user_id not in data:
        data[user_id] = []
    
    outfit = SavedOutfit(
        id=str(uuid.uuid4()),
        name=name,
        result_url=result_url,
        garments=[OutfitItem(**g) for g in garments],
        created_at=datetime.utcnow().isoformat()
    )
    
    data[user_id].append(outfit.dict())
    _save_json(data)
    
    return outfit


def delete_outfit(user_id: str, outfit_id: str) -> bool:
    """Delete a saved outfit"""
    _init_storage()
    data = _load_json()
    
    if user_id not in data:
        return False
    
    outfits = data[user_id]
    for i, outfit in enumerate(outfits):
        if outfit["id"] == outfit_id:
            # Delete the result image file if it exists locally
            try:
                result_url = outfit.get("result_url", "")
                if result_url and "/uploads/" in result_url:
                    relative_path = result_url.split("/uploads/")[-1]
                    image_path = BASE_UPLOADS / relative_path
                    if image_path.exists():
                        image_path.unlink()
            except:
                pass  # Ignore file deletion errors
            
            del outfits[i]
            _save_json(data)
            return True
    
    return False


def update_outfit_name(user_id: str, outfit_id: str, name: str) -> SavedOutfit:
    """Update an outfit's name"""
    _init_storage()
    data = _load_json()
    
    if user_id not in data:
        raise HTTPException(status_code=404, detail="No outfits found")
    
    for outfit in data[user_id]:
        if outfit["id"] == outfit_id:
            outfit["name"] = name
            _save_json(data)
            return SavedOutfit(**outfit)
    
    raise HTTPException(status_code=404, detail="Outfit not found")
