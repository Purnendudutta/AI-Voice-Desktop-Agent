# Plugin Architecture & Extensibility

## Overview

The AI Voice Desktop Agent supports sandboxed plugins to connect external desktop applications, developer services, and cloud integrations without modifying core agent logic.

---

## Plugin Manifest Schema

Each plugin provides a manifest implementing `PluginManifest`:

```typescript
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  permissions: string[];
  toolsProvided: string[];
  enabled: boolean;
  config?: Record<string, unknown>;
}
```

---

## Built-in Plugins

1. **`plugin_vscode`**: Visual Studio Code integration providing `open_application` and `run_command` tools.
2. **`plugin_github`**: Git repository and GitHub workflow assistant providing `git_status` and `git_diff`.
3. **`plugin_browser`**: Web Navigator & Research providing `open_url` and `browser_search`.
4. **`plugin_file_organizer`**: Smart filesystem categorization providing `search_files` and `organize_directory`.

Plugins can be toggled on or off at any time from the **Plugins** view in the Command Center.
