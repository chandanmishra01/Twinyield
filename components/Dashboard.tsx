"use client";

import Link from "next/link";
import { useProtocolState } from "@/lib/hooks";
import { fmt18, fmtPct, fmtUsd, fmtToken9 } from "@/lib/format";
import { PRECISION } from "@/lib/deployment";
import { BaseTokenIcon, TokenMark } from "./Landing";

export function Dashboard() {
  const { data, error, isLoading } = useProtocolState();

  if (error) return <ErrorState message={error.message} />;
  if (isLoading || !data) return <LoadingState />;

  const peggedOk = data.aNav === PRECISION;
  const ytAlive = data.xNav > 0n;
  const crNum = Number((data.cr * 10000n) / PRECISION) / 10000;
  const crLabel = ytAlive ? "HEALTHY" : "UNDER-COLLATERAL";
  const crTone =
    crNum >= 1.3 ? "pt" : crNum >= 1.2 ? "warn" : "danger";

  return (
    <section className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-16 max-w-7xl mx-auto">
      <Headline />

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-8 sm:mt-10">
        <StatCard
          label="gFOGO Spot Price"
          value={`$${fmt18(data.price18, 2)}`}
          sub="Oracle · live mark"
          icon={<BaseTokenIcon size={28} />}
        />
        <StatCard
          label="Collateral Ratio"
          value={fmtPct(data.cr, 2)}
          sub={
            <span
              className={
                "uppercase tracking-widest " +
                (ytAlive ? "text-[var(--color-brand-300)]" : "text-[var(--color-danger)]")
              }
            >
              {crLabel}
            </span>
          }
          tone={crTone as "pt" | "warn" | "danger"}
        />
        <StatCard
          label="System Leverage"
          value={
            <>
              {fmt18(data.leverage, 2)}
              <span className="text-white/40">×</span>
            </>
          }
          sub="PT amplification factor"
        />
        <StatCard
          label="Yield Rate (APY)"
          value={
            <>
              5.00<span className="text-white/40">%</span>
            </>
          }
          sub={`Rate provider · ${fmt18(data.rate18, 6)}×`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
        <TrancheCard
          name="agFOGO"
          ticker="YT · Yield"
          tone="yt"
          nav={data.aNav}
          navOk={peggedOk}
          supply9={data.aSupply9}
          blurb="Pegged at $1 while CR > liquidation threshold. Price-protected, and earns the pool's staking yield."
        />
        <TrancheCard
          name="xgFOGO"
          ticker="PT · Price"
          tone="pt"
          nav={data.xNav}
          navOk={ytAlive}
          supply9={data.xSupply9}
          blurb={`Captures 100% of price moves at ${fmt18(data.leverage, 2)}× leverage. No yield.`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 mt-3 sm:mt-4">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/55 inline-flex items-center gap-2">
              <span className="w-1 h-3 bg-[var(--color-brand-500)] rounded-full" />
              Treasury · Collateral base
            </div>
            <Link
              href="/mint"
              className="text-[10px] uppercase tracking-widest text-[var(--color-brand-300)] hover:text-[var(--color-brand-400)] transition"
            >
              Mint / Redeem →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
            <KV k="Total Base (accounted)" v={`${fmtToken9(data.totalBase9, 4)} gFOGO`} />
            <KV k="Treasury ATA Balance" v={`${fmtToken9(data.treasuryAta9, 4)} gFOGO`} />
            <KV k="USD Value of Collateral" v={`$${fmtUsd((data.totalBase9 * 10n ** 9n * data.price18) / PRECISION, 2)}`} />
            <KV k="Buffer (Base × Price − YT $)" v={`$${formatBuffer(data)}`} />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-1 h-3 bg-[var(--color-brand-500)] rounded-full" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">
              Stress Thresholds
            </span>
          </div>
          <ThresholdBar label="Stability"   ratio={1.3}  currentCR={crNum} tone="bg-[var(--color-brand-400)]" />
          <ThresholdBar label="Liquidation" ratio={1.2}  currentCR={crNum} tone="bg-[var(--color-warn)]" />
          <ThresholdBar label="Self-Liq"    ratio={1.14} currentCR={crNum} tone="bg-[var(--color-danger)]" />
          <ThresholdBar label="Recap"       ratio={1.04} currentCR={crNum} tone="bg-[var(--color-magenta)]" />
        </GlassCard>
      </div>
    </section>
  );
}

function Headline() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full glass text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-300)] tabular">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulseGlow" />
          Live · FOGO Testnet
        </span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 tabular">
          Block · streaming every 8s
        </span>
      </div>
      <h1 className="font-display text-[32px] sm:text-[44px] md:text-[56px] leading-[1.05] font-semibold text-white">
        Price / Yield
        <br />
        <span className="text-gradient-split">split staking.</span>
      </h1>
      <p className="text-white/65 max-w-xl text-sm sm:text-[15px] leading-relaxed">
        Stake gFOGO and split it into <span className="text-[var(--color-yt-300)]">agFOGO</span>, the
        $1-pegged yield token that earns the staking yield, and{" "}
        <span className="text-[var(--color-brand-300)]">xgFOGO</span>, the price token with leveraged exposure
        to FOGO&apos;s price.
      </p>
    </div>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl glass p-5 sm:p-6 ${className}`}>
      <div className="absolute inset-0 noise opacity-25 pointer-events-none rounded-2xl" />
      <div className="relative">{children}</div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "pt" | "yt" | "warn" | "danger";
}) {
  const stripe = {
    default: "bg-[var(--color-brand-500)]",
    pt: "bg-[var(--color-brand-400)]",
    yt: "bg-[var(--color-yt-400)]",
    warn: "bg-[var(--color-warn)]",
    danger: "bg-[var(--color-danger)]",
  }[tone];
  return (
    <div className="relative rounded-2xl glass p-4 sm:p-5">
      <div className="absolute inset-0 noise opacity-25 pointer-events-none rounded-2xl" />
      <div className="relative flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1 h-3 rounded-full ${stripe}`} />
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/55 truncate">{label}</span>
        </div>
        {icon && <div className="shrink-0">{icon}</div>}
      </div>
      <div className="relative tabular text-[22px] sm:text-[26px] font-medium text-white leading-none">
        {value}
      </div>
      {sub && <div className="relative mt-2 text-[11px] tabular text-white/55">{sub}</div>}
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45 mb-1">{k}</div>
      <div className="tabular text-[17px] sm:text-[18px] text-white/95 break-all">{v}</div>
    </div>
  );
}

function TrancheCard({
  name,
  ticker,
  tone,
  nav,
  navOk,
  supply9,
  blurb,
}: {
  name: string;
  ticker: string;
  tone: "pt" | "yt";
  nav: bigint;
  navOk: boolean;
  supply9: bigint;
  blurb: string;
}) {
  const isPT = tone === "pt";
  return (
    <div
      className={
        "relative rounded-2xl p-5 sm:p-6 overflow-hidden " +
        (isPT ? "glass-pt" : "glass-yt")
      }
    >
      <div className="absolute inset-0 noise opacity-25 pointer-events-none" />
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl grid place-items-center bg-[#05070d]/40">
            <TokenMark kind={isPT ? "PT" : "YT"} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg text-white truncate">{name}</div>
            <div
              className={
                "text-[11px] font-mono " +
                (isPT ? "text-[var(--color-brand-300)]" : "text-[var(--color-yt-300)]")
              }
            >
              {ticker}
            </div>
          </div>
        </div>
        <div
          className={
            "text-[10px] tabular uppercase tracking-widest px-2 py-0.5 rounded-full border " +
            (navOk
              ? isPT
                ? "border-[var(--color-brand-500)]/50 text-[var(--color-brand-300)]"
                : "border-[var(--color-yt-500)]/50 text-[var(--color-yt-300)]"
              : "border-[var(--color-danger)]/60 text-[var(--color-danger)]")
          }
        >
          {navOk ? "OK" : "WIPED"}
        </div>
      </div>

      <div className="relative flex items-baseline gap-3">
        <div className="tabular text-[36px] sm:text-[40px] font-medium leading-none text-white">
          ${fmt18(nav, 4)}
        </div>
        <div className="text-[10px] uppercase tracking-widest text-white/45">NAV / token</div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-4">
        <KV k="Supply" v={fmtToken9(supply9, 4)} />
        <KV k="Total $ Value" v={`$${fmtUsd((supply9 * 10n ** 9n * nav) / PRECISION, 2)}`} />
      </div>

      <p className="relative mt-4 text-[12px] text-white/55 leading-relaxed">{blurb}</p>
    </div>
  );
}

function ThresholdBar({
  label,
  ratio,
  currentCR,
  tone,
}: {
  label: string;
  ratio: number;
  currentCR: number;
  tone: string;
}) {
  const breached = currentCR < ratio;
  const headroom = ((currentCR - ratio) * 100).toFixed(2);
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest mb-1">
        <span className="text-white/55">{label}</span>
        <span className={`tabular ${breached ? "text-[var(--color-danger)]" : "text-white/85"}`}>
          {(ratio * 100).toFixed(0)}% · {breached ? "BREACHED" : `+${headroom}pp`}
        </span>
      </div>
      <div className="h-1 bg-white/10 relative rounded-full overflow-hidden">
        <div
          className={`${tone} h-1 transition-all`}
          style={{
            width: `${Math.max(2, Math.min(100, (ratio / Math.max(currentCR, ratio)) * 100))}%`,
          }}
        />
      </div>
    </div>
  );
}

function formatBuffer(data: { totalBase9: bigint; price18: bigint; aSupply9: bigint }) {
  const baseUsd = (data.totalBase9 * 10n ** 9n * data.price18) / PRECISION;
  const aUsd = data.aSupply9 * 10n ** 9n;
  const buf = baseUsd > aUsd ? baseUsd - aUsd : -(aUsd - baseUsd);
  if (buf < 0n) return `-${fmtUsd(-buf, 2)}`;
  return fmtUsd(buf, 2);
}

function LoadingState() {
  return (
    <section className="px-4 sm:px-6 pt-10 pb-24 max-w-7xl mx-auto">
      <div className="animate-pulse flex flex-col gap-3">
        <div className="h-12 w-1/2 rounded-xl bg-white/5 border border-white/[0.06]" />
        <div className="h-4 w-1/3 rounded bg-white/5 border border-white/[0.06]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 border border-white/[0.06]" />
          ))}
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="px-4 sm:px-6 pt-10 pb-24 max-w-7xl mx-auto">
      <div className="rounded-2xl glass p-8 border-[var(--color-danger)]/60">
        <div className="text-[10px] uppercase tracking-widest text-[var(--color-danger)] mb-2">RPC ERROR</div>
        <div className="tabular text-sm text-white/90 break-all">{message}</div>
        <div className="text-[12px] text-white/55 mt-4">
          Could not reach FOGO testnet RPC. Check NEXT_PUBLIC_FOGO_RPC and that the deployment is alive.
        </div>
      </div>
    </section>
  );
}
