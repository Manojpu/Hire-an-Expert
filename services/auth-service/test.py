import requests

token="eyJhbGciOiJSUzI1NiIsImtpZCI6Ijk1MWRkZTkzMmViYWNkODhhZmIwMDM3YmZlZDhmNjJiMDdmMDg2NmIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vZmFzdGFwaWF1dGgtZmM3NTciLCJhdWQiOiJmYXN0YXBpYXV0aC1mYzc1NyIsImF1dGhfdGltZSI6MTc1Mzk3NDMyOSwidXNlcl9pZCI6ImpkMzd1bndVZEtNQmhmTGZyMFptSEJuZnM4ajEiLCJzdWIiOiJqZDM3dW53VWRLTUJoZkxmcjBabUhCbmZzOGoxIiwiaWF0IjoxNzUzOTc0MzI5LCJleHAiOjE3NTM5Nzc5MjksImVtYWlsIjoiZXhhbXBsZUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6ZmFsc2UsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsiZXhhbXBsZUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.Q-7lA8zxdO1Cpl3VJvNRYHRMRyqb8KreBoUzghWb5_xr5c-nC54x9almxbuB7ctbT5gNoIS0OhEN6N2dkBfQg0ZerqzxqwOE__mNm4_9RXl24CfvBVqcC_3uIj8eIcq4WGdksUdABjBANj-dch8ZW5kf-9yA3GcBKmsJOurdBxAAs3Q8kUI52OwV-sQW2vBoXd8qKMnAbhZmtNSck_BJWGebuTKG_BNyhGt5Hc0K1PjjEj4_EgL8HOFKS1FNHUOnx8jlJs7hV7bUqjmEzw9OlF4gwLvjx2mjHrOPVtfrgGDLf8kyWpK-wmChgprfw99qYEC_F9mXXUcP2lY-rSuHzA"

def test_validate_endpoint():

    headers = {
            'authorization':token
        }

    response = requests.post(
        "http://127.0.0.1:8000/ping",
        headers = headers
    )

    return response.text

print(test_validate_endpoint())    