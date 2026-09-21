# Installation & Setup Guide

## System Requirements

* **Operating System**: Windows 10/11, macOS 12+, or modern Linux (Ubuntu 22.04+)
* **Node.js**: v20 or higher
* **npm**: v10 or higher
* **Python** (Optional): 3.10+ (for local wake-word & OCR vision helper)

---

## Step-by-Step Installation

### 1. Clone the Codebase

```bash
git clone https://github.com/Purnendudutta/AI-Voice-Desktop-Agent.git
cd AI-Voice-Desktop-Agent
```

### 2. Install Node Dependencies

```bash
npm install
```

### 3. (Optional) Set up Python Companion Service

```bash
cd python
pip install -r requirements.txt
cd ..
```

---

## Configuration & First Launch

1. Start the application:
   ```bash
   npm run dev
   ```
2. On first launch, the **Personalization Onboarding Wizard** will appear:
   * **Agent Name**: Choose a dynamic identity (e.g. *Atlas*, *Nova*, *Friday*).
   * **Wake Phrase**: Set the invocation phrase (e.g. *Hey Atlas*).
   * **Voice**: Select voice model (*Aoede*, *Puck*, *Charon*, *Kore*).
   * **Language**: Choose your preferred language.
   * **Voice Feedback**: Enable or disable spoken audio responses.
3. Configure Gemini API Key:
   * Navigate to **Settings** -> **AI Models & Cloud Routing**.
   * Enter your Google Gemini API key (`AIzaSy...`) to enable Gemini 3.8 Flash multi-step reasoning and Gemini 3.1 Flash Live voice streaming.
   * *Alternatively*, choose **Deterministic Mock (Offline / No Key)** to evaluate all desktop tools without an API key!
