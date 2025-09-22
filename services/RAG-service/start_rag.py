"""
Simple startup script for RAG service that handles all the path issues.
Run this instead of main.py directly.
"""
import os
import sys
import subprocess

def main():
    print("🚀 RAG Service Startup Script")
    print("=" * 50)
    
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.join(current_dir, 'app')
    
    print(f"📁 Current directory: {current_dir}")
    print(f"📂 App directory: {app_dir}")
    
    # Check if app directory exists
    if not os.path.exists(app_dir):
        print("❌ App directory not found!")
        return 1
    
    # Check if main.py exists
    main_py = os.path.join(app_dir, 'main.py')
    if not os.path.exists(main_py):
        print("❌ main.py not found in app directory!")
        return 1
    
    print("✅ Found main.py file")
    
    # Change to app directory
    original_cwd = os.getcwd()
    os.chdir(app_dir)
    print(f"📍 Changed to: {os.getcwd()}")
    
    try:
        print("🎯 Starting RAG Service...")
        print("=" * 50)
        
        # Run the FastAPI application
        result = subprocess.run([
            sys.executable, 'main.py'
        ], check=False)
        
        return result.returncode
        
    except KeyboardInterrupt:
        print("\n⏹️ Server stopped by user (Ctrl+C)")
        return 0
    except Exception as e:
        print(f"❌ Error running server: {e}")
        return 1
    finally:
        # Restore original directory
        os.chdir(original_cwd)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)