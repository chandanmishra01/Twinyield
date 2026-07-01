"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useSWR from "swr";
import { fetchProtocolState, fetchTokenBalance, ProtocolState } from "./onchain";
import { DEPLOYMENT, PK } from "./deployment";

export function useIsAdmin(): boolean {
  const { publicKey } = useWallet();
  if (!publicKey) return false;
  try {
    return publicKey.toBase58() === DEPLOYMENT.admin;
  } catch {
    return false;
  }
}

export function useProtocolState() {
  const { connection } = useConnection();
  return useSWR<ProtocolState>(
    ["protocol-state"],
    () => fetchProtocolState(connection),
    { refreshInterval: 8000 },
  );
}

export function useWalletBalances() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  return useSWR(
    publicKey ? ["wallet-balances", publicKey.toBase58()] : null,
    async () => {
      if (!publicKey) return null;
      const [base, a, x] = await Promise.all([
        fetchTokenBalance(connection, PK.baseMint, publicKey),
        fetchTokenBalance(connection, PK.aMint, publicKey),
        fetchTokenBalance(connection, PK.xMint, publicKey),
      ]);
      return { base9: base, a9: a, x9: x };
    },
    { refreshInterval: 10000 },
  );
}
