# mcp-whois

WHOIS lookups for domains, IPs, and ASNs — check availability and registration details.

> **Free API** — No API key required.

## Tools

| Tool | Description |
|------|-------------|
| `lookup_domain` | WHOIS lookup for a domain. |
| `lookup_ip` | WHOIS lookup for an IP address. |
| `check_availability` | Check if a domain is available (heuristic based on WHOIS response). |
| `lookup_asn` | WHOIS lookup for an ASN. |
| `raw_whois` | Raw WHOIS query with optional server. |

## Installation

```bash
git clone https://github.com/PetrefiedThunder/mcp-whois.git
cd mcp-whois
npm install
npm run build
```

## Usage with Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "whois": {
      "command": "node",
      "args": ["/path/to/mcp-whois/dist/index.js"]
    }
  }
}
```

## Usage with npx

```bash
npx mcp-whois
```

## License

MIT
