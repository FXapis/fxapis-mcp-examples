# VS Code (GitHub Copilot agent mode)

Copy [`mcp.json`](mcp.json) to `.vscode/mcp.json` in your project. VS Code asks for the key the
first time (the `inputs` block below) and stores it securely — nothing to export beforehand.

```json
{
  "inputs": [
    { "type": "promptString", "id": "fxapis-key", "description": "fxapis API key", "password": true }
  ],
  "servers": {
    "fxapis": {
      "type": "http",
      "url": "https://api.fxapis.com/mcp",
      "headers": { "Authorization": "Bearer ${input:fxapis-key}" }
    }
  }
}
```
