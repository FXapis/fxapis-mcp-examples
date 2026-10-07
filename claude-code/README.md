# Claude Code

```bash
claude mcp add --transport http fxapis https://api.fxapis.com/mcp \
  --header "Authorization: Bearer $FXAPIS_KEY"
```

Or drop [`mcp.json`](mcp.json) in as `.mcp.json` at your project root to share it with your team —
each person reads the key from their own `FXAPIS_KEY` environment variable, so the key itself is
never committed:

```bash
cp mcp.json /path/to/your/project/.mcp.json
export FXAPIS_KEY=fx_test_...   # each teammate sets their own
```

Run `/mcp` inside Claude Code to check that `fxapis` is connected.
