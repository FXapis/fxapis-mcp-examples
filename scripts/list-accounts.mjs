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

const accounts = await client.callTool({ name: "list_accounts", arguments: {} });
const data = JSON.parse(accounts.content[0].text);
const rows = Array.isArray(data) ? data : (data.data ?? data);
console.log(`${rows.length} account(s):\n`);

for (const account of rows) {
  console.log(`  ${account.id}  ${account.login}@${account.server}  state=${account.state}`);
  if (account.state !== "ready") continue;
  const positions = await client.callTool({ name: "list_positions", arguments: { account_id: account.id } });
  const posData = JSON.parse(positions.content[0].text);
  const posRows = Array.isArray(posData) ? posData : (posData.data ?? posData);
  for (const p of posRows) {
    console.log(`      ${p.symbol.padEnd(10)} ${p.side.padEnd(4)} ${String(p.volume).padStart(6)}  profit=${p.profit}`);
  }
}

await client.close();
