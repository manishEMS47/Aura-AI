from datetime import datetime

class PersistentContextManager:
    """
    Manages persistent candidate context that is ALWAYS present in AI prompts.
    No token limits - includes complete resume and job description.
    """
    
    def __init__(self):
        self.persistent_context = {
            'candidate_name': '',
            'target_company': '',
            'target_role': '',
            'complete_resume': '',        # UNLIMITED - Full resume
            'complete_job_description': '',  # UNLIMITED - Full job description
            'focus_areas': [],
            'additional_context': {},
            'created_at': None
        }
        self.conversation_history = []  # Limited to 5 exchanges
        self.is_initialized = False
    
    def initialize_persistent_context(self, onboarding_data: dict):
        """Initialize persistent context from onboarding data - called once per interview"""
        self.persistent_context.update({
            'candidate_name': onboarding_data.get('name', ''),
            'target_company': onboarding_data.get('company', ''),
            'target_role': onboarding_data.get('role', ''),
            'complete_resume': onboarding_data.get('resume', ''),  # FULL CONTENT
            'complete_job_description': onboarding_data.get('objectives', ''),  # FULL CONTENT
            'focus_areas': onboarding_data.get('focus', []),
            'created_at': datetime.now().isoformat()
        })
        self.is_initialized = True
        print(f"✅ Persistent context initialized with full resume ({len(self.persistent_context['complete_resume'])} chars)")
    
    def add_conversation_exchange(self, interviewer_question: str, candidate_response: str = None):
        """Add conversation exchange - limited to 5 most recent"""
        exchange = {
            'interviewer_question': interviewer_question,
            'candidate_response': candidate_response,
            'timestamp': datetime.now().isoformat()
        }
        
        # If we are only getting a candidate response, add it to the last exchange.
        if interviewer_question is None and candidate_response and self.conversation_history:
            self.conversation_history[-1]['candidate_response'] = candidate_response
        else:
            self.conversation_history.append(exchange)

        # Keep only last 5 exchanges
        if len(self.conversation_history) > 5:
            self.conversation_history = self.conversation_history[-5:]
    
    def get_complete_context(self) -> dict:
        """Return complete context - persistent + conversation history"""
        return {
            'persistent': self.persistent_context,
            'conversation_history': self.conversation_history,
            'context_stats': {
                'resume_length': len(self.persistent_context['complete_resume']),
                'job_desc_length': len(self.persistent_context['complete_job_description']),
                'conversation_exchanges': len(self.conversation_history),
                'is_initialized': self.is_initialized
            }
        }
    
    def ensure_context_available(self) -> bool:
        """Verify persistent context is properly initialized"""
        return self.is_initialized and bool(self.persistent_context.get('candidate_name'))