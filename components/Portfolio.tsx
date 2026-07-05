"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { useProtocolState, useWalletBalances, useYtPosition } from "@/lib/hooks";
import { PRECISION, TOKEN_SCALE } from "@/lib/deployment";
import { fmt18, fmtToken9, fmtUsd, truncAddress } from "@/lib/format";
import { claimYield, WalletLike } from "@/lib/anchor";
import { classifyTxError } from "@/lib/txError";
import { BaseTokenIcon, TokenMark } from "./Landing";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

export function Portfolio() {
  const wallet = useWallet();
  const { publicKey, connected } = wallet;
  const { connection } = useConnection();
  const { data: state } = useProtocolState();
  const { data: bal } = useWalletBalances();
  const { data: yt, mutate: mutateYt } = useYtPosition(bal?.a9, state?.ytRewardIndex);
  const [claiming, setClaiming] = useState(false);
  const [claimErr, setClaimErr] = useState<string | null>(null);

  async function handleClaim() {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) return;
    setClaiming(true);
    setClaimErr(null);
    try {
      const w: WalletLike = {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet) as never,
        signAllTransactions: wallet.signAllTransactions.bind(wallet) as never,
      };
      await claimYield(connection, w);
      await mutateYt();
    } catch (e) {
      const { cancelled, message } = classifyTxError(e);
      setClaimErr(cancelled ? null : message);
    } finally {
      setClaiming(false);
    }
  }

  if (!connected) {
    return (
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-24 pb-24 max-w-3xl mx-auto text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-300)] mb-4">
          Wallet required
        </div>
        <h1 className="font-display text-[32px] sm:text-[40px] text-white tracking-tight mb-3">
          Connect to view holdings
        </h1>
        <p className="text-white/55 text-sm max-w-md mx-auto mb-8">
          Connect a Solana wallet to see your gFOGO, agFOGO, and xgFOGO balances along with live position value.
        </p>
        <div className="flex justify-center">
          <WalletMultiButton />
        </div>
      </section>
    );
  }

  const aValueUsd = state && bal ? (bal.a9 * TOKEN_SCALE * state.aNav) / PRECISION : 0n;
  const xValueUsd = state && bal ? (bal.x9 * TOKEN_SCALE * state.xNav) / PRECISION : 0n;
  const baseValueUsd = state && bal ? (bal.base9 * TOKEN_SCALE * state.price18) / PRECISION : 0n;
  const totalUsd = aValueUsd + xValueUsd + baseValueUsd;

  return (
    <section className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-16 max-w-6xl mx-auto">
      <div className="mb-6 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-300)]">
          Your position
        </div>
        <h1 className="font-display text-3xl sm:text-[40px] text-white tracking-tight">Portfolio</h1>
        <div className="text-[11px] tabular text-white/45">
          wallet · {publicKey ? truncAddress(publicKey.toBase58(), 6, 6) : "·"}
        </div>
      </div>

      <div className="relative rounded-2xl glass-strong p-6 overflow-hidden mb-4 sm:mb-5">
        <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl bg-[var(--color-brand-500)]/25" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full blur-3xl bg-[var(--color-yt-500)]/20" />
        <div className="relative flex items-end justify-between mb-2 gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-white/55 mb-1">
              Total Net Value
            </div>
            <div className="tabular text-[40px] sm:text-[48px] font-medium leading-none text-white drop-shadow-[0_0_18px_rgba(255,107,51,0.35)]">
              ${fmtUsd(totalUsd, 2)}
            </div>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-white/45 tabular shrink-0">
            · 3 ASSETS
          </div>
        </div>
        <div className="relative h-1.5 mt-6 bg-white/10 rounded-full overflow-hidden flex">
          <Slice value={baseValueUsd} total={totalUsd} color="#FFB454" />
          <Slice value={aValueUsd} total={totalUsd} color="#ff6b33" />
          <Slice value={xValueUsd} total={totalUsd} color="#33d2ff" />
        </div>
        <div className="relative flex flex-wrap gap-4 mt-3 text-[10px] uppercase tracking-widest tabular">
          <Legend color="#FFB454" label="gFOGO"  pct={pct(baseValueUsd, totalUsd)} />
          <Legend color="#ff6b33" label="agFOGO" pct={pct(aValueUsd, totalUsd)} />
          <Legend color="#33d2ff" label="xgFOGO" pct={pct(xValueUsd, totalUsd)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <HoldingCard
          variant="base"
          label="gFOGO"
          sub="Base · staked collateral"
          balance={bal?.base9 ?? 0n}
          nav={state?.price18 ?? PRECISION}
          value={baseValueUsd}
        />
        <HoldingCard
          variant="pt"
          label="agFOGO"
          sub="YT · Yield"
          balance={bal?.a9 ?? 0n}
          nav={state?.aNav ?? PRECISION}
          value={aValueUsd}
          note="Pegged at $1, price-protected. Earns the pool's staking yield — claim it below."
          claimable9={yt?.claimable9 ?? 0n}
          onClaim={handleClaim}
          claiming={claiming}
          claimErr={claimErr}
        />
        <HoldingCard
          variant="yt"
          label="xgFOGO"
          sub="PT · Price"
          balance={bal?.x9 ?? 0n}
          nav={state?.xNav ?? PRECISION}
          value={xValueUsd}
          note={state ? `Leveraged ${fmt18(state.leverage, 2)}× exposure to gFOGO's price. No yield.` : ""}
        />
      </div>
    </section>
  );
}

function HoldingCard({
  variant,
  label,
  sub,
  balance,
  nav,
  value,
  note,
  claimable9,
  onClaim,
  claiming,
  claimErr,
}: {
  variant: "base" | "pt" | "yt";
  label: string;
  sub: string;
  balance: bigint;
  nav: bigint;
  value: bigint;
  note?: string;
  claimable9?: bigint;
  onClaim?: () => void;
  claiming?: boolean;
  claimErr?: string | null;
}) {
  const surface =
    variant === "pt" ? "glass-pt" : variant === "yt" ? "glass-yt" : "glass";
  const accent =
    variant === "pt" ? "text-[var(--color-brand-300)]" : variant === "yt" ? "text-[var(--color-yt-300)]" : "text-[#FFB454]";
  const hasClaim = onClaim !== undefined;
  const claimAmt = claimable9 ?? 0n;
  const canClaim = hasClaim && claimAmt > 0n && !claiming;
  return (
    <div className={`relative rounded-2xl p-5 overflow-hidden ${surface}`}>
      <div className="absolute inset-0 noise opacity-20 pointer-events-none" />
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl grid place-items-center bg-[#05070d]/40 border border-white/[0.06]">
            {variant === "base" ? <BaseTokenIcon size={24} /> : <TokenMark kind={variant === "pt" ? "PT" : "YT"} />}
          </div>
          <div className="min-w-0">
            <div className={`text-[11px] uppercase tracking-[0.18em] ${accent}`}>{label}</div>
            <div className="text-[10px] uppercase tracking-widest text-white/45 mt-0.5 truncate">{sub}</div>
          </div>
        </div>
      </div>
      <div className="relative tabular text-[26px] sm:text-[28px] font-medium leading-none text-white">
        {fmtToken9(balance, 4)}
      </div>
      <div className="relative text-[11px] tabular text-white/50 mt-2">
        @ ${fmt18(nav, 4)} · ${fmtUsd(value, 2)}
      </div>
      {note && (
        <div className="relative text-[10px] text-white/45 mt-3 leading-snug border-t border-white/[0.06] pt-3">
          {note}
        </div>
      )}
      {hasClaim && (
        <div className="relative mt-3 border-t border-white/[0.06] pt-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-widest text-white/40">Claimable yield</div>
              <div className="tabular text-[15px] text-white leading-tight">
                {fmtToken9(claimAmt, 4)} <span className="text-white/45 text-[11px]">gFOGO</span>
              </div>
            </div>
            <button
              onClick={onClaim}
              disabled={!canClaim}
              className={`shrink-0 text-[11px] uppercase tracking-widest px-3.5 py-2 rounded-lg border transition ${
                canClaim
                  ? "border-[var(--color-brand-300)]/40 text-[var(--color-brand-300)] hover:bg-[var(--color-brand-500)]/15"
                  : "border-white/[0.08] text-white/30 cursor-not-allowed"
              }`}
            >
              {claiming ? "Claiming…" : "Claim"}
            </button>
          </div>
          {claimErr && (
            <div className="text-[10px] text-red-300/80 mt-2 leading-snug">{claimErr}</div>
          )}
        </div>
      )}
    </div>
  );
}

function Slice({
  value,
  total,
  color,
}: {
  value: bigint;
  total: bigint;
  color: string;
}) {
  if (total === 0n) return null;
  const w = Number((value * 10000n) / total) / 100;
  return <div style={{ width: `${w}%`, backgroundColor: color }} className="h-1.5" />;
}

function Legend({ color, label, pct }: { color: string; label: string; pct: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: color }} />
      <span className="text-white/55">{label}</span>
      <span className="text-white/85">{pct}</span>
    </div>
  );
}

function pct(value: bigint, total: bigint): string {
  if (total === 0n) return "0.00%";
  const v = Number((value * 10000n) / total) / 100;
  return `${v.toFixed(2)}%`;
}
