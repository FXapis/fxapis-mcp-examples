<div align="center">

<img src="https://fxapis.com/logo.png" alt="" width="72" height="72">

# fxapis MCP examples

**Connect Claude, ChatGPT, Cursor, VS Code and other AI agents to MetaTrader 5 over the Model Context Protocol**

[Website](https://fxapis.com) · [Docs](https://docs.fxapis.com) · [MCP guide](https://docs.fxapis.com/guides/mcp) · [Status](https://status.fxapis.com) · [Support](mailto:support@fxapis.com)

[![License: MIT](https://img.shields.io/badge/license-MIT-22D3D6?style=flat-square)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-Streamable%20HTTP-6E56CF?style=flat-square)](https://modelcontextprotocol.io)
[![fxapis status](https://status.fxapis.com/badge.svg)](https://status.fxapis.com)

</div>

---

fxapis runs a hosted [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server. Point an MCP client at it, sign in with your fxapis account (or send an fxapis API key), and the assistant can list your MetaTrader 5 accounts, read positions, orders and deals, bring accounts online, and — if you allow it — place, modify and close trades.

```
https://api.fxapis.com/mcp
```

A second, [read-only server](#read-only-server) at `https://api.fxapis.com/mcp/insights` answers questions and has no tool that trades.

There is nothing to install or run: the servers are part of the API, and the MT5 terminals run in our EU cloud, as they do for every other fxapis call. This repository is **tested client configurations and example scripts**, not the server itself.

> [!WARNING]
> **An agent allowed to trade trades real money.** Every fxapis account connection reaches a real broker, and so does every key, `fx_test_` included. Start with a **broker demo account** and **read-only** access: when you sign in, Trading is off unless you turn it on; with a key, give an agent `trading:reduce` (close, move stops, cancel) before you ever give it `trading:execute` (open positions). Read [Safety model](#safety-model) before connecting a live account.

## Table of contents

- [What's here](#whats-here)
- [How it works](#how-it-works)
- [Create a key for the agent](#create-a-key-for-the-agent)
- [Connect your client](#connect-your-client)
- [Claude Code plugin and skill](#claude-code-plugin-and-skill)
- [Tools](#tools)
- [Read-only server](#read-only-server)
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
| Claude (claude.ai / Desktop) | [`claude/`](claude/) | custom connector with sign-in, or `mcp-remote` with a key |
| Claude Code | [`claude-code/`](claude-code/) | `claude mcp add` with sign-in or a key, the plugin, or a shared `.mcp.json` |
| Cursor | [`cursor/`](cursor/) | `~/.cursor/mcp.json` or project-level, with a key |
| VS Code (Copilot agent mode) | [`vscode/`](vscode/) | `.vscode/mcp.json` with a secure key prompt |
| OpenAI API (Responses) | [`openai-api/`](openai-api/) | a `tools: [{ type: "mcp", ... }]` request body |
| Anthropic API (Messages) | [`anthropic-api/`](anthropic-api/) | an `mcp_servers` + `mcp_toolset` request body |
| Plain client scripts | [`scripts/`](scripts/) | Python and Node — call fxapis's MCP tools directly, no model involved |

ChatGPT needs no file: see [ChatGPT](#chatgpt) below.

Every key-based config in this repo was run against the live `https://api.fxapis.com/mcp` endpoint while writing it (with an invalid key, to confirm the request reaches the server and gets fxapis's real `401` back) — see [Contributing](#contributing) for how to do the same.

## How it works

- **Transport:** Streamable HTTP, stateless. It speaks both the 2026-07-28 revision of the protocol and the 2025 revisions (clients that start with an `initialize` handshake), and answers in plain JSON. There are no sessions, so any of fxapis's servers can answer any request.
- **Sign in, no key to copy.** Clients that support MCP's OAuth sign-in (claude.ai, Claude Desktop, Claude Code, ChatGPT) open fxapis's sign-in page the first time they use it. You choose what the app may do:
  - **Read access** — accounts, positions, orders, deals, figures and quotes — is always included.
  - **Trading** is off by default. Turn it on per account: everything the app changes (opening, closing, stops, cancelling, bringing online, taking offline) is limited to the accounts you pick. It needs two-factor turned on. You can also set a maximum order size and a number of orders a day.

  Every app you connect is listed on the [API keys page](https://fxapis.com/dashboard/keys) under **Connected apps**; **Revoke** ends its access on its very next request. Sign-in is OAuth 2.1 with PKCE, discovered from `https://api.fxapis.com/.well-known/oauth-protected-resource/mcp`.
- **API keys still work**, for scripts, unattended agents and clients that cannot sign in yet (Cursor, VS Code): `Authorization: Bearer fx_live_…`, or `X-API-Key: fx_live_…` for clients that only offer that header.
- **`initialize` and `tools/list` answer without a credential.** A tool call without one, or with an invalid one, gets `401` with a `WWW-Authenticate: Bearer` challenge that points the client at the sign-in.
- **The same rules as the REST API.** Each tool calls the ordinary `/v1` endpoints with what you allowed. Scopes, workspace isolation, rate limits, plan limits, idempotency and fxapis's trading kill switch apply exactly as they do to your own code — the MCP server cannot do anything the connection or key could not do over REST. Each tool call counts as one or two API calls on your plan.
- **Deliberately missing:** connecting an MT5 account and managing API keys. Connecting takes the broker password, and a broker credential must never pass through a language model's context. Do both in the [fxapis console](https://fxapis.com/dashboard).

## Create a key for the agent

Skip this if your client signs in. For a script, an agent that runs unattended, or a client that cannot sign in yet, [create a key](https://fxapis.com/dashboard/keys) in the console just for it, with the fewest scopes that do the job:

| The agent should… | Scopes |
|---|---|
| Report on accounts, positions and history | `accounts:read`, `trading:read`, `history:read` |
| …and bring accounts online or take them offline | add `accounts:write` |
| …and manage risk: close, move stops, cancel — never open | add `trading:reduce` |
| …and open new positions | add `trading:execute` |

A key without the scope for a tool gets `MISSING_SCOPE` back from that tool, and the agent is told to ask you rather than work around it. Revoke the key in the console and the agent is cut off on its very next call.

## Connect your client

Where a config uses a key, replace `fx_live_…` / `${FXAPIS_KEY}` with yours. **Keep the key out of anything you commit** — every config here reads it from an environment variable or your client's own secret storage.

- **[Claude](claude/)** — claude.ai custom connector with sign-in (any plan; also in Claude Desktop), or Claude Desktop via `mcp-remote` with a key
- **[Claude Code](claude-code/)** — `claude mcp add --transport http fxapis https://api.fxapis.com/mcp`, then sign in from `/mcp`; or the [plugin](#claude-code-plugin-and-skill); or a key in a team `.mcp.json`
- **[ChatGPT](#chatgpt)** — developer mode, with sign-in
- **[Cursor](cursor/)** — with a key
- **[VS Code](vscode/)** — GitHub Copilot agent mode, with a key
- **[OpenAI API](openai-api/)** — Responses API, `tools: [{ type: "mcp" }]`
- **[Anthropic API](anthropic-api/)** — Messages API, `mcp_servers` + `mcp_toolset`
- **Any other client:** one that supports MCP's OAuth sign-in connects with the URL alone. fxapis accepts sign-in return addresses for Claude, ChatGPT, and apps on your own computer (`http://localhost` and `http://127.0.0.1`); clients that return to a custom scheme, such as `cursor://` or `vscode://`, are not accepted yet, so use a key with them: URL `https://api.fxapis.com/mcp`, header `Authorization: Bearer fx_live_…`. Test from a terminal with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

  ```bash
  npx @modelcontextprotocol/inspector https://api.fxapis.com/mcp   # signs in from the browser

  npx @modelcontextprotocol/inspector --cli https://api.fxapis.com/mcp --transport http \
    --header "Authorization: Bearer $FXAPIS_KEY" --method tools/list
  ```

### ChatGPT

Turn on **Settings → Apps → Advanced settings → Developer mode** (on the plans OpenAI offers it on), then **Create app**:

- **MCP server URL:** `https://api.fxapis.com/mcp`
- **Authentication:** OAuth

Sign in to fxapis when ChatGPT asks. Agents built on the OpenAI API use a key instead: see [`openai-api/`](openai-api/).

## Claude Code plugin and skill

The [fxapis plugin](https://github.com/FXapis/fxapis-claude-plugins) adds the server with sign-in, the `trading-mt5-safely` skill, the `/fxapis:status`, `/fxapis:positions` and `/fxapis:connect-help` commands, and a hook that asks you before every fxapis trade — even in auto-accept mode — and refuses trades on live accounts until you turn on its `allowLiveTrading` setting:

```
/plugin marketplace add FXapis/fxapis-claude-plugins
/plugin install fxapis@fxapis
```

For an unattended agent, set an API key as the plugin's `api_key` option instead of signing in.

On claude.ai and Claude Desktop, the skill alone is a zip: download [trading-mt5-safely.zip](https://docs.fxapis.com/downloads/trading-mt5-safely.zip), upload it under **Settings → Capabilities → Skills**, and add the connector as in [`claude/`](claude/). Details: [docs.fxapis.com/guides/claude-plugin](https://docs.fxapis.com/guides/claude-plugin).

## Tools

`https://api.fxapis.com/mcp` has 29 tools. Arguments are `snake_case`. Account ids are the fxapis UUIDs from `list_accounts`, not MT5 login numbers. Volumes and prices are best sent as strings (`"0.10"`, `"1.08450"`); numbers are accepted and converted.

Results are small by design:

- each result is one line for the model plus the data once as compact JSON (also in `structuredContent`);
- read tools take `response_format`: `concise` (the default) returns what a next step needs, `detailed` every field the API has;
- list tools return `{ items, next_cursor, total }`, 25 at a time by default; pass `limit`, and send `next_cursor` back as `cursor` for the next page. `total` is `null` where the API pages by cursor (`list_orders`, `list_deals`).

### Answer a question in one call (`readOnlyHint: true`)

| Tool | Title | What it does | Scope |
|---|---|---|---|
| `get_account_overview` | Account overview | An account's state, environment, balance, equity, and its largest positions with total P/L | `accounts:read`, `trading:read` |
| `get_symbol_snapshot` | Symbol snapshot | A symbol's specification, live quote, whether the market is open, and the margin for a volume | `accounts:read`, `trading:read` |

### Read-only (`readOnlyHint: true` — safe to run unattended)

| Tool | Title | What it does | Scope |
|---|---|---|---|
| `get_workspace` | Workspace and plan | Plan, its limits and features, and whether trading is switched off | `accounts:read` |
| `get_usage` | This month's usage | This month's orders, multi-account orders and API calls against the plan | `accounts:read` |
| `list_accounts` | List MT5 accounts | Connected MT5 accounts with id, login, server, state and environment (demo or live) | `accounts:read` |
| `get_account` | Get an account | One account: broker, currency, leverage, state, and its last-read balance and equity | `accounts:read` |
| `get_account_status` | Poll account state | Just the state — poll it after `bring_accounts_online` until `ready` | `accounts:read` |
| `get_account_figures` | Get balance, equity and margin | Balance, equity, margin and margin level — the last read, or fresh from the terminal (`fresh: true`) | `accounts:read` |
| `list_positions` | List positions | Positions on an account as last observed | `trading:read` |
| `list_instruments` | List instruments | Markets named once (`XAUUSD`, `US30`…), whatever each broker calls them | any |
| `search_broker_servers` | Search broker servers | The exact MT5 server for a broker's name or the start of a server name | `accounts:read` |
| `list_account_instruments` | Map instruments | The broker symbol each instrument trades as on an account, or why it cannot; `query` narrows it | `accounts:read` |
| `get_market_hours` | Market hours | Whether a market is open now on an account's broker, and when it opens or closes | `accounts:read` |
| `get_quotes` | Get live prices | Live bid and ask for up to 20 symbols or instruments, from the account's own broker | `trading:read` |
| `list_orders` | List orders | Orders, newest first, filtered by account, state, symbol and time | `trading:read` |
| `get_order` | Get an order | One order, the broker's return code and fill; optionally its deals | `trading:read` (+ `history:read` for deals) |
| `list_deals` | List deals | The broker's deal history for an account, including deals no order of yours caused | `history:read` |
| `list_multi_account_orders` | List multi-account orders | Recent multi-account orders, with a result per account | `trading:read` |
| `get_multi_account_order` | Follow a multi-account order | One multi-account order, to follow it until it settles | `trading:read` |
| `calculate` | Margin or profit | Margin an order would need, or profit between two prices — asks the broker, opens nothing | `trading:read` |

### Account lifecycle (`destructiveHint: false`, `idempotentHint: true` — safe to repeat, never trades)

| Tool | Title | What it does | Scope |
|---|---|---|---|
| `bring_accounts_online` | Bring accounts online | Starts and logs in up to 200 accounts; returns at once with a result per account | `accounts:write` |
| `take_account_offline` | Take an account offline | Stops the terminal. Open positions, stop losses and take profits stay at the broker | `accounts:write` |

### Trading (`destructiveHint: true` — a client that asks before acting will ask)

Each one **requires an `idempotency_key`**: the agent generates a fresh one (a UUID is ideal) per action, and sends the **same** key again only if it retries that exact action after an error or timeout. With it, a retried order is never a second order, and a retried close is never an opposite position.

| Tool | Title | What it does | Scope |
|---|---|---|---|
| `place_market_order` | Place a market order | Opens a position at market, with optional stop loss and take profit | `trading:execute` |
| `place_pending_order` | Place a limit or stop order | Places a limit, stop or stop-limit order that waits at the broker | `trading:execute` |
| `close_position` | Close a position | Closes a position in whole or in part | `trading:reduce` |
| `modify_position` | Move stop loss / take profit | Moves or removes a position's stop loss and take profit | `trading:reduce` |
| `cancel_order` | Cancel a pending order | Cancels a pending order that has not triggered | `trading:reduce` |
| `place_multi_account_order` | Place one trade on many accounts | Places the same trade on many accounts at once | `trading:execute` |
| `cancel_multi_account_order` | Cancel a multi-account order | Calls off a multi-account order before anything is sent | `trading:reduce` |

A connected app that was not allowed to trade, and calls a trading tool, gets `403` with `WWW-Authenticate: Bearer error="insufficient_scope", scope="… trading:execute"`. The app then asks you to sign in again, and the sign-in page opens with **Trading** selected.

## Read-only server

```
https://api.fxapis.com/mcp/insights
```

The read-only server answers questions about your MT5 accounts and cannot trade: it has no tool that opens, closes or changes anything, and its sign-in grants read access only. It is the fxapis connector listed in the Claude and ChatGPT directories, whose rules exclude tools that execute financial transactions.

Its 14 tools are the read tools above, with the same arguments and answers: `list_accounts`, `get_account`, `get_account_status`, `get_account_figures`, `list_positions`, `list_instruments`, `list_account_instruments`, `get_market_hours`, `get_quotes`, `list_orders`, `get_order`, `list_deals`, `get_account_overview` and `get_symbol_snapshot`.

Add it like the full server, with this URL. To trade as well, add `https://api.fxapis.com/mcp` too; each connection is listed and revoked separately under **Connected apps**. Details: [docs.fxapis.com/guides/mcp-read-only](https://docs.fxapis.com/guides/mcp-read-only).

## Errors

A failure comes back as an MCP tool error (`isError: true`) whose text starts with the API's own error code, followed by the message, any `details`, what to do next and the request id — for example:

```
ORDER_UNRESOLVED (HTTP 503): Something went wrong and we do not know yet whether the order was sent. We are confirming it with the broker. Do not resend it.
details: [{"orderId":"5b0e7c1a-2f4d-4a8e-9c3b-1d6f0e2a7b94","state":"unknown","retryable":false}]
Next step: Do NOT resend this order. Its outcome is unknown and it may be live at the broker. Poll get_order with the orderId in details until it leaves `unknown`, and tell the user.
requestId: 3f8a1c92-7b4e-4d81-a2f6-0c5e9b3d7a14
```

The same code, status, message, request id and next step are in the result's `_meta` under `com.fxapis/error`, for programs.

The codes that matter most to an agent:

| Code | Meaning for the agent |
|---|---|
| `ORDER_UNRESOLVED` | The outcome is unknown and the order may be live. **Never resend**; poll `get_order` |
| `SEND_FAILED` | Nothing reached the broker. Retry with the **same** `idempotency_key` |
| `ORDER_REJECTED` | The broker refused it; nothing was opened. Tell the user the reason |
| `MISSING_SCOPE` | This connection or key does not allow it. Ask the user; do not look for another way |
| `KEY_LIMIT_EXCEEDED` | A limit chosen for this connection or key refuses it; `details` say which |
| `ACCOUNT_NOT_READY` / `NO_RUNTIME` | Bring the account online, wait for `ready`, then retry |
| `RATE_LIMITED` | Wait `retryAfterSeconds`, then retry once |
| `TRADING_DISABLED` | Trading is switched off for the account or workspace. Do not retry |

The full reference: [docs.fxapis.com/errors](https://docs.fxapis.com/errors). Every code with its next step for an agent: [error codes in the skill](https://github.com/FXapis/fxapis-claude-plugins/blob/main/plugins/fxapis/skills/trading-mt5-safely/error-codes.md).

## Safety model

An agent is a new kind of caller: it can misread a request, act on text planted in a web page or a message it was asked to summarize, or loop. The protections, strongest to weakest:

1. **What you allowed**, enforced by the API on every call whatever the model decides:
   - a connected app's choices on the sign-in page: read-only, or trading on the accounts you picked, within the size and daily limits you set. A trading connection cannot change anything on an account you did not pick; it can still read every account in the workspace;
   - a key's scopes and limits. A read-only key cannot trade, and a `trading:reduce` key can only ever close, cancel and move stops.

   Start read-only.
2. **Two-factor for trading.** Letting an app trade needs two-factor turned on.
3. **Demo accounts.** Connect a broker demo account while you learn how an agent behaves with it. There is no simulated market at fxapis; demo accounts are how you test.
4. **Your plan's limits.** Opening orders are refused once the plan's limits are reached (closing is never refused for billing).
5. **Your client's approvals.** Trading tools are marked destructive and read-only tools are marked read-only, so clients such as Claude and Cursor ask before a trade. The [Claude Code plugin](#claude-code-plugin-and-skill) makes that a rule and refuses live accounts until you allow them. Do not choose "always allow" for trading tools on a live account.
6. **The tool descriptions and the skill**, which tell the model it trades real money, to confirm symbol, side, volume and account with you first, and never to resend an unresolved order. That shapes behaviour; it does not enforce anything. Points 1 and 2 do.

Every order an agent places is recorded like any other — in `list_orders` and in the console — with the key or connected app that placed it. Tool calls are logged with the tool name, the workspace and the outcome, never the arguments.

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

- **Custom-scheme sign-in returns** (`cursor://`, `vscode://`) are not accepted yet. Use an API key with those clients.
- **No streaming or notifications to the agent.** Tools answer once. An agent following an account coming online or a multi-account order settling polls for it. For your own server, fxapis sends [webhooks](https://docs.fxapis.com/guides/webhooks) — but an MCP client has nowhere to receive them.
- **MetaTrader 5 only.** MT4 is not supported.

## Related fxapis repositories

| Repository | What it is |
|---|---|
| [`fxapis-examples`](https://github.com/FXapis/fxapis-examples) | REST API examples in Python, Node/TypeScript and curl |
| [`fxapis-typescript`](https://github.com/FXapis/fxapis-typescript) | The official TypeScript/Node.js SDK |
| [`fxapis-python`](https://github.com/FXapis/fxapis-python) | The official Python SDK |
| [`fxapis-integrations`](https://github.com/FXapis/fxapis-integrations) | Postman collection, TradingView payloads, automation templates |
| [`fxapis-claude-plugins`](https://github.com/FXapis/fxapis-claude-plugins) | The Claude Code plugin: MCP server, `trading-mt5-safely` skill, trade-confirmation hook |

## Contributing

Every config here should work when copied as-is. Before opening a pull request that changes one:

1. Edit the config/script.
2. Run it against `https://api.fxapis.com/mcp` with a well-formed but **invalid** key, such as
   `fx_test_00000000_invalid0ci0check0invalid0ci0check0`. You should get back fxapis's real `401`
   (`The API key is not valid.`) — that proves the client reaches the server, authenticates the
   way you intended, and the transport is wired correctly, without needing a real account. (A
   value that is not shaped like a key is treated as a sign-in token and refused with a different
   message.) The scripts in [`scripts/`](scripts/) do this with
   `FXAPIS_API_KEY=fx_test_00000000_invalid0ci0check0invalid0ci0check0 python scripts/list_accounts.py`.
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
