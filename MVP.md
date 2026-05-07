# Virtual Stylist - MVP (Minimum Viable Product)

## Overview
An AI-powered virtual try-on application that allows users to upload their clothes and see how they look on themselves or AI avatars.

## MVP Features

### 1. User Authentication
- Register/Login with email and password
- JWT token-based authentication
- User profile with photo upload

### 2. Wardrobe Management
- Upload clothing items by category:
  - Top (shirts, t-shirts, jackets)
  - Bottom (pants, shorts, jeans)
  - Dresses
  - Shoes
  - Accessories
- View all uploaded items
- Delete items

### 3. Avatar Management
- Upload multiple photos of yourself
- Set active avatar for try-on
- Switch between different avatars

### 4. Virtual Try-On
#### Single Garment
- Select one clothing item
- AI generates realistic try-on result using:
  - **Replicate IDM-VTON** for tops (shirts, jackets) - Best quality
  - **Local AI processing** for bottoms (pants) with background removal

#### Multi-Garment (Mix & Match)
- Select up to 2-3 items (e.g., shirt + pants)
- System processes each garment
- Composites results into single image

### 5. Real-time Preview (Avatar Overlay)
- Selected clothing items overlay on avatar in builder page
- Visual feedback before generating AI result

## Tech Stack

### Frontend
- **Next.js 16** + React 19 + TypeScript
- Tailwind CSS for styling
- Component-based architecture

### Backend
- **FastAPI** (Python)
- **Replicate API** for AI try-on (IDM-VTON model)
- OpenCV + Pillow for local image processing
- JWT authentication

### AI/ML
- **Replicate IDM-VTON**: State-of-the-art virtual try-on for tops
- **GrabCut algorithm**: Background removal for garment images
- **Local compositing**: Multi-garment overlay and blending

## How It Works

### Try-On Flow
1. User selects clothing from wardrobe
2. System detects category (top/bottom)
3. **For tops**: Sends to Replicate IDM-VTON for realistic AI generation
4. **For bottoms**: Uses local processing with background removal
5. **For multiple items**: Processes each separately, then composites
6. Returns final result image

### Background Removal (Local)
- Uses OpenCV GrabCut algorithm
- Automatically segments foreground (garment) from background
- Applies feathering for smooth edges

## API Endpoints

### Auth
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `POST /auth/photo` - Upload profile photo

### Wardrobe
- `POST /wardrobe/upload` - Upload clothing item
- `GET /wardrobe/list` - List all items
- `DELETE /wardrobe/{category}/{file_id}` - Delete item

### Avatars
- `GET /avatars` - List avatars
- `POST /avatars` - Create avatar
- `POST /avatars/{id}/activate` - Set active

### Try-On
- `POST /tryon/outfit` - Generate try-on (single or multi-garment)
  - Input: `garment_urls` (comma-separated)
  - Output: Result image URL

## File Structure
```
Project/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI routes
│   │   ├── ai_tryon.py       # Local AI processing
│   │   ├── replicate_client.py # Replicate API client
│   │   ├── auth.py           # Authentication logic
│   │   └── avatars.py        # Avatar management
│   ├── uploads/              # User uploads
│   └── .env                  # Environment variables
├── frontend/
│   ├── app/
│   │   ├── builder/          # Main try-on page
│   │   ├── login/            # Login page
│   │   └── register/         # Register page
│   ├── src/
│   │   ├── components/
│   │   │   └── AvatarOverlay.tsx
│   │   └── lib/
│   │       ├── api.ts        # API client
│   │       └── auth-context.tsx
│   └── public/
└── requirements.txt
```

## Environment Variables
```env
# Backend
REPLICATE_API_TOKEN=your_token_here
BACKEND_PUBLIC_BASE=http://localhost:8000

# Frontend
NEXT_PUBLIC_BACKEND_BASE=http://localhost:8000
```

## Running Locally

### Backend
```bash
cd backend
source ../.venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend
```bash
cd frontend
npm run dev
```

## Usage

1. **Register/Login** at `http://localhost:3000`
2. **Upload avatar** in Profile tab
3. **Add clothes** to wardrobe using the + button
4. **Select items** from wardrobe (click to select)
5. **Click "Try On Outfit"** to generate AI result
6. **Download** the result

## Future Improvements (Beyond MVP)
- Better multi-garment blending (like M&M VTO paper)
- Size/fit estimation
- Style recommendations
- Social sharing
- Mobile app
