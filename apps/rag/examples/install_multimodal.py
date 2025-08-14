#!/usr/bin/env python3
"""
Installation and verification script for LightRAG multimodal capabilities.

This script helps users install and verify the multimodal integration setup.
"""

import subprocess
import sys
import importlib
from typing import Dict, List, Tuple


def check_package_installed(package: str) -> bool:
    """Check if a package is installed."""
    try:
        importlib.import_module(package)
        return True
    except ImportError:
        return False


def install_package(package: str) -> Tuple[bool, str]:
    """Install a package using pip."""
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", package
        ], capture_output=True, text=True)
        return True, f"Successfully installed {package}"
    except subprocess.CalledProcessError as e:
        return False, f"Failed to install {package}: {e.stderr}"


def verify_multimodal_setup() -> Dict[str, bool]:
    """Verify that all multimodal components are available."""
    results = {}
    
    # Check core lightrag
    results["lightrag"] = check_package_installed("lightrag")
    
    # Check raganything
    results["raganything"] = check_package_installed("raganything")
    
    # Check multimodal integration
    try:
        from lightrag import (
            LightRAGMultimodal,
            create_multimodal_lightrag,
            RAGANYTHING_AVAILABLE
        )
        results["multimodal_integration"] = True
        results["raganything_detected"] = RAGANYTHING_AVAILABLE
    except ImportError:
        results["multimodal_integration"] = False
        results["raganything_detected"] = False
    
    # Check vision model support
    try:
        from lightrag import create_openai_vision_func
        results["openai_vision_support"] = True
    except ImportError:
        results["openai_vision_support"] = False
    
    return results


def main():
    """Main installation and verification process."""
    print("🚀 LightRAG Multimodal Setup Verification")
    print("=" * 50)
    
    # Check current setup
    print("\n📋 Checking current installation...")
    results = verify_multimodal_setup()
    
    for component, available in results.items():
        status = "✅" if available else "❌"
        print(f"  {status} {component}: {'Available' if available else 'Not available'}")
    
    # Install missing components
    missing_packages = []
    
    if not results.get("lightrag", False):
        missing_packages.append("lightrag-hku")
    
    if not results.get("raganything", False):
        missing_packages.append("raganything")
    
    if missing_packages:
        print(f"\n📦 Installing missing packages: {', '.join(missing_packages)}")
        
        for package in missing_packages:
            print(f"\n  Installing {package}...")
            success, message = install_package(package)
            
            if success:
                print(f"    ✅ {message}")
            else:
                print(f"    ❌ {message}")
                print(f"    Please try manually: pip install {package}")
    
    # Verify again after installation
    print("\n🔍 Re-verifying installation...")
    final_results = verify_multimodal_setup()
    
    all_good = all(final_results.values())
    
    if all_good:
        print("\n🎉 All components successfully installed and verified!")
        print("\n📖 Next steps:")
        print("  1. Check examples/multimodal_example.py for usage examples")
        print("  2. Read MULTIMODAL_INTEGRATION.md for detailed documentation")
        print("  3. Configure your API keys for vision models")
        
        # Show quick example
        print("\n🔥 Quick test:")
        print("""
from lightrag import create_multimodal_lightrag, RAGANYTHING_AVAILABLE

if RAGANYTHING_AVAILABLE:
    print("✅ Multimodal capabilities are ready!")
else:
    print("❌ RAG-Anything not detected")
""")
    else:
        print("\n⚠️  Some components are missing:")
        for component, available in final_results.items():
            if not available:
                print(f"  ❌ {component}")
        
        print("\n🛠️  Try installing manually:")
        print("  pip install lightrag-hku raganything")


if __name__ == "__main__":
    main()

