# Claude Code

## Sign in

```bash
claude mcp add --transport http fxapis https://api.fxapis.com/mcp
```

Then run `/mcp`, choose **fxapis**, and **Authenticate**: your browser opens fxapis's sign-in.
Read access is always included; **Trading** is off unless you turn it on for the accounts you
pick (it needs two-factor).

## The plugin

The [fxapis plugin](https://github.com/FXapis/fxapis-claude-plugins) adds the same server with
sign-in, the `trading-mt5-safely` skill, status and positions commands, and a hook that asks you
before every fxapis trade and refuses live accounts until you allow them:

```
/plugin marketplace add FXapis/fxapis-claude-plugins
/plugin install fxapis@fxapis
```

## With an API key

For an agent that runs unattended:

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
