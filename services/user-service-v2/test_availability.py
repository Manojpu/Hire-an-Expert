"""
Example of how to use the /users/me/availability-rules endpoint:

1. Make a POST request to /users/me/availability-rules
2. Include an authentication token in the Authorization header
3. Send the following JSON payload:
"""

# Sample payload structure
sample_payload = {
    "availabilityRules": [
        {
            "day_of_week": 1,  # Monday
            "start_time_utc": "09:00",
            "end_time_utc": "17:00"
        },
        {
            "day_of_week": 2,  # Tuesday
            "start_time_utc": "09:00",
            "end_time_utc": "17:00"
        }
    ],
    "dateOverrides": [
        {
            "unavailable_date": "2025-09-18"  # Format: YYYY-MM-DD
        },
        {
            "unavailable_date": "2025-09-15"
        }
    ]
}

"""
Example cURL command:

curl -X POST http://localhost:8000/users/me/availability-rules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "availabilityRules": [
        {
            "day_of_week": 1,
            "start_time_utc": "09:00",
            "end_time_utc": "17:00"
        },
        {
            "day_of_week": 2,
            "start_time_utc": "09:00",
            "end_time_utc": "17:00"
        }
    ],
    "dateOverrides": [
        {
            "unavailable_date": "2025-09-18"
        },
        {
            "unavailable_date": "2025-09-15"
        }
    ]
}'

Example Python code:

```python
import requests

url = "http://localhost:8000/users/me/availability-rules"
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_ACCESS_TOKEN"
}
payload = {
    "availabilityRules": [
        {
            "day_of_week": 1,
            "start_time_utc": "09:00",
            "end_time_utc": "17:00"
        },
        {
            "day_of_week": 2,
            "start_time_utc": "09:00",
            "end_time_utc": "17:00"
        }
    ],
    "dateOverrides": [
        {
            "unavailable_date": "2025-09-18"
        },
        {
            "unavailable_date": "2025-09-15"
        }
    ]
}

response = requests.post(url, headers=headers, json=payload)
print(response.json())
```
"""