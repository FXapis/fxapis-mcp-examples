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
import json
import os
import sys

import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

MCP_URL = "https://api.fxapis.com/mcp"


async def main() -> None:
    key = os.environ.get("FXAPIS_API_KEY")
    if not key:
        print("Set FXAPIS_API_KEY first (create one at https://fxapis.com/dashboard/keys).", file=sys.stderr)
        raise SystemExit(1)

    http_client = httpx.AsyncClient(headers={"Authorization": f"Bearer {key}"})
    async with streamable_http_client(MCP_URL, http_client=http_client) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            accounts = await session.call_tool("list_accounts", {})
            data = json.loads(accounts.content[0].text)
            rows = data.get("data", data) if isinstance(data, dict) else data
            print(f"{len(rows)} account(s):\n")

            for account in rows:
                print(f"  {account['id']}  {account['login']}@{account['server']}  state={account['state']}")
                if account["state"] != "ready":
                    continue
                positions = await session.call_tool("list_positions", {"account_id": account["id"]})
                pos_data = json.loads(positions.content[0].text)
                pos_rows = pos_data.get("data", pos_data) if isinstance(pos_data, dict) else pos_data
                for p in pos_rows:
                    print(f"      {p['symbol']:<10} {p['side']:<4} {p['volume']:>6}  profit={p['profit']}")


if __name__ == "__main__":
    asyncio.run(main())
