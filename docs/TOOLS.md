# Built-in Tools Specification

Every tool registered in `ToolRegistry` implements the `ExecutableTool` interface:

```typescript
export interface ExecutableTool extends ToolDefinition {
  execute: (args: Record<string, any>, context?: any) => Promise<any>;
  verify: (args: Record<string, any>, result: any, context?: any) => Promise<ToolVerificationResult>;
  recover?: (args: Record<string, any>, error: any, context?: any) => Promise<ToolRecoveryStrategy>;
}
```

---

## Tool Catalog

### Desktop & Windows
* **`open_application`**: Launch or focus an application (`appName`, `path`). Verifies process existence and window response.
* **`close_application`**: Terminate an application process safely (`appName`). Verifies process termination.
* **`get_active_window`**: Query foreground window title and active process ID.
* **`list_windows`**: List all open top-level application windows.
* **`focus_window`**: Bring target window to the foreground.
* **`read_clipboard`**: Read current text content from the system clipboard.
* **`write_clipboard`**: Write text to the system clipboard and verify content.

### Filesystem
* **`search_files`**: Search files using wildcard patterns and extensions (`query`, `directory`).
* **`read_file`**: Read file content with buffer truncation protection (`path`).
* **`create_file`**: Create or overwrite file and verify on disk (`path`, `content`).
* **`move_file`**: Move or rename file and verify target location (`source`, `destination`).
* **`delete_file`**: Permanently delete file or directory (**HIGH RISK** - requires confirmation).
* **`organize_directory`**: Plan and sort directory files into Documents, Images, Media, Archives categories.

### Developer & Git
* **`git_status`**: Inspect working tree state, current branch, modified and untracked files.
* **`git_diff`**: Unified diff preview of staged or unstaged changes.
* **`run_tests`**: Execute test runner within sandbox and parse results (`command`).
* **`analyze_logs`**: Generate automated diagnostic reports from test and build failure logs.
* **`run_command`**: Execute command in sandbox with dangerous pattern checks and timeout limits.

### Web & Browser
* **`open_url`**: Navigate to URL in browser and extract page snippet (`url`).
* **`browser_search`**: Search the web and retrieve structured search summaries (`query`).

### System
* **`get_system_status`**: Retrieve CPU usage, memory consumption, uptime, and OS details.
* **`create_notification`**: Display operating system or dashboard desktop notification (`title`, `body`).
