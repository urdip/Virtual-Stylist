"""
Vercel entrypoint for FastAPI backend
"""
import sys
import os

# Add backend directory to path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
sys.path.insert(0, backend_path)

# Import the FastAPI app
from app.main import app
