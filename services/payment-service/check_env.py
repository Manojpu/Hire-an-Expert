import os
from dotenv import load_dotenv

load_dotenv()
print('Stripe Public Key:', os.getenv('STRIPE_PUBLIC_KEY'))
print('Frontend URL:', os.getenv('FRONTEND_URL'))
