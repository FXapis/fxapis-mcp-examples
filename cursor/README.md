# Cursor

Copy [`mcp.json`](mcp.json) to `~/.cursor/mcp.json` (every project) or `.cursor/mcp.json` (one
project), then export the key:

```bash
export FXAPIS_KEY=fx_test_...
```

`${env:FXAPIS_KEY}` reads it from your environment; you can also paste the key directly in its
place in a file that is never committed. The server appears under **Settings → MCP**.
