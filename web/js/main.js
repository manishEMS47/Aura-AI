import { getSystemAudio, setupMicrophone } from './media.js';

// --- DOM Elements ---
const checks = {
    systemAudio: document.getElementById('check-system-audio'),
    micPermission: document.getElementById('check-mic-permission'),
    micSelection: document.getElementById('check-mic-selection'),
    backend: document.getElementById('check-backend'),
    deepgram: document.getElementById('check-deepgram'),
    groq: document.getElementById('check-groq'),
};
const micSelect = document.getElementById('mic-select');
const startButton = document.getElementById('start-button');


/**
 * Updates the UI for a specific check item.
 * @param {HTMLElement} checkElement The container element for the check.
 * @param {'success' | 'error' | 'pending'} status The status to set.
 * @param {string} text The text to display for the check.
 */
function updateCheckStatus(checkElement, status, text) {
    const indicator = checkElement.querySelector('.indicator');
    if (status === 'success') {
        indicator.textContent = '🟢';
    } else if (status === 'error') {
        indicator.textContent = '🔴';
    } else {
        indicator.textContent = '⚪';
    }
    // The text node is the second child
    checkElement.childNodes[2].nodeValue = ` ${text}`;
}


async function runPreFlightChecks() {
    // 1. System Audio Check
    updateCheckStatus(checks.systemAudio, 'pending', 'Requesting System Audio...');
    const systemStream = await getSystemAudio();
    if (systemStream) {
        updateCheckStatus(checks.systemAudio, 'success', 'System Audio OK');
        // Stop the track to release the resource, we just needed permission
        systemStream.getTracks().forEach(track => track.stop());
    } else {
        updateCheckStatus(checks.systemAudio, 'error', 'System Audio Permission Denied');
        return; // Stop checks if this fails
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

    // TODO: Add checks for backend, Deepgram, and Groq
}

function connectWebSocket() {
    const socket = new WebSocket("ws://127.0.0.1:8002/ws");

    socket.onopen = function(e) {
        console.log("[open] Connection established");
        updateCheckStatus(checks.backend, 'success', 'Backend Connected');
        // Now, let's check the API keys
        checkApiKeys(socket);
    };

    socket.onclose = function(event) {
        updateCheckStatus(checks.backend, 'error', 'Backend Disconnected');
        // Optional: implement reconnect logic if needed
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
            // After each key check, see if we can enable the start button
            checkAllSystemsGo();
        }
    };
}

function checkApiKeys(socket) {
    // The backend now sends status immediately upon connection,
    // so we just set the status to pending here.
    // The onmessage handler will do the rest.
    updateCheckStatus(checks.deepgram, 'pending', 'Checking Deepgram API...');
    updateCheckStatus(checks.groq, 'pending', 'Checking Groq API...');
}

function checkAllSystemsGo() {
    // Check if all indicators are green
    const allGreen = Object.values(checks).every(
        check => check.querySelector('.indicator').textContent === '🟢'
    );

    if (allGreen) {
        startButton.disabled = false;
        console.log("All systems go! Ready to start.");
    }
}


// --- Event Listeners ---
window.addEventListener('DOMContentLoaded', () => {
    runPreFlightChecks().then(() => {
        // Only connect WebSocket if initial media checks are okay
        const micOk = checks.micPermission.querySelector('.indicator').textContent === '🟢';
        const systemAudioOk = checks.systemAudio.querySelector('.indicator').textContent === '🟢';
        if (micOk && systemAudioOk) {
            connectWebSocket();
        } else {
            updateCheckStatus(checks.backend, 'error', 'Backend check skipped');
        }
    });
});

// This section was incorrect and has been removed.
// The logic is now correctly placed inside socket.onmessage.