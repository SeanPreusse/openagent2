#!/usr/bin/env python3
"""
Test script to debug file upload issues with LightRAG API
"""

import requests
import base64
import mimetypes
import magic
import os
from pathlib import Path

# Test file - create a simple JPG test file
def create_test_image():
    """Create a simple test image file"""
    from PIL import Image
    import io
    
    # Create a simple 100x100 red image
    img = Image.new('RGB', (100, 100), color='red')
    
    # Save to bytes buffer
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG')
    buffer.seek(0)
    
    return buffer.getvalue()

def test_file_upload():
    """Test file upload to LightRAG API"""
    
    # Create test image
    image_data = create_test_image()
    
    # Get MIME type using different methods
    print("=== MIME Type Detection ===")
    
    # Method 1: python-magic
    try:
        mime_magic = magic.from_buffer(image_data, mime=True)
        print(f"python-magic: {mime_magic}")
    except Exception as e:
        print(f"python-magic error: {e}")
    
    # Method 2: mimetypes
    mime_guess = mimetypes.guess_type('test.jpg')[0]
    print(f"mimetypes.guess_type: {mime_guess}")
    
    # Method 3: Manual
    print(f"Manual: image/jpeg")
    
    # Convert to base64
    base64_data = base64.b64encode(image_data).decode('utf-8')
    
    print("\n=== File Upload Test ===")
    
    # Test the upload endpoint
    url = "http://localhost:9621/documents/upload"
    
    # Try different MIME types
    for mime_type in ["image/jpeg", "image/jpg", mime_magic if 'mime_magic' in locals() else "image/jpeg"]:
        print(f"\nTesting with MIME type: {mime_type}")
        
        files = {
            'files': ('test_image.jpg', base64.b64decode(base64_data), mime_type)
        }
        
        data = {
            'collection_uuid': 'test-collection'
        }
        
        try:
            response = requests.post(url, files=files, data=data)
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            
            if response.status_code == 200:
                print("✅ Upload successful!")
                break
            else:
                print("❌ Upload failed")
                
        except Exception as e:
            print(f"❌ Request error: {e}")

def test_supported_types():
    """Test what file types are actually supported"""
    print("\n=== Supported File Types Test ===")
    
    url = "http://localhost:9621/health"
    try:
        response = requests.get(url)
        if response.status_code == 200:
            print("✅ Server is healthy")
            print("Server configuration:")
            data = response.json()
            print(f"Core version: {data.get('core_version')}")
            print(f"API version: {data.get('api_version')}")
        else:
            print("❌ Server health check failed")
    except Exception as e:
        print(f"❌ Health check error: {e}")

if __name__ == "__main__":
    print("🧪 LightRAG File Upload Test")
    print("=" * 40)
    
    test_supported_types()
    test_file_upload()




