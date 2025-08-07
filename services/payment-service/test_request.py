import requests
import json

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

# Send the request
response = requests.post(url, data=json.dumps(payload), headers=headers)

# Print response status and content
print(f"Status code: {response.status_code}")
print(f"Response body: {response.text}")
