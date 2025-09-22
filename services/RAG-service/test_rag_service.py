"""
Simple test script to check if the RAG service starts properly.
This will test the basic FastAPI application without complex dependencies.
"""
import subprocess
import sys
import os
import time
import requests
from threading import Thread

def test_server_startup():
    """Test if the server starts and responds to basic requests"""
    print("🧪 Testing RAG Service Startup...")
    
    # Change to app directory
    app_dir = os.path.join(os.path.dirname(__file__), 'app')
    if not os.path.exists(app_dir):
        print("❌ App directory not found!")
        return False
    
    os.chdir(app_dir)
    print(f"📂 Changed to: {os.getcwd()}")
    
    # Start the server in a subprocess
    print("🚀 Starting server...")
    try:
        server_process = subprocess.Popen(
            [sys.executable, 'main.py'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait a bit for server to start
        time.sleep(3)
        
        # Test if server is responding
        try:
            response = requests.get("http://localhost:8004/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("✅ Server is responding!")
                print(f"   Message: {data.get('message', 'N/A')}")
                print(f"   Status: {data.get('status', 'N/A')}")
                
                # Test health endpoint
                health_response = requests.get("http://localhost:8004/health", timeout=5)
                if health_response.status_code == 200:
                    health_data = health_response.json()
                    print("✅ Health endpoint working!")
                    print(f"   Components: {health_data.get('components', {})}")
                else:
                    print("⚠️ Health endpoint not working")
                
                success = True
            else:
                print(f"❌ Server responded with status: {response.status_code}")
                success = False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Could not connect to server: {e}")
            success = False
        
        # Stop the server
        server_process.terminate()
        server_process.wait(timeout=5)
        print("🛑 Server stopped")
        
        return success
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False

def test_imports():
    """Test if individual modules can be imported"""
    print("🧪 Testing Module Imports...")
    
    # Test config
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'core'))
        from config import settings
        print(f"✅ Config loaded - Port: {settings.PORT}")
    except Exception as e:
        print(f"⚠️ Config import failed: {e}")
    
    # Test logger
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))
        from logger import get_logger
        logger = get_logger("test")
        print("✅ Logger working")
    except Exception as e:
        print(f"⚠️ Logger import failed: {e}")
    
    # Test schemas
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), 'schemas'))
        from rag_schemas import GigSearchRequest
        test_req = GigSearchRequest(query="test", top_k=5)
        print("✅ Schemas working")
    except Exception as e:
        print(f"⚠️ Schemas import failed: {e}")

def main():
    """Run all tests"""
    print("=" * 60)
    print("RAG SERVICE TESTING")
    print("=" * 60)
    
    # Test imports first
    test_imports()
    print()
    
    # Test server startup
    server_works = test_server_startup()
    
    print()
    print("=" * 60)
    if server_works:
        print("🎉 RAG Service is working correctly!")
        print("To start the service manually, run:")
        print("cd app && python main.py")
    else:
        print("❌ RAG Service has issues. Check the logs above.")
    print("=" * 60)

if __name__ == "__main__":
    main()