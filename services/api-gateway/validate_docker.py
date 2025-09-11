#!/usr/bin/env python3
"""
Docker Configuration Validator for API Gateway
Validates Docker setup without actually building
"""
import os
import re

def validate_dockerfile():
    """Validate Dockerfile configuration"""
    print("🐳 Validating Dockerfile...")
    
    if not os.path.exists("Dockerfile"):
        print("❌ Dockerfile not found!")
        return False
    
    with open("Dockerfile", "r") as f:
        content = f.read()
    
    checks = [
        ("Python base image", r"FROM python:[\d\.-]+"),
        ("Working directory", r"WORKDIR /app"),
        ("Requirements copy", r"COPY requirements\.txt"),
        ("Pip install", r"pip install.*requirements\.txt"),
        ("Source copy", r"COPY \. \."),
        ("User creation", r"useradd.*app"),
        ("Port exposure", r"EXPOSE 8000"),
        ("Health check", r"HEALTHCHECK"),
        ("Start command", r'CMD.*uvicorn.*main:app'),
    ]
    
    passed = 0
    for check_name, pattern in checks:
        if re.search(pattern, content):
            print(f"   ✅ {check_name}")
            passed += 1
        else:
            print(f"   ❌ {check_name}")
    
    print(f"📊 Dockerfile validation: {passed}/{len(checks)} checks passed")
    return passed == len(checks)

def validate_docker_compose():
    """Validate docker-compose.yml"""
    print("\n🐳 Validating docker-compose.yml...")
    
    if not os.path.exists("docker-compose.yml"):
        print("❌ docker-compose.yml not found!")
        return False
    
    with open("docker-compose.yml", "r") as f:
        content = f.read()
    
    checks = [
        ("Service definition", r"api-gateway:"),
        ("Build context", r"build: \."),
        ("Port mapping", r"8000:8000"),
        ("Environment variables", r"environment:"),
        ("Volume mapping", r"volumes:"),
        ("Health check", r"healthcheck:"),
        ("Restart policy", r"restart:"),
    ]
    
    passed = 0
    for check_name, pattern in checks:
        if re.search(pattern, content):
            print(f"   ✅ {check_name}")
            passed += 1
        else:
            print(f"   ❌ {check_name}")
    
    print(f"📊 Docker Compose validation: {passed}/{len(checks)} checks passed")
    return passed == len(checks)

def validate_dockerignore():
    """Validate .dockerignore file"""
    print("\n🐳 Validating .dockerignore...")
    
    if not os.path.exists(".dockerignore"):
        print("❌ .dockerignore not found!")
        return False
    
    with open(".dockerignore", "r") as f:
        content = f.read()
    
    important_ignores = [
        "venv/",
        ".env",
        "__pycache__/",
        ".pytest_cache/",
        "test_*.py",
        ".git/"
    ]
    
    passed = 0
    for ignore in important_ignores:
        if ignore in content:
            print(f"   ✅ {ignore} ignored")
            passed += 1
        else:
            print(f"   ❌ {ignore} not ignored")
    
    print(f"📊 .dockerignore validation: {passed}/{len(important_ignores)} checks passed")
    return passed == len(important_ignores)

def validate_requirements():
    """Validate requirements.txt for Docker compatibility"""
    print("\n🐳 Validating requirements.txt...")
    
    if not os.path.exists("requirements.txt"):
        print("❌ requirements.txt not found!")
        return False
    
    with open("requirements.txt", "r") as f:
        content = f.read()
    
    required_packages = [
        "fastapi",
        "uvicorn",
        "pydantic",
        "httpx",
        "python-dotenv"
    ]
    
    passed = 0
    for package in required_packages:
        if package in content:
            print(f"   ✅ {package}")
            passed += 1
        else:
            print(f"   ❌ {package}")
    
    print(f"📊 Requirements validation: {passed}/{len(required_packages)} checks passed")
    return passed == len(required_packages)

def main():
    """Run all Docker validations"""
    print("🐳 Docker Configuration Validation")
    print("=" * 50)
    
    validations = [
        validate_dockerfile(),
        validate_docker_compose(),
        validate_dockerignore(),
        validate_requirements()
    ]
    
    passed = sum(validations)
    total = len(validations)
    
    print("\n" + "=" * 50)
    print(f"📋 DOCKER VALIDATION SUMMARY")
    print("=" * 50)
    
    if passed == total:
        print("🎉 All Docker validations passed!")
        print("✅ Ready for Docker build and deployment")
    else:
        print(f"⚠️  {passed}/{total} validations passed")
        print("❌ Please fix the issues above")
    
    print("\n🚀 To build and run with Docker:")
    print("   docker build -t api-gateway .")
    print("   docker-compose up")

if __name__ == "__main__":
    main()
