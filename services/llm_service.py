from groq import Groq, APIStatusError
from core.config import settings

def verify_groq_api_key():
    """
    Verifies the Groq API key by making a simple test call.
    Returns True if the key is valid, False otherwise.
    """
    if not settings.GROQ_API_KEY:
        return False
    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        # Make a simple, low-cost call to check credentials
        client.models.list()
        return True
    except APIStatusError as e:
        # This error is typically raised for authentication issues (e.g., 401)
        print(f"ERROR: Groq API key verification failed. Status: {e.status_code}, Message: {e.message}")
        return False
    except Exception as e:
        print(f"ERROR: An unexpected error occurred while verifying Groq key: {e}")
        return False