import requests

# Legacy Pollinations (often still works for free)
URL = "https://image.pollinations.ai/prompt/a%20heroic%20knight?width=256&height=256&nologo=true"

try:
    print(f"Testing Legacy Pollinations NO-AUTH...")
    response = requests.get(URL, timeout=30)
    print(f"Status Code: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type')}")
    if response.status_code == 200 and 'image' in response.headers.get('Content-Type', ''):
        with open("tmp/legacy_test.png", "wb") as f:
            f.write(response.content)
        print("Success! Image saved to tmp/legacy_test.png")
    else:
        print(f"First 100 chars of body: {response.text[:100]}")
except Exception as e:
    print(f"Error: {e}")
