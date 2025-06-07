import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.llm_service import verify_groq_api_key
from services.stt_service import verify_deepgram_api_key

router = APIRouter()

async def send_status(websocket: WebSocket, service: str, valid: bool):
    """Helper function to send API key status to the client."""
    await websocket.send_text(json.dumps({
        "type": "api_key_status",
        "payload": {
            "service": service,
            "valid": valid
        }
    }))

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("INFO: WebSocket connection established.")
    try:
        # 1. Immediately check the keys upon connection
        print("INFO: Verifying API keys...")
        
        # Verify Deepgram
        is_deepgram_valid = verify_deepgram_api_key()
        await send_status(websocket, "deepgram", is_deepgram_valid)
        
        # Verify Groq
        is_groq_valid = verify_groq_api_key()
        await send_status(websocket, "groq", is_groq_valid)

        # 2. Listen for other messages (like audio data in the future)
        while True:
            data = await websocket.receive_text()
            # This is where we'll handle audio chunks later
            print(f"INFO: Received message from client: {data}")

    except WebSocketDisconnect:
        print("INFO: WebSocket connection closed.")
    except Exception as e:
        print(f"ERROR: An error occurred in the WebSocket: {e}")