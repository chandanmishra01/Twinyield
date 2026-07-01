"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { mockMintGfogo } from "@/lib/anchor";
import { classifyTxError } from "@/lib/txError";
import { useWalletBalances } from "@/lib/hooks";
import { BaseTokenIcon } from "./Landing";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

const CLAIM_AMOUNT_UI = 100;
const MAX_CLAIMS_PER_DAY = 2;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function storageKey(addr: string) {
  return `twinyield_faucet_${addr.toLowerCase()}`;
}

function loadTimestamps(addr: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(addr));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTimestamps(addr: string, ts: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(addr), JSON.stringify(ts));
}

function activeWindow(ts: number[]): number[] {
  const cutoff = Date.now() - WINDOW_MS;
  return ts.filter((t) => t > cutoff);
}

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "0h 00m 00s";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return `${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}

export function Faucet() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { mutate: mutateBal } = useWalletBalances();

  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "idle" | "ok" | "err" | "cancelled"; msg?: string; sig?: string }>({ kind: "idle" });

  // 1s countdown timer
  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  void tick;

  // Reset status when wallet changes
  useEffect(() => {
    setStatus({ kind: "idle" });
  }, [wallet.publicKey?.toBase58()]);

  const addr = wallet.publicKey?.toBase58() ?? "";
  const claims = addr ? activeWindow(loadTimestamps(addr)) : [];
  const claimsLeft = Math.max(0, MAX_CLAIMS_PER_DAY - claims.length);
  const nextAvailMs =
    claims.length >= MAX_CLAIMS_PER_DAY
      ? Math.min(...claims) + WINDOW_MS - Date.now()
      : 0;

  const onClaim = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus({ kind: "err", msg: "Connect wallet first" });
      return;
    }
    if (claimsLeft === 0) return;
    setBusy(true);
    setStatus({ kind: "idle" });
    try {
      const w = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet) as never,
        signAllTransactions: wallet.signAllTransactions!.bind(wallet) as never,
      };
      const sig = await mockMintGfogo(connection, w, CLAIM_AMOUNT_UI);
      const a = wallet.publicKey.toBase58();
      saveTimestamps(a, [...activeWindow(loadTimestamps(a)), Date.now()]);
      setStatus({ kind: "ok", sig, msg: `${CLAIM_AMOUNT_UI} gFOGO sent to your wallet` });
      mutateBal();
    } catch (e) {
      const { cancelled, message } = classifyTxError(e, 240);
      setStatus({ kind: cancelled ? "cancelled" : "err", msg: message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <div className="max-w-md mx-auto">
        <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#0a0d16]/70 border border-white/[0.08] backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(255,107,51,0.25),0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 noise opacity-20 pointer-events-none" />

          <div className="relative p-4 sm:p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-500)]/15 border border-[var(--color-brand-500)]/30 grid place-items-center">
                <BaseTokenIcon size={28} />
              </div>
              <div>
                <div className="font-display text-lg text-white/90">gFOGO Faucet</div>
                <div className="text-xs text-white/50">
                  Claim testnet gFOGO to try the protocol
                </div>
              </div>
            </div>

            {/* Info panel */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-5 space-y-2.5">
              <Row label="Amount per claim" value={`${CLAIM_AMOUNT_UI} gFOGO`} />
              <Row
                label="Claims remaining (24h)"
                value={
                  wallet.connected
                    ? `${claimsLeft} / ${MAX_CLAIMS_PER_DAY}`
                    : "·"
                }
                tone={claimsLeft > 0 ? "ok" : "warn"}
              />
              {wallet.connected && claimsLeft === 0 && nextAvailMs > 0 && (
                <Row
                  label="Next claim in"
                  value={fmtCountdown(nextAvailMs)}
                  mono
                />
              )}
            </div>

            {/* Action */}
            {!wallet.connected ? (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            ) : claimsLeft === 0 ? (
              <button
                disabled
                className="w-full rounded-full py-3 font-semibold text-sm bg-white/[0.06] text-white/40 cursor-not-allowed"
              >
                Limit reached · resets in {fmtCountdown(nextAvailMs)}
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={onClaim}
                className="w-full btn-hemi py-3 text-sm"
              >
                {busy
                  ? "Claiming…"
                  : `Claim ${CLAIM_AMOUNT_UI} gFOGO (${claimsLeft} left today)`}
              </button>
            )}

            {/* Status */}
            {status.kind === "ok" && (
              <div className="mt-4 p-3 rounded-xl border border-[var(--color-brand-500)]/40 bg-[var(--color-brand-500)]/10">
                <div className="text-sm font-medium text-[var(--color-brand-300)] text-center">
                  {status.msg}
                </div>
                {status.sig && (
                  <div className="mt-1 text-[10px] text-white/45 font-mono break-all text-center">
                    {status.sig}
                  </div>
                )}
              </div>
            )}
            {status.kind === "err" && (
              <div className="mt-4 p-3 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10">
                <div className="text-xs font-medium text-[var(--color-danger)]">
                  Transaction failed
                </div>
                <div className="mt-0.5 text-[10px] text-[var(--color-danger)]/85 break-words">
                  {status.msg}
                </div>
              </div>
            )}
            {status.kind === "cancelled" && (
              <div className="mt-4 p-3 rounded-xl border border-white/20 bg-white/[0.05]">
                <div className="text-xs font-medium text-white/70">
                  {status.msg}
                </div>
              </div>
            )}

            <p className="mt-4 text-center text-[10px] text-white/30">
              Testnet only · Tokens hold no real value
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  label,
  value,
  tone,
  mono,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
  mono?: boolean;
}) {
  const cls =
    tone === "ok"
      ? "text-[var(--color-brand-300)]"
      : tone === "warn"
      ? "text-[var(--color-danger)]"
      : "text-white/90";
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/55">{label}</span>
      <span className={`font-semibold ${cls} ${mono ? "tabular" : ""}`}>{value}</span>
    </div>
  );
}

