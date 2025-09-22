"""
Simplified startup script for the RAG service.
This script handles all the import issues and starts the server.
"""
import os
import sys
import subprocess

def main():
    print("🚀 Starting RAG Service...")
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.join(current_dir, 'app')
    
    print(f"📁 App directory: {app_dir}")
    
    # Check if app directory exists
    if not os.path.exists(app_dir):
        print("❌ App directory not found!")
        return
    
    # Check if main.py exists
    main_py = os.path.join(app_dir, 'main.py')
    if not os.path.exists(main_py):
        print("❌ main.py not found in app directory!")
        return
    
    # Print environment info
    print(f"🐍 Python version: {sys.version}")
    print(f"📍 Current working directory: {os.getcwd()}")
    
    # Change to app directory and run
    os.chdir(app_dir)
    print(f"📂 Changed to: {os.getcwd()}")
    
    print("▶️ Starting FastAPI server...")
    print("=" * 50)
    
    try:
        # Run the main.py file
        result = subprocess.run([sys.executable, 'main.py'], 
                              capture_output=False, 
                              text=True)
        return result.returncode
    except KeyboardInterrupt:
        print("\n⏹️ Server stopped by user")
        return 0
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)