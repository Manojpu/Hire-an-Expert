"""
Startup script for Payment Service that handles module imports correctly.
"""
import os
import sys
import subprocess

def main():
    print("🚀 Payment Service Startup")
    print("=" * 40)
    
    # Get the current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    app_dir = os.path.join(current_dir, 'app')
    
    # Check if we're in the right directory
    if not os.path.exists(app_dir):
        print("❌ App directory not found!")
        print(f"Current directory: {current_dir}")
        print("Please run this script from the payment-service root directory")
        return 1
    
    print(f"📁 Working directory: {current_dir}")
    print(f"📂 App directory: {app_dir}")
    
    # Add the app directory to Python path
    env = os.environ.copy()
    pythonpath = env.get('PYTHONPATH', '')
    if pythonpath:
        env['PYTHONPATH'] = f"{app_dir}{os.pathsep}{pythonpath}"
    else:
        env['PYTHONPATH'] = app_dir
    
    print(f"🐍 Python path: {env['PYTHONPATH']}")
    
    # Change to app directory and run
    try:
        print("🎯 Starting Payment Service...")
        print("=" * 40)
        
        # Run the FastAPI application
        result = subprocess.run([
            sys.executable, '-m', 'uvicorn', 'main:app',
            '--host', '0.0.0.0',
            '--port', '8005',
            '--reload'
        ], cwd=app_dir, env=env, check=False)
        
        return result.returncode
        
    except KeyboardInterrupt:
        print("\n⏹️ Service stopped by user (Ctrl+C)")
        return 0
    except Exception as e:
        print(f"❌ Error starting service: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)