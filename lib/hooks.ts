"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import useSWR from "swr";
import {
  fetchProtocolState,
  fetchTokenBalance,
  fetchPoolState,
  fetchDepositor,
  fetchYtPosition,
  ProtocolState,
} from "./onchain";
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

export function usePoolState() {
  const { connection } = useConnection();
  return useSWR(
    ["pool-state"],
    () => fetchPoolState(connection),
    { refreshInterval: 8000 },
  );
}

export function useDepositor() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  return useSWR(
    publicKey ? ["depositor", publicKey.toBase58()] : null,
    () => fetchDepositor(connection, publicKey!),
    { refreshInterval: 8000 },
  );
}

// A holder's claimable agFOGO (YT) yield. Needs their agFOGO balance and the
// live yt_reward_index to compute pending accrual, so pass both from
// useWalletBalances()/useProtocolState().
export function useYtPosition(aBalance9?: bigint, ytRewardIndex?: bigint) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const ready = !!publicKey && aBalance9 !== undefined && ytRewardIndex !== undefined;
  return useSWR(
    ready
      ? ["yt-position", publicKey!.toBase58(), aBalance9!.toString(), ytRewardIndex!.toString()]
      : null,
    () => fetchYtPosition(connection, publicKey!, aBalance9!, ytRewardIndex!),
    { refreshInterval: 8000 },
  );
}
