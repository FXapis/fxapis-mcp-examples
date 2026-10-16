<div align="center">

<img src="https://fxapis.com/logo.png" alt="" width="72" height="72">

# fxapis MCP examples

**Connect Claude, Cursor, VS Code and other AI agents to MetaTrader 5 over the Model Context Protocol**

[Website](https://fxapis.com) · [Docs](https://docs.fxapis.com) · [MCP guide](https://docs.fxapis.com/guides/mcp) · [Status](https://status.fxapis.com) · [Support](mailto:support@fxapis.com)

[![License: MIT](https://img.shields.io/badge/license-MIT-22D3D6?style=flat-square)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6E56CF?style=flat-square)](https://modelcontextprotocol.io)
[![fxapis status](https://status.fxapis.com/badge.svg)](https://status.fxapis.com)

</div>

---

fxapis runs a hosted [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server. Point an MCP client at it with an fxapis API key and the assistant can list your MetaTrader 5 accounts, read positions, orders and deals, bring accounts online, and — if the key allows it — place, modify and close trades.

```
https://api.fxapis.com/mcp
```

There is nothing to install or run: the server is part of the API, and the MT5 terminals run in our EU cloud, as they do for every other fxapis call. This repository is **tested client configurations and example scripts**, not the server itself.

> [!WARNING]
> **An agent with a trading key trades real money.** Every fxapis key, `fx_test_` included, reaches a real broker. Start with a **broker demo account** and a **read-only key**. Give an agent `trading:reduce` (close, move stops, cancel) before you ever give it `trading:execute` (open positions). Read [Safety model](#safety-model) before connecting a live account.

## Table of contents

- [What's here](#whats-here)
- [How it works](#how-it-works)
- [Create a key for the agent](#create-a-key-for-the-agent)
- [Connect your client](#connect-your-client)
- [Tools](#tools)
- [Errors](#errors)
- [Safety model](#safety-model)
- [Example prompts](#example-prompts)
- [Limits today](#limits-today)
- [Related fxapis repositories](#related-fxapis-repositories)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## What's here

| Client | Config | |
|---|---|---|
| Claude (claude.ai / Desktop) | [`claude/`](claude/) | custom connector, or `mcp-remote` for Desktop without header support |
| Claude Code | [`claude-code/`](claude-code/) | `claude mcp add`, or a shared `.mcp.json` |
| Cursor | [`cursor/`](cursor/) | `~/.cursor/mcp.json` or project-level |
| VS Code (Copilot agent mode) | [`vscode/`](vscode/) | `.vscode/mcp.json` with a secure key prompt |
| OpenAI API (Responses) | [`openai-api/`](openai-api/) | a `tools: [{ type: "mcp", ... }]` request body |
| Anthropic API (Messages) | [`anthropic-api/`](anthropic-api/) | an `mcp_servers` + `mcp_toolset` request body |
| Plain client scripts | [`scripts/`](scripts/) | Python and Node — call fxapis's MCP tools directly, no model involved |

Every config in this repo was run against the live `https://api.fxapis.com/mcp` endpoint while writing it (with an invalid key, to confirm the request reaches the server and gets fxapis's real `401` back) — see [Contributing](#contributing) for how to do the same.

## How it works

- **Transport:** Streamable HTTP, stateless. It speaks both the 2026-07-28 revision of the protocol and the 2025 revisions (clients that start with an `initialize` handshake), and answers in plain JSON. There are no sessions, so any of fxapis's servers can answer any request.
- **Authentication:** your fxapis API key, in `Authorization: Bearer fx_live_…`. `X-API-Key: fx_live_…` is accepted too, for clients that only offer that header. A missing or invalid key gets `401` with a `WWW-Authenticate: Bearer` challenge. OAuth sign-in is not available yet.
- **The same rules as the REST API.** Each tool calls the ordinary `/v1` endpoints with your key. Scopes, workspace isolation, rate limits, plan limits, idempotency and fxapis's trading kill switch apply exactly as they do to your own code — the MCP server cannot do anything the key could not do over REST. Each tool call counts as one or two API calls on your plan.
- **Deliberately missing:** connecting an MT5 account and managing API keys. Connecting takes the broker password, and a broker credential must never pass through a language model's context. Do both in the [fxapis console](https://fxapis.com/dashboard).

## Create a key for the agent

In the console, [create a key](https://fxapis.com/dashboard/keys) just for the assistant, with the fewest scopes that do the job:

| The agent should… | Scopes |
|---|---|
| Report on accounts, positions and history | `accounts:read`, `trading:read`, `history:read` |
| …and bring accounts online or take them offline | add `accounts:write` |
| …and manage risk: close, move stops, cancel — never open | add `trading:reduce` |
| …and open new positions | add `trading:execute` |

A key without the scope for a tool gets `MISSING_SCOPE` back from that tool, and the agent is told to ask you rather than work around it. Revoke the key in the console and the agent is cut off on its very next call.

## Connect your client

Replace `fx_live_…` / `${FXAPIS_KEY}` with your key in each example. **Keep the key out of anything you commit** — every config here reads it from an environment variable or your client's own secret storage.

- **[Claude](claude/)** — claude.ai custom connector, or Claude Desktop via `mcp-remote`
- **[Claude Code](claude-code/)** — `claude mcp add`, or a team `.mcp.json`
- **[Cursor](cursor/)**
- **[VS Code](vscode/)** — GitHub Copilot agent mode
- **[OpenAI API](openai-api/)** — Responses API, `tools: [{ type: "mcp" }]`
- **[Anthropic API](anthropic-api/)** — Messages API, `mcp_servers` + `mcp_toolset`
- **Any other client** that supports Streamable HTTP and custom headers: URL `https://api.fxapis.com/mcp`, header `Authorization: Bearer fx_live_…`. Test from a terminal with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

  ```bash
  npx @modelcontextprotocol/inspector --cli https://api.fxapis.com/mcp --transport http \
    --header "Authorization: Bearer $FXAPIS_KEY" --method tools/list
  ```

**ChatGPT's** developer-mode apps currently connect with OAuth or with no authentication; they do not send an API key. Because fxapis requires a key and does not offer OAuth sign-in yet, the fxapis MCP server cannot be added to ChatGPT today — the [OpenAI API](openai-api/) example works now for agents built on that API.

## Tools

Arguments are `snake_case`. Account ids are the fxapis UUIDs from `list_accounts`, not MT5 login numbers. Volumes and prices are best sent as strings (`"0.10"`, `"1.08450"`); numbers are accepted and converted.

### Read-only (`readOnlyHint: true` — safe to run unattended)

| Tool | What it does | Scope |
|---|---|---|
| `get_workspace` | Plan, its limits and features, and whether trading is switched off | `accounts:read` |
| `get_usage` | This month's orders, multi-account orders and API calls against the plan | `accounts:read` |
| `list_accounts` | Every connected MT5 account with its id, login, server and state | `accounts:read` |
| `get_account` | One account: broker, currency, leverage, state, and its last-read balance and equity | `accounts:read` |
| `get_account_status` | Just the state — poll it after `bring_accounts_online` until `ready` | `accounts:read` |
| `get_account_figures` | Balance, equity, margin and margin level — the last read, or fresh from the terminal (`fresh: true`) | `accounts:read` |
| `list_positions` | Positions on an account as last observed, with `observedAt` | `trading:read` |
| `list_instruments` | Markets named once (`XAUUSD`, `US30`…), whatever each broker calls them | any key |
| `search_broker_servers` | The exact MT5 server for a broker's name or the start of a server name | `accounts:read` |
| `list_account_instruments` | The broker symbol each instrument trades as on an account, or why it cannot | `accounts:read` |
| `get_market_hours` | Whether a market is open now on an account's broker, and its weekly sessions in UTC | `accounts:read` |
| `get_quotes` | Live bid and ask for up to 20 symbols or instruments, from the account's own broker | `trading:read` |
| `list_orders` | Orders, newest first, filtered by account, state, symbol and time; paginated | `trading:read` |
| `get_order` | One order, the broker's return code and fill; optionally its deals | `trading:read` (+ `history:read` for deals) |
| `list_deals` | The broker's deal history for an account, including deals no order of yours caused | `history:read` |
| `list_multi_account_orders` | Recent multi-account orders, with a result per account | `trading:read` |
| `get_multi_account_order` | One multi-account order, to follow it until it settles | `trading:read` |
| `calculate` | Margin an order would need, or profit between two prices — asks the broker, opens nothing | `trading:read` |

### Account lifecycle (safe to repeat — never trades)

| Tool | What it does | Scope |
|---|---|---|
| `bring_accounts_online` | Starts and logs in up to 200 accounts; returns at once with a result per account | `accounts:write` |
| `take_account_offline` | Stops the terminal. Open positions, stop losses and take profits stay at the broker | `accounts:write` |

### Trading (`destructiveHint: true` — a client that asks before acting will ask)

Each one **requires an `idempotency_key`**: the agent generates a fresh one (a UUID is ideal) per action, and sends the **same** key again only if it retries that exact action after an error or timeout.

| Tool | What it does | Scope |
|---|---|---|
| `place_market_order` | Opens a position at market, with optional stop loss and take profit | `trading:execute` |
| `place_pending_order` | Places a limit, stop or stop-limit order that waits at the broker | `trading:execute` |
| `close_position` | Closes a position in whole or in part | `trading:reduce` |
| `modify_position` | Moves or removes a position's stop loss and take profit | `trading:reduce` |
| `cancel_order` | Cancels a pending order that has not triggered | `trading:reduce` |
| `place_multi_account_order` | Places the same trade on many accounts at once | `trading:execute` |
| `cancel_multi_account_order` | Calls off a multi-account order before anything is sent | `trading:reduce` |

## Errors

A failure comes back as an MCP tool error (`isError: true`) whose text starts with the API's own error code, followed by the message and what to do next — for example:

```
ORDER_UNRESOLVED (HTTP 503): Something went wrong and we do not know yet whether the order was sent. We are confirming it with the broker. Do not resend it.
Next step: Do NOT resend this order. Its outcome is unknown and it may be live at the broker. Poll get_order with the orderId in details until it leaves `unknown`, and tell the user.
```

The codes that matter most to an agent:

| Code | Meaning for the agent |
|---|---|
| `ORDER_UNRESOLVED` | The outcome is unknown and the order may be live. **Never resend**; poll `get_order` |
| `SEND_FAILED` | Nothing reached the broker. Retry with the **same** `idempotency_key` |
| `ORDER_REJECTED` | The broker refused it; nothing was opened. Tell the user the reason |
| `MISSING_SCOPE` | The key does not allow this. Ask the user; do not look for another way |
| `ACCOUNT_NOT_READY` / `NO_RUNTIME` | Bring the account online, wait for `ready`, then retry |
| `RATE_LIMITED` | Wait `retryAfterSeconds`, then retry once |
| `TRADING_DISABLED` | Trading is switched off for the account or workspace. Do not retry |

The full reference, including the 401 you'll see while testing without a key: [docs.fxapis.com/errors](https://docs.fxapis.com/errors).

## Safety model

An agent is a new kind of caller: it can misread a request, act on text planted in a web page or a message it was asked to summarize, or loop. The protections, strongest to weakest:

1. **The key's scopes**, enforced by the API on every call whatever the model decides. A read-only key cannot trade, and a `trading:reduce` key can only ever close, cancel and move stops. Start there.
2. **Demo accounts.** Connect a broker demo account while you learn how an agent behaves with it. There is no simulated market at fxapis; demo accounts are how you test.
3. **Your plan's limits.** Opening orders are refused once the plan's limits are reached (closing is never refused for billing).
4. **Your client's approvals.** Trading tools are marked destructive and read-only tools are marked read-only, so clients such as Claude Code and Cursor ask before a trade. Do not choose "always allow" for trading tools on a live account.
5. **The tool descriptions**, which tell the model it trades real money and to confirm symbol, side, volume and account with you first. That shapes behaviour; it does not enforce anything. Scopes do.

Every order an agent places is recorded like any other — in `list_orders` and in the console — with the key that placed it. Tool calls are logged with the tool name, the workspace and the outcome, never the arguments.

## Example prompts

- "Which of my MT5 accounts are online, and what positions are open on each?"
- "What was my realised profit on EURUSD this week on the Vantage demo account?"
- "How much margin would 0.5 lots of XAUUSD need on account 2?"
- "Bring all my accounts online, then tell me when they are ready."
- "Move the stop loss on my gold position to break-even." *(needs `trading:reduce`)*
- "Close half of every open EURUSD position on the demo account." *(needs `trading:reduce`)*
- "Buy 0.01 lots of EURUSD on the demo account with a 20-pip stop." *(needs `trading:execute`)*
- "Did anything go wrong with today's orders? Show me any that are still `unknown`."

## Limits today

- **API keys only.** OAuth sign-in, which would let a claude.ai or ChatGPT user connect with their fxapis login instead of a key, is planned.
- **No streaming or notifications to the agent.** Tools answer once. An agent following an account coming online or a multi-account order settling polls for it. For your own server, fxapis sends [webhooks](https://docs.fxapis.com/guides/webhooks) — but an MCP client has nowhere to receive them.
- **MetaTrader 5 only.** MT4 is not supported.

## Related fxapis repositories

| Repository | What it is |
|---|---|
| [`fxapis-examples`](https://github.com/FXapis/fxapis-examples) | REST API examples in Python, Node/TypeScript and curl |
| [`fxapis-typescript`](https://github.com/FXapis/fxapis-typescript) | The official TypeScript/Node.js SDK |
| [`fxapis-python`](https://github.com/FXapis/fxapis-python) | The official Python SDK |
| [`fxapis-integrations`](https://github.com/FXapis/fxapis-integrations) | Postman collection, TradingView payloads, automation templates |

## Contributing

Every config here should work when copied as-is. Before opening a pull request that changes one:

1. Edit the config/script.
2. Run it against `https://api.fxapis.com/mcp` with a deliberately **invalid** key. You should get
   back fxapis's real `401` (`A valid fxapis API key is required: …`) — that proves the client
   reaches the server, authenticates the way you intended, and the transport is wired correctly,
   without needing a real account. The scripts in [`scripts/`](scripts/) do this with
   `FXAPIS_API_KEY=invalid python scripts/list_accounts.py`.
3. For something that must be checked against a real account (a trading tool), use a **broker demo
   account** and say so in the pull request.

New client folders should follow the existing shape: a config file plus a short `README.md`
explaining where it goes.

## Support

- **Docs:** [docs.fxapis.com/guides/mcp](https://docs.fxapis.com/guides/mcp)
- **Status:** [status.fxapis.com](https://status.fxapis.com)
- **Bugs:** [open an issue](https://github.com/FXapis/fxapis-mcp-examples/issues)
- **Everything else:** [support@fxapis.com](mailto:support@fxapis.com)

## License

[MIT](LICENSE) © 2026 El Wizard
