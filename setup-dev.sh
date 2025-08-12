#!/bin/bash

# Hire an Expert - Development Environment Setup Script

echo "🚀 Setting up Hire an Expert Microservices Development Environment"
echo "================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[i]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_status "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_status "npm found: $NPM_VERSION"
    else
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_status "Python found: $PYTHON_VERSION"
    else
        print_error "Python 3 is not installed. Please install Python 3.8+ from https://python.org/"
        exit 1
    fi
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        PIP_VERSION=$(pip3 --version)
        print_status "pip found: $PIP_VERSION"
    else
        print_error "pip3 is not installed. Please install pip3."
        exit 1
    fi
    
    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker found: $DOCKER_VERSION"
    else
        print_warning "Docker is not installed. You can still run in development mode."
    fi
    
    # Check Docker Compose (optional)
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_VERSION=$(docker-compose --version)
        print_status "Docker Compose found: $DOCKER_COMPOSE_VERSION"
    else
        print_warning "Docker Compose is not installed. You can still run in development mode."
    fi
}

# Install dependencies for Node.js services
install_node_services() {
    print_info "Installing Node.js service dependencies..."
    
    # API Gateway
    print_info "Installing API Gateway dependencies..."
    cd services/api-gateway
    npm install
    if [ $? -eq 0 ]; then
        print_status "API Gateway dependencies installed"
    else
        print_error "Failed to install API Gateway dependencies"
    fi
    cd ../..
    
    # Message Service
    print_info "Installing Message Service dependencies..."
    cd services/msg-service
    npm install
    if [ $? -eq 0 ]; then
        print_status "Message Service dependencies installed"
    else
        print_error "Failed to install Message Service dependencies"
    fi
    cd ../..
    
    # Frontend
    print_info "Installing Frontend dependencies..."
    cd frontend
    npm install
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installed"
    else
        print_error "Failed to install Frontend dependencies"
    fi
    cd ..
}

# Install dependencies for Python services
install_python_services() {
    print_info "Installing Python service dependencies..."
    
    # Check if pipenv is installed
    if ! command -v pipenv &> /dev/null; then
        print_info "Installing pipenv..."
        pip3 install pipenv
    fi
    
    # Auth Service
    print_info "Installing Auth Service dependencies..."
    cd services/auth-service
    if [ -f "Pipfile" ]; then
        pipenv install
        if [ $? -eq 0 ]; then
            print_status "Auth Service dependencies installed"
        else
            print_error "Failed to install Auth Service dependencies"
        fi
    else
        print_warning "Pipfile not found in Auth Service"
    fi
    cd ../..
    
    # Other Python services
    for service in gig-service booking-service payment-service; do
        print_info "Installing $service dependencies..."
        cd "services/$service"
        if [ -f "requirements.txt" ]; then
            pip3 install -r requirements.txt
            if [ $? -eq 0 ]; then
                print_status "$service dependencies installed"
            else
                print_error "Failed to install $service dependencies"
            fi
        else
            print_warning "requirements.txt not found in $service"
        fi
        cd ../..
    done
}

# Create environment files
create_env_files() {
    print_info "Creating environment files..."
    
    # API Gateway .env
    if [ ! -f "services/api-gateway/.env" ]; then
        print_info "Creating API Gateway .env file..."
        cp services/api-gateway/.env services/api-gateway/.env.backup 2>/dev/null || true
        print_status "API Gateway .env file ready"
    else
        print_status "API Gateway .env file already exists"
    fi
}

# Display startup instructions
show_startup_instructions() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    print_info "To start the development environment:"
    echo ""
    echo "Option 1: Docker (Recommended)"
    echo "  docker-compose up --build"
    echo ""
    echo "Option 2: Development mode (Manual)"
    echo "  Terminal 1: cd services/api-gateway && npm run dev"
    echo "  Terminal 2: cd services/msg-service && npm run dev" 
    echo "  Terminal 3: cd services/auth-service && pipenv run python main.py"
    echo "  Terminal 4: cd services/gig-service && python main.py"
    echo "  Terminal 5: cd services/booking-service && python main.py"
    echo "  Terminal 6: cd services/payment-service && python -m app.main"
    echo "  Terminal 7: cd frontend && npm run dev"
    echo ""
    echo "Option 3: Using npm scripts"
    echo "  npm install concurrently -g"
    echo "  npm run dev  # Starts gateway, message service, and frontend"
    echo ""
    print_info "Access points:"
    echo "  🌐 Frontend: http://localhost:3000"
    echo "  🚪 API Gateway: http://localhost:8000"
    echo "  ❤️  Health Check: http://localhost:8000/health"
    echo ""
    print_info "Service ports:"
    echo "  🔐 Auth Service: http://localhost:8001"
    echo "  💼 Gig Service: http://localhost:8002"
    echo "  📅 Booking Service: http://localhost:8003"
    echo "  💳 Payment Service: http://localhost:8004"
    echo "  💬 Message Service: http://localhost:8005"
    echo ""
    print_warning "Make sure all services are running before testing the application!"
}

# Main execution
main() {
    check_prerequisites
    echo ""
    install_node_services
    echo ""
    install_python_services
    echo ""
    create_env_files
    echo ""
    show_startup_instructions
}

# Run main function
main
