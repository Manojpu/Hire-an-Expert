#!/bin/bash

echo "Starting Hire-an-Expert Services..."
echo

echo "Starting User Service..."
cd user-service-v2
gnome-terminal --title="User Service" -- bash -c "python main.py; exec bash" &
cd ..

echo "Starting Auth Service..."
cd auth-service
gnome-terminal --title="Auth Service" -- bash -c "python main.py; exec bash" &
cd ..

echo
echo "Services started!"
echo "User Service: http://localhost:8001"
echo "Auth Service: http://localhost:8000"
echo
echo "Press Ctrl+C to stop all services..."
wait 