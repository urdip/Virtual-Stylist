"""
FastAPI backend for Virtual Stylist app
- User authentication
- Kling AI for virtual try-on (single and multi-garment)
"""

from fastapi import FastAPI, File, Form, UploadFile, HTTPException, Depends
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import uvicorn
import os
import shutil
import uuid
import hashlib
import asyncio
from pathlib import Path
from urllib.parse import quote
import httpx
import time

# In-memory result cache: (person_hash + garment_urls) -> result_url
_tryon_cache: dict[str, str] = {}

def _cache_key(person_path: str, urls: list[str]) -> str:
    try:
        person_hash = hashlib.md5(open(person_path, "rb").read()).hexdigest()[:8]
    except Exception:
        return ""
    return hashlib.md5(f"{person_hash}:{','.join(sorted(urls))}".encode()).hexdigest()

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent.parent / ".env")
except:
    pass

from app.auth import (
    register_user, login_user, logout_user, require_auth,
    google_login_user,
    update_user_photo, delete_user_photo, update_user_profile, change_password,
    User, UserCreate, UserLogin
)

app = FastAPI(title="Virtual Stylist API", version="2.0")

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use /tmp on Vercel (serverless), local uploads dir for development
BASE_UPLOADS = Path(os.getenv("UPLOADS_DIR", "/tmp/uploads" if os.getenv("VERCEL") else "uploads"))
BASE_UPLOADS.mkdir(parents=True, exist_ok=True)

# Determine BACKEND_PUBLIC_BASE: use https for Vercel, http for localhost
_vercel_url = os.getenv("VERCEL_URL")
if _vercel_url:
    BACKEND_PUBLIC_BASE = os.getenv("BACKEND_PUBLIC_BASE", "https://" + _vercel_url)
else:
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

class GoogleLoginRequest(BaseModel):
    id_token: str

@app.post("/auth/google")
async def google_login(request: GoogleLoginRequest):
    session = google_login_user(request.id_token)
    from app.auth import get_current_user
    user = get_current_user(session.token)
    if user:
        get_user_dir(user.id)
    return {"status": "success", "token": session.token, "user": {
        "id": session.user_id,
        "email": session.email,
        "name": user.name if user else "",
        "photo_url": user.photo_url if user else None,
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

@app.post("/auth/change-password")
async def change_user_password(
    current_password: str = Form(...),
    new_password: str = Form(...),
    user: User = Depends(require_auth)
):
    """Change user password"""
    change_password(user.email, current_password, new_password)
    return {"status": "success", "message": "Password changed successfully"}

# Image proxy: fetches Zara CDN product images server-side to avoid hotlink blocking.
# STRICT ALLOWLIST — only static.zara.net is permitted. This endpoint is not a general-purpose
# image proxy; adding other hosts here would reopen the open-proxy attack surface.
ALLOWED_IMAGE_HOSTS = {"static.zara.net", "image.hm.com"}

@app.get("/image-proxy")
async def image_proxy(url: str):
    from urllib.parse import urlparse
    from fastapi.responses import Response as FastAPIResponse
    parsed = urlparse(url)
    if parsed.hostname not in ALLOWED_IMAGE_HOSTS:
        raise HTTPException(status_code=400, detail="Image host not allowed")
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; VirtualStylist/1.0)",
        "Referer": "https://www.zara.com/",
        "Accept": "image/*,*/*;q=0.8",
    }
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers=headers)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail="Failed to fetch image")
        content_type = resp.headers.get("content-type", "image/jpeg")
        if not content_type.startswith("image/"):
            raise HTTPException(status_code=502, detail="Response is not an image")
        return FastAPIResponse(
            content=resp.content,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Image fetch error: {exc}")

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

class ImportFromUrlRequest(BaseModel):
    image_url: str
    category: str = "top"
    name: str = "imported"

@app.post("/wardrobe/import-from-url")
async def import_clothing_from_url(body: ImportFromUrlRequest, user: User = Depends(require_auth)):
    from urllib.parse import urlparse
    parsed = urlparse(body.image_url)
    if parsed.hostname not in ALLOWED_IMAGE_HOSTS:
        raise HTTPException(status_code=400, detail="Image host not allowed")
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; VirtualStylist/1.0)",
        "Accept": "image/*,*/*;q=0.8",
    }
    async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
        resp = await client.get(body.image_url, headers=headers)
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Failed to fetch image")
    content_type = resp.headers.get("content-type", "image/jpeg")
    if not content_type.startswith("image/"):
        raise HTTPException(status_code=502, detail="Response is not an image")
    ext_map = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
    ext = ext_map.get(content_type.split(";")[0].strip(), ".jpg")
    wardrobe_dir = get_wardrobe_dir(user.id)
    cat_dir = wardrobe_dir / body.category
    cat_dir.mkdir(exist_ok=True)
    file_id = f"{uuid.uuid4()}{ext}"
    file_path = cat_dir / file_id
    with open(file_path, "wb") as f:
        f.write(resp.content)
    return {
        "status": "success",
        "file_id": file_id,
        "url": f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/wardrobe/{body.category}/{file_id}",
        "category": body.category,
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

    # Check cache before doing any work
    cache_key = _cache_key(str(person_path), urls)
    if cache_key and cache_key in _tryon_cache:
        print(f"  Cache hit! Returning cached result.")
        return {"status": "success", "result_url": _tryon_cache[cache_key], "cached": True, "garment_count": len(urls)}

    # Download avatar and all garments concurrently
    garment_downloads = await asyncio.gather(
        *[_download_garment(url, user_dir) for url in urls],
        return_exceptions=True
    )
    garment_paths = []
    categories = []
    for url, result in zip(urls, garment_downloads):
        if isinstance(result, Exception):
            raise HTTPException(status_code=400, detail=f"Failed to download garment: {result}")
        garment_paths.append(result)
        category = "top"
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
        result_url = f"{BACKEND_PUBLIC_BASE}/uploads/users/{user.id}/{result_filename}"
        if cache_key and len(_tryon_cache) < 200:
            _tryon_cache[cache_key] = result_url
        return {
            "status": "success",
            "result_url": result_url,
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
    """Download garment or use local file if it's a local URL"""
    if url.startswith(f"{BACKEND_PUBLIC_BASE}/uploads/"):
        # Local file - construct path directly
        relative_path = url.split("/uploads/")[-1]
        local_path = BASE_UPLOADS / relative_path
        if local_path.exists():
            print(f"  Using local file: {local_path}")
            return local_path
        else:
            print(f"  Local file not found: {local_path}")
    
    # Download from URL
    ext = ".jpg"
    if "." in url.split("/")[-1]:
        ext = "." + url.split("/")[-1].split(".")[-1].split("?")[0]
    
    garment_id = f"garment_{uuid.uuid4()}{ext}"
    garment_path = dest_dir / garment_id
    
    print(f"  Downloading from: {url}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30)
            response.raise_for_status()
            with open(garment_path, "wb") as f:
                f.write(response.content)
        print(f"  Downloaded to: {garment_path}")
        return garment_path
    except Exception as e:
        print(f"  Download failed: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download garment: {str(e)}")

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


# Outfit Management Endpoints
from app.outfits import (
    get_user_outfits, save_outfit, delete_outfit, update_outfit_name,
    SavedOutfit, OutfitCreate
)

@app.get("/outfits")
async def list_outfits(user: User = Depends(require_auth)):
    """Get all saved outfits for the current user"""
    outfits = get_user_outfits(user.id)
    return {"status": "success", "outfits": outfits}

@app.post("/outfits")
async def create_outfit(
    outfit: OutfitCreate,
    user: User = Depends(require_auth)
):
    """Save a new outfit with AI-generated result"""
    # Auto-generate name if not provided or empty
    name = outfit.name
    if not name or name.strip() == "":
        # Generate name from garment categories
        categories = [g.category for g in outfit.garments]
        if len(categories) == 1:
            name = f"My {categories[0].capitalize()}"
        elif len(categories) == 2:
            name = f"{categories[0].capitalize()} & {categories[1].capitalize()}"
        else:
            name = f"Outfit ({len(categories)} items)"
    
    saved = save_outfit(
        user.id,
        name.strip(),
        outfit.result_url,
        [g.dict() for g in outfit.garments]
    )
    return {"status": "success", "outfit": saved}

@app.put("/outfits/{outfit_id}")
async def rename_outfit(
    outfit_id: str,
    name: str = Form(...),
    user: User = Depends(require_auth)
):
    """Update an outfit's name"""
    outfit = update_outfit_name(user.id, outfit_id, name)
    return {"status": "success", "outfit": outfit}

@app.delete("/outfits/{outfit_id}")
async def remove_outfit(outfit_id: str, user: User = Depends(require_auth)):
    """Delete a saved outfit"""
    success = delete_outfit(user.id, outfit_id)
    if not success:
        raise HTTPException(status_code=404, detail="Outfit not found")
    return {"status": "success", "message": "Outfit deleted"}


# Image proxy — fetches external images server-side and re-serves them.
# This bypasses CORS / hotlink restrictions (e.g. Zara CDN) so the browser
# always receives images from our own origin.
@app.get("/proxy/image")
async def proxy_image(url: str):
    if not url.startswith("https://"):
        raise HTTPException(status_code=400, detail="Only HTTPS image URLs are supported")
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
            "Referer": "https://www.zara.com/",
        }
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
        content_type = resp.headers.get("content-type", "image/jpeg")
        from fastapi.responses import Response
        return Response(content=resp.content, media_type=content_type,
                        headers={"Cache-Control": "public, max-age=86400"})
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch image: {e}")


# Serve files
@app.get("/uploads/{path:path}")
async def serve_file(path: str):
    file_path = BASE_UPLOADS / path
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
