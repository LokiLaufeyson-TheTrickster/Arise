import requests

# Test with Realistic User-Agent
URL = "https://pollinations.ai/p/a%20heroic%20knight?width=256&height=256&nologo=true"
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
}

try:
    print(f"Testing Pollinations with Browser headers...")
    response = requests.get(URL, headers=headers, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    if response.status_code == 200 and 'image' in response.headers.get('Content-Type', ''):
        with open("tmp/ua_test.png", "wb") as f:
            f.write(response.content)
        print("Success! Image saved to tmp/ua_test.png")
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
