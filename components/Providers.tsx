"use client";

import { ReactNode, useContext, useMemo } from "react";
import {
  ConnectionProvider,
  WalletContext,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { NightlyWalletAdapter } from "@solana/wallet-adapter-wallets";
import { SWRConfig } from "swr";
import { FOGO_RPC } from "@/lib/deployment";

import "@solana/wallet-adapter-react-ui/styles.css";

const NIGHTLY_WALLET_NAME = "Nightly";

// `WalletProvider` always merges our configured adapters with every wallet the
// browser exposes via the Wallet Standard (Phantom, Solflare, Backpack, …), and
// there's no prop to opt out. This wrapper re-provides the wallet context with
// the list narrowed to just Nightly, so the connect modal shows a single option.
function OnlyNightly({ children }: { children: ReactNode }) {
  const ctx = useContext(WalletContext);
  const value = useMemo(() => {
    const seen = new Set<string>();
    const wallets = ctx.wallets.filter(({ adapter }) => {
      if (adapter.name !== NIGHTLY_WALLET_NAME || seen.has(adapter.name)) return false;
      seen.add(adapter.name);
      return true;
    });
    return { ...ctx, wallets };
  }, [ctx]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function Providers({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [new NightlyWalletAdapter()], []);

  return (
    <SWRConfig value={{ refreshInterval: 8000, revalidateOnFocus: false }}>
      <ConnectionProvider endpoint={FOGO_RPC} config={{ commitment: "confirmed" }}>
        <WalletProvider wallets={wallets} autoConnect>
          <OnlyNightly>
            <WalletModalProvider>{children}</WalletModalProvider>
          </OnlyNightly>
        </WalletProvider>
      </ConnectionProvider>
    </SWRConfig>
  );
}
