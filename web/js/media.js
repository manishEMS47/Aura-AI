// --- media.js ---
// This module handles all interactions with the Web Media APIs.

/**
 * Requests permission to capture system audio.
 * @returns {Promise<MediaStream|null>} A stream of the system audio, or null on failure.
 */
async function getSystemAudio() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: true, // Required to get the audio prompt
            audio: {
                suppressLocalPlayback: false // Hear the audio yourself
            },
        });
        // We only need the audio track
        const audioStream = new MediaStream(stream.getAudioTracks());
        // Stop the video track as we don't need it and it saves resources
        stream.getVideoTracks().forEach(track => track.stop());
        console.log("System audio captured successfully.");
        return audioStream;
    } catch (err) {
        console.error("Error capturing system audio:", err);
        return null;
    }
}

/**
 * Requests permission to use the microphone and populates the dropdown.
 * @returns {Promise<boolean>} True if permission was granted, false otherwise.
 */
async function setupMicrophone() {
    const micSelect = document.getElementById('mic-select');
    try {
        // Request permission first to enable device enumeration
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        // Close the stream immediately, we only needed it for permission
        stream.getTracks().forEach(track => track.stop());

        // Enumerate devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevices = devices.filter(device => device.kind === 'audioinput');

        if (audioDevices.length === 0) {
            console.error("No microphones found.");
            return false;
        }

        // Populate dropdown
        micSelect.innerHTML = '';
        audioDevices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Microphone ${micSelect.options.length + 1}`;
            micSelect.appendChild(option);
        });
        
        micSelect.disabled = false;
        console.log("Microphone setup complete.");
        return true;
    } catch (err) {
        console.error("Error setting up microphone:", err);
        micSelect.disabled = true;
        return false;
    }
}

/**
 * Gets a stream from the currently selected microphone.
 * @returns {Promise<MediaStream|null>} A stream of the microphone audio, or null on failure.
 */
async function getMicrophoneStream() {
    const micSelect = document.getElementById('mic-select');
    if (!micSelect.value) {
        console.error("No microphone selected.");
        return null;
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: { deviceId: { exact: micSelect.value } },
            video: false
        });
        console.log("Microphone stream captured successfully.");
        return stream;
    } catch (err) {
        console.error("Error capturing microphone stream:", err);
        return null;
    }
}

export { getSystemAudio, setupMicrophone, getMicrophoneStream };