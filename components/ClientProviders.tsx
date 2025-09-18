// components/ClientProviders.tsx
"use client";

import React from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { arbitrum } from "viem/chains";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        embeddedWallets: { showWalletUIs: false, createOnLogin: "all-users" },
        supportedChains: [arbitrum],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
