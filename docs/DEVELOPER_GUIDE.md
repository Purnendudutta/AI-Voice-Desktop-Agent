# Developer Guide

## Development Environment

The project is structured into three clean TypeScript packages bundled via Vite and Electron:

```
src/
├── main/       # Electron Main process (Node.js runtime, tools, AI, security)
├── preload/    # Electron Preload script (context isolation bridge)
├── renderer/   # React 18 UI (Tailwind CSS, command center dashboard)
└── shared/     # Strongly typed schemas, interfaces, and constants
```

---

## Adding a New Tool

All tools must be registered in `src/main/tools/ToolRegistry.ts` implementing `ExecutableTool`:

```typescript
this.register({
  id: 'my_custom_tool',
  name: 'My Custom Tool',
  description: 'Explain clearly what this tool accomplishes',
  category: 'productivity',
  riskLevel: 'LOW', // 'LOW' | 'MEDIUM' | 'HIGH'
  timeoutMs: 5000,
  requiresPermissions: ['custom:permission'],
  parameters: {
    type: 'object',
    properties: {
      target: { type: 'string', description: 'Parameter description' }
    },
    required: ['target'],
  },
  returns: { type: 'object', description: 'Return value description' },
  execute: async (args, context) => {
    // 1. Act
    return performAction(args.target);
  },
  verify: async (args, result, context) => {
    // 2. Observe & Verify
    const verified = checkState(result);
    return {
      verified,
      message: verified ? 'Action verified' : 'Action failed verification',
    };
  },
  recover: async (args, error, context) => {
    // 3. Optional Recovery Strategy
    return {
      canRecover: true,
      suggestedArguments: { target: fallbackTarget },
    };
  },
});
```

---

## Running Tests

```bash
# Run Vitest test suite
npm test

# Run Benchmarks
npm run test:benchmark

# Typecheck with TypeScript
npm run typecheck
```
