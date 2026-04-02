import urllib.request
import os

def test_download():
    url = "https://image.pollinations.ai/prompt/a%20glowing%20blue%20sword%20dark%20fantasy%20pitch%20black%20background?width=512&height=512&nologo=true&seed=42"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
    }
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open("test_poll_fixed.png", "wb") as f:
                f.write(response.read())
        print(f"Success! Size: {os.path.getsize('test_poll_fixed.png')} bytes")
    except Exception as e:
        print(f"Failed again: {e}")

if __name__ == "__main__":
    test_download()
