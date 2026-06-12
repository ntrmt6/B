## GitHub Copilot Chat

- Extension: 0.37.9 (prod)
- VS Code: 1.109.5 (072586267e68ece9a47aa43f8c108e0dcbf44622)
- OS: win32 10.0.26200 x64
- Remote Name: ssh-remote
- Extension Kind: UI
- GitHub Account: systemnextit-spec

## Network

User Settings:
```json
  "http.systemCertificatesNode": true,
  "github.copilot.advanced.debug.useElectronFetcher": true,
  "github.copilot.advanced.debug.useNodeFetcher": false,
  "github.copilot.advanced.debug.useNodeFetchFetcher": true
```

Connecting to https://api.github.com:
- DNS ipv4 Lookup: 20.205.243.168 (5 ms)
- DNS ipv6 Lookup: Error (65 ms): getaddrinfo ENOTFOUND api.github.com
- Proxy URL: None (1 ms)
- Electron fetch (configured): HTTP 200 (389 ms)
- Node.js https: HTTP 200 (289 ms)
- Node.js fetch: HTTP 200 (121 ms)

Connecting to https://api.githubcopilot.com/_ping:
- DNS ipv4 Lookup: 140.82.112.22 (42 ms)
- DNS ipv6 Lookup: Error (44 ms): getaddrinfo ENOTFOUND api.githubcopilot.com
- Proxy URL: None (12 ms)
- Electron fetch (configured): HTTP 200 (990 ms)
- Node.js https: HTTP 200 (1848 ms)
- Node.js fetch: HTTP 200 (825 ms)

Connecting to https://copilot-proxy.githubusercontent.com/_ping:
- DNS ipv4 Lookup: 138.91.182.224 (62 ms)
- DNS ipv6 Lookup: Error (51 ms): getaddrinfo ENOTFOUND copilot-proxy.githubusercontent.com
- Proxy URL: None (10 ms)
- Electron fetch (configured): HTTP 200 (734 ms)
- Node.js https: HTTP 200 (748 ms)
- Node.js fetch: HTTP 200 (725 ms)

Connecting to https://mobile.events.data.microsoft.com: HTTP 404 (299 ms)
Connecting to https://dc.services.visualstudio.com: HTTP 404 (789 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (837 ms)
Connecting to https://copilot-telemetry.githubusercontent.com/_ping: HTTP 200 (811 ms)
Connecting to https://default.exp-tas.com: HTTP 400 (185 ms)

Number of system certificates: 72

## Documentation

In corporate networks: [Troubleshooting firewall settings for GitHub Copilot](https://docs.github.com/en/copilot/troubleshooting-github-copilot/troubleshooting-firewall-settings-for-github-copilot).