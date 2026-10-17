#!/usr/bin/env python3
"""List MT5 accounts and their open positions over fxapis's MCP server.

Uses the official MCP Python SDK (`pip install mcp`) as a plain client --
no AI model involved, just the protocol -- to call fxapis's read-only
list_accounts and list_positions tools directly.

    pip install mcp
    export FXAPIS_API_KEY=fx_test_...
    python list_accounts.py
"""

from __future__ import annotations

import asyncio
import os
import sys

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

MCP_URL = "https://api.fxapis.com/mcp"


async def all_items(session: ClientSession, name: str, args: dict) -> list[dict]:
    """Every row of a list tool.

    Each tool answers with one line for the model in `content` and the data as
    `structuredContent`. Lists are {items, next_cursor, total}, 25 at a time.
    """
    items: list[dict] = []
    cursor = None
    while True:
        result = await session.call_tool(name, {**args, **({"cursor": cursor} if cursor else {})})
        if result.isError:
            raise RuntimeError(result.content[0].text)
        items.extend(result.structuredContent["items"])
        cursor = result.structuredContent.get("next_cursor")
        if not cursor:
            return items


async def main() -> None:
    key = os.environ.get("FXAPIS_API_KEY")
    if not key:
        print("Set FXAPIS_API_KEY first (create one at https://fxapis.com/dashboard/keys).", file=sys.stderr)
        raise SystemExit(1)

    http_client = httpx.AsyncClient(headers={"Authorization": f"Bearer {key}"})
    async with streamable_http_client(MCP_URL, http_client=http_client) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            accounts = await all_items(session, "list_accounts", {})
            print(f"{len(accounts)} account(s):\n")

            for account in accounts:
                print(f"  {account['id']}  {account['login']}@{account['server']}  state={account['state']}")
                if account["state"] != "ready":
                    continue
                for p in await all_items(session, "list_positions", {"account_id": account["id"]}):
                    print(f"      {p['symbol']:<10} {p['side']:<4} {p['volume']:>6}  profit={p['profit']}")


if __name__ == "__main__":
    asyncio.run(main())
