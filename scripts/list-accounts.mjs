// List MT5 accounts and their open positions over fxapis's MCP server.
//
// Uses the official MCP TypeScript SDK (npm install @modelcontextprotocol/sdk)
// as a plain client -- no AI model involved, just the protocol -- to call
// fxapis's read-only list_accounts and list_positions tools directly.
//
//   npm install @modelcontextprotocol/sdk
//   export FXAPIS_API_KEY=fx_test_...
//   node list-accounts.mjs

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = "https://api.fxapis.com/mcp";

const key = process.env.FXAPIS_API_KEY;
if (!key) {
  console.error("Set FXAPIS_API_KEY first (create one at https://fxapis.com/dashboard/keys).");
  process.exit(1);
}

const transport = new StreamableHTTPClientTransport(new URL(MCP_URL), {
  requestInit: { headers: { Authorization: `Bearer ${key}` } },
});

const client = new Client({ name: "fxapis-mcp-examples", version: "1.0.0" });
await client.connect(transport);

// Each tool answers with one line for the model in `content` and the data as
// `structuredContent`. Lists are { items, next_cursor, total }, 25 at a time.
async function all(name, args) {
  const items = [];
  let cursor;
  do {
    const result = await client.callTool({ name, arguments: { ...args, ...(cursor ? { cursor } : {}) } });
    if (result.isError) throw new Error(result.content[0].text);
    items.push(...result.structuredContent.items);
    cursor = result.structuredContent.next_cursor;
  } while (cursor);
  return items;
}

const accounts = await all("list_accounts", {});
console.log(`${accounts.length} account(s):\n`);

for (const account of accounts) {
  console.log(`  ${account.id}  ${account.login}@${account.server}  state=${account.state}`);
  if (account.state !== "ready") continue;
  for (const p of await all("list_positions", { account_id: account.id })) {
    console.log(`      ${p.symbol.padEnd(10)} ${p.side.padEnd(4)} ${String(p.volume).padStart(6)}  profit=${p.profit}`);
  }
}

await client.close();
