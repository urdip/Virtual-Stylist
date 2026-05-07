# Virtual Stylist 👔👗

An AI-powered virtual try-on app — upload your photo, pick clothes, and see how the outfit looks on you before buying.

Built with **Next.js 16**, **FastAPI**, and **Kling AI**.

---

## ✨ Features

- **AI Virtual Try-On** — Upload your photo and visualize outfits using Kling AI Kolors v1.5
- **Multi-Garment Support** — Try on full outfits (top + bottom) with realistic layering
- **Wardrobe Management** — Upload and organize clothes by category (tops, bottoms, dresses, shoes, accessories)
- **Avatar System** — Create and switch between multiple style avatars
- **Outfit Saving** — Save and revisit your favorite outfit combinations
- **Google Sign-In** — One-click login with Google OAuth, plus email/password auth
- **Result Caching** — Previously processed try-ons are served instantly

---

## 🏗️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI (Python 3.9+), HTTPX, PyJWT |
| AI / Try-On | Kling AI Virtual Try-On (Kolors v1.5) |
| Auth | JWT sessions + Google OAuth (GSI) |
| Deployment | Vercel (frontend + serverless backend) |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- [Kling AI API credentials](https://app.klingai.com/global/dev/api-key)
- [Google OAuth Client ID](https://console.cloud.google.com/apis/credentials) (for Google sign-in)

### 1. Clone the Repository

```bash
git clone https://github.com/urdip/virtual-stylist.git
cd virtual-stylist
```

### 2. Set Up the Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
# Kling AI (required for try-on)
KLINGAI_ACCESS_KEY=your_access_key
KLINGAI_SECRET_KEY=your_secret_key

# Google OAuth (required for Google sign-in)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Server config
BACKEND_PUBLIC_BASE=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
```

Start the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Set Up the Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend:

```bash
npm run dev
```

### 4. Open the App

Go to [http://localhost:3000](http://localhost:3000)

> **Google Sign-In note:** You must add `http://localhost:3000` as an **Authorized JavaScript origin** in your Google Cloud OAuth client, otherwise sign-in will return `origin_mismatch`.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `KLINGAI_ACCESS_KEY` | Kling AI API access key | Yes |
| `KLINGAI_SECRET_KEY` | Kling AI API secret key | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes (for Google login) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes (for Google login) |
| `BACKEND_PUBLIC_BASE` | Public URL of the backend (default: `http://localhost:8000`) | No |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | No |

### Frontend (`frontend/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID (for GSI button) | Yes (for Google login) |
| `NEXT_PUBLIC_BACKEND_BASE` | Backend API base URL (default: `http://localhost:8000`) | No |

---

## 📁 Project Structure

```
virtual-stylist/
├── api/
│   └── app.py                  # Vercel serverless entry point
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app & all routes
│   │   ├── auth.py             # JWT + Google OAuth auth
│   │   ├── avatars.py          # Avatar management
│   │   ├── outfits.py          # Saved outfits
│   │   └── klingai_client.py   # Kling AI try-on integration
│   ├── uploads/                # Local file storage (dev only)
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── builder/            # Main try-on interface
│   │   ├── avatar/             # Avatar management page
│   │   ├── login/              # Login page (email + Google)
│   │   ├── register/           # Register page (email + Google)
│   │   ├── page.tsx            # Landing page
│   │   └── layout.tsx          # Root layout
│   ├── src/lib/api.ts          # Typed API client
│   ├── package.json
│   └── next.config.ts
├── vercel.json                 # Vercel routing config
└── requirements.txt            # Top-level Python deps (for Vercel)
```

---

## 🎯 How It Works

### Try-On Flow

1. **Sign In** — Log in with email/password or Google
2. **Upload Photo** — Add a profile photo or create an avatar
3. **Build Wardrobe** — Upload clothes, organised by category
4. **Pick an Outfit** — Select one or more garments to try on
5. **AI Processing** — Kling AI applies the garments to your photo
6. **See the Result** — View the realistic try-on image
7. **Save** — Optionally save the outfit for later

### Multi-Garment Processing

When combining a top and bottom:
- The bottom (trousers/skirt) is applied first
- The top is layered over the result
- This order ensures realistic garment overlap

---

## 🛠️ API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register with email + password |
| `/auth/login` | POST | Login with email + password |
| `/auth/google` | POST | Login / register with Google ID token |
| `/auth/logout` | POST | Logout |
| `/auth/me` | GET | Get current user |
| `/auth/photo` | POST | Upload profile photo |
| `/auth/photo` | DELETE | Delete profile photo |
| `/auth/profile` | PUT | Update name / photo |
| `/auth/change-password` | POST | Change password |

### Wardrobe

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wardrobe/upload` | POST | Upload a clothing item |
| `/wardrobe/list` | GET | List items (filter by category) |
| `/wardrobe/{category}/{file_id}` | DELETE | Delete an item |

### Try-On

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tryon` | POST | Try on a single garment |
| `/tryon/outfit` | POST | Try on multiple garments |

### Avatars

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/avatars` | GET | List avatars |
| `/avatars` | POST | Create avatar |
| `/avatars/{id}` | PUT | Update avatar |
| `/avatars/{id}` | DELETE | Delete avatar |
| `/avatars/{id}/activate` | POST | Set as active avatar |

### Outfits

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/outfits` | GET | List saved outfits |
| `/outfits` | POST | Save an outfit |
| `/outfits/{id}` | PUT | Rename outfit |
| `/outfits/{id}` | DELETE | Delete outfit |

---

## 🚀 Deployment (Vercel)

1. Connect your GitHub repo to Vercel
2. Add environment variables in the Vercel dashboard (see table above)
3. Deploy — `vercel.json` handles routing between frontend pages and serverless backend functions

---

## 📝 License

MIT — see [LICENSE](LICENSE) for details.

---

## 📧 Contact

**Urdip Jadeja** — [GitHub](https://github.com/urdip) — jadejaurdip@gmail.com

> This project requires Kling AI API credits for virtual try-on processing. [Purchase credits on the Kling AI platform.](https://app.klingai.com/)
