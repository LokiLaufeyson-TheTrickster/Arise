import requests

# Pollinations No-Auth with model=turbo (often free)
URL = "https://pollinations.ai/p/a%20heroic%20knight?width=256&height=256&seed=42&nologo=true&model=turbo"

try:
    print(f"Testing Pollinations NO-AUTH with model=turbo...")
    response = requests.get(URL, timeout=30)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200 and 'image' in response.headers.get('Content-Type', ''):
        with open("tmp/turbo_test.png", "wb") as f:
            f.write(response.content)
        print("Success! Image saved to tmp/turbo_test.png")
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
