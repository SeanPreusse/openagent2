#!/usr/bin/env python3
"""
Simple test script to debug file upload with the local server
"""

import requests
import base64
import mimetypes
import json
from PIL import Image
import io

def create_test_files():
    """Create test files to upload"""
    
    # Create a simple JPG image
    img = Image.new('RGB', (100, 100), color='red')
    jpg_buffer = io.BytesIO()
    img.save(jpg_buffer, format='JPEG')
    jpg_data = jpg_buffer.getvalue()
    
    return {
        'test_image.jpg': {
            'data': jpg_data,
            'mime_type': 'image/jpeg'
        }
    }

def test_health():
    """Test server health"""
    try:
        response = requests.get("http://localhost:9621/health")
        if response.status_code == 200:
            print("✅ Server is healthy")
            return True
        else:
            print(f"❌ Server health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to server: {e}")
        return False

def test_file_detection():
    """Test file type detection directly"""
    print("\n=== File Type Detection Test ===")
    
    files = create_test_files()
    
    for filename, file_info in files.items():
        print(f"\nFile: {filename}")
        print(f"Size: {len(file_info['data'])} bytes")
        print(f"MIME type: {file_info['mime_type']}")
        
        # Test mimetypes module
        guessed_type = mimetypes.guess_type(filename)[0]
        print(f"mimetypes.guess_type: {guessed_type}")
        
        # Check file signature
        signature = file_info['data'][:4]
        print(f"File signature: {signature.hex()}")
        
        # JPEG files start with FF D8 FF
        if signature[:3] == b'\xff\xd8\xff':
            print("✅ Valid JPEG signature detected")
        else:
            print("❌ Invalid JPEG signature")

def test_api_upload():
    """Test API upload directly"""
    print("\n=== API Upload Test ===")
    
    files = create_test_files()
    
    for filename, file_info in files.items():
        print(f"\nTesting upload: {filename}")
        
        # Test different API endpoints
        endpoints = [
            "/documents/upload",
            "/collections/default/documents/upload",
            "/upload"
        ]
        
        for endpoint in endpoints:
            url = f"http://localhost:9621{endpoint}"
            print(f"Trying endpoint: {endpoint}")
            
            try:
                # Test as multipart/form-data (correct field name: 'file')
                files_payload = {
                    'file': (filename, file_info['data'], file_info['mime_type'])
                }
                
                response = requests.post(url, files=files_payload)
                print(f"  Status: {response.status_code}")
                print(f"  Response: {response.text[:100]}...")
                
                if response.status_code in [200, 201]:
                    print("  ✅ Upload successful!")
                    return True
                    
            except Exception as e:
                print(f"  ❌ Request failed: {e}")
    
    return False

def list_api_endpoints():
    """Try to discover available API endpoints"""
    print("\n=== API Endpoints Discovery ===")
    
    test_endpoints = [
        "/",
        "/docs",
        "/redoc", 
        "/openapi.json",
        "/health",
        "/collections",
        "/documents"
    ]
    
    for endpoint in test_endpoints:
        url = f"http://localhost:9621{endpoint}"
        try:
            response = requests.get(url)
            print(f"{endpoint}: {response.status_code}")
            if response.status_code == 200 and 'json' in response.headers.get('content-type', ''):
                try:
                    data = response.json()
                    if isinstance(data, dict) and len(str(data)) < 200:
                        print(f"  Data: {data}")
                except:
                    pass
        except Exception as e:
            print(f"{endpoint}: Error - {e}")

if __name__ == "__main__":
    print("🧪 LightRAG File Upload Debug Test")
    print("=" * 50)
    
    if not test_health():
        print("❌ Server is not running. Please start LightRAG server first.")
        exit(1)
    
    test_file_detection()
    list_api_endpoints()
    test_api_upload()
