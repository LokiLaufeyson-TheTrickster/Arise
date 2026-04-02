import requests

# Hercai Free API (Unofficial but often works)
URL = "https://hercai.onrender.com/v1/flux?prompt=A%20heroic%20knight"

try:
    print(f"Testing Hercai Free API...")
    response = requests.get(URL, timeout=30)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        image_url = data.get('url')
        print(f"Image URL: {image_url}")
        if image_url:
            img_res = requests.get(image_url, timeout=30)
            if img_res.status_code == 200:
                with open("tmp/hercai_test.png", "wb") as f:
                    f.write(img_res.content)
                print("Success! Image saved to tmp/hercai_test.png")
    else:
        print(f"Response: {response.text[:200]}")
except Exception as e:
    print(f"Error: {e}")
