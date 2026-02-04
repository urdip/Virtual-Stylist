"""
FastAPI backend for Virtual Stylist app
- User authentication
- Kling AI for virtual try-on (single and multi-garment)
"""

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import os
import shutil
import uuid
from pathlib import Path
from urllib.parse import quote
import httpx
import time

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except:
    pass

from app.auth import (
    register_user, login_user, logout_user, require_auth, 
    update_user_photo, delete_user_photo, update_user_profile,
    User, UserCreate, UserLogin
)

app = FastAPI(title="Virtual Stylist API", version="2.0")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_UPLOADS = Path("uploads")
BASE_UPLOADS.mkdir(exist_ok=True)
BACKEND_PUBLIC_BASE = os.getenv("BACKEND_PUBLIC_BASE", "http://localhost:8000")

def get_user_dir(user_id: str) -> Path:
    user_dir = BASE_UPLOADS / "users" / user_id
    user_dir.mkdir(parents=True, exist_ok=True)
    return user_dir

def get_wardrobe_dir(user_id: str) -> Path:
    wardrobe_dir = BASE_UPLOADS / "users" / user_id / "wardrobe"
    wardrobe_dir.mkdir(parents=True, exist_ok=True)
    return wardrobe_dir

# Auth endpoints
@app.post("/auth/register")
async def register(user_data: UserCreate):
    user = register_user(user_data)
    get_user_dir(user.id)
    return {"status": "success", "user": user}

@app.post("/auth/login")
async def login(credentials: UserLogin):
    session = login_user(credentials)
    return {"status": "success", "token": session.token, "user": {
        "id": session.user_id,
        "email": session.email
    }}

@app.post("/auth/logout")
async def logout(token: str = Form(...)):
    logout_user(token)
    return {"status": "success"}

@app.get("/auth/me")
async def get_me(user: User = Depends(require_auth)):
    return {"status": "success", "user": user}

@app.post("/auth/photo")
async def upload_user_photo(photo: UploadFile = File(...), user: User = Depends(require_auth)):
    user_dir = get_user_dir(user.id)
    
    # Delete old photo if exists
    for ext in [".jpg", ".jpeg", ".png"]:
        old_photo = user_dir / f"profile{ext}"
        if old_photo.exists():
            old_photo.unlink()
    
    # Save new photo
    ext = Path(photo.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png"]:
        ext = ".jpg"
    
    photo_path = user_dir / f"profile{ext}"
    with open(photo_path, "wb") as f:
        shutil.copyfileobj(photo.file, f)
    
    photo_url = f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/profile{ext}"
    update_user_photo(user.email, photo_url)
    
    return {"status": "success", "photo_url": photo_url}

@app.delete("/auth/photo")
async def delete_user_photo_endpoint(user: User = Depends(require_auth)):
    """Delete user's profile photo"""
    user_dir = get_user_dir(user.id)
    
    # Delete photo files
    deleted = False
    for ext in [".jpg", ".jpeg", ".png"]:
        photo_path = user_dir / f"profile{ext}"
        if photo_path.exists():
            photo_path.unlink()
            deleted = True
    
    # Update database
    delete_user_photo(user.email)
    
    return {"status": "success", "message": "Photo deleted" if deleted else "No photo found"}

@app.put("/auth/profile")
async def update_profile(
    name: str = Form(None),
    photo: UploadFile = File(None),
    user: User = Depends(require_auth)
):
    """Update user profile (name and/or photo)"""
    photo_url = None
    
    if photo:
        user_dir = get_user_dir(user.id)
        
        # Delete old photo if exists
        for ext in [".jpg", ".jpeg", ".png"]:
            old_photo = user_dir / f"profile{ext}"
            if old_photo.exists():
                old_photo.unlink()
        
        # Save new photo
        ext = Path(photo.filename).suffix.lower()
        if ext not in [".jpg", ".jpeg", ".png"]:
            ext = ".jpg"
        
        photo_path = user_dir / f"profile{ext}"
        with open(photo_path, "wb") as f:
            shutil.copyfileobj(photo.file, f)
        
        photo_url = f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/profile{ext}"
    
    updated_user = update_user_profile(user.email, name=name, photo_url=photo_url)
    
    return {"status": "success", "user": updated_user}

# Wardrobe with categories
@app.post("/wardrobe/upload")
async def upload_clothing(
    file: UploadFile = File(...),
    category: str = Form("top"),
    user: User = Depends(require_auth)
):
    wardrobe_dir = get_wardrobe_dir(user.id)
    cat_dir = wardrobe_dir / category
    cat_dir.mkdir(exist_ok=True)
    
    ext = Path(file.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp"]:
        ext = ".jpg"
    
    file_id = f"{uuid.uuid4()}{ext}"
    file_path = cat_dir / file_id
    
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    return {
        "status": "success",
        "file_id": file_id,
        "url": f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/wardrobe/{category}/{file_id}",
        "category": category
    }

@app.get("/wardrobe/list")
async def list_wardrobe(category: str = None, user: User = Depends(require_auth)):
    wardrobe_dir = get_wardrobe_dir(user.id)
    items = []
    categories = [category] if category else ["top", "bottom", "shoes", "dress", "accessory"]
    
    for cat in categories:
        cat_dir = wardrobe_dir / cat
        if cat_dir.exists():
            for f in cat_dir.iterdir():
                if f.is_file():
                    items.append({
                        "id": f.name,
                        "url": f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/wardrobe/{cat}/{f.name}",
                        "filename": f.name,
                        "category": cat
                    })
    
    return {"status": "success", "items": items}

@app.delete("/wardrobe/{category}/{file_id}")
async def delete_item(category: str, file_id: str, user: User = Depends(require_auth)):
    file_path = get_wardrobe_dir(user.id) / category / file_id
    if file_path.exists():
        file_path.unlink()
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Item not found")

# Try-on with user's active avatar (single garment - backward compatible)
@app.post("/tryon")
async def tryon(garment_url: str = Form(...), user: User = Depends(require_auth)):
    return await tryon_multiple(garment_urls=garment_url, user=user)

# Try-on with multiple garments for complete outfit
@app.post("/tryon/outfit")
async def tryon_multiple(
    garment_urls: str = Form(...),  # Comma-separated URLs or single URL
    user: User = Depends(require_auth)
):
    # Get active avatar
    from app.avatars import get_active_avatar
    active_avatar = get_active_avatar(user.id)
    
    if not active_avatar and not user.photo_url:
        raise HTTPException(status_code=400, detail="Create an avatar or upload a photo first")
    
    # Use active avatar photo if available, otherwise fall back to profile photo
    if active_avatar:
        photo_url = active_avatar.photo_url
        print(f"Using active avatar: {active_avatar.name} ({active_avatar.id})")
    else:
        photo_url = user.photo_url
        print(f"Using profile photo (no active avatar)")
    
    user_dir = get_user_dir(user.id)
    
    # Download avatar photo if it's a URL
    if photo_url.startswith("http"):
        async with httpx.AsyncClient() as client:
            response = await client.get(photo_url)
            response.raise_for_status()
            person_path = user_dir / "active_avatar.jpg"
            with open(person_path, "wb") as f:
                f.write(response.content)
    else:
        # Local path
        person_path = Path(photo_url.replace(f"{BACKEND_PUBLIC_BASE}/uploads/", ""))
        if not person_path.exists():
            person_path = user_dir / "profile.jpg"
    
    if not person_path.exists():
        raise HTTPException(status_code=400, detail="Avatar photo not found")
    
    # Parse garment URLs (comma-separated)
    urls = [url.strip() for url in garment_urls.split(",") if url.strip()]
    print(f"Try-on request: {len(urls)} garments")
    for i, url in enumerate(urls):
        print(f"  {i+1}. {url}")
    if not urls:
        raise HTTPException(status_code=400, detail="No garments provided")
    
    # Download all garments and detect categories from URLs
    garment_paths = []
    categories = []
    for url in urls:
        garment_path = await _download_garment(url, user_dir)
        garment_paths.append(garment_path)
        
        # Detect category from URL path
        category = "top"  # default
        if "/top/" in url:
            category = "top"
        elif "/bottom/" in url:
            category = "bottom"
        elif "/dress/" in url:
            category = "dress"
        elif "/shoes/" in url:
            category = "shoes"
        elif "/accessory/" in url:
            category = "accessory"
        categories.append(category)
        print(f"  Garment: {url} -> category: {category}")
    
    output_id = f"result_{uuid.uuid4()}.jpg"
    output_path = user_dir / output_id
    
    # Process garments using Kling AI
    if len(garment_paths) == 1:
        out_file = await _process_single_garment(person_path, garment_paths[0], output_path, user_dir, categories[0])
    else:
        out_file = await _process_multiple_garments(person_path, garment_paths, output_path, user_dir, categories)
    
    if out_file and Path(out_file).exists():
        result_filename = Path(out_file).name
        return {
            "status": "success",
            "result_url": f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/{result_filename}",
            "garment_count": len(garment_paths)
        }
    
    raise HTTPException(status_code=500, detail="Try-on failed")

async def _process_single_garment(person_path: Path, garment_path: Path, output_path: Path, user_dir: Path, category: str = "top") -> str:
    """Process a single garment try-on - use Kling AI"""
    from app.klingai_client import klingai_tryon
    
    print(f"Using Kling AI for {category} garment...")
    try:
        return klingai_tryon(str(person_path), str(garment_path), str(output_path))
    except Exception as e:
        print(f"Kling AI failed: {e}")
        raise HTTPException(status_code=500, detail=f"Kling AI try-on failed: {str(e)}")

async def _process_multiple_garments(person_path: Path, garment_paths: list, output_path: Path, user_dir: Path, categories: list = None) -> str:
    """Process multiple garments - use Kling AI only"""
    import tempfile
    import os
    
    if categories is None:
        categories = ["top"] * len(garment_paths)
    
    print(f"Processing {len(garment_paths)} garments: {categories}")
    
    # Check if we have both top and bottom for Kling AI multi-garment
    top_path = None
    bottom_path = None
    top_idx = None
    bottom_idx = None
    
    for idx, (garment_path, category) in enumerate(zip(garment_paths, categories)):
        if category in ["top", "dress"] and top_path is None:
            top_path = str(garment_path)
            top_idx = idx
            print(f"  Found top at index {idx}: {garment_path}")
        elif category == "bottom" and bottom_path is None:
            bottom_path = str(garment_path)
            bottom_idx = idx
            print(f"  Found bottom at index {idx}: {garment_path}")
    
    # Use Kling AI for multi-garment (best results - supports upper+lower combo)
    if top_path and bottom_path:
        try:
            print(f"Using Kling AI multi-garment processing...")
            print(f"  Top: {top_path}")
            print(f"  Bottom: {bottom_path}")
            from app.klingai_client import klingai_multi_garment
            result = klingai_multi_garment(
                str(person_path),
                top_path,
                bottom_path,
                str(output_path)
            )
            print(f"  Kling AI multi-garment success: {result}")
            return result
        except Exception as e:
            import traceback
            print(f"Kling AI multi-garment failed: {e}")
            traceback.print_exc()
            print(f"  Falling back to sequential processing...")
    
    # Sequential processing: apply bottom first, then top (so top is layered on top)
    from app.klingai_client import klingai_tryon
    
    # Sort by category: process bottom first, then top/dress
    # This ensures top layer is applied last
    order = []
    for idx, cat in enumerate(categories):
        if cat == "bottom":
            order.append((0, idx))  # Process bottoms first
        elif cat in ["top", "dress"]:
            order.append((1, idx))  # Process tops second
        else:
            order.append((2, idx))  # Process others last
    order.sort()  # Sort by priority
    
    current_person = str(person_path)
    
    for seq, (priority, idx) in enumerate(order):
        garment_path = garment_paths[idx]
        category = categories[idx]
        
        # Last iteration: save to final output
        if seq == len(order) - 1:
            temp_output = str(output_path)
        else:
            # Use temp file for intermediate results
            temp_fd, temp_output = tempfile.mkstemp(suffix=".jpg")
            os.close(temp_fd)
        
        try:
            print(f"Sequential processing: garment {seq+1}/{len(order)} ({category}) with Kling AI...")
            result = klingai_tryon(current_person, str(garment_path), temp_output)
            current_person = result  # Use result for next iteration
            print(f"  Applied {category}, result: {result}")
        except Exception as e:
            print(f"Kling AI failed for {category}: {e}")
            raise HTTPException(status_code=500, detail=f"Kling AI try-on failed for {category}: {str(e)}")
    
    return str(output_path)

async def _download_garment(url: str, dest_dir: Path) -> Path:
    if url.startswith(f"{BACKEND_PUBLIC_BASE}/uploads/"):
        local_path = BASE_UPLOADS / url.split("/uploads/")[-1].replace("users/", "")
        if local_path.exists():
            return local_path
    
    ext = ".jpg"
    if "." in url.split("/")[-1]:
        ext = "." + url.split("/")[-1].split(".")[-1].split("?")[0]
    
    garment_id = f"garment_{uuid.uuid4()}{ext}"
    garment_path = dest_dir / garment_id
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        with open(garment_path, "wb") as f:
            f.write(response.content)
    
    return garment_path

# Avatar Management Endpoints
from app.avatars import (
    get_user_avatars, get_active_avatar, create_avatar, 
    update_avatar, delete_avatar, set_active_avatar, Avatar
)

def get_avatars_dir(user_id: str) -> Path:
    """Get directory for storing avatar photos"""
    avatars_dir = BASE_UPLOADS / "users" / user_id / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)
    return avatars_dir

@app.get("/avatars")
async def list_avatars(user: User = Depends(require_auth)):
    """Get all avatars for the current user"""
    avatars = get_user_avatars(user.id)
    return {"status": "success", "avatars": avatars}

@app.get("/avatars/active")
async def get_current_avatar(user: User = Depends(require_auth)):
    """Get the currently active avatar"""
    avatar = get_active_avatar(user.id)
    return {"status": "success", "avatar": avatar}

@app.post("/avatars")
async def create_new_avatar(
    name: str = Form(...),
    photo: UploadFile = File(...),
    user: User = Depends(require_auth)
):
    """Create a new avatar with a photo"""
    avatars_dir = get_avatars_dir(user.id)
    
    # Save avatar photo
    ext = Path(photo.filename).suffix.lower()
    if ext not in [".jpg", ".jpeg", ".png"]:
        ext = ".jpg"
    
    avatar_id = f"avatar_{uuid.uuid4()}{ext}"
    photo_path = avatars_dir / avatar_id
    
    with open(photo_path, "wb") as f:
        shutil.copyfileobj(photo.file, f)
    
    photo_url = f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/avatars/{avatar_id}"
    
    # Create avatar record
    avatar = create_avatar(user.id, name, photo_url)
    
    return {"status": "success", "avatar": avatar}

@app.put("/avatars/{avatar_id}")
async def update_existing_avatar(
    avatar_id: str,
    name: str = Form(None),
    is_active: bool = Form(None),
    user: User = Depends(require_auth)
):
    """Update avatar name or set as active"""
    avatar = update_avatar(user.id, avatar_id, name=name, is_active=is_active)
    return {"status": "success", "avatar": avatar}

@app.post("/avatars/{avatar_id}/activate")
async def activate_avatar(avatar_id: str, user: User = Depends(require_auth)):
    """Set an avatar as the active one"""
    avatar = set_active_avatar(user.id, avatar_id)
    return {"status": "success", "avatar": avatar}

@app.delete("/avatars/{avatar_id}")
async def delete_existing_avatar(avatar_id: str, user: User = Depends(require_auth)):
    """Delete an avatar"""
    # Get avatar info before deleting
    avatars = get_user_avatars(user.id)
    avatar_to_delete = None
    for avatar in avatars:
        if avatar.id == avatar_id:
            avatar_to_delete = avatar
            break
    
    if not avatar_to_delete:
        raise HTTPException(status_code=404, detail="Avatar not found")
    
    # Delete photo file
    try:
        photo_path = BASE_UPLOADS / avatar_to_delete.photo_url.split("/uploads/")[-1]
        if photo_path.exists():
            photo_path.unlink()
    except:
        pass  # Ignore file deletion errors
    
    # Delete avatar record
    success = delete_avatar(user.id, avatar_id)
    
    return {"status": "success", "message": "Avatar deleted"}

# Serve files
@app.get("/uploads/{path:path}")
async def serve_file(path: str):
    file_path = BASE_UPLOADS / path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
