import json
from openai import AsyncOpenAI, APIStatusError
from core.config import settings
from core.prompts import get_interview_answer_prompt, get_quick_response_prompt
from typing import Dict, List, Optional
from services.context_manager import PersistentContextManager

# --- LLMManager Class ---

class LLMManager:
    """Enhanced LLM Manager with persistent context support."""
    
    def __init__(self, provider_name: str, base_url: str, api_key: str, model_name: str):
        self.provider_name = provider_name
        self.model_name = model_name
        self.context_manager = PersistentContextManager()  # NEW
        
        try:
            self.client = AsyncOpenAI(base_url=base_url, api_key=api_key)
            print(f"✅ LLMManager initialized with persistent context for: {self.provider_name}")
        except Exception as e:
            self.client = None
            print(f"❌ CRITICAL: Failed to initialize LLMManager: {e}")

    def initialize_candidate_context(self, onboarding_data: dict):
        """Initialize persistent candidate context - called once per interview session"""
        self.context_manager.initialize_persistent_context(onboarding_data)
        print(f"🔒 Persistent context initialized for candidate: {onboarding_data.get('name', 'Unknown')}")

    async def get_ai_answer(self, question: str) -> str:
        """Get AI answer using persistent context + conversation history"""
        if not self.client:
            return "I'm sorry, the AI service is not available at this time."
        
        if not self.context_manager.ensure_context_available():
            return "I'm sorry, candidate context is not properly initialized."
        
        try:
            # Add question to conversation history
            self.context_manager.add_conversation_exchange(question)
            
            # Generate prompt with persistent context (no token limits)
            prompt = get_interview_answer_prompt(question, self.context_manager)
            
            print(f"🎯 Processing question with FULL context: '{question[:100]}...'")
            context_stats = self.context_manager.get_complete_context()['context_stats']
            print(f"📊 Context stats: Resume={context_stats['resume_length']} chars, "
                  f"Job={context_stats['job_desc_length']} chars")
            
            # Make API call with complete context
            chat_completion = await self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model_name,
                temperature=0.5,
                top_p=0.8,
            )
            
            answer = chat_completion.choices[0].message.content
            return answer.strip()
            
        except Exception as e:
            print(f"❌ ERROR: AI answer generation failed: {e}")
            return "I'm sorry, I couldn't generate a response. Please try again."

    def process_candidate_response(self, response: str):
        """Processes the candidate's response to add to conversation context."""
        if settings.TRACK_CANDIDATE_RESPONSES and response.strip():
            self.context_manager.add_conversation_exchange(None, response)
            print("📝 Conversation context updated with candidate response")

# --- Standalone Verification Function ---

async def verify_provider_connection(base_url: str, api_key: str, model_name: str) -> bool:
    """
    Verifies a connection to an AI provider without creating a full manager instance.
    Returns True if the connection is valid, False otherwise.
    """
    try:
        temp_client = AsyncOpenAI(base_url=base_url, api_key=api_key)
        # A lightweight call to check credentials and connectivity.
        # Note: Some providers might not list all models, but this is a good general check.
        await temp_client.models.list()
        print(f"✅ Connection to {base_url} with model {model_name} is valid.")
        return True
    except APIStatusError as e:
        print(f"❌ ERROR: API key verification failed for {base_url}. Status: {e.status_code}")
        return False
    except Exception as e:
        print(f"❌ ERROR: An unexpected error occurred during provider verification for {base_url}: {e}")
        return False