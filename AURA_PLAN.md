# Proposed Development Plan: Project Aura

This document outlines the strategic plan for developing "Aura," a real-time AI interview coach.

### **High-Level Architecture**

This diagram visualizes the modular architecture.

```mermaid
graph TD
    subgraph User's Desktop
        A[User's Physical Monitor]
        B[Screen Sharing Software e.g., Teams, Zoom]
    end

    subgraph Aura Application
        subgraph Frontend (pywebview - HTML/JS/CSS)
            C(UI: Onboarding, Transcript, AI Answer)
            D(Media: System Audio Capture)
            E(Comms: WebSocket Client)
        end

        subgraph Backend (Python/FastAPI)
            F(API: WebSocket Server)
            G[Service: STT - Deepgram]
            H[Service: LLM - Groq]
            I[Core: Config, Prompts]
            J[Desktop: Window Manager]
        end
    end

    A -- "Sees App Normally" --> C
    B -- "Sees a Black Window" --> C
    C <-->|User Input| E
    D -- "Audio Chunks" --> E
    E <-->|WebSocket Protocol| F
    F -- "Transcribe" --> G
    F -- "Generate Answer" --> H
    F -- "Get Config/Prompts" --> I
    J -- "SetWindowDisplayAffinity" --> C
```

### **Development Phases**

**Phase 0: Core Risk Validation (Proof of Concept)**
*   **Goal:** To confirm the most critical and platform-dependent feature works before we write any other code.
*   **Tasks:** Create a minimal Python script using `pywebview` and `win32gui` to create a window and apply `SetWindowDisplayAffinity`. Manually test if screen sharing software sees a black window.
*   **Rationale:** This de-risks the entire project.

**Phase 1: Foundational Structure**
*   **Goal:** Build the skeleton of the application based on the modular design.
*   **Tasks:** Set up the Python backend project structure (`api/`, `services/`, `core/`, `desktop/`), the FastAPI server, the basic WebSocket endpoint, and the `web/` directory with a basic HTML/JS frontend capable of a simple WebSocket connection.

**Phase 2: The Core Loop - Real-Time Transcription and AI Response**
*   **Goal:** Implement the primary functionality.
*   **Tasks:** Implement backend services for Deepgram and Groq. Implement frontend logic to capture system audio, stream it to the backend, and display the returned transcript and AI responses.

**Phase 3: Advanced Features & User Experience**
*   **Goal:** Build the features that make the application polished.
*   **Tasks:** Implement the onboarding UI, context handling for the LLM prompt, "Push-to-Talk" or deepgram speaker diaraztion (to avaoid push to talk) for speaker diarization, the code pane with syntax highlighting, and the session export feature.

**Phase 4: Production Hardening & Deployment**
*   **Goal:** Prepare the application for distribution.
*   **Tasks:** Add comprehensive error handling, logging, and unit/integration tests. Use PyInstaller to package everything into a single `.exe` file.

---
### **Important Considerations**

*   **Cross-Platform Compatibility**: The core `SetWindowDisplayAffinity` API is **Windows-specific**. Achieving the same "stealth" functionality on macOS and Linux is a significant challenge. Development will focus exclusively on **Windows first**.