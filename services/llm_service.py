from openai import OpenAI, APIStatusError
from core.config import settings
from core.prompts import get_interview_answer_prompt, get_quick_response_prompt
from typing import Dict, List

# --- Global State ---
conversation_history: List[Dict] = []

# --- OpenAI Client Initialization ---
# Create a single, reusable client instance configured from settings
try:
    client = OpenAI(
        base_url=settings.OPENAI_COMPATIBLE_BASE_URL,
        api_key=settings.OPENAI_COMPATIBLE_API_KEY,
    )
    print("✅ OpenAI-compatible client initialized successfully.")
except Exception as e:
    client = None
    print(f"❌ CRITICAL: Failed to initialize OpenAI-compatible client: {e}")

# --- Public Functions ---

def verify_api_key() -> bool:
    """
    Verifies the OpenAI-compatible API key by making a simple test call.
    Returns True if the key and connection are valid, False otherwise.
    """
    if not client:
        print("❌ API key verification failed: Client not initialized.")
        return False
        
    try:
        # Make a simple, low-cost call to check credentials and connectivity
        client.models.list()
        print("✅ OpenAI-compatible API key is valid.")
        return True
    except APIStatusError as e:
        print(f"❌ ERROR: API key verification failed. Status: {e.status_code}, Message: {e.message}")
        return False
    except Exception as e:
        print(f"❌ ERROR: An unexpected error occurred during API key verification: {e}")
        return False

def get_ai_answer(question: str, context: dict) -> str:
    """
    Gets an AI-generated answer for an interview question using the configured
    OpenAI-compatible service.
    """
    if not client:
        return "I'm sorry, the AI service is not available at this time."

    try:
        print(f"🎯 PROCESSING CURRENT QUESTION: '{question}'")
        add_to_conversation_history(interviewer_question=question)
        
        if settings.PERSONALIZE_ANSWERS:
            prompt = get_interview_answer_prompt(question, context, conversation_history)
        else:
            prompt = get_quick_response_prompt(question, context)
            
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model=settings.OPENAI_COMPATIBLE_MODEL_NAME,
            temperature=0.6,
            top_p=0.9,
        )
        
        answer = chat_completion.choices[0].message.content
        return answer.strip()
        
    except Exception as e:
        print(f"❌ ERROR: Could not get AI answer: {e}")
        return "I'm sorry, I couldn't generate a response at this time. Please try to answer based on your experience."

def process_candidate_response(response: str):
    """
    Processes what the candidate said to add to the conversation context.
    """
    if settings.TRACK_CANDIDATE_RESPONSES and response.strip():
        add_to_conversation_history(candidate_response=response)
        print("📝 Conversation context updated with candidate response")

def clear_conversation_history():
    """Clears the conversation history for a new interview."""
    global conversation_history
    conversation_history = []

# --- Private Helper Functions ---

def add_to_conversation_history(interviewer_question: str = None, candidate_response: str = None):
    """Adds an exchange to the conversation history."""
    global conversation_history
    
    if not settings.TRACK_CANDIDATE_RESPONSES:
        return
        
    if conversation_history and not conversation_history[-1].get('candidate_response') and candidate_response:
        conversation_history[-1]['candidate_response'] = candidate_response
    elif interviewer_question:
        conversation_history.append({
            'interviewer_question': interviewer_question,
            'candidate_response': None
        })
    
    # Enforce history limit
    if len(conversation_history) > settings.MAX_CONVERSATION_HISTORY:
        conversation_history = conversation_history[-settings.MAX_CONVERSATION_HISTORY:]