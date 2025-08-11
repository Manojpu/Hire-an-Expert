import stripe
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import os
import re

from dotenv import load_dotenv

load_dotenv()
# Initialize Stripe with the secret key from environment variables

def ensure_url_has_scheme(url):
    """
    Ensure that a URL has a scheme (http:// or https://).
    If no scheme is present, https:// is added as default.
    """
    if not re.match(r'^https?://', url):
        return f"https://{url}"
    return url

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
router = APIRouter()

class CheckoutRequest(BaseModel):
    booking_id: str
    booking_price: float
    gig_title: str

@router.post("/create-checkout-session")
def create_checkout_session(request: CheckoutRequest):
    try:
        session = stripe.checkout.Session.create(
            line_items=[
                {
                    'price_data': {
                        'currency': 'LKR',
                        'product_data': {
                            'name': request.gig_title,
                        },
                        'unit_amount': int(request.booking_price * 100),  # Convert to cents
                    },
                    'quantity': 1,
                }
            ],
            mode='payment',
            success_url=ensure_url_has_scheme(f"{os.getenv('BOOKING_SERVICE_URL', 'https://localhost:8000')}/booking/success?booking_id={request.booking_id}"),
            cancel_url=ensure_url_has_scheme(f"{os.getenv('BOOKING_SERVICE_URL', 'https://localhost:8000')}/booking/cancel?booking_id={request.booking_id}"),
        )
        return {"sessionId": session.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 