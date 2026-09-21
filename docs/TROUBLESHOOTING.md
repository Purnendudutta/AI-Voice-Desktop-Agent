# Troubleshooting Guide

## Common Issues & Resolutions

### 1. "Gemini API key is not configured"
* **Cause**: Cloud reasoning or live voice requires an API key from Google AI Studio.
* **Resolution**: Navigate to **Settings** -> **AI Models & Cloud Routing**, paste your key, or select **Deterministic Mock (Offline / No Key)** for local testing.

### 2. "Execution Blocked: Command is not in the allowlist"
* **Cause**: Strict command allowlist mode is enabled under **Security & Sandbox Engine**.
* **Resolution**: In **Security & Sandbox Engine**, toggle allowlist mode off, or execute commands matching the allowed patterns (`git`, `node`, `npm test`).

### 3. "Microphone permissions or audio capture error"
* **Cause**: Electron application has not been granted microphone access in Windows/OS Settings.
* **Resolution**: Open system privacy settings and allow desktop microphone access for Electron / AI Voice Desktop Agent.

### 4. Recovering from Interrupted Workflows
* **Resolution**: Click the **STOP** button in the voice bar or say *"Cancel"*. The active task will safely transition to `cancelled` and release held resources.
