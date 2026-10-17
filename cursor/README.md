# Cursor

Cursor connects with an API key: fxapis does not accept sign-in returns to a custom scheme such as
`cursor://` yet.

Copy [`mcp.json`](mcp.json) to `~/.cursor/mcp.json` (every project) or `.cursor/mcp.json` (one
project), then export the key:

```bash
export FXAPIS_KEY=fx_test_...
```

`${env:FXAPIS_KEY}` reads it from your environment; you can also paste the key directly in its
place in a file that is never committed. The server appears under **Settings → MCP**.
