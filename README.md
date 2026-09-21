# 🎙️ AI Voice Desktop Agent (2027 Desktop Operating Layer)

A production-grade, modular, security-hardened desktop AI agent platform. Users control and automate their computer using natural voice, text, screen context, files, applications, browser automation, developer tools, and multi-step AI workflows.

The application functions as an intelligent **desktop operating layer** following the core principle:

> **User gives a goal → Agent understands context → Creates a task plan → Selects tools → Executes actions → Observes results → Verifies success → Recovers from failures when possible → Reports the result.**

---

## 🌟 Key Architecture & Capabilities

* **Dynamic Agent Identity**: Never hardcoded. Personalize agent name (e.g. *Atlas*, *Nova*, *Friday*), wake phrase, voice, language, and theme during first-launch onboarding and update anytime in Settings.
* **Observe → Act → Verify → Recover**: Every tool execution explicitly verifies its effect (process existence, window focus, filesystem state, exit codes) and triggers autonomous retry/alternative-tool recovery if verification fails.
* **AI Provider Abstraction**:
  * Powered by Google's `@google/genai` SDK with `gemini-3.8-flash` for multi-step reasoning and planning, `gemini-3.1-flash-live-preview` for bidirectional streaming voice over WebSockets, and `gemini-3.5-transcribe` for live speech recognition.
  * Includes a high-fidelity deterministic `MockAIProvider` for fully offline testing, instant verification, and reproducible benchmarks without API keys.
* **Voice System & Barge-In**: Real-time microphone capture with RMS energy Voice Activity Detection (VAD) and immediate barge-in interruption (user saying *"Cancel"* or *"Stop"* halts voice synthesis and cancels safe pending actions).
* **Zero-Trust Security & Permissions**:
  * Multi-tiered risk classification: `LOW` (Auto-Allow), `MEDIUM` (Controlled), `HIGH` (Confirm or Block).
  * High-risk operations (file deletion, destructive commands, code pushes) require user approval via interactive modals.
  * Command Execution Sandbox with hard-blocked dangerous patterns (`rm -rf`, `del /s /q c:\`, fork bombs) and directory restriction.
* **10-View Command Center**:
  1. **Dashboard**: Agent status, active task cards, active window preview, quick workflows, real-time health metrics.
  2. **Tasks & Planning**: Multi-step plan tree, step status badges, observations, verifications, and retry traces.
  3. **Workflows**: Saved workspaces (Development, Study, Meeting) and automated schedules (cron / event triggers).
  4. **Memory**: Layered storage (Short-term, Preferences, Workspaces, Tasks, and Semantic Vector Memory with cosine similarity).
  5. **Plugins**: Extensible tool manifests, permission scopes, and lifecycle controls.
  6. **Developer Mode**: Git status, diff inspection, sandboxed test runner, and automated failure diagnostics.
  7. **Security & Sandbox**: Risk level policies, allowlist toggles, and pattern blacklist inspector.
  8. **Activity (Audit Trail)**: Immutable chronological log of tool executions, risk levels, durations, and arguments.
  9. **System Status**: Real-time CPU, RAM, uptime, platform details, and AI latency monitor.
  10. **Settings**: Dynamic agent identity customization, voice selection, language, API credentials, and privacy controls.
  11. **Evaluations**: Benchmark dashboard tracking success rate, execution time, retry count, and recovery rate across 10 evaluation tasks.

---

## 🚀 Quick Start

### Prerequisites
* **Node.js**: v20+ (tested on Node v24)
* **Python**: 3.10+ (optional helper for local wake-word & vision OCR)

### Installation

```bash
# Clone the repository
git clone https://github.com/Purnendudutta/AI-Voice-Desktop-Agent.git
cd AI-Voice-Desktop-Agent

# Install Node dependencies
npm install

# (Optional) Set up Python companion service
cd python
pip install -r requirements.txt
cd ..
```

### Running the Application

```bash
# Start in development mode (Vite + Electron Main + Preload)
npm run dev
```

### Running Automated Tests & Benchmarks

```bash
# Run unit, integration, and security tests
npm test

# Run 10-task evaluation benchmarks
npm run test:benchmark

# Type-check TypeScript codebase
npm run typecheck
```

---

## 🔒 Security Architecture

1. **Context Isolation**: Renderer runs isolated with `contextIsolation: true` and `nodeIntegration: false`.
2. **Minimal IPC Surface**: All IPC communication goes through strictly typed channels in `src/shared/types/ipc.ts`.
3. **No Unrestricted Shell**: Shell commands pass through `CommandSandbox`, which checks allowlists, enforces timeouts (default 15s), caps output at 512KB, and rejects destructive commands.
4. **Audit Trail**: Every action, tool invocation, and decision is logged in an immutable ring buffer exportable for audit review.

---

## 📚 Documentation Index

* [Architecture Guide](file:///d:/AI-Voice-Desktop-Agent/docs/ARCHITECTURE.md)
* [Installation & Setup](file:///d:/AI-Voice-Desktop-Agent/docs/INSTALLATION.md)
* [Developer Guide](file:///d:/AI-Voice-Desktop-Agent/docs/DEVELOPER_GUIDE.md)
* [Security & Sandbox Model](file:///d:/AI-Voice-Desktop-Agent/docs/SECURITY.md)
* [Built-in Tools Specification](file:///d:/AI-Voice-Desktop-Agent/docs/TOOLS.md)
* [Plugin Development](file:///d:/AI-Voice-Desktop-Agent/docs/PLUGINS.md)
* [Troubleshooting Guide](file:///d:/AI-Voice-Desktop-Agent/docs/TROUBLESHOOTING.md)

---

## 📄 License
MIT License. Antigravity AI Systems.