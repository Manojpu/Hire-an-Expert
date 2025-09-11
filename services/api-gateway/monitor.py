"""
Service Monitor for FastAPI API Gateway
"""
import asyncio
import httpx
import time
import os
from datetime import datetime
from typing import List, Dict, Any
import sys

# ANSI color codes for terminal output
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    GRAY = '\033[90m'
    BOLD = '\033[1m'
    END = '\033[0m'

# Service configuration
SERVICES = [
    {"name": "API Gateway", "url": "http://localhost:8000/health", "port": 8000},
    {"name": "Auth Service", "url": "http://localhost:8001/", "port": 8001},
    {"name": "Gig Service", "url": "http://localhost:8002/", "port": 8002},
    {"name": "Booking Service", "url": "http://localhost:8003/", "port": 8003},
    {"name": "Payment Service", "url": "http://localhost:8004/", "port": 8004},
    {"name": "Message Service", "url": "http://localhost:8005/", "port": 8005},
    {"name": "User Service V2", "url": "http://localhost:8006/", "port": 8006},
    {"name": "Review Service", "url": "http://localhost:8007/", "port": 8007},
    {"name": "Frontend", "url": "http://localhost:3000/", "port": 3000}
]

async def check_service(service: Dict[str, Any]) -> Dict[str, Any]:
    """Check individual service health"""
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            start_time = time.time()
            response = await client.get(service["url"])
            response_time = round((time.time() - start_time) * 1000)  # Convert to ms
            
            return {
                "name": service["name"],
                "port": service["port"],
                "status": "online",
                "response_time": response_time,
                "status_code": response.status_code,
                "data": response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text[:100]
            }
        except Exception as e:
            return {
                "name": service["name"],
                "port": service["port"],
                "status": "offline",
                "error": str(e),
                "response_time": None
            }

def clear_screen():
    """Clear terminal screen"""
    os.system('cls' if os.name == 'nt' else 'clear')

def display_status(results: List[Dict[str, Any]]):
    """Display service status"""
    clear_screen()
    
    print(f"{Colors.CYAN}{Colors.BOLD}🚀 Hire an Expert - Service Status Monitor{Colors.END}")
    print("=" * 60)
    print()
    
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"{Colors.GRAY}Last check: {timestamp}{Colors.END}")
    print()
    
    online_count = 0
    total_count = len(results)
    
    for result in results:
        status_icon = "✅" if result["status"] == "online" else "❌"
        status_color = Colors.GREEN if result["status"] == "online" else Colors.RED
        
        response_time = f"({result['response_time']}ms)" if result["response_time"] else ""
        
        print(f"{status_icon} {status_color}{result['name'].ljust(18)}{Colors.END} :{result['port']} {response_time}")
        
        if result["status"] == "online":
            online_count += 1
            if result.get("data"):
                data_str = str(result["data"])[:60]
                ellipsis = "..." if len(str(result["data"])) > 60 else ""
                print(f"    {Colors.GRAY}Response: {data_str}{ellipsis}{Colors.END}")
        else:
            print(f"    {Colors.RED}Error: {result['error']}{Colors.END}")
        print()
    
    # Summary
    health_percentage = round((online_count / total_count) * 100)
    if health_percentage == 100:
        summary_color = Colors.GREEN
    elif health_percentage >= 70:
        summary_color = Colors.YELLOW
    else:
        summary_color = Colors.RED
    
    print("=" * 60)
    print(f"{summary_color}System Health: {online_count}/{total_count} services online ({health_percentage}%){Colors.END}")
    
    if health_percentage < 100:
        print()
        print(f"{Colors.YELLOW}{Colors.BOLD}💡 Troubleshooting Tips:{Colors.END}")
        
        for result in results:
            if result["status"] == "offline":
                print(f"   • {Colors.YELLOW}{result['name']}: Check if service is running on port {result['port']}{Colors.END}")
                
                # Service-specific commands
                commands = {
                    "API Gateway": "cd services/api-gateway && uvicorn main:app --reload",
                    "Message Service": "cd services/msg-service && npm run dev",
                    "Frontend": "cd frontend && npm run dev",
                    "Auth Service": "cd services/auth-service && python main.py",
                    "Gig Service": "cd services/gig-service && python main.py",
                    "Booking Service": "cd services/booking-service && python main.py",
                    "Payment Service": "cd services/payment-service && python -m app.main",
                    "User Service V2": "cd services/user-service-v2 && python main.py",
                    "Review Service": "cd services/review-service && python main.py"
                }
                
                if result["name"] in commands:
                    print(f"     {Colors.GRAY}Command: {commands[result['name']]}{Colors.END}")
                print()
    
    print()
    print(f"{Colors.GRAY}Press Ctrl+C to exit monitor{Colors.END}")

async def monitor_services():
    """Main monitoring function"""
    print(f"{Colors.CYAN}🔍 Starting FastAPI service health monitor...{Colors.END}")
    print(f"{Colors.GRAY}Checking services every 10 seconds...{Colors.END}")
    
    try:
        while True:
            try:
                # Check all services concurrently
                results = await asyncio.gather(*[check_service(service) for service in SERVICES])
                display_status(results)
                
                # Wait 10 seconds before next check
                await asyncio.sleep(10)
                
            except Exception as e:
                print(f"{Colors.RED}Monitor error: {e}{Colors.END}")
                await asyncio.sleep(5)
                
    except KeyboardInterrupt:
        print(f"\n\n{Colors.CYAN}👋 Service monitor stopped{Colors.END}")

if __name__ == "__main__":
    try:
        asyncio.run(monitor_services())
    except KeyboardInterrupt:
        print(f"\n{Colors.CYAN}👋 Goodbye!{Colors.END}")
        sys.exit(0)
