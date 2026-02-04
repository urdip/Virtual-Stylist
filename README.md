# Virtual Stylist 👔👗

An AI-powered virtual try-on application that lets users visualize how clothes will look on them before buying. Built with Next.js, FastAPI, and Kling AI.

![Virtual Stylist Preview](https://via.placeholder.com/800x400?text=Virtual+Stylist+Preview)

## ✨ Features

- **AI Virtual Try-On**: Upload your photo and see how different outfits look on you
- **Wardrobe Management**: Organize clothes by category (tops, bottoms, dresses, shoes, accessories)
- **Multi-Garment Support**: Try on complete outfits (top + bottom combinations)
- **Avatar System**: Create and manage multiple avatars for different looks
- **Real-Time Processing**: Fast AI-powered garment transfer using Kling AI

## 🏗️ Tech Stack

**Frontend:**
- Next.js 16 + React 19
- TypeScript
- Tailwind CSS

**Backend:**
- FastAPI (Python)
- Kling AI API for virtual try-on
- JWT authentication

**AI/ML:**
- Kling AI Virtual Try-On (Kolors v1.5)
- Supports single and multi-garment processing

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- Kling AI API credentials ([Sign up here](https://www.klingai.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/virtual-stylist.git
cd virtual-stylist
```

### 2. Setup Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:

```env
KLINGAI_ACCESS_KEY=your_klingai_access_key
KLINGAI_SECRET_KEY=your_klingai_secret_key
BACKEND_PUBLIC_BASE=http://localhost:8000
CORS_ORIGINS=http://localhost:3000
```

Start the backend server:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Navigate to http://localhost:3000 in your browser.

## 📸 Screenshots

| Wardrobe Selection | Try-On Result |
|-------------------|---------------|
| ![Wardrobe](https://via.placeholder.com/400x300?text=Wardrobe+Selection) | ![Result](https://via.placeholder.com/400x300?text=Try-On+Result) |

## 🔑 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `KLINGAI_ACCESS_KEY` | Kling AI API access key | Yes |
| `KLINGAI_SECRET_KEY` | Kling AI API secret key | Yes |
| `BACKEND_PUBLIC_BASE` | Backend URL (default: http://localhost:8000) | No |
| `CORS_ORIGINS` | Allowed frontend origins (default: http://localhost:3000) | No |

## 📁 Project Structure

```
virtual-stylist/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── klingai_client.py    # Kling AI integration
│   │   ├── auth.py              # User authentication
│   │   ├── avatars.py           # Avatar management
│   │   └── __init__.py
│   ├── uploads/                 # User uploads storage
│   └── requirements.txt
├── frontend/
│   ├── app/                     # Next.js pages
│   ├── src/lib/
│   │   ├── api.ts               # API client
│   │   └── auth-context.tsx     # Auth context
│   └── ...
└── README.md
```

## 🎯 How It Works

1. **Upload Profile Photo**: User uploads their photo or creates an avatar
2. **Build Wardrobe**: Upload clothing items categorized by type (tops, bottoms, etc.)
3. **Select Outfit**: Choose garments to try on (single or multiple items)
4. **AI Processing**: Kling AI processes the images using sequential garment application
5. **View Result**: See a realistic visualization of yourself wearing the outfit

### Multi-Garment Processing

When selecting both a top and bottom:
- Bottom garment (pants) is applied first
- Top garment (shirt) is applied over the result
- This ensures proper layering and realistic appearance

## 🛠️ Development

### Backend API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | User login |
| `/auth/me` | GET | Get current user |
| `/wardrobe/upload` | POST | Upload clothing item |
| `/wardrobe/list` | GET | List wardrobe items |
| `/tryon/outfit` | POST | Generate try-on with selected garments |
| `/avatars` | GET/POST | List/Create avatars |

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- [Kling AI](https://www.klingai.com/) for providing the virtual try-on API
- [Next.js](https://nextjs.org/) for the frontend framework
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework

## 📧 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter) - email@example.com

Project Link: [https://github.com/yourusername/virtual-stylist](https://github.com/yourusername/virtual-stylist)

---

**Note**: This project requires Kling AI API credentials. Virtual Try-On credits need to be purchased separately from Kling AI platform.
