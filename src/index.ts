#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { execSync } from "child_process";

const RATE_LIMIT_MS = 1000;
let last = 0;

async function throttle() {
  const now = Date.now(); if (now - last < RATE_LIMIT_MS) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - (now - last)));
  last = Date.now();
}

function runWhois(query: string, server?: string): string {
  const cmd = server ? `whois -h ${server} "${query}"` : `whois "${query}"`;
  try { return execSync(cmd, { timeout: 15000, maxBuffer: 1024 * 1024 }).toString(); }
  catch (e: any) { return e.stdout?.toString() || e.message; }
}

function parseWhois(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([^:]+):\s*(.+)/);
    if (m && !m[1].startsWith("%") && !m[1].startsWith("#")) {
      const key = m[1].trim();
      if (!result[key]) result[key] = m[2].trim();
    }
  }
  return result;
}

const server = new McpServer({ name: "mcp-whois", version: "1.0.0" });

server.tool("lookup_domain", "WHOIS lookup for a domain.", {
  domain: z.string().describe("Domain name (e.g. 'example.com')"),
}, async ({ domain }) => {
  await throttle();
  const raw = runWhois(domain);
  const parsed = parseWhois(raw);
  return { content: [{ type: "text" as const, text: JSON.stringify({
    domain, parsed, raw: raw.slice(0, 3000),
  }, null, 2) }] };
});

server.tool("lookup_ip", "WHOIS lookup for an IP address.", {
  ip: z.string(),
}, async ({ ip }) => {
  await throttle();
  const raw = runWhois(ip);
  const parsed = parseWhois(raw);
  return { content: [{ type: "text" as const, text: JSON.stringify({ ip, parsed, raw: raw.slice(0, 3000) }, null, 2) }] };
});

server.tool("check_availability", "Check if a domain is available (heuristic based on WHOIS response).", {
  domain: z.string(),
}, async ({ domain }) => {
  await throttle();
  const raw = runWhois(domain);
  const lower = raw.toLowerCase();
  const available = lower.includes("no match") || lower.includes("not found") || lower.includes("no entries found") || lower.includes("no data found");
  return { content: [{ type: "text" as const, text: JSON.stringify({
    domain, available, confidence: available ? "high" : "likely registered",
    registrar: parseWhois(raw)["Registrar"] || null,
    expiry: parseWhois(raw)["Registry Expiry Date"] || parseWhois(raw)["Expiration Date"] || null,
  }, null, 2) }] };
});

server.tool("lookup_asn", "WHOIS lookup for an ASN.", {
  asn: z.string().describe("AS number (e.g. 'AS13335')"),
}, async ({ asn }) => {
  await throttle();
  const raw = runWhois(asn);
  const parsed = parseWhois(raw);
  return { content: [{ type: "text" as const, text: JSON.stringify({ asn, parsed, raw: raw.slice(0, 3000) }, null, 2) }] };
});

server.tool("raw_whois", "Raw WHOIS query with optional server.", {
  query: z.string(), whoisServer: z.string().optional().describe("Specific WHOIS server to query"),
}, async ({ query, whoisServer }) => {
  await throttle();
  const raw = runWhois(query, whoisServer);
  return { content: [{ type: "text" as const, text: raw.slice(0, 5000) }] };
});

async function main() { const t = new StdioServerTransport(); await server.connect(t); }
main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
