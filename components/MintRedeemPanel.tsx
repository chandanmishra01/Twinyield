"use client";

import { useEffect, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useProtocolState, useWalletBalances } from "@/lib/hooks";
import { fmtToken9 } from "@/lib/format";
import { mintAToken, mintXToken, redeem, mockMintGfogo } from "@/lib/anchor";
import { classifyTxError } from "@/lib/txError";
import { BaseTokenIcon, TokenMark } from "./Landing";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

type Tab = "mint" | "redeem";
type Side = "agFOGO" | "xgFOGO";
type MintMode = "both" | "agFOGO" | "xgFOGO";

type TxStatus = { kind: "idle" | "ok" | "err" | "cancelled"; msg?: string; sig?: string };

// Map a thrown tx error to a status banner, showing a neutral "cancelled"
// notice when the user declines signing instead of a scary red error.
function describeTxError(e: unknown): TxStatus {
  const { cancelled, message } = classifyTxError(e);
  return { kind: cancelled ? "cancelled" : "err", msg: message };
}

export function MintRedeemPanel() {
  const [tab, setTab] = useState<Tab>("mint");
  const [side, setSide] = useState<Side>("agFOGO");
  const [mintMode, setMintMode] = useState<MintMode>("both");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [queueYtAmount, setQueueYtAmount] = useState<number | null>(null);
  const [status, setStatus] = useState<TxStatus>({ kind: "idle" });
  const lastHandledSig = useRef<string | undefined>(undefined);

  const { connection } = useConnection();
  const wallet = useWallet();
  const { data: state, mutate: mutateState } = useProtocolState();
  const { data: balances, mutate: mutateBal } = useWalletBalances();

  const amountNum = parseFloat(amount) || 0;

  const inputBalance =
    tab === "mint"
      ? balances?.base9 ?? 0n
      : side === "agFOGO"
      ? balances?.a9 ?? 0n
      : balances?.x9 ?? 0n;

  const inputSymbol = tab === "mint" ? "gFOGO" : side;
  const balanceN = Number(inputBalance) / 1e9;

  const onMax = () => setAmount(balanceN.toString());
  const onSlider = (pct: number) => {
    if (balanceN > 0) setAmount(((balanceN * pct) / 100).toFixed(6));
  };

  const sliderPct = balanceN > 0 ? Math.min(100, (amountNum / balanceN) * 100) : 0;

  const priceN = state ? Number(state.price18) / 1e18 : 0;
  const aNavN = state ? Number(state.aNav) / 1e18 : 1;
  const xNavN = state ? Number(state.xNav) / 1e18 : 1;

  const inputUsd =
    tab === "mint"
      ? amountNum * priceN
      : amountNum * (side === "agFOGO" ? aNavN : xNavN);

  const outAFull = aNavN > 0 ? inputUsd / aNavN : 0;
  const outXFull = xNavN > 0 ? inputUsd / xNavN : 0;
  const redeemOut = priceN > 0 ? inputUsd / priceN : 0;

  const reset = () => {
    setAmount("");
    setStatus({ kind: "idle" });
  };

  const runTx = async (fn: () => Promise<string>): Promise<string | null> => {
    try {
      const sig = await fn();
      setStatus({ kind: "ok", sig, msg: "Confirmed" });
      mutateState();
      mutateBal();
      return sig;
    } catch (e) {
      setStatus(describeTxError(e));
      return null;
    }
  };

  const onSubmit = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus({ kind: "err", msg: "Connect wallet first" });
      return;
    }
    if (amountNum <= 0) return;
    setBusy(true);
    setStatus({ kind: "idle" });
    lastHandledSig.current = undefined;

    const w = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction.bind(wallet) as never,
      signAllTransactions: wallet.signAllTransactions!.bind(wallet) as never,
    };

    try {
      if (tab === "mint") {
        if (mintMode === "agFOGO") {
          await runTx(() => mintAToken(connection, w, amountNum));
        } else if (mintMode === "xgFOGO") {
          await runTx(() => mintXToken(connection, w, amountNum));
        } else {
          // Both: split deposit 50/50 across two sequential txs
          const half = amountNum / 2;
          const otherHalf = amountNum - half;
          const sig1 = await runTx(() => mintAToken(connection, w, half));
          if (sig1) {
            setQueueYtAmount(otherHalf);
          }
        }
      } else {
        if (side === "agFOGO") await runTx(() => redeem(connection, w, amountNum, 0));
        else await runTx(() => redeem(connection, w, 0, amountNum));
      }
      if (mintMode !== "both" || tab !== "mint") setAmount("");
    } finally {
      if (!(tab === "mint" && mintMode === "both")) setBusy(false);
    }
  };

  // Second leg of "mint both": run mintX after mintA confirms.
  useEffect(() => {
    if (queueYtAmount === null) return;
    if (!wallet.publicKey || !wallet.signTransaction) {
      setQueueYtAmount(null);
      setBusy(false);
      return;
    }
    const amt = queueYtAmount;
    setQueueYtAmount(null);
    const w = {
      publicKey: wallet.publicKey,
      signTransaction: wallet.signTransaction.bind(wallet) as never,
      signAllTransactions: wallet.signAllTransactions!.bind(wallet) as never,
    };
    (async () => {
      try {
        await runTx(() => mintXToken(connection, w, amt));
        setAmount("");
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueYtAmount]);

  const onFaucet = async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus({ kind: "err", msg: "Connect wallet first" });
      return;
    }
    setBusy(true);
    try {
      const w = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet) as never,
        signAllTransactions: wallet.signAllTransactions!.bind(wallet) as never,
      };
      const sig = await mockMintGfogo(connection, w, 10);
      setStatus({ kind: "ok", sig, msg: "Got 10 gFOGO (admin only)" });
      mutateBal();
    } catch (e) {
      setStatus(describeTxError(e));
    } finally {
      setBusy(false);
    }
  };

  const primaryLabel = () => {
    if (busy) return queueYtAmount !== null ? "Minting both…" : "Processing…";
    if (amountNum <= 0) return "Enter an amount";
    if (tab === "mint") {
      if (mintMode === "both") return "Mint with gFOGO";
      if (mintMode === "agFOGO") return "Mint agFOGO";
      return "Mint xgFOGO";
    }
    return `Redeem ${side} → gFOGO`;
  };

  const assetPrice =
    tab === "mint" ? priceN : side === "agFOGO" ? aNavN : xNavN;

  return (
    <section className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-16">
      <div className="max-w-md mx-auto">
        <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#0a0d16]/70 border border-white/[0.08] backdrop-blur-xl shadow-[0_30px_60px_-20px_rgba(255,107,51,0.25),0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <div className="absolute inset-0 noise opacity-20 pointer-events-none" />

          <div className="relative p-4 sm:p-6">
            {/* Tabs */}
            <div className="flex bg-white/[0.06] border border-white/[0.08] rounded-full p-1 mb-6">
              {(["mint", "redeem"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); reset(); setMintMode("both"); }}
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

            {/* Redeem side selector: themed pills replacing the native <select> */}
            {tab === "redeem" && (
              <div className="grid grid-cols-2 gap-2 mb-4">
                {(["agFOGO", "xgFOGO"] as Side[]).map((s) => {
                  const isPT = s === "xgFOGO";
                  const active = side === s;
                  return (
                    <button
                      key={s}
                      onClick={() => { setSide(s); setAmount(""); }}
                      className={
                        "py-2.5 px-3 rounded-full border font-semibold text-sm transition flex items-center justify-center gap-2 " +
                        (active
                          ? isPT
                            ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/15 text-[var(--color-brand-300)]"
                            : "border-[var(--color-yt-500)] bg-[var(--color-yt-500)]/15 text-[var(--color-yt-300)]"
                          : "border-white/[0.10] text-white/55 hover:border-white/[0.20] hover:text-white/85")
                      }
                    >
                      <TokenMark kind={isPT ? "PT" : "YT"} size={18} />
                      {s}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Asset row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/[0.08] bg-white/[0.04] grid place-items-center">
                  {tab === "mint" ? (
                    <BaseTokenIcon size={28} />
                  ) : (
                    <TokenMark kind={side === "xgFOGO" ? "PT" : "YT"} size={32} />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white/90">{inputSymbol}</div>
                  <div className="text-xs text-white/45 tabular">$ {assetPrice.toFixed(3)}</div>
                </div>
              </div>
              <button
                onClick={async () => {
                  if (refreshing) return;
                  reset(); // clear the amount/slider/status so you can set it up again
                  setRefreshing(true);
                  try {
                    await Promise.all([mutateState(), mutateBal()]);
                  } finally {
                    setRefreshing(false);
                  }
                }}
                disabled={refreshing}
                title="Refresh"
                className="w-9 h-9 rounded-full border border-white/[0.08] bg-white/[0.05] text-white/55 hover:text-white hover:bg-white/[0.08] transition grid place-items-center disabled:opacity-60"
              >
                <span className={refreshing ? "inline-block animate-spin" : "inline-block"}>↻</span>
              </button>
            </div>

            {/* Amount input */}
            <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl px-5 py-3 mb-4 flex items-center gap-3">
              <input
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                className="bg-transparent flex-1 min-w-0 text-lg text-white/90 outline-none placeholder:text-white/25 tabular"
              />
              <button
                onClick={onMax}
                className="text-xs text-white/45 hover:text-[var(--color-brand-400)] whitespace-nowrap transition tabular"
              >
                Max: {fmtToken9(inputBalance, 2)}
              </button>
            </div>

            {/* Slider */}
            <div className="mb-5 px-1">
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={sliderPct}
                onChange={(e) => onSlider(parseFloat(e.target.value))}
                disabled={balanceN <= 0}
                className="brand-slider"
                style={{ ["--val" as never]: `${sliderPct}%` }}
              />
              <div className="relative text-[10px] text-white/30 mt-2 h-4 tabular">
                {[20, 50, 80].map((p) => (
                  <span key={p} className="absolute" style={{ left: `${p}%`, transform: "translateX(-50%)" }}>
                    {p}%
                  </span>
                ))}
              </div>
            </div>

            {/* MINT body */}
            {tab === "mint" && (
              <>
                <div className="text-center text-sm font-semibold text-[var(--color-brand-400)] mb-3">
                  You will Receive:
                </div>

                {mintMode === "both" ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-2">
                    <ReceiveRow label="agFOGO" amount={outAFull / 2} nav={aNavN} tone="yt" />
                    <ReceiveRow label="xgFOGO" amount={outXFull / 2} nav={xNavN} tone="pt" />
                  </div>
                ) : mintMode === "agFOGO" ? (
                  <div className="mb-2 flex justify-center">
                    <ReceiveRow label="agFOGO" amount={outAFull} nav={aNavN} tone="yt" />
                  </div>
                ) : (
                  <div className="mb-2 flex justify-center">
                    <ReceiveRow label="xgFOGO" amount={outXFull} nav={xNavN} tone="pt" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-5 mb-4">
                  {mintMode === "both" ? (
                    <>
                      <ModeBtn label="Mint xgFOGO only" active={false} onClick={() => setMintMode("xgFOGO")} />
                      <ModeBtn label="Mint agFOGO only" active={false} onClick={() => setMintMode("agFOGO")} />
                    </>
                  ) : mintMode === "xgFOGO" ? (
                    <>
                      <ModeBtn label="Mint xgFOGO only" active onClick={() => setMintMode("xgFOGO")} />
                      <ModeBtn label="Mint both" active={false} onClick={() => setMintMode("both")} />
                    </>
                  ) : (
                    <>
                      <ModeBtn label="Mint agFOGO only" active onClick={() => setMintMode("agFOGO")} />
                      <ModeBtn label="Mint both" active={false} onClick={() => setMintMode("both")} />
                    </>
                  )}
                </div>
              </>
            )}

            {/* REDEEM body */}
            {tab === "redeem" && (
              <>
                <div className="text-center text-sm font-semibold text-[var(--color-brand-400)] mb-3">
                  You will Receive:
                </div>
                <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 text-center mb-4">
                  <div className="flex items-center justify-center gap-2">
                    <BaseTokenIcon size={18} />
                    <div className="text-[11px] uppercase tracking-widest text-white/55">gFOGO</div>
                  </div>
                  <div className="text-2xl font-semibold text-white/95 mt-1 tabular">
                    {redeemOut.toFixed(4)}
                  </div>
                  <div className="text-[11px] text-white/45 mt-0.5">≈ ${inputUsd.toFixed(2)}</div>
                </div>
              </>
            )}

            {/* Action */}
            {!wallet.connected ? (
              <div className="flex justify-center">
                <WalletMultiButton />
              </div>
            ) : amountNum <= 0 ? (
              <button
                disabled
                className="w-full rounded-full py-3 font-semibold text-sm bg-white/[0.06] text-white/30 cursor-not-allowed"
              >
                Enter an amount
              </button>
            ) : (
              <button
                disabled={busy}
                onClick={onSubmit}
                className="w-full btn-hemi py-3 text-sm"
              >
                {primaryLabel()}
              </button>
            )}

            {/* Faucet shortcut */}
            {wallet.connected && (
              <button
                onClick={onFaucet}
                disabled={busy}
                className="mt-3 w-full h-9 text-[10px] uppercase tracking-widest text-white/45 hover:text-[var(--color-brand-400)] transition disabled:opacity-40"
              >
                · faucet: +10 gFOGO (admin only) ·
              </button>
            )}

            {/* Status banner */}
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
          </div>
        </div>
      </div>
    </section>
  );
}

function ReceiveRow({
  label,
  amount,
  nav,
  tone,
}: {
  label: string;
  amount: number;
  nav: number;
  tone: "pt" | "yt";
}) {
  const isPT = tone === "pt";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className={
          "w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-full overflow-hidden grid place-items-center border " +
          (isPT
            ? "bg-[var(--color-brand-500)]/20 border-[var(--color-brand-500)]/30"
            : "bg-[var(--color-yt-500)]/20 border-[var(--color-yt-500)]/30")
        }
      >
        <TokenMark kind={isPT ? "PT" : "YT"} size={28} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={
            "text-[13px] sm:text-sm font-semibold truncate tabular " +
            (isPT ? "text-[var(--color-brand-300)]" : "text-[var(--color-yt-300)]")
          }
        >
          {amount.toFixed(2)} {label}
        </div>
        <div className="text-[11px] sm:text-xs text-white/45 truncate tabular">
          ${nav.toFixed(2)}
        </div>
      </div>
    </div>
  );
}

function ModeBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "py-2.5 px-2 rounded-full border font-semibold text-[11px] sm:text-sm transition whitespace-nowrap " +
        (active
          ? "border-[var(--color-brand-500)] bg-[var(--color-brand-500)]/15 text-[var(--color-brand-300)]"
          : "border-white/[0.10] text-white/55 hover:border-white/[0.25] hover:text-white/85")
      }
    >
      {label}
    </button>
  );
}

