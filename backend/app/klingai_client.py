"""
Kling AI Virtual Try-On API Client
API: https://api-singapore.klingai.com/v1/images/kolors-virtual-try-on
Supports: Single garment and multi-garment (upper + lower) combination
"""

import os
import time
import jwt
import requests
import base64
from pathlib import Path
from typing import Optional, Tuple
from PIL import Image


class KlingAIClient:
    """
    Client for Kling AI Virtual Try-On API
    Supports both single and multi-garment try-on
    """
    
    def __init__(self, access_key: Optional[str] = None, secret_key: Optional[str] = None):
        self.access_key = access_key or os.getenv("KLINGAI_ACCESS_KEY", "")
        self.secret_key = secret_key or os.getenv("KLINGAI_SECRET_KEY", "")
        # Try China endpoint first, fall back to Singapore
        self.base_url = "https://api.klingai.com"  # China endpoint
        
        if not self.access_key or not self.secret_key:
            raise ValueError("KLINGAI_ACCESS_KEY and KLINGAI_SECRET_KEY must be set")
    
    def _generate_token(self) -> str:
        """Generate JWT token for authentication"""
        headers = {
            "alg": "HS256",
            "typ": "JWT"
        }
        payload = {
            "iss": self.access_key,
            "exp": int(time.time()) + 1800,  # 30 minutes expiry
            "nbf": int(time.time()) - 5
        }
        token = jwt.encode(payload, self.secret_key, algorithm="HS256", headers=headers)
        return token
    
    def _get_auth_header(self) -> dict:
        """Get authorization header with JWT token"""
        token = self._generate_token()
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
    
    def _upload_image_base64(self, image_path: str) -> str:
        """Convert image to base64 string"""
        with open(image_path, 'rb') as f:
            image_data = f.read()
        return base64.b64encode(image_data).decode('utf-8')
    
    def _merge_garments(self, top_path: str, bottom_path: str, output_path: str) -> str:
        """
        Merge top and bottom garments into a single image with white background
        For Kling AI v1.5 multi-garment try-on
        Layout: Top garment in upper portion, bottom garment in lower portion
        """
        # Load garments
        top = Image.open(top_path).convert("RGBA")
        bottom = Image.open(bottom_path).convert("RGBA")
        
        # Create white background canvas (standard portrait size)
        canvas_width = 768
        canvas_height = 1024
        canvas = Image.new('RGB', (canvas_width, canvas_height), (255, 255, 255))
        
        # Calculate proportions to fit human body layout
        # Upper body (top) takes roughly top 45% of image
        # Lower body (bottom) takes roughly bottom 45% of image
        
        # Resize top garment to fit upper body area
        top_target_height = int(canvas_height * 0.42)
        top_aspect = top.width / top.height
        top_height = min(top_target_height, int(canvas_width * 0.9 / top_aspect))
        top_width = int(top_height * top_aspect)
        if top_width > canvas_width * 0.9:
            top_width = int(canvas_width * 0.9)
            top_height = int(top_width / top_aspect)
        top_resized = top.resize((top_width, top_height), Image.Resampling.LANCZOS)
        
        # Resize bottom garment to fit lower body area  
        bottom_target_height = int(canvas_height * 0.45)
        bottom_aspect = bottom.width / bottom.height
        bottom_height = min(bottom_target_height, int(canvas_width * 0.9 / bottom_aspect))
        bottom_width = int(bottom_height * bottom_aspect)
        if bottom_width > canvas_width * 0.9:
            bottom_width = int(canvas_width * 0.9)
            bottom_height = int(bottom_width / bottom_aspect)
        bottom_resized = bottom.resize((bottom_width, bottom_height), Image.Resampling.LANCZOS)
        
        # Position top garment in upper area (slight padding from top)
        top_x = (canvas_width - top_width) // 2
        top_y = int(canvas_height * 0.03)  # 3% from top
        
        # Position bottom garment below the top, leaving small gap
        bottom_x = (canvas_width - bottom_width) // 2
        bottom_y = int(canvas_height * 0.52)  # Start at 52% down (overlap slightly with top)
        
        # Paste garments
        canvas.paste(top_resized, (top_x, top_y), top_resized)
        canvas.paste(bottom_resized, (bottom_x, bottom_y), bottom_resized)
        
        canvas.save(output_path, "JPEG", quality=95)
        print(f"    Merged image saved: {output_path} ({canvas_width}x{canvas_height})")
        print(f"    Top position: ({top_x}, {top_y}), size: {top_resized.size}")
        print(f"    Bottom position: ({bottom_x}, {bottom_y}), size: {bottom_resized.size}")
        return output_path
    
    def tryon(
        self,
        person_path: str,
        garment_path: str,
        output_path: str,
        model_name: str = "kolors-virtual-try-on-v1-5",
        max_wait: int = 300,
        retries: int = 3
    ) -> str:
        """
        Single garment try-on
        
        Args:
            person_path: Path to person image
            garment_path: Path to garment image
            output_path: Path to save result
            model_name: Model version to use
            max_wait: Maximum seconds to wait
            retries: Number of retries for rate limiting
        
        Returns:
            Path to result image
        """
        headers = self._get_auth_header()
        
        # Prepare payload
        payload = {
            "model_name": model_name,
            "human_image": self._upload_image_base64(person_path),
            "cloth_image": self._upload_image_base64(garment_path)
        }
        
        # Create task with retry
        for attempt in range(retries):
            try:
                print(f"  Creating Kling AI try-on task (attempt {attempt + 1})...")
                response = requests.post(
                    f"{self.base_url}/v1/images/kolors-virtual-try-on",
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 429:
                    wait_time = 5 * (attempt + 1)
                    print(f"  Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                
                response.raise_for_status()
                result = response.json()
                
                if result.get("code") != 0:
                    raise ValueError(f"API error: {result.get('message')}")
                
                task_id = result["data"]["task_id"]
                print(f"  Task created: {task_id}")
                
                # Poll for result
                return self._wait_for_result(task_id, output_path, max_wait)
                
            except requests.exceptions.HTTPError as e:
                if attempt < retries - 1:
                    time.sleep(2)
                    continue
                raise
        
        raise RuntimeError("Max retries exceeded")
    
    def multi_garment_tryon(
        self,
        person_path: str,
        top_path: str,
        bottom_path: str,
        output_path: str,
        model_name: str = "kolors-virtual-try-on-v1-5",
        max_wait: int = 300
    ) -> str:
        """
        Multi-garment try-on (upper + lower)
        Uses sequential processing: applies bottom first, then top
        
        Args:
            person_path: Path to person image
            top_path: Path to top garment
            bottom_path: Path to bottom garment
            output_path: Path to save result
            model_name: Model version to use
            max_wait: Maximum seconds to wait
        
        Returns:
            Path to result image
        """
        import tempfile
        
        print("  Sequential multi-garment: applying bottom first, then top...")
        
        # Step 1: Apply bottom garment (pants) first
        with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
            step1_path = tmp.name
        
        try:
            print(f"    Step 1/2: Applying bottom garment...")
            self.tryon(person_path, bottom_path, step1_path, model_name, max_wait)
            
            # Step 2: Apply top garment over the result
            print(f"    Step 2/2: Applying top garment...")
            self.tryon(step1_path, top_path, output_path, model_name, max_wait)
            
            print(f"    Multi-garment complete: {output_path}")
            return output_path
            
        finally:
            # Cleanup temp file
            if os.path.exists(step1_path):
                os.unlink(step1_path)
    
    def _wait_for_result(self, task_id: str, output_path: str, max_wait: int) -> str:
        """Poll for task result"""
        headers = self._get_auth_header()
        start_time = time.time()
        
        while time.time() - start_time < max_wait:
            response = requests.get(
                f"{self.base_url}/v1/images/kolors-virtual-try-on/{task_id}",
                headers=headers,
                timeout=30
            )
            response.raise_for_status()
            result = response.json()
            
            if result.get("code") != 0:
                raise ValueError(f"API error: {result.get('message')}")
            
            status = result["data"]["task_status"]
            print(f"  Status: {status}")
            
            if status == "succeed":
                # Download result image
                image_url = result["data"]["task_result"]["images"][0]["url"]
                print(f"  Downloading result...")
                img_response = requests.get(image_url, timeout=60)
                img_response.raise_for_status()
                
                with open(output_path, 'wb') as f:
                    f.write(img_response.content)
                
                print(f"  ✓ Result saved to {output_path}")
                return output_path
            
            elif status == "failed":
                raise ValueError(f"Task failed: {result['data'].get('task_status_msg', 'Unknown error')}")
            
            time.sleep(2)
        
        raise TimeoutError("Task timed out")


# Convenience functions
def klingai_tryon(person_path: str, garment_path: str, output_path: str, **kwargs) -> str:
    """Single garment try-on with Kling AI"""
    client = KlingAIClient()
    return client.tryon(person_path, garment_path, output_path, **kwargs)


def klingai_multi_garment(person_path: str, top_path: str, bottom_path: str, output_path: str, **kwargs) -> str:
    """Multi-garment try-on with Kling AI (upper + lower)"""
    client = KlingAIClient()
    return client.multi_garment_tryon(person_path, top_path, bottom_path, output_path, **kwargs)
