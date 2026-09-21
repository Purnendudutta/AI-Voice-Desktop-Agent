# System Architecture

## Overview

The AI Voice Desktop Agent operates as a modular, event-driven desktop platform separating the user interface, execution runtime, and external AI services into distinct, security-isolated layers.

```
┌─────────────────────────────────────────────────────────────┐
│                       Renderer UI                           │
│        (React 18 + Tailwind CSS + Lucide Icons)             │
│    Command Center • Voice Waveform • Operational Cards      │
└──────────────────────────────┬──────────────────────────────┘
                               │  Typed IPC Bridge
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Preload Layer                          │
│     contextBridge.exposeInMainWorld('electronAPI', ...)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Electron Main Process (Node.js)             │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │               Agent Execution Loop                  │   │
│   │  Context -> Planning -> Risk -> Observe-Act-Verify  │   │
│   └──────────┬──────────────┬──────────────┬────────────┘   │
│              │              │              │                │
│   ┌──────────▼────────┐ ┌───▼────────┐ ┌───▼────────────┐   │
│   │   Tool Registry   │ │ Permission │ │ Memory & State │   │
│   │ (Desktop, Browser,│ │   Engine   │ │ SQLite + Vector│   │
│   │  Files, Git, Cmd) │ │(LOW/MED/HI)│ │  Memory Store  │   │
│   └───────────────────┘ └────────────┘ └────────────────┘   │
│              │                                              │
│   ┌──────────▼─────────────────────────┐                    │
│   │        AI Provider Abstraction     │                    │
│   │  Gemini Live / Flash 3.8 / Mock AI │                    │
│   └────────────────────────────────────┘                    │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON-RPC (stdin/stdout)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Python Companion Service                    │
│          Wake Word Detector • Screen Vision & OCR           │
└─────────────────────────────────────────────────────────────┘
```

---

## The Controlled Execution Loop

Every user interaction follows an immutable 9-stage progression:

1. **Input Processing**: Natural language speech or typed goal received.
2. **Context Collection**: Active window title, running application, current project, clipboard preview, and relevant semantic memory are assembled and compressed.
3. **Task Planning**: The AI provider breaks down the goal into concise operational steps without exposing internal chain-of-thought.
4. **Risk Assessment**: Steps are scanned for risk levels (`LOW`, `MEDIUM`, `HIGH`).
5. **Permission Gate**: If any step is high-risk (e.g. deletion, code modification, shell command), the execution pauses and requests interactive approval.
6. **Act**: The designated tool executes with strict timeouts.
7. **Observe**: Output, standard streams, or UI changes are observed.
8. **Verify**: The tool's verification function confirms the expected state (e.g. checking if process is running or file exists).
9. **Recover**: If verification fails, the Recovery Engine retries or switches to alternative tools before failing safely.
10. **Remember & Report**: Operational memory is updated and concise status is returned.

---

## AI Provider Abstraction

The system decouples model providers via the `AIProvider` interface:

* **GeminiProvider**: Connects to Google's official `@google/genai` SDK using `gemini-3.8-flash` for multi-step reasoning, `gemini-3.1-flash-live-preview` for bidirectional streaming voice, and `gemini-3.5-transcribe` for live speech recognition.
* **MockAIProvider**: Deterministic mock enabling automated tests, benchmarks, and offline execution without external API dependencies.
* **ModelRouter**: Automatically routes tasks based on connectivity, API key presence, and user settings.
