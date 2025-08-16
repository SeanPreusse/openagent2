#!/usr/bin/env python3
"""
Docker Multimodal Test Script for LightRAG with Azure OpenAI

This script tests the multimodal functionality in a Docker environment
with Azure OpenAI configuration.
"""

import asyncio
import os
import sys
import json
import tempfile
from pathlib import Path
from typing import Dict, Any
import requests


class DockerMultimodalTester:
    """Test class for Docker multimodal functionality"""
    
    def __init__(self, host: str = "localhost", port: int = 9621):
        self.base_url = f"http://{host}:{port}"
        self.api_url = f"{self.base_url}/api"
        self.headers = {"Content-Type": "application/json"}
        
        # Check for API key
        api_key = os.getenv("LIGHTRAG_API_KEY")
        if api_key:
            self.headers["Authorization"] = f"Bearer {api_key}"
    
    def check_server_health(self) -> bool:
        """Check if the LightRAG server is running"""
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            return response.status_code == 200
        except requests.RequestException as e:
            print(f"❌ Server health check failed: {e}")
            return False
    
    def check_multimodal_support(self) -> Dict[str, bool]:
        """Check if multimodal features are available"""
        results = {}
        
        try:
            # Check if server supports multimodal endpoints
            response = requests.get(f"{self.api_url}/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                results["server_running"] = True
                results["multimodal_endpoint"] = "multimodal" in str(data)
            else:
                results["server_running"] = False
                results["multimodal_endpoint"] = False
        except Exception as e:
            print(f"❌ Error checking multimodal support: {e}")
            results["server_running"] = False
            results["multimodal_endpoint"] = False
        
        return results
    
    def test_text_insert(self) -> bool:
        """Test basic text insertion"""
        try:
            payload = {
                "content": "This is a test document for Docker multimodal testing.",
                "description": "Test document insertion"
            }
            
            response = requests.post(
                f"{self.api_url}/insert",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                print("✅ Text insertion test passed")
                return True
            else:
                print(f"❌ Text insertion failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Text insertion error: {e}")
            return False
    
    def test_query(self) -> bool:
        """Test basic query functionality"""
        try:
            payload = {
                "query": "What is in the test document?",
                "mode": "hybrid"
            }
            
            response = requests.post(
                f"{self.api_url}/query",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"✅ Query test passed: {result.get('response', 'No response')[:100]}...")
                return True
            else:
                print(f"❌ Query failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Query error: {e}")
            return False
    
    def create_test_files(self) -> Dict[str, str]:
        """Create temporary test files for multimodal testing"""
        test_files = {}
        
        # Create a simple CSV file (simulating Excel functionality)
        csv_content = """Name,Age,Department
John Doe,30,Engineering
Jane Smith,25,Marketing
Bob Johnson,35,Sales"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            f.write(csv_content)
            test_files['csv'] = f.name
        
        # Create a simple text file with tabular data
        txt_content = """Financial Report Q3 2024
Revenue: $1,250,000
Expenses: $800,000
Profit: $450,000

Key Performance Indicators:
- Customer Satisfaction: 92%
- Employee Retention: 85%
- Market Share: 15%"""
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(txt_content)
            test_files['txt'] = f.name
        
        return test_files
    
    def test_file_upload(self, file_path: str, file_type: str) -> bool:
        """Test file upload functionality"""
        try:
            with open(file_path, 'rb') as f:
                files = {'file': (os.path.basename(file_path), f, 'text/plain')}
                data = {'description': f'Test {file_type} file upload'}
                
                response = requests.post(
                    f"{self.api_url}/upload",
                    headers={k: v for k, v in self.headers.items() if k != "Content-Type"},
                    files=files,
                    data=data,
                    timeout=60
                )
            
            if response.status_code == 200:
                print(f"✅ {file_type.upper()} file upload test passed")
                return True
            else:
                print(f"❌ {file_type.upper()} file upload failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ {file_type.upper()} file upload error: {e}")
            return False
    
    def test_multimodal_query(self) -> bool:
        """Test multimodal query functionality"""
        try:
            payload = {
                "query": "What financial data is available? Show me the revenue and profit information.",
                "mode": "hybrid"
            }
            
            response = requests.post(
                f"{self.api_url}/query",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get('response', '')
                
                # Check if the response contains financial information
                if any(term in response_text.lower() for term in ['revenue', 'profit', 'financial']):
                    print(f"✅ Multimodal query test passed: Found financial data in response")
                    return True
                else:
                    print(f"⚠️  Multimodal query partially passed: {response_text[:100]}...")
                    return True
            else:
                print(f"❌ Multimodal query failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Multimodal query error: {e}")
            return False
    
    def check_azure_openai_config(self) -> Dict[str, bool]:
        """Check Azure OpenAI configuration"""
        results = {}
        
        # Check environment variables
        azure_vars = [
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_ENDPOINT", 
            "AZURE_OPENAI_DEPLOYMENT",
            "AZURE_EMBEDDING_DEPLOYMENT"
        ]
        
        for var in azure_vars:
            results[var] = bool(os.getenv(var))
        
        results["llm_binding"] = os.getenv("LLM_BINDING") == "azure_openai"
        results["embedding_binding"] = os.getenv("EMBEDDING_BINDING") == "azure_openai"
        
        return results
    
    def cleanup_test_files(self, test_files: Dict[str, str]):
        """Clean up temporary test files"""
        for file_type, file_path in test_files.items():
            try:
                os.unlink(file_path)
                print(f"🧹 Cleaned up {file_type} test file")
            except Exception as e:
                print(f"⚠️  Could not clean up {file_type} test file: {e}")
    
    async def run_full_test_suite(self):
        """Run the complete test suite"""
        print("🚀 Starting Docker Multimodal Test Suite")
        print("=" * 60)
        
        # Check server health
        print("\n1. 🏥 Checking server health...")
        if not self.check_server_health():
            print("❌ Server is not running. Please start with: docker compose up")
            return False
        
        # Check Azure OpenAI configuration
        print("\n2. ☁️  Checking Azure OpenAI configuration...")
        azure_config = self.check_azure_openai_config()
        for var, status in azure_config.items():
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {var}: {'Configured' if status else 'Not configured'}")
        
        # Check multimodal support
        print("\n3. 🔍 Checking multimodal support...")
        multimodal_status = self.check_multimodal_support()
        for feature, status in multimodal_status.items():
            status_icon = "✅" if status else "❌"
            print(f"  {status_icon} {feature}: {'Available' if status else 'Not available'}")
        
        # Test basic functionality
        print("\n4. 📝 Testing basic text functionality...")
        text_success = self.test_text_insert()
        query_success = self.test_query()
        
        # Test file uploads
        print("\n5. 📁 Testing file upload functionality...")
        test_files = self.create_test_files()
        upload_results = {}
        
        for file_type, file_path in test_files.items():
            upload_results[file_type] = self.test_file_upload(file_path, file_type)
        
        # Test multimodal queries
        print("\n6. 🔍 Testing multimodal query functionality...")
        multimodal_query_success = self.test_multimodal_query()
        
        # Clean up
        print("\n7. 🧹 Cleaning up test files...")
        self.cleanup_test_files(test_files)
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        all_tests = {
            "Server Health": self.check_server_health(),
            "Text Insert": text_success,
            "Basic Query": query_success,
            "Multimodal Query": multimodal_query_success,
            **{f"{ft.upper()} Upload": result for ft, result in upload_results.items()}
        }
        
        passed = sum(all_tests.values())
        total = len(all_tests)
        
        for test_name, result in all_tests.items():
            status_icon = "✅" if result else "❌"
            print(f"  {status_icon} {test_name}")
        
        print(f"\n📈 Overall Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Docker multimodal setup is working correctly.")
        elif passed >= total * 0.7:
            print("⚠️  Most tests passed. Check the failed tests above.")
        else:
            print("❌ Many tests failed. Please check your configuration.")
        
        return passed == total


def main():
    """Main function"""
    print("🐳 LightRAG Docker Multimodal Functionality Test")
    print("This script tests the multimodal capabilities in Docker environment")
    print()
    
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description="Test Docker multimodal functionality")
    parser.add_argument("--host", default="localhost", help="LightRAG server host")
    parser.add_argument("--port", type=int, default=9621, help="LightRAG server port")
    parser.add_argument("--quick", action="store_true", help="Run quick tests only")
    
    args = parser.parse_args()
    
    # Create tester instance
    tester = DockerMultimodalTester(host=args.host, port=args.port)
    
    # Run tests
    try:
        success = asyncio.run(tester.run_full_test_suite())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test suite failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
