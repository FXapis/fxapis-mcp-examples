# Claude (claude.ai and Claude Desktop)

## claude.ai — custom connector

**Customize → Connectors → Add custom connector** (Team/Enterprise: an Owner adds it under
**Organization settings → Connectors**).

1. **MCP server URL:** `https://api.fxapis.com/mcp`
2. **Authentication:** choose **No sign-in**.
3. **Request headers:** add `authorization` with the value `Bearer fx_live_…` — include the word
   `Bearer` and the space; Claude sends the value exactly as typed.

> **Request headers are in beta at Claude.** If your dialog does not show that section yet, use
> Claude Code, or Claude Desktop through `mcp-remote` below, until it does. Header settings
> cannot be edited later: to change the key, remove the connector and add it again.

Connectors added on claude.ai are also available in the Claude desktop app.

## Claude Desktop without request headers

Claude Desktop can run the open-source [`mcp-remote`](https://www.npmjs.com/package/mcp-remote)
bridge, which adds the header for it. Needs Node.js 18+.

1. Open **Settings → Developer → Edit Config**.
2. Paste [`claude_desktop_config.json`](claude_desktop_config.json) in (merge it if you already
   have other servers configured), and put your real key in `FXAPIS_AUTH`.
3. Restart Claude Desktop.

The header is passed through an environment variable, not inline in `args`, because some systems
split arguments on spaces.
