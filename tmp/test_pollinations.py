import requests
import json

API_KEY = "sk_rkaaVHVP4bc5VUUBapk4T2QuDj5qc7oa"
URL = "https://gen.pollinations.ai/v1/images/generations"

payload = {
    "model": "flux",
    "prompt": "A rusted iron broadsword. Dark fantasy RPG aesthetic, highly detailed, pitch black void background.",
    "size": "512x512"
}
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(URL, headers=headers, json=payload, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Full Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")
