from fastapi import FastAPI
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# Import the actual app
from app.main import app as fastapi_app

# Re-export
app = fastapi_app
