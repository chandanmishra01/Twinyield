"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { usePoolState, useDepositor, useWalletBalances } from "@/lib/hooks";
import { fmtToken9 } from "@/lib/format";
import { poolDeposit, poolUnlock, poolWithdraw, poolClaimBase } from "@/lib/anchor";
import { classifyTxError } from "@/lib/txError";
import { TokenMark, BaseTokenIcon } from "./Landing";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

type Tab = "deposit" | "withdraw";
type TxStatus = { kind: "idle" | "ok" | "err" | "cancelled"; msg?: string; sig?: string };

function fmtDuration(secs: number): string {
  if (secs <= 0) return "0s";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function PoolPanel() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { data: pool, mutate: mutatePool } = usePoolState();
  const { data: dep, mutate: mutateDep } = useDepositor();
  const { data: balances, mutate: mutateBal } = useWalletBalances();

  const [tab, setTab] = useState<Tab>("deposit");
  const [amount, setAmount] = useState("");
  const [claimOnWithdraw, setClaimOnWithdraw] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<TxStatus>({ kind: "idle" });
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  // 1s tick to drive the unlock countdown
  useEffect(() => {
    const id = window.setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setStatus({ kind: "idle" });
    setAmount("");
  }, [wallet.publicKey?.toBase58()]);

  const w =
    wallet.publicKey && wallet.signTransaction
      ? {
          publicKey: wallet.publicKey,
          signTransaction: wallet.signTransaction.bind(wallet) as never,
          signAllTransactions: wallet.signAllTransactions!.bind(wallet) as never,
        }
      : null;

  const agBalance9 = balances?.a9 ?? 0n;
  const staked9 = dep?.initialDeposit9 ?? 0n;
  const unlocking9 = dep?.initialUnlockAmount9 ?? 0n;
  const pending9 = dep?.basePending9 ?? 0n;
  const unlockAt = Number(dep?.initialUnlockAt ?? 0n);
  const unlockReady = unlocking9 > 0n && unlockAt > 0 && unlockAt <= now;
  const secsLeft = unlockAt > now ? unlockAt - now : 0;
  const unlockDurationSecs = Number(pool?.unlockDuration ?? 0n);

  const inputBalance9 = tab === "deposit" ? agBalance9 : staked9;
  const balanceN = Number(inputBalance9) / 1e9;
  const amountNum = parseFloat(amount) || 0;

  const refresh = () => Promise.all([mutatePool(), mutateDep(), mutateBal()]);

  const run = async (fn: () => Promise<string>, label: string, clear = true) => {
    if (!w) {
      setStatus({ kind: "err", msg: "Connect wallet first" });
      return;
    }
    setBusy(true);
    setStatus({ kind: "idle" });
    try {
      const sig = await fn();
      setStatus({ kind: "ok", sig, msg: `${label} confirmed` });
      if (clear) setAmount("");
      await refresh();
    } catch (e) {
      const { cancelled, message } = classifyTxError(e);
      setStatus({ kind: cancelled ? "cancelled" : "err", msg: message });
    } finally {
      setBusy(false);
    }
  };

  const onPrimary = () => {
    if (amountNum <= 0) return;
    if (tab === "deposit") run(() => poolDeposit(connection, w!, amountNum), "Deposit");
    else run(() => poolUnlock(connection, w!, amountNum), "Unlock");
  };

  return (
    <section className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <div className="max-w-md mx-auto">
        {/* Pool stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <StatTile
            label="Total Staked"
            value={pool ? `${fmtToken9(pool.totalSupply9, 2)}` : "·"}
            sub="agFOGO"
          />
          <StatTile
            label="Your Pending"
            value={`${fmtToken9(pending9, 4)}`}
            sub="gFOGO reward"
            tone="brand"
          />
        </div>

        <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#0a0d16]/70 border border-white/[0.08] backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(255,107,51,0.25),0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 noise opacity-20 pointer-events-none" />

          <div className="relative p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[var(--color-brand-500)]/15 border border-[var(--color-brand-500)]/30 grid place-items-center">
                <TokenMark kind="PT" size={30} />
              </div>
              <div>
                <div className="font-display text-lg text-white/90">Stability Pool</div>
                <div className="text-xs text-white/50">
                  Deposit agFOGO · earn gFOGO yield · backstop the peg
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white/[0.06] border border-white/[0.08] rounded-full p-1 mb-5">
              {(["deposit", "withdraw"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setAmount("");
                    setStatus({ kind: "idle" });
                  }}
                  className={
                    "flex-1 py-2 rounded-full text-sm font-semibold capitalize transition " +
                    (tab === t
                      ? "bg-[var(--color-brand-500)] text-white shadow"
                      : "text-white/55 hover:text-white/80")
                  }
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Your position */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 mb-5 space-y-2.5">
              <Row label="Your staked" value={`${fmtToken9(staked9, 4)} agFOGO`} />
              <Row
                label="Unlocking"
                value={
                  unlocking9 > 0n
                    ? `${fmtToken9(unlocking9, 4)} agFOGO`
                    : "—"
                }
              />
              {unlocking9 > 0n && (
                <Row
                  label={unlockReady ? "Status" : "Withdrawable in"}
                  value={unlockReady ? "Ready to withdraw" : fmtDuration(secsLeft)}
                  tone={unlockReady ? "ok" : undefined}
                  mono={!unlockReady}
                />
              )}
              <Row
                label="Cooldown"
                value={unlockDurationSecs ? fmtDuration(unlockDurationSecs) : "·"}
              />
            </div>

            {/* DEPOSIT / UNLOCK amount input */}
            {(tab === "deposit" || staked9 > 0n) && (
              <>
                <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
                  <input
                    inputMode="decimal"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                    className="bg-transparent flex-1 min-w-0 text-lg text-white/90 outline-none placeholder:text-white/25 tabular"
                  />
                  <button
                    onClick={() => setAmount(balanceN.toString())}
                    className="text-xs text-white/45 hover:text-[var(--color-brand-400)] whitespace-nowrap transition tabular"
                  >
                    Max: {fmtToken9(inputBalance9, 2)}
                  </button>
                </div>
                <div className="text-center text-[11px] text-white/40 mb-4">
                  {tab === "deposit"
                    ? "Deposits earn a share of harvested gFOGO yield."
                    : "Unlock starts the cooldown; withdraw after it elapses."}
                </div>
              </>
            )}

            {/* Actions */}
            {!wallet.connected ? (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            ) : tab === "deposit" ? (
              <button
                disabled={busy || amountNum <= 0}
                onClick={onPrimary}
                className="w-full btn-hemi py-3 text-sm disabled:opacity-50"
              >
                {busy ? "Processing…" : amountNum <= 0 ? "Enter an amount" : "Deposit agFOGO"}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  disabled={busy || amountNum <= 0 || staked9 <= 0n}
                  onClick={onPrimary}
                  className="w-full btn-hemi py-3 text-sm disabled:opacity-50"
                >
                  {busy
                    ? "Processing…"
                    : staked9 <= 0n
                    ? "Nothing staked"
                    : amountNum <= 0
                    ? "Enter an amount to unlock"
                    : "Unlock agFOGO"}
                </button>
                <label className="flex items-center justify-center gap-2 text-[11px] text-white/55 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={claimOnWithdraw}
                    onChange={(e) => setClaimOnWithdraw(e.target.checked)}
                    className="accent-[var(--color-brand-500)]"
                  />
                  also claim pending gFOGO on withdraw
                </label>
                <button
                  disabled={busy || !unlockReady}
                  onClick={() =>
                    run(() => poolWithdraw(connection, w!, claimOnWithdraw), "Withdraw", false)
                  }
                  className="w-full rounded-full py-3 font-semibold text-sm border border-white/[0.12] text-white/80 hover:border-[var(--color-brand-500)]/50 hover:text-[var(--color-brand-300)] transition disabled:opacity-40"
                >
                  {unlockReady
                    ? "Withdraw unlocked agFOGO"
                    : unlocking9 > 0n
                    ? `Withdraw (ready in ${fmtDuration(secsLeft)})`
                    : "No unlocked balance"}
                </button>
              </div>
            )}

            {/* Claim rewards */}
            {wallet.connected && (
              <button
                onClick={() => run(() => poolClaimBase(connection, w!), "Claim", false)}
                disabled={busy || pending9 <= 0n}
                className="mt-3 w-full h-9 text-[10px] uppercase tracking-widest text-white/45 hover:text-[var(--color-brand-400)] transition disabled:opacity-40"
              >
                · claim {fmtToken9(pending9, 4)} gFOGO reward ·
              </button>
            )}

            {/* Status */}
            {status.kind !== "idle" && (
              <div
                className={
                  "mt-4 px-3 py-2 text-[11px] tabular border rounded-xl " +
                  (status.kind === "ok"
                    ? "border-[var(--color-brand-500)]/60 text-[var(--color-brand-300)] bg-[var(--color-brand-500)]/10"
                    : status.kind === "cancelled"
                    ? "border-white/20 text-white/70 bg-white/[0.05]"
                    : "border-[var(--color-danger)]/60 text-[var(--color-danger)] bg-[var(--color-danger)]/10")
                }
              >
                <div className="uppercase tracking-widest text-[9px] mb-1">
                  {status.kind === "ok" ? "OK" : status.kind === "cancelled" ? "CANCELLED" : "ERR"}
                </div>
                <div className="break-words">{status.msg}</div>
                {status.sig && (
                  <div className="text-[10px] text-white/45 mt-1 break-all">sig: {status.sig}</div>
                )}
              </div>
            )}

            <p className="mt-4 text-center text-[10px] text-white/30 flex items-center justify-center gap-1.5">
              <BaseTokenIcon size={12} /> Testnet only · Tokens hold no real value
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "brand";
}) {
  return (
    <div className="relative rounded-2xl glass p-4">
      <div className="absolute inset-0 noise opacity-20 pointer-events-none rounded-2xl" />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-widest text-white/45">{label}</div>
        <div
          className={
            "tabular text-xl font-semibold mt-1 " +
            (tone === "brand" ? "text-[var(--color-brand-300)]" : "text-white")
          }
        >
          {value}
        </div>
        <div className="text-[11px] text-white/45 mt-0.5">{sub}</div>
      </div>
    </div>
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
  tone?: "ok";
  mono?: boolean;
}) {
  const cls = tone === "ok" ? "text-[var(--color-brand-300)]" : "text-white/90";
  return (
    <div className="flex justify-between text-sm">
      <span className="text-white/55">{label}</span>
      <span className={`font-semibold ${cls} ${mono ? "tabular" : ""}`}>{value}</span>
    </div>
  );
}
