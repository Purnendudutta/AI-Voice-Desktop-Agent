# Security & Sandbox Model

## Core Principles

The AI Desktop Agent enforces a **Zero-Trust Security Architecture**. An LLM is never given unrestricted access to operating system shells or destructive APIs.

---

## 1. Risk Tiering

Every tool declared in `ToolRegistry` specifies a `RiskLevel`:

| Tier | Characteristics | Default Action | Examples |
|------|-----------------|----------------|----------|
| **LOW** | Read-only, inspection, window switching, metrics | `ALLOW` | `search_files`, `get_active_window`, `get_system_status`, `read_clipboard` |
| **MEDIUM** | Non-destructive modifications, directory creation, dependency install | `ALLOW` | `create_file`, `move_file`, `run_tests`, `organize_directory` |
| **HIGH** | Permanent deletion, arbitrary shell commands, code commits/push | `CONFIRM` (User Modal) | `delete_file`, `run_command`, `git_commit` |

---

## 2. Command Execution Sandbox

All shell operations are routed through `CommandSandbox`:

1. **Dangerous Patterns Blacklist**:
   - `rm -rf /` and `rm -rf \`
   - `del /f /s /q c:\`
   - `format [c-z]:` and `mkfs`
   - Fork bombs `:(){ :|:& };:`
   - System shutdown/reboot commands
2. **Execution Timeouts**: Every command is constrained to a configurable timeout (default 15 seconds) and terminated via `SIGTERM` if exceeded.
3. **Output Truncation**: Standard output is capped at 512KB to protect Electron main process memory.
4. **Working Directory Constraints**: Commands only execute within verified workspace paths.
5. **Optional Strict Allowlist**: Can be enabled in Settings to permit only whitelisted binaries (`git`, `node`, `npm test`, `python`).

---

## 3. Electron Sandboxing & IPC Security

* `contextIsolation: true`
* `nodeIntegration: false`
* Strict preload layer exposing only explicit functions on `window.electronAPI`
* Content Security Policy (CSP) headers restricting network scripts and unsafe evaluations.
