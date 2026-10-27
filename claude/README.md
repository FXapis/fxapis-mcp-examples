# Claude (claude.ai and Claude Desktop)

## claude.ai — custom connector with sign-in

On any Claude plan: **Customize → Connectors → Add custom connector** (Team/Enterprise: an Owner
adds it under **Organization settings → Connectors**).

1. Give it a name and set the **Remote MCP server URL** to `https://api.fxapis.com/mcp` (or
   `https://api.fxapis.com/mcp/insights` for the [read-only server](../README.md#read-only-server)).
2. **Authentication:** choose **Sign in now**.
3. **OAuth client:** choose **Use Claude's published identity**. Nothing to set up.
4. Click **Add**, then **Connect**, and sign in to fxapis in the window that opens. Read access is always
   included; **Trading** is off unless you turn it on for the accounts you pick (it needs
   two-factor). Then allow it.

Connectors added on claude.ai are also available in the Claude desktop app. The connection is
listed under **Connected apps** on the [API keys page](https://fxapis.com/dashboard/keys), where
**Revoke** ends it at once.

For the `trading-mt5-safely` skill, download
[trading-mt5-safely.zip](https://docs.fxapis.com/downloads/trading-mt5-safely.zip) and upload it
under **Settings → Capabilities → Skills**.

## Claude Desktop with an API key

To use a key instead of signing in, Claude Desktop can run the open-source
[`mcp-remote`](https://www.npmjs.com/package/mcp-remote) bridge, which adds the header for it.
Needs Node.js 18+.

1. Open **Settings → Developer → Edit Config**.
2. Paste [`claude_desktop_config.json`](claude_desktop_config.json) in (merge it if you already
   have other servers configured), and put your real key in `FXAPIS_AUTH`.
3. Restart Claude Desktop.

The header is passed through an environment variable, not inline in `args`, because some systems
split arguments on spaces.
