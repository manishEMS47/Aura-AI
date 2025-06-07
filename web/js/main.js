import { getSystemAudio, setupMicrophone, getMicrophoneStream } from './media.js';
import { autofillForTesting } from './dev.js';

// --- Config ---
const DEV_MODE = true; // Enables developer shortcuts

// --- State Management ---
const appState = {
    onboardingData: {},
    systemStream: null,
    micStream: null,
    socket: null,
};

// --- DOM Elements ---
const views = {
    onboarding: document.getElementById('onboarding-view'),
    preflight: document.getElementById('preflight-view'),
    live: document.getElementById('live-view'),
};

const onboardingForm = {
    name: document.getElementById('user-name'),
    company: document.getElementById('user-company'),
    role: document.getElementById('user-role'),
    resume: document.getElementById('user-resume'),
    focusCheckboxes: document.querySelectorAll('input[name="focus"]'),
    objectives: document.getElementById('user-objectives'),
};

const checks = {
    systemAudio: document.getElementById('check-system-audio'),
    micPermission: document.getElementById('check-mic-permission'),
    micSelection: document.getElementById('check-mic-selection'),
    backend: document.getElementById('check-backend'),
    deepgram: document.getElementById('check-deepgram'),
    groq: document.getElementById('check-groq'),
};

const micSelect = document.getElementById('mic-select');
const proceedButton = document.getElementById('proceed-to-checks');
const startButton = document.getElementById('start-interview-button');


// --- View Management ---
function switchView(targetView) {
    Object.values(views).forEach(view => view.classList.remove('active'));
    views[targetView].classList.add('active');
}


// --- Logic ---
function updateCheckStatus(checkElement, status, text) {
    const indicator = checkElement.querySelector('.indicator');
    // Find the text node to update, ignoring the <select> element
    const textNode = Array.from(checkElement.childNodes).find(node =>
        node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''
    );
    indicator.textContent = status === 'success' ? '🟢' : status === 'error' ? '🔴' : '⚪';
    if (textNode) {
        textNode.nodeValue = ` ${text}`;
    }
}

function handleOnboarding() {
    const focus = Array.from(onboardingForm.focusCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    appState.onboardingData = {
        name: onboardingForm.name.value,
        company: onboardingForm.company.value,
        role: onboardingForm.role.value,
        resume: onboardingForm.resume.value,
        focus: focus,
        objectives: onboardingForm.objectives.value,
    };
    console.log("Onboarding data captured:", appState.onboardingData);
    switchView('preflight');
    runPreFlightChecks();
}

async function runPreFlightChecks() {
    // 1. System Audio Check
    updateCheckStatus(checks.systemAudio, 'pending', 'Requesting System Audio...');
    const systemStream = await getSystemAudio();
    if (systemStream) {
        updateCheckStatus(checks.systemAudio, 'success', 'System Audio OK');
        systemStream.getTracks().forEach(track => track.stop());
    } else {
        updateCheckStatus(checks.systemAudio, 'error', 'System Audio Permission Denied');
        return;
    }

    // 2. Microphone Check
    updateCheckStatus(checks.micPermission, 'pending', 'Requesting Microphone...');
    const micPermission = await setupMicrophone();
    if (micPermission) {
        updateCheckStatus(checks.micPermission, 'success', 'Microphone Permission OK');
        updateCheckStatus(checks.micSelection, 'success', 'Microphone Selection Ready');
    } else {
        updateCheckStatus(checks.micPermission, 'error', 'Microphone Permission Denied');
        updateCheckStatus(checks.micSelection, 'error', 'Microphone Selection Failed');
        return;
    }
    
    // 3. Backend Connection and API Key Checks
    connectWebSocket();
}

function connectWebSocket() {
    updateCheckStatus(checks.backend, 'pending', 'Connecting to Backend...');
    const socket = new WebSocket("ws://127.0.0.1:8002/ws");
    appState.socket = socket;

    socket.onopen = function(e) {
        console.log("[open] Connection established");
        updateCheckStatus(checks.backend, 'success', 'Backend Connected');
        // The backend will automatically start sending API key status
        updateCheckStatus(checks.deepgram, 'pending', 'Checking Deepgram API...');
        updateCheckStatus(checks.groq, 'pending', 'Checking Groq API...');
    };

    socket.onclose = function(event) {
        updateCheckStatus(checks.backend, 'error', 'Backend Disconnected');
    };

    socket.onerror = function(error) {
        updateCheckStatus(checks.backend, 'error', 'Backend Connection Failed');
    };

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log("Received from backend:", data);

        if (data.type === 'api_key_status') {
            const { service, valid } = data.payload;
            const checkElement = service === 'deepgram' ? checks.deepgram : checks.groq;
            const serviceName = service.charAt(0).toUpperCase() + service.slice(1);

            if (valid) {
                updateCheckStatus(checkElement, 'success', `${serviceName} API OK`);
            } else {
                updateCheckStatus(checkElement, 'error', `${serviceName} API Key Invalid`);
            }
            checkAllSystemsGo();
        }
    };
}

function checkAllSystemsGo() {
    const allGreen = Object.values(checks).every(
        check => check.querySelector('.indicator').textContent === '🟢'
    );
    if (allGreen) {
        startButton.disabled = false;
        console.log("All systems go! Ready to start interview.");
    }
}


// --- Event Listeners ---
proceedButton.addEventListener('click', handleOnboarding);

window.addEventListener('DOMContentLoaded', () => {
    switchView('onboarding');
});

// --- Developer Shortcut ---
if (DEV_MODE) {
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'j') {
            e.preventDefault();
            autofillForTesting(onboardingForm);
        }
    });
}