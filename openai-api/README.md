# OpenAI API (Responses)

[`request.json`](request.json) is a Responses API body that connects the fxapis MCP server as a
remote tool. Put your key in `authorization` and send it:

```bash
export OPENAI_API_KEY=sk-...
export FXAPIS_KEY=fx_test_...
sed "s/fx_live_…/$FXAPIS_KEY/" request.json | \
  curl -sS https://api.openai.com/v1/responses \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -H "Content-Type: application/json" \
    -d @-
```

`require_approval` as written lets the model read freely (`list_accounts`, `get_account_status`,
`list_positions`, `get_order`, `list_orders`) and asks your code to approve every other call,
including every trade. The value in `authorization` is not stored by OpenAI; it is sent with
each request.

**ChatGPT** connects with sign-in, not a key: on the web, **Plugins → + → Add custom MCP server** with
the URL `https://api.fxapis.com/mcp` and **Authentication: OAuth**, then sign in to fxapis when asked.
See [ChatGPT](../README.md#chatgpt).
