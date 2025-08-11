import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# URL of your endpoint
url = "http://localhost:8000/payments/create-checkout-session"

# Correct payload structure matching the CheckoutRequest model
payload = {
    "booking_id": "12345",
    "booking_price": 100.50,  # Must be a number
    "gig_title": "Test Gig Service"
}

headers = {
    "Content-Type": "application/json"
}

# Print env vars to debug
print("BOOKING_SERVICE_URL:", os.getenv("BOOKING_SERVICE_URL"))
print("STRIPE_SECRET_KEY exists:", bool(os.getenv("STRIPE_SECRET_KEY")))

# Send the request
try:
    response = requests.post(url, data=json.dumps(payload), headers=headers)
    
    # Print response status and content
    print(f"Status code: {response.status_code}")
    print(f"Response body: {response.text}")
    
    if response.status_code == 200:
        print("Success! Checkout session created")
        checkout_data = response.json()
        print(f"Session ID: {checkout_data.get('sessionId')}")
        print("You can use this session ID to redirect to Stripe's checkout page")
    else:
        print(f"Error: Status code {response.status_code}")
except Exception as e:
    print(f"Exception occurred: {e}")
