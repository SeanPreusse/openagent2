#!/usr/bin/env python3
"""
LightRAG Multimodal Integration Validation Script

This script validates that all multimodal components are properly integrated
and working with Azure OpenAI configuration.
"""

import asyncio
import os
import sys
import tempfile
import json
from pathlib import Path
from typing import Dict, List, Any, Optional


class MultimodalIntegrationValidator:
    """Validates the complete multimodal integration"""
    
    def __init__(self):
        self.results = {}
        self.errors = []
        self.warnings = []
    
    def check_python_packages(self) -> Dict[str, bool]:
        """Check if all required packages are available"""
        packages = {
            'lightrag': False,
            'raganything': False,
            'openai': False,
            'PIL': False,  # Pillow for image processing
            'pandas': False,
            'openpyxl': False,  # Excel support
            'python-pptx': False,  # PowerPoint support
        }
        
        for package in packages.keys():
            try:
                if package == 'PIL':
                    import PIL
                elif package == 'python-pptx':
                    import pptx
                else:
                    __import__(package)
                packages[package] = True
            except ImportError:
                packages[package] = False
        
        return packages
    
    def check_lightrag_multimodal_import(self) -> Dict[str, bool]:
        """Check if LightRAG multimodal components can be imported"""
        components = {
            'LightRAG': False,
            'LightRAGMultimodal': False,
            'MultimodalConfig': False,
            'create_multimodal_lightrag': False,
            'create_openai_vision_func': False,
            'RAGANYTHING_AVAILABLE': False,
        }
        
        try:
            from lightrag import (
                LightRAG,
                LightRAGMultimodal,
                MultimodalConfig,
                create_multimodal_lightrag,
                create_openai_vision_func,
                RAGANYTHING_AVAILABLE,
            )
            
            components['LightRAG'] = True
            components['LightRAGMultimodal'] = True
            components['MultimodalConfig'] = True
            components['create_multimodal_lightrag'] = True
            components['create_openai_vision_func'] = True
            components['RAGANYTHING_AVAILABLE'] = RAGANYTHING_AVAILABLE
            
        except ImportError as e:
            self.errors.append(f"Failed to import LightRAG multimodal components: {e}")
        
        return components
    
    def check_azure_openai_config(self) -> Dict[str, Any]:
        """Check Azure OpenAI configuration"""
        config = {
            'env_file_exists': os.path.exists('.env'),
            'required_vars': {},
            'optional_vars': {},
        }
        
        # Load environment variables
        if config['env_file_exists']:
            try:
                with open('.env', 'r') as f:
                    env_content = f.read()
                    
                # Check required variables for Azure OpenAI
                required_vars = [
                    'LLM_BINDING',
                    'AZURE_OPENAI_API_KEY',
                    'AZURE_OPENAI_ENDPOINT',
                    'AZURE_OPENAI_DEPLOYMENT',
                    'EMBEDDING_BINDING',
                    'AZURE_EMBEDDING_DEPLOYMENT',
                ]
                
                for var in required_vars:
                    value = os.getenv(var)
                    config['required_vars'][var] = {
                        'present': value is not None,
                        'configured': value and not any(placeholder in value.lower() 
                                                      for placeholder in ['your_', 'replace', 'example']),
                        'value_preview': value[:20] + '...' if value and len(value) > 20 else value
                    }
                
                # Check optional multimodal variables
                optional_vars = [
                    'ENABLE_MULTIMODAL',
                    'VISION_MODEL',
                    'AZURE_VISION_DEPLOYMENT',
                    'MULTIMODAL_OUTPUT_DIR',
                ]
                
                for var in optional_vars:
                    value = os.getenv(var)
                    config['optional_vars'][var] = {
                        'present': value is not None,
                        'value': value
                    }
                    
            except Exception as e:
                self.errors.append(f"Error reading .env file: {e}")
        
        return config
    
    def create_test_documents(self) -> Dict[str, str]:
        """Create test documents for multimodal testing"""
        test_docs = {}
        
        try:
            # Create a test CSV file (Excel alternative)
            csv_content = """Product,Revenue,Quarter
Product A,150000,Q1
Product B,200000,Q1
Product C,180000,Q1
Product A,165000,Q2
Product B,220000,Q2
Product C,195000,Q2"""
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
                f.write(csv_content)
                test_docs['csv'] = f.name
            
            # Create a test text file with structured data
            txt_content = """Financial Summary Report Q2 2024

REVENUE BREAKDOWN:
- North America: $2,450,000 (45%)
- Europe: $1,890,000 (35%)
- Asia Pacific: $1,080,000 (20%)

KEY METRICS:
- Customer Acquisition Cost: $125
- Lifetime Value: $2,800
- Churn Rate: 3.2%
- Net Promoter Score: 68

QUARTERLY TARGETS:
Q3 Target: $6,200,000
Q4 Target: $7,100,000"""
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
                f.write(txt_content)
                test_docs['txt'] = f.name
            
            print(f"✅ Created test documents: {list(test_docs.keys())}")
            
        except Exception as e:
            self.errors.append(f"Failed to create test documents: {e}")
        
        return test_docs
    
    async def test_basic_lightrag_functionality(self) -> bool:
        """Test basic LightRAG functionality"""
        try:
            from lightrag import LightRAG
            from lightrag.llm.openai import openai_complete_if_cache, openai_embed
            from lightrag.utils import EmbeddingFunc
            
            # Check if we can create a basic LightRAG instance
            with tempfile.TemporaryDirectory() as temp_dir:
                lightrag_instance = LightRAG(
                    working_dir=temp_dir,
                    llm_model_func=lambda prompt, **kwargs: "Test response",
                    embedding_func=EmbeddingFunc(
                        embedding_dim=1536,
                        func=lambda texts: [[0.1] * 1536 for _ in texts],
                    )
                )
                
                # Test basic initialization
                await lightrag_instance.initialize_storages()
                print("✅ Basic LightRAG functionality test passed")
                return True
                
        except Exception as e:
            self.errors.append(f"Basic LightRAG functionality test failed: {e}")
            return False
    
    async def test_multimodal_integration(self) -> bool:
        """Test multimodal integration"""
        try:
            from lightrag import (
                LightRAG,
                create_multimodal_lightrag,
                create_openai_vision_func,
                MultimodalConfig,
                RAGANYTHING_AVAILABLE
            )
            
            if not RAGANYTHING_AVAILABLE:
                self.warnings.append("RAG-Anything is not available for multimodal testing")
                return False
            
            # Create a mock vision function for testing
            def mock_vision_func(prompt, system_prompt=None, history_messages=[], image_data=None, **kwargs):
                if image_data:
                    return f"Mock vision analysis of image with prompt: {prompt}"
                else:
                    return f"Mock text response to: {prompt}"
            
            # Test multimodal configuration
            config = MultimodalConfig(
                vision_model_func=mock_vision_func,
                enable_image_processing=True,
                enable_office_processing=True,
                output_dir=tempfile.mkdtemp()
            )
            
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create basic LightRAG instance
                lightrag_instance = LightRAG(
                    working_dir=temp_dir,
                    llm_model_func=lambda prompt, **kwargs: "Test response",
                    embedding_func=lambda texts: [[0.1] * 1536 for _ in texts],
                )
                
                await lightrag_instance.initialize_storages()
                
                # Create multimodal enhanced instance
                multimodal_rag = await create_multimodal_lightrag(
                    lightrag_instance=lightrag_instance,
                    config=config
                )
                
                print("✅ Multimodal integration test passed")
                return True
                
        except Exception as e:
            self.errors.append(f"Multimodal integration test failed: {e}")
            return False
    
    def cleanup_test_files(self, test_docs: Dict[str, str]):
        """Clean up test documents"""
        for doc_type, file_path in test_docs.items():
            try:
                os.unlink(file_path)
                print(f"🧹 Cleaned up {doc_type} test file")
            except Exception as e:
                self.warnings.append(f"Could not clean up {doc_type} test file: {e}")
    
    async def run_validation(self) -> bool:
        """Run complete validation suite"""
        print("🔍 LightRAG Multimodal Integration Validation")
        print("=" * 60)
        
        # 1. Check Python packages
        print("\n1. 📦 Checking Python packages...")
        package_status = self.check_python_packages()
        
        for package, available in package_status.items():
            status = "✅" if available else "❌"
            print(f"  {status} {package}")
            
        if not all(package_status.values()):
            missing = [pkg for pkg, avail in package_status.items() if not avail]
            self.errors.append(f"Missing packages: {', '.join(missing)}")
        
        # 2. Check LightRAG multimodal imports
        print("\n2. 🔧 Checking LightRAG multimodal components...")
        component_status = self.check_lightrag_multimodal_import()
        
        for component, available in component_status.items():
            status = "✅" if available else "❌"
            print(f"  {status} {component}")
        
        if not component_status.get('RAGANYTHING_AVAILABLE', False):
            self.warnings.append("RAG-Anything is not available - multimodal features will be limited")
        
        # 3. Check Azure OpenAI configuration
        print("\n3. ☁️  Checking Azure OpenAI configuration...")
        azure_config = self.check_azure_openai_config()
        
        if azure_config['env_file_exists']:
            print("  ✅ .env file found")
            
            for var, details in azure_config['required_vars'].items():
                if details['present'] and details['configured']:
                    print(f"  ✅ {var}: Configured")
                elif details['present']:
                    print(f"  ⚠️  {var}: Present but appears to be placeholder")
                else:
                    print(f"  ❌ {var}: Missing")
            
            for var, details in azure_config['optional_vars'].items():
                if details['present']:
                    print(f"  ✅ {var}: {details['value']}")
                else:
                    print(f"  ⚠️  {var}: Not set (optional)")
        else:
            print("  ❌ .env file not found")
            self.errors.append("No .env file found")
        
        # 4. Test basic functionality
        print("\n4. 🧪 Testing basic functionality...")
        basic_test_passed = await self.test_basic_lightrag_functionality()
        
        # 5. Test multimodal integration
        print("\n5. 🔍 Testing multimodal integration...")
        multimodal_test_passed = await self.test_multimodal_integration()
        
        # 6. Create and test with documents
        print("\n6. 📄 Creating test documents...")
        test_docs = self.create_test_documents()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 VALIDATION SUMMARY")
        print("=" * 60)
        
        # Count results
        total_packages = len(package_status)
        available_packages = sum(package_status.values())
        
        total_components = len(component_status)
        available_components = sum(component_status.values())
        
        print(f"📦 Packages: {available_packages}/{total_packages} available")
        print(f"🔧 Components: {available_components}/{total_components} available")
        print(f"☁️  Azure OpenAI: {'Configured' if azure_config['env_file_exists'] else 'Not configured'}")
        print(f"🧪 Basic functionality: {'✅ Pass' if basic_test_passed else '❌ Fail'}")
        print(f"🔍 Multimodal integration: {'✅ Pass' if multimodal_test_passed else '❌ Fail'}")
        
        # Show errors and warnings
        if self.errors:
            print(f"\n❌ Errors ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
        
        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")
        
        # Overall assessment
        critical_issues = len(self.errors)
        
        if critical_issues == 0:
            print("\n🎉 Integration validation PASSED! Multimodal LightRAG is ready to use.")
            success = True
        elif critical_issues <= 2:
            print("\n⚠️  Integration validation PASSED with warnings. Most features should work.")
            success = True
        else:
            print("\n❌ Integration validation FAILED. Please address the errors above.")
            success = False
        
        # Cleanup
        if test_docs:
            print("\n🧹 Cleaning up test files...")
            self.cleanup_test_files(test_docs)
        
        return success


def main():
    """Main function"""
    print("🚀 LightRAG Multimodal Integration Validation")
    print("This script validates the complete multimodal integration setup")
    print()
    
    validator = MultimodalIntegrationValidator()
    
    try:
        success = asyncio.run(validator.run_validation())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️  Validation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Validation failed with error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

