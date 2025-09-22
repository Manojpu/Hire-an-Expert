"""
Example payment flow demonstration for the Payment Service.
This script shows how to integrate with the Payment Service API.
"""
import asyncio
import aiohttp
import json
from decimal import Decimal

# Configuration
PAYMENT_SERVICE_URL = "http://localhost:8005"
API_BASE = f"{PAYMENT_SERVICE_URL}/api/v1"

class PaymentFlowExample:
    def __init__(self):
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def create_expert_account(self, user_id: str, name: str, email: str):
        """Step 1: Create Stripe Connect account for expert"""
        print(f"🔨 Creating expert account for {name}...")
        
        payload = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "country": "US",
            "business_type": "individual"
        }
        
        async with self.session.post(
            f"{API_BASE}/experts/create-account",
            json=payload
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Expert account created!")
                print(f"   Expert ID: {data['expert']['id']}")
                print(f"   Onboarding Link: {data['account_link']}")
                return data
            else:
                error = await response.text()
                print(f"❌ Failed to create expert account: {error}")
                return None
    
    async def initiate_payment(self, client_id: str, expert_id: int, gig_id: str, amount: float):
        """Step 2: Initiate payment with escrow"""
        print(f"💰 Initiating payment of ${amount}...")
        
        payload = {
            "client_id": client_id,
            "expert_id": expert_id,
            "gig_id": gig_id,
            "amount": amount,
            "currency": "USD",
            "description": f"Payment for gig {gig_id}",
            "idempotency_key": f"payment_{client_id}_{gig_id}"
        }
        
        async with self.session.post(
            f"{API_BASE}/payments/initiate",
            json=payload
        ) as response:
            if response.status == 200:
                data = await response.json()
                payment = data['payment']
                print(f"✅ Payment initiated!")
                print(f"   Payment UUID: {payment['payment_uuid']}")
                print(f"   Status: {payment['status']}")
                print(f"   Amount: ${payment['amount']}")
                print(f"   Commission: ${payment['commission']}")
                print(f"   Expert Amount: ${payment['expert_amount']}")
                print(f"   Client Secret: {data['client_secret'][:20]}...")
                return data
            else:
                error = await response.text()
                print(f"❌ Failed to initiate payment: {error}")
                return None
    
    async def check_payment_status(self, payment_uuid: str):
        """Step 3: Check payment status"""
        print(f"🔍 Checking payment status...")
        
        async with self.session.get(
            f"{API_BASE}/payments/status/{payment_uuid}"
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Payment Status: {data['status']}")
                print(f"   Can Capture: {data['can_capture']}")
                print(f"   Can Refund: {data['can_refund']}")
                return data
            else:
                error = await response.text()
                print(f"❌ Failed to get payment status: {error}")
                return None
    
    async def capture_payment(self, payment_uuid: str):
        """Step 4: Capture payment (release funds to expert)"""
        print(f"💸 Capturing payment...")
        
        payload = {
            "payment_uuid": payment_uuid,
            "notes": "Service completed successfully"
        }
        
        async with self.session.post(
            f"{API_BASE}/payments/capture",
            json=payload
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Payment captured!")
                print(f"   Status: {data['status']}")
                print(f"   Captured At: {data['captured_at']}")
                return data
            else:
                error = await response.text()
                print(f"❌ Failed to capture payment: {error}")
                return None
    
    async def refund_payment(self, payment_uuid: str, reason: str = "Service cancelled"):
        """Alternative Step 4: Refund payment"""
        print(f"🔄 Refunding payment...")
        
        payload = {
            "payment_uuid": payment_uuid,
            "reason": reason
        }
        
        async with self.session.post(
            f"{API_BASE}/payments/refund",
            json=payload
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Payment refunded!")
                print(f"   Status: {data['status']}")
                print(f"   Refund Reason: {data['refund_reason']}")
                return data
            else:
                error = await response.text()
                print(f"❌ Failed to refund payment: {error}")
                return None
    
    async def get_payment_history(self, user_id: str, user_type: str = "client"):
        """Get payment history for a user"""
        print(f"📊 Getting payment history for {user_type} {user_id}...")
        
        async with self.session.get(
            f"{API_BASE}/payments/history/{user_id}?user_type={user_type}&per_page=10"
        ) as response:
            if response.status == 200:
                data = await response.json()
                print(f"✅ Found {data['total_count']} payments")
                for payment in data['payments'][:3]:  # Show first 3
                    print(f"   - {payment['payment_uuid']}: ${payment['amount']} ({payment['status']})")
                return data
            else:
                error = await response.text()
                print(f"❌ Failed to get payment history: {error}")
                return None

async def demonstrate_successful_payment_flow():
    """Demonstrate a complete successful payment flow"""
    print("🚀 Starting Payment Flow Demonstration")
    print("=" * 60)
    
    async with PaymentFlowExample() as demo:
        # Step 1: Create expert account
        expert_data = await demo.create_expert_account(
            user_id="demo_expert_123",
            name="John Doe",
            email="john.doe@example.com"
        )
        
        if not expert_data:
            print("❌ Cannot continue without expert account")
            return
        
        expert_id = expert_data['expert']['id']
        print()
        
        # Step 2: Initiate payment
        payment_data = await demo.initiate_payment(
            client_id="demo_client_456",
            expert_id=expert_id,
            gig_id="demo_gig_789",
            amount=100.00
        )
        
        if not payment_data:
            print("❌ Cannot continue without payment")
            return
        
        payment_uuid = payment_data['payment']['payment_uuid']
        print()
        
        # Step 3: Check status
        await demo.check_payment_status(payment_uuid)
        print()
        
        # Step 4a: Capture payment (successful completion)
        print("📋 Scenario: Service completed successfully")
        await demo.capture_payment(payment_uuid)
        print()
        
        # Step 5: Check final status
        await demo.check_payment_status(payment_uuid)
        print()
        
        # Step 6: Get payment history
        await demo.get_payment_history("demo_client_456", "client")
        await demo.get_payment_history("demo_expert_123", "expert")

async def demonstrate_refund_flow():
    """Demonstrate a refund flow"""
    print("\n🔄 Starting Refund Flow Demonstration")
    print("=" * 60)
    
    async with PaymentFlowExample() as demo:
        # Create another payment for refund demo
        expert_data = await demo.create_expert_account(
            user_id="demo_expert_refund",
            name="Jane Smith",
            email="jane.smith@example.com"
        )
        
        if expert_data:
            payment_data = await demo.initiate_payment(
                client_id="demo_client_refund",
                expert_id=expert_data['expert']['id'],
                gig_id="demo_gig_refund",
                amount=75.00
            )
            
            if payment_data:
                payment_uuid = payment_data['payment']['payment_uuid']
                print()
                
                # Refund instead of capture
                print("📋 Scenario: Service cancelled, refunding client")
                await demo.refund_payment(payment_uuid, "Client requested cancellation")
                print()
                
                await demo.check_payment_status(payment_uuid)

async def main():
    """Run the complete demonstration"""
    print("🏪 Hire an Expert - Payment Service Demo")
    print("This demo shows the complete payment flow with escrow functionality")
    print()
    
    try:
        # Test service availability
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{PAYMENT_SERVICE_URL}/health") as response:
                if response.status != 200:
                    print(f"❌ Payment service not available at {PAYMENT_SERVICE_URL}")
                    print("Please make sure the service is running:")
                    print("python -m app.main")
                    return
        
        print(f"✅ Payment service is running at {PAYMENT_SERVICE_URL}")
        print()
        
        # Run demonstrations
        await demonstrate_successful_payment_flow()
        await demonstrate_refund_flow()
        
        print("\n🎉 Demo completed successfully!")
        print("\n📝 Next steps:")
        print("1. Integrate frontend payment form with Stripe.js")
        print("2. Set up webhook endpoint URL in Stripe dashboard")
        print("3. Test with real Stripe test cards")
        print("4. Configure production environment variables")
        
    except Exception as e:
        print(f"❌ Demo failed: {str(e)}")
        print("Please check that the Payment Service is running and accessible")

if __name__ == "__main__":
    asyncio.run(main())