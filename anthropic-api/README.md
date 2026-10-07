# Anthropic API (Messages)

[`request.json`](request.json) is a Messages API body with the fxapis MCP server attached as a
tool. Put your key in `authorization_token` and send it with the MCP beta header:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export FXAPIS_KEY=fx_test_...
sed "s/fx_live_…/$FXAPIS_KEY/" request.json | \
  curl -sS https://api.anthropic.com/v1/messages \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "anthropic-beta: mcp-client-2025-11-20" \
    -H "Content-Type: application/json" \
    -d @-
```

Both halves of the request matter: the server under `mcp_servers` and the `mcp_toolset` entry in
`tools`. Drop or swap the `model` for whichever Claude model you're calling.
