import requests
from core.config import settings

def verify_deepgram_api_key():
    """
    Verifies the Deepgram API key by making a direct HTTP request.
    This is the most reliable method, independent of SDK changes.
    Returns True if the key is valid, False otherwise.
    """
    if not settings.DEEPGRAM_API_KEY:
        return False

    url = "https://api.deepgram.com/v1/projects"
    headers = {
        "Authorization": f"Token {settings.DEEPGRAM_API_KEY}"
    }

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            print("INFO: Deepgram API key is valid.")
            return True
        else:
            print(f"ERROR: Deepgram API key verification failed. Status: {response.status_code}, Response: {response.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"ERROR: A network error occurred while verifying Deepgram key: {e}")
        return False