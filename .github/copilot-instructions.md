# AI Stylist — Copilot Instructions

## Project Overview
**AI Stylist** is a digital wardrobe + virtual try-on web application. Users upload clothing items, manage them by category (top, bottom, shoes, outerwear, accessory), upload a personal photo, and generate AI-powered try-on visualizations showing how clothes look on them.

### Architecture
- **Backend**: FastAPI (`/backend/app/main.py`) running on port 8000
  - Handles file uploads (clothing & avatars)
  - Serves uploaded files as static assets
  - Delegates try-on generation to Hugging Face Spaces API
  - Uses `python-multipart`, `pillow`, `rembg`, `onnxruntime` for image processing

- **Frontend**: Next.js 16 App Router (`/frontend`) running on port 3000
  - Two main flows: `/` (home/wardrobe) and `/builder` (outfit builder with try-on)
  - `/avatar` page for pure wardrobe management (minimal implementation)
  - Direct API calls via `fetch` to backend (no API middleware)

### Key External Dependencies
- **Hugging Face Spaces**: Backend proxies try-on requests to a Spaces deployment
  - Config via `.env`: `HF_SPACE_ID`, `HF_API_NAME`, `HF_FN_INDEX`, `HF_API_TOKEN`
  - If try-on fails, check these environment variables match your Space's "View API"

---

## Critical Data Flow Patterns

### Upload Clothing
1. Frontend sends multipart form: `(category: string, image: File)` to `/upload-clothing`
2. Backend saves with UUID filename to `UPLOAD_DIR/{category}/`
3. Returns `{ url: "/uploads/{category}/{filename}", filename }`
4. Frontend stores in state; files persist between sessions

### List Wardrobe
- Frontend calls `/wardrobe/{category}` → returns array of `{ filename, url }` for that category
- **Important**: `url` is relative path (e.g., `/uploads/top/xxx.jpg`), not absolute
- **Frontend assumption**: Prepends `http://localhost:8000` when rendering images

### Generate Try-On (Critical)
1. Frontend sends multipart: `(person: File, garmentUrl: string)` to `/tryon`
2. Backend must handle `person` as actual `UploadFile`, not JSON
3. `garmentUrl` can be relative path (backend downloads via `BACKEND_PUBLIC_BASE`)
4. Backend delegates to HF Spaces via API token
5. Returns `{ result_url: "/uploads/tryon/xxx.png" }` (relative path)
6. Frontend constructs: `url.startsWith("http") ? url : "http://localhost:8000" + url`

---

## Key Files & Their Roles

| File | Purpose | Critical Notes |
|------|---------|---|
| `backend/app/main.py` | All FastAPI endpoints + upload/list/tryon logic | Must support CORS for `http://localhost:3000` |
| `frontend/src/lib/api.ts` | Central API client; exports `uploadClothing()`, `listWardrobe()`, `generateTryOn()` | **Contract**: all functions use multipart FormData; responses are JSON |
| `frontend/app/page.tsx` | Home page: wardrobe grid + avatar upload + try-on result | State: `items`, `avatarFile`, `selectedGarment`, `tryOnUrl` |
| `frontend/app/builder/page.tsx` | Builder: two-column layout for wardrobe selection + try-on | State: `items`, `selectedItem`, `personFile`, `resultUrl` |
| `backend/.env` | API keys & URLs for HF Spaces integration | Keep `CORS_ORIGINS=http://localhost:3000` in sync |
| `frontend/next.config.ts` | Allows `http://127.0.0.1:8000/uploads/**` for Next.js Image optimization | Remote images from backend must match this pattern |

---

## Developer Workflows

### Start Development (Two Terminals)
```bash
# Terminal 1: Backend
cd /backend
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd /frontend
npm run dev  # Starts on http://localhost:3000
```

### Troubleshooting Try-On Failures
- **"Try-on failed" error**: Check backend console for HF Spaces errors
- **No result URL**: Verify `HF_SPACE_ID`, `HF_API_NAME`, `HF_FN_INDEX` in `.env` match your Space
- **CORS errors**: Ensure backend has `CORS_ORIGINS=http://localhost:3000`

### Adding New Endpoints
- Use FastAPI decorators: `@app.get()`, `@app.post()`, `@app.put()`
- For file uploads: `UploadFile = File(...)` parameter (auto-extracted by `python-multipart`)
- For form fields: `field: str = Form(...)`
- Always return `application/json` for consistency with frontend expectations

### Adding UI Pages
- Use Next.js App Router: create file in `frontend/app/[page]/page.tsx`
- Import API functions from `src/lib/api.ts`
- Pages are "use client" (client-side rendering) to use React hooks
- Style with Tailwind or inline styles (project mixes both)

---

## Project-Specific Conventions

1. **File Paths**
   - Backend URLs: relative paths (e.g., `/uploads/top/xxx.jpg`)
   - Frontend: prepends `http://localhost:8000` for absolute URLs
   - No path validation; assumes `UPLOAD_DIR` is `/backend/uploads`

2. **Error Handling**
   - Frontend catches `fetch()` errors and shows in `error` state
   - Backend returns plain text error body on failure (`res.text()` in frontend)
   - No custom error codes; HTTP status determines success

3. **Categories**
   - Fixed set: `["top", "bottom", "shoes", "outerwear", "accessory"]`
   - Directories auto-created on first upload
   - No validation; frontend passes user selection directly to backend

4. **State Management**
   - Each page uses local `useState()` hooks
   - No global state (Redux, Zustand, etc.)
   - No persistence; refreshing page reloads wardrobe from backend

5. **Image Handling**
   - Frontend: `URL.createObjectURL(file)` for previews
   - Backend: saves original file; no resizing/optimization
   - Accepted formats: `.jpg`, `.png`, `.jpeg` (case-insensitive check)

---

## Testing & Validation
- No test suite in repo (empty `/test.py`)
- Manual testing: upload item → list wardrobe → select item → upload avatar → generate try-on
- Check browser DevTools Network tab for API calls; verify multipart encoding

---

## Environment Setup
- Python 3.12+ with `pip install fastapi uvicorn python-multipart pillow rembg onnxruntime httpx python-dotenv`
- Node 18+ with `npm install` in `frontend/`
- Hugging Face token required; set `HF_API_TOKEN` in `/backend/.env`
