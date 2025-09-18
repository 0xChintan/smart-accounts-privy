import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const scriptSources = [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      "blob:",
      "https://challenges.cloudflare.com",
      "https://www.googletagmanager.com",
      "https://auth.privy.io",
      "https://cdn.jsdelivr.net",
      "https://tagmanager.google.com",
    ];

    const styleSources = [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
    ];

    const imgSources = [
      "'self'",
      "data:",
      "blob:",
      "https://storage.googleapis.com",
      "https://cdn.jsdelivr.net",
    ];

    const fontSources = ["'self'", "https://fonts.gstatic.com"];

    const connectSources = [
      "'self'",
      "https://auth.privy.io",
      "wss://relay.walletconnect.com",
      "wss://relay.walletconnect.org",
      "wss://www.walletlink.org",
      // wildcard subdomain for privy RPCs
      "https://*.rpc.privy.systems",
      "https://explorer-api.walletconnect.com",
      "https://api.coinbase.com",
      "https://api.binance.com",
      "https://mainnet.base.org",
      "https://arb1.arbitrum.io",
      "https://rpc.zerodev.app",
    ];

    const childSources = [
      "https://auth.privy.io",
      "https://verify.walletconnect.com",
      "https://verify.walletconnect.org",
    ];

    const frameSources = [
      "https://auth.privy.io",
      "https://verify.walletconnect.com",
      "https://verify.walletconnect.org",
      "https://challenges.cloudflare.com",
    ];

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src ${scriptSources.join(" ")};
              script-src ${scriptSources.join(" ")};
              style-src ${styleSources.join(" ")};
              img-src ${imgSources.join(" ")};
              font-src ${fontSources.join(" ")};
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              child-src ${childSources.join(" ")};
              frame-src ${frameSources.join(" ")};
              connect-src ${connectSources.join(" ")};
              worker-src 'self';
              manifest-src 'self';
              report-uri /csp-violation-report-endpoint;
              upgrade-insecure-requests;
            `
              .replace(/\n/g, " ")
              .replace(/\s{2,}/g, " "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
