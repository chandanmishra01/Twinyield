"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "./TopNav";

export function Landing() {
  return (
    <div className="landing-bg min-h-screen overflow-x-hidden">
      <TestnetBanner />
      <LandingNav />
      <Hero />
      <Pillars />
      <TwoTokens />
      <HowItWorks />
      <Mechanics />
      <JourneyExample />
      <KeyBenefits />
      <CTA />
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Top bar                                                            */
/* ------------------------------------------------------------------ */

function TestnetBanner() {
  return (
    <div className="testnet-strip relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] sm:text-[11px] tracking-[0.18em] sm:tracking-[0.22em] uppercase text-[var(--color-brand-200)]">
        <span className="inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulseGlow" />
          FOGO Testnet
        </span>
        <span className="text-white/40 hidden sm:inline">·</span>
        <span className="text-white/60 normal-case tracking-normal text-center">
          Testnet build. Tokens hold no real value.
        </span>
      </div>
    </div>
  );
}

function LandingNav() {
  return (
    <header className="relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3">
        <a href="#top" className="flex items-center gap-2 sm:gap-2.5 font-display text-base sm:text-lg min-w-0">
          <LogoMark size={32} />
          <span className="tracking-wide text-white/95 truncate">
            Twin<span className="text-[var(--color-brand-500)]">yield</span>
          </span>
        </a>
        <Link href="/mint" className="btn-hemi text-xs sm:text-sm shrink-0 px-3! sm:px-5!">
          <span>Launch</span>
          <span className="hidden sm:inline">App</span>
          <ArrowIcon />
        </Link>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section id="top" className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:pt-12 pb-16 md:pb-24 grid md:grid-cols-12 gap-8 md:gap-10 items-center">
        <div className="md:col-span-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] sm:text-xs uppercase tracking-[0.2em] text-[var(--color-brand-300)] mb-5 sm:mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand-500)] animate-pulseGlow" />
            PT / YT split · Built on FOGO
          </div>
          <h1 className="font-display text-[32px] sm:text-[44px] md:text-[56px] lg:text-[68px] leading-[1.05] md:leading-[1.02] font-semibold text-white">
            Split your
            <br />
            <span className="text-gradient-split">stake. Shape</span>
            <br />
            your outcome.
          </h1>
          <p className="mt-5 sm:mt-6 text-white/70 text-base sm:text-lg max-w-xl">
            TwinYield splits staked <span className="text-[var(--color-brand-400)] font-medium">gFOGO</span> into two tradeable tokens:{" "}
            <span className="text-[var(--color-brand-400)] font-medium">agFOGO</span>, the yield token (YT) that earns the staking yield at a stable NAV, and{" "}
            <span className="text-[var(--color-yt-400)] font-medium">xgFOGO</span>, the price token (PT) with leveraged exposure to FOGO&apos;s price.
          </p>
          <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3">
            <Link href="/mint" className="btn-hemi text-sm sm:text-base">
              <span>Launch App</span>
              <ArrowIcon />
            </Link>
            <a href="#how" className="btn-ghost text-sm sm:text-base">
              <PlayIcon />
              See the split
            </a>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/50">
            <div className="flex items-center gap-2">
              <BaseTokenIcon size={16} />
              <span>Backed by gFOGO</span>
            </div>
            <div className="w-px h-4 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <ShieldIcon small />
              <span>Non-custodial</span>
            </div>
            <div className="w-px h-4 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <ClockIcon small />
              <span>Perpetual · no expiry</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-6 relative">
          <Splitter3D />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3D Splitter                                                        */
/* ------------------------------------------------------------------ */

function Splitter3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      setTilt({ rx: -y * 10, ry: x * 14 });
    };
    const reset = () => setTilt({ rx: 0, ry: 0 });
    el.addEventListener("mousemove", handle);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", handle);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <div ref={wrapRef} className="scene-3d relative h-[380px] sm:h-[460px] md:h-[520px] lg:h-[620px]">
      <div className="orbit animate-spinSlow" style={{ inset: "8% 10%", transform: "rotateX(70deg)" }} />
      <div className="orbit orbit-yt animate-spinRevSlow" style={{ inset: "22% 22%", transform: "rotateX(70deg) rotateZ(22deg)" }} />
      <div className="orbit" style={{ inset: "34% 34%", transform: "rotateX(70deg) rotateZ(-10deg)", borderStyle: "solid", borderColor: "rgba(255,107,51,0.15)" }} />

      <div className="absolute inset-0 flex items-start justify-center pointer-events-none">
        <div className="mt-10 w-[60%] h-[60%] rounded-full blur-3xl bg-[var(--color-brand-500)]/20 animate-pulseGlow" />
      </div>

      <div
        className="relative w-full h-full preserve-3d transition-transform duration-300"
        style={{ transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      >
        <div
          className="absolute left-1/2 top-[10%]"
          style={{ transform: "translate(-50%, 0) translateZ(60px)" }}
        >
          <div className="animate-float">
            <SourceOrb />
          </div>
        </div>

        <svg
          viewBox="0 0 400 520"
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: "translateZ(20px)" }}
        >
          <defs>
            <linearGradient id="ptGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#ffc2a1" />
              <stop offset="100%" stopColor="#ff6b33" />
            </linearGradient>
            <linearGradient id="ytGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#bff2ff" />
              <stop offset="100%" stopColor="#33d2ff" />
            </linearGradient>
          </defs>
          <path d="M200 164 C 188 250, 118 305, 99 352" stroke="url(#ptGrad)" strokeWidth="2" fill="none" className="conduit" opacity="0.9" />
          <path d="M200 164 C 212 250, 282 305, 301 352" stroke="url(#ytGrad)" strokeWidth="2" fill="none" className="conduit" opacity="0.9" />
          <circle cx="99" cy="352" r="38" fill="#ff6b33" opacity="0.12" />
          <circle cx="301" cy="352" r="38" fill="#33d2ff" opacity="0.12" />
        </svg>

        <div className="absolute" style={{ left: "8%", top: "58%", transform: "translateZ(90px)" }}>
          <div className="animate-floatLeft">
            <TokenChip kind="PT" />
          </div>
        </div>
        <div className="absolute" style={{ right: "8%", top: "58%", transform: "translateZ(90px)" }}>
          <div className="animate-floatRight">
            <TokenChip kind="YT" />
          </div>
        </div>

        <FloatingChip className="top-[4%] left-[2%]" depth={50} title="" value="Perpetual" />
        <FloatingChip className="top-[20%] right-[2%]" depth={30} title="YT" value="Earns yield" tone="brand" />
        <FloatingChip className="bottom-[4%] left-[30%]" depth={40} title="PT" value="Price upside" tone="yt" />
      </div>
    </div>
  );
}

function SourceOrb() {
  return (
    <div className="relative w-28 h-28">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 via-[var(--color-brand-300)]/60 to-[var(--color-brand-600)] shadow-[0_0_40px_rgba(255,107,51,0.45)]" />
      <div className="absolute inset-[14%] rounded-full bg-[#05070d]/80 backdrop-blur grid place-items-center font-display text-lg text-white">
        gFOGO
      </div>
      <div className="absolute -inset-1 rounded-full border border-[var(--color-brand-500)]/40 animate-pulseGlow" />
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.28em] text-white/55 uppercase whitespace-nowrap">
        Staked · Yield-bearing
      </div>
    </div>
  );
}

function TokenChip({ kind }: { kind: "PT" | "YT" }) {
  const isPT = kind === "PT";
  const ticker = isPT ? "agFOGO" : "xgFOGO";
  const role = isPT ? "YT" : "PT";
  const tagline = isPT ? "Earns yield, redeemable" : "Leveraged FOGO upside";
  return (
    <div className="relative">
      <div
        className={
          "w-32 sm:w-40 md:w-44 rounded-2xl p-3 sm:p-4 overflow-hidden " +
          (isPT ? "glass-pt ring-hemi" : "glass-yt ring-yt")
        }
      >
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl overflow-hidden grid place-items-center bg-[#05070d]/40">
            <TokenMark kind={kind} />
          </div>
          <div>
            <div className={"text-xs font-mono " + (isPT ? "text-[var(--color-brand-300)]" : "text-[var(--color-yt-300)]")}>
              {ticker}
            </div>
            <div className="text-[11px] text-white/55">{role}</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-white/70">{tagline}</div>
        <div className="absolute inset-0 noise opacity-30 pointer-events-none" />
      </div>
    </div>
  );
}

function FloatingChip({
  className,
  depth,
  title,
  value,
  tone = "neutral",
}: {
  className: string;
  depth: number;
  title: string;
  value: string;
  tone?: "brand" | "yt" | "neutral";
}) {
  const accent =
    tone === "brand"
      ? "text-[var(--color-brand-300)]"
      : tone === "yt"
      ? "text-[var(--color-yt-300)]"
      : "text-white/80";
  return (
    <div
      className={"absolute glass rounded-2xl px-3.5 py-2.5 text-xs " + className}
      style={{ transform: `translateZ(${depth}px)` }}
    >
      <div className="text-[10px] tracking-[0.25em] text-white/50 uppercase">{title}</div>
      <div className={"mt-0.5 " + accent}>{value}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Qualitative pillars                                                */
/* ------------------------------------------------------------------ */

function Pillars() {
  const items = [
    { icon: <FogoIcon />,  label: "FOGO-native",      body: "Underlying is staked, yield-bearing gFOGO." },
    { icon: <ClockIcon />, label: "Perpetual",        body: "No expiry to roll or manage. Redeem either tranche any time." },
    { icon: <SplitIcon />, label: "Two-sided market", body: "Trade the stable and leveraged tranches as separate tokens." },
    { icon: <LockIcon />,  label: "Non-custodial",     body: "Keys, mints, and redeems stay in your wallet." },
  ];
  return (
    <section className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="relative rounded-2xl sm:rounded-3xl glass p-4 sm:p-5 md:p-7 section-glow">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((it) => (
              <div key={it.label} className="flex items-start gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl grid place-items-center bg-gradient-to-br from-[var(--color-brand-500)]/25 to-[var(--color-brand-700)]/10 border border-[var(--color-brand-500)]/25 text-[var(--color-brand-300)]">
                  {it.icon}
                </div>
                <div className="min-w-0">
                  <div className="font-display text-white">{it.label}</div>
                  <div className="text-xs text-white/55 mt-0.5">{it.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Two tokens                                                         */
/* ------------------------------------------------------------------ */

function TwoTokens() {
  return (
    <section id="tokens" className="relative py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle
          eyebrow="The split"
          title={
            <>
              One stake. <span className="text-gradient-split">Two outcomes.</span>
            </>
          }
          subtitle="Deposit gFOGO and pick your token: agFOGO, the yield token (YT) that earns the staking yield, or xgFOGO, the price token (PT) with leveraged exposure to FOGO's price."
        />
        <div className="mt-10 sm:mt-14 grid md:grid-cols-2 gap-5 sm:gap-6">
          <TokenBigCard
            kind="PT"
            name="agFOGO"
            ticker="YT · Yield Token"
            role="Yield observer"
            headline="Earn yield, skip the volatility."
            body="agFOGO is the stable tranche. It captures the gFOGO staking yield while holding a steady NAV, insulated from FOGO's price swings, and you can redeem it for gFOGO any time."
            bullets={[
              "Earns the gFOGO staking yield",
              "Steady NAV, insulated from price swings",
              "Redeemable for gFOGO any time",
              "Predictable returns, no liquidations",
            ]}
          />
          <TokenBigCard
            kind="YT"
            name="xgFOGO"
            ticker="PT · Price Token"
            role="Price observer"
            headline="Amplify your FOGO upside."
            body="xgFOGO is the leveraged tranche. It carries built-in leverage on FOGO's price and absorbs the volatility agFOGO sheds. Amplified upside, higher risk, no liquidations."
            bullets={[
              "Leveraged exposure to FOGO's price",
              "Absorbs the volatility agFOGO sheds",
              "Amplified upside (and downside)",
              "No liquidations, fully on-chain",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function TokenBigCard({
  kind,
  name,
  ticker,
  role,
  headline,
  body,
  bullets,
}: {
  kind: "PT" | "YT";
  name: string;
  ticker: string;
  role: string;
  headline: string;
  body: string;
  bullets: string[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isPT = kind === "PT";

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(1200px) rotateX(${-y * 5}deg) rotateY(${x * 7}deg) translateZ(0)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative rounded-3xl p-[1px] transition-transform duration-200 will-change-transform"
      style={{
        background: isPT
          ? "radial-gradient(280px 180px at var(--mx,50%) var(--my,0%), rgba(255,107,51,0.7), rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)"
          : "radial-gradient(280px 180px at var(--mx,50%) var(--my,0%), rgba(51,210,255,0.7), rgba(255,255,255,0.04) 50%, rgba(255,255,255,0.02) 100%)",
      }}
    >
      <div
        className={
          "relative rounded-3xl overflow-hidden h-full p-6 sm:p-8 md:p-10 " +
          (isPT ? "glass-pt" : "glass-yt")
        }
      >
        <div className="absolute inset-0 noise opacity-25 pointer-events-none" />
        <div className="relative flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={
                "w-12 h-12 rounded-2xl overflow-hidden grid place-items-center bg-[#05070d]/40 " +
                (isPT ? "ring-hemi" : "ring-yt")
              }
            >
              <TokenMark kind={kind} />
            </div>
            <div>
              <div className="font-display text-xl text-white">{name}</div>
              <div className={"text-xs font-mono " + (isPT ? "text-[var(--color-brand-300)]" : "text-[var(--color-yt-300)]")}>
                {ticker}
              </div>
            </div>
          </div>
          <div
            className={
              "text-[11px] tracking-[0.22em] uppercase px-3 py-1 rounded-full border " +
              (isPT
                ? "border-[var(--color-brand-500)]/40 text-[var(--color-brand-300)] bg-[var(--color-brand-500)]/5"
                : "border-[var(--color-yt-500)]/40 text-[var(--color-yt-300)] bg-[var(--color-yt-500)]/5")
            }
          >
            {role}
          </div>
        </div>

        <h3 className="relative mt-8 font-display text-2xl md:text-3xl text-white leading-tight">{headline}</h3>
        <p className="relative mt-4 text-white/65 max-w-lg">{body}</p>

        <ul className="relative mt-6 space-y-2.5">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-sm text-white/80">
              <span
                className={
                  "w-5 h-5 rounded-full grid place-items-center " +
                  (isPT
                    ? "bg-[var(--color-brand-500)]/20 text-[var(--color-brand-300)]"
                    : "bg-[var(--color-yt-500)]/20 text-[var(--color-yt-300)]")
                }
              >
                <CheckIcon />
              </span>
              {b}
            </li>
          ))}
        </ul>

        <div className="relative mt-8 rounded-2xl glass p-4">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>{isPT ? "Value over time" : "Price payoff"}</span>
            <span className={isPT ? "text-[var(--color-brand-300)]" : "text-[var(--color-yt-300)]"}>
              {isPT ? "Stable + yield" : "Leveraged upside"}
            </span>
          </div>
          <div className="mt-3">
            <PayoffChart variant={kind} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* Payoff charts under each token card.
   variant "PT" = agFOGO (the YT token): steady NAV + accruing yield → gentle rise.
   variant "YT" = xgFOGO (the PT token): leveraged price exposure → steep rise above a 1× FOGO reference. */
function PayoffChart({ variant }: { variant: "PT" | "YT" }) {
  const isYield = variant === "PT";
  const stroke = isYield ? "var(--color-brand-400)" : "var(--color-yt-300)";
  const gid = isYield ? "payoffYield" : "payoffLev";
  return (
    <div className="relative h-24 w-full overflow-hidden rounded-lg">
      <svg viewBox="0 0 300 96" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="6" y1="86" x2="294" y2="86" stroke="rgba(255,255,255,0.12)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        {isYield ? (
          <>
            {/* stable NAV reference */}
            <line x1="8" y1="70" x2="292" y2="70" stroke="rgba(255,255,255,0.22)" strokeWidth="1" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
            {/* steady value: stable NAV + accruing yield */}
            <path d={`M8 70 C 110 67, 200 57, 292 40 L292 86 L8 86 Z`} fill={`url(#${gid})`} />
            <path d={`M8 70 C 110 67, 200 57, 292 40`} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </>
        ) : (
          <>
            {/* underlying FOGO price, 1× reference */}
            <path d={`M8 80 C 110 75, 200 65, 292 48`} fill="none" stroke="rgba(255,255,255,0.32)" strokeWidth="1.5" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
            {/* leveraged exposure: amplified upside */}
            <path d={`M8 82 C 120 72, 195 44, 292 10 L292 86 L8 86 Z`} fill={`url(#${gid})`} />
            <path d={`M8 82 C 120 72, 195 44, 292 10`} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      {isYield ? (
        <>
          <span className="absolute left-2 bottom-1 text-[9px] uppercase tracking-[0.18em] text-white/40">time</span>
          <span className="absolute right-2 top-1.5 text-[10px] font-mono text-[var(--color-brand-300)]">agFOGO · +yield</span>
        </>
      ) : (
        <>
          <span className="absolute left-2 bottom-1 text-[9px] uppercase tracking-[0.18em] text-white/40">FOGO price</span>
          <span className="absolute right-2 top-1.5 text-[10px] font-mono text-[var(--color-yt-300)]">xgFOGO ▲ leveraged</span>
          <span className="absolute right-2 top-8 text-[9px] font-mono text-white/35">FOGO 1×</span>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How it works                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  const steps = [
    { n: "01", title: "Deposit gFOGO", body: "Supply staked, yield-bearing gFOGO to the TwinYield treasury.", icon: <VaultIcon />, accent: "brand" as const },
    { n: "02", title: "Mint agFOGO or xgFOGO", body: "Choose agFOGO (YT) for a stable, yield-earning position, or xgFOGO (PT) for leveraged exposure to FOGO's price. Both mint at the live NAV.", icon: <SplitIcon />, accent: "split" as const },
    { n: "03", title: "Hold, trade, or redeem", body: "Hold for yield or upside, trade either token on-chain, or redeem it back into gFOGO any time. No maturity, no liquidations.", icon: <SwapIcon />, accent: "yt" as const },
  ];
  return (
    <section id="how" className="relative py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle
          eyebrow="How it works"
          title={<>Three steps. <span className="text-gradient">Zero custody.</span></>}
          subtitle="The protocol is on-chain and non-custodial. Your gFOGO, agFOGO, and xgFOGO stay in your wallet."
        />

        <div className="mt-10 sm:mt-14 grid md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-3 grid gap-4">
            {steps.map((s, i) => (
              <StepCard key={s.n} {...s} last={i === steps.length - 1} />
            ))}
          </div>
          <div className="md:col-span-2 relative h-[320px] md:h-[420px] hidden md:block">
            <CubeVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function StepCard({
  n,
  title,
  body,
  icon,
  accent,
  last,
}: {
  n: string;
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: "brand" | "yt" | "split";
  last?: boolean;
}) {
  const ring =
    accent === "brand"
      ? "from-[var(--color-brand-400)] to-[var(--color-brand-600)]"
      : accent === "yt"
      ? "from-[var(--color-yt-300)] to-[var(--color-yt-600)]"
      : "from-[var(--color-brand-400)] via-[var(--color-brand-500)] to-[var(--color-yt-400)]";
  return (
    <div className="relative glass rounded-2xl p-5 md:p-6 flex gap-5 items-start">
      <div className={"relative shrink-0 w-14 h-14 rounded-2xl grid place-items-center text-[#05070d] bg-gradient-to-br " + ring}>
        {icon}
        <span className="absolute -top-2 -right-2 text-[10px] font-mono bg-[#0a0d16] border border-white/10 rounded px-1.5 py-0.5 text-white/70">
          {n}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="font-display text-lg text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/65 leading-relaxed">{body}</p>
      </div>
      {!last && (
        <div className="absolute left-[46px] -bottom-4 w-px h-4 bg-gradient-to-b from-white/20 to-transparent" />
      )}
    </div>
  );
}

function CubeVisual() {
  const [rot, setRot] = useState({ x: -18, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!interacting) return;
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      setRot((r) => ({
        x: Math.max(-89, Math.min(89, r.x - dy * 0.4)),
        y: r.y + dx * 0.4,
      }));
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [interacting]);

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    setInteracting(true);
  };
  const onLeave = () => {
    if (dragging.current) return;
    setInteracting(false);
    setRot({ x: -18, y: 0 });
  };

  return (
    <div className="scene-3d-low absolute inset-0 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full blur-3xl bg-[var(--color-brand-500)]/20 animate-pulseGlow" />
      </div>
      <div
        className="cube select-none"
        onPointerDown={onDown}
        onPointerLeave={onLeave}
        style={
          interacting
            ? {
                animation: "none",
                transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
                cursor: dragging.current ? "grabbing" : "grab",
              }
            : { cursor: "grab" }
        }
      >
        <div className="face front text-[var(--color-brand-300)] font-display text-xl">gFOGO</div>
        <div className="face back text-[var(--color-yt-300)] font-display text-xl">Market</div>
        <div className="face right text-[var(--color-brand-300)] font-display text-xl">YT</div>
        <div className="face left text-[var(--color-yt-300)] font-display text-xl">PT</div>
        <div className="face top text-white/70 font-mono text-xs">REDEEM</div>
        <div className="face bottom text-white/70 font-mono text-xs">MINT</div>
      </div>
      <div className="absolute top-4 left-4 glass rounded-xl px-3 py-2 text-[10px] tracking-[0.25em] uppercase text-white/60 pointer-events-none">
        Protocol core
      </div>
      <div className="absolute bottom-4 right-4 glass rounded-xl px-3 py-2 text-[10px] font-mono text-[var(--color-yt-300)] pointer-events-none">
        YT ⇄ gFOGO ⇄ PT
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Mechanics                                                          */
/* ------------------------------------------------------------------ */

function Mechanics() {
  const columns = [
    {
      n: "01",
      label: "Mint",
      tone: "brand" as const,
      body: "Deposit gFOGO and mint the tranche you want at the current NAV: agFOGO for stability or xgFOGO for leverage. Your gFOGO sits in the treasury, backing the supply.",
    },
    {
      n: "02",
      label: "Hold",
      tone: "split" as const,
      body: "agFOGO (YT) holds a steady NAV and earns the staking yield. xgFOGO (PT) carries the leveraged price exposure. Together they're fully backed by the treasury's gFOGO.",
    },
    {
      n: "03",
      label: "Exit",
      tone: "yt" as const,
      body: "Redeem either token back into gFOGO any time at NAV. No maturity to wait on, no liquidations to fear. Exit on your own schedule.",
    },
  ];

  return (
    <section id="mechanics" className="relative py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle
          eyebrow="The mechanics"
          title={<>Deposit once. Pick your side. <span className="text-gradient">Always backed.</span></>}
          subtitle="Every token is minted and redeemed at live NAV, fully backed by gFOGO in the treasury."
        />

        <div className="mt-10 sm:mt-14 grid md:grid-cols-3 gap-4 sm:gap-6">
          {columns.map((c) => (
            <MechanicsColumn key={c.n} {...c} />
          ))}
        </div>

        <div className="mt-6 sm:mt-8 rounded-2xl glass section-glow px-4 sm:px-6 py-4 sm:py-5 text-center">
          <p className="font-mono text-sm sm:text-base text-white/85 break-words">
            <span className="text-white">gFOGO treasury</span>{" "}
            <span className="text-[var(--color-brand-300)]">=</span>{" "}
            <span className="text-[var(--color-brand-300)]">agFOGO (YT)</span>{" "}
            <span className="text-white/50">+</span>{" "}
            <span className="text-[var(--color-yt-300)]">xgFOGO (PT)</span>
            <span className="text-white/45">. Fully backed, on-chain, non-custodial.</span>
          </p>
        </div>
      </div>
    </section>
  );
}

function MechanicsColumn({
  n,
  label,
  body,
  tone,
}: {
  n: string;
  label: string;
  body: string;
  tone: "brand" | "yt" | "split";
}) {
  const accent =
    tone === "brand"
      ? "text-[var(--color-brand-300)]"
      : tone === "yt"
      ? "text-[var(--color-yt-300)]"
      : "text-gradient-split";
  return (
    <div className="relative glass rounded-2xl p-6 md:p-7 h-full">
      <div className="flex items-center justify-between">
        <h3 className={"font-display text-xl " + accent}>{label}</h3>
        <span className="text-[10px] font-mono bg-[#0a0d16] border border-white/10 rounded px-1.5 py-0.5 text-white/60">
          {n}
        </span>
      </div>
      <p className="mt-3 text-sm text-white/65 leading-relaxed">{body}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Journey                                                            */
/* ------------------------------------------------------------------ */

function JourneyExample() {
  return (
    <section id="journey" className="relative py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle
          eyebrow="Walkthrough"
          title={<>A trader&apos;s <span className="text-gradient">journey.</span></>}
          subtitle="Two paths from a single deposit of gFOGO on the FOGO testnet."
        />

        <div className="mt-10 sm:mt-14 grid lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
          <div className="lg:col-span-7 relative glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 section-glow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--color-brand-400)] to-[var(--color-yt-400)] grid place-items-center font-display text-[#05070d]">
                A
              </div>
              <div>
                <div className="font-display text-lg text-white">Alice · FOGO trader</div>
                <div className="text-xs text-white/50">Wants to choose her exposure to staked FOGO</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <JourneyStep tag="Deposit"    tone="neutral" title="Deposits 100 gFOGO"
                detail="Supplies 100 gFOGO to the treasury, then decides which tranche to mint at the current NAV." />
              <div className="grid md:grid-cols-2 gap-3">
                <JourneyStep tag="Option A · YT" tone="brand" title="Mints agFOGO"
                  detail="Takes the stable tranche: a steady-NAV position that earns the gFOGO staking yield, redeemable any time. No price risk." />
                <JourneyStep tag="Option B · PT" tone="yt" title="Mints xgFOGO"
                  detail="Takes the leveraged tranche: amplified exposure to FOGO's price that absorbs the volatility agFOGO sheds. Higher risk, bigger upside." />
              </div>
              <JourneyStep tag="Exit" tone="neutral" title="Redeem or trade, any time"
                detail="Redeem either tranche back into gFOGO at NAV, or trade it on-chain. No maturity, no liquidations." />
            </div>
          </div>

          <div className="lg:col-span-5 relative glass rounded-2xl sm:rounded-3xl p-5 sm:p-6 md:p-8 flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs tracking-[0.25em] text-white/50 uppercase">Market</div>
                <div className="mt-1 font-display text-lg text-white">agFOGO / xgFOGO</div>
              </div>
              <div className="text-[10px] font-mono text-[var(--color-brand-300)] bg-[var(--color-brand-500)]/10 border border-[var(--color-brand-500)]/30 px-2 py-1 rounded">
                PERPETUAL
              </div>
            </div>
            <div className="relative flex-1 grid place-items-center mt-4">
              <YieldDial />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <MicroBadge label="YT"         value="agFOGO" tone="brand" />
              <MicroBadge label="PT"         value="xgFOGO" tone="yt" />
              <MicroBadge label="Underlying" value="gFOGO" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function JourneyStep({
  tag,
  tone,
  title,
  detail,
}: {
  tag: string;
  tone: "brand" | "yt" | "neutral";
  title: string;
  detail: string;
}) {
  const t =
    tone === "brand"
      ? { chip: "bg-[var(--color-brand-500)]/15 text-[var(--color-brand-300)] border-[var(--color-brand-500)]/30", rail: "bg-[var(--color-brand-500)]" }
      : tone === "yt"
      ? { chip: "bg-[var(--color-yt-500)]/15 text-[var(--color-yt-300)] border-[var(--color-yt-500)]/30", rail: "bg-[var(--color-yt-400)]" }
      : { chip: "bg-white/5 text-white/70 border-white/10", rail: "bg-white/30" };
  return (
    <div className="relative rounded-2xl glass p-4 flex gap-4 items-start">
      <div className={"w-1 self-stretch rounded-full " + t.rail} />
      <div className="flex-1">
        <div className={"inline-block text-[10px] tracking-[0.22em] uppercase border px-2 py-0.5 rounded-full " + t.chip}>
          {tag}
        </div>
        <div className="mt-2 text-white font-medium">{title}</div>
        <div className="text-sm text-white/60 mt-1">{detail}</div>
      </div>
    </div>
  );
}

function MicroBadge({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "brand" | "yt" | "neutral";
}) {
  const cls =
    tone === "brand" ? "text-[var(--color-brand-300)]" : tone === "yt" ? "text-[var(--color-yt-300)]" : "text-white";
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
      <div className="text-[10px] tracking-[0.22em] text-white/50 uppercase">{label}</div>
      <div className={"mt-1 font-display text-base sm:text-lg flex items-center justify-center gap-1.5 " + cls}>
        {value}
      </div>
    </div>
  );
}

function YieldDial() {
  const R = 84;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative w-56 h-56">
      <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
        <defs>
          <linearGradient id="dialGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ff6b33" />
            <stop offset="100%" stopColor="#33d2ff" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r={R} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="100"
          cy="100"
          r={R}
          stroke="url(#dialGrad)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C * 0.66} ${C}`}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <div className="text-[10px] tracking-[0.25em] text-white/50 uppercase">Yield accruing</div>
          <div className="font-display text-2xl text-white mt-2">Live</div>
          <div className="text-xs text-white/50 mt-1">streaming on-chain</div>
        </div>
      </div>
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[80%] h-6 rounded-full bg-[var(--color-brand-500)]/15 blur-2xl" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Benefits                                                           */
/* ------------------------------------------------------------------ */

function KeyBenefits() {
  const cards = [
    { icon: <ShieldIcon />, title: "Fully backed",    body: "Both tranches are fully backed by staked gFOGO held in the treasury, redeemable at NAV." },
    { icon: <TargetIcon />, title: "Yield or price", body: "agFOGO (YT) for steady, yield-earning exposure. xgFOGO (PT) for leveraged exposure to FOGO's price." },
    { icon: <LayersIcon />, title: "Composable",      body: "agFOGO and xgFOGO are standard SPL tokens. LP them, lend them, plug them into the stack." },
    { icon: <LockIcon />,   title: "No liquidations", body: "Leverage with no liquidation engine. On-chain contracts hold the collateral; your wallet holds the position." },
  ];
  return (
    <section id="benefits" className="relative py-16 sm:py-20 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionTitle
          eyebrow="Why TwinYield"
          title={<>Built for serious <span className="text-gradient">onchain traders.</span></>}
          subtitle="Modular. On-chain. Opinionated about structure, so you don&apos;t have to be."
        />
        <div className="mt-10 sm:mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c) => (
            <BenefitCard key={c.title} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateX(0) rotateY(0)";
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative rounded-2xl p-[1px] transition-transform duration-200 will-change-transform"
      style={{
        background:
          "radial-gradient(240px 160px at var(--mx,50%) var(--my,0%), rgba(255,107,51,0.55), rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.02) 100%)",
      }}
    >
      <div className="relative h-full rounded-2xl bg-[#0a0d16]/80 p-6 overflow-hidden">
        <div className="absolute inset-0 noise opacity-30 pointer-events-none" />
        <div className="relative w-10 h-10 rounded-xl grid place-items-center bg-gradient-to-br from-[var(--color-brand-500)]/30 to-[var(--color-brand-700)]/10 text-[var(--color-brand-400)] border border-[var(--color-brand-500)]/30">
          {icon}
        </div>
        <h3 className="relative mt-4 font-display text-lg text-white">{title}</h3>
        <p className="relative mt-2 text-sm text-white/65 leading-relaxed">{body}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* CTA + Footer                                                       */
/* ------------------------------------------------------------------ */

function CTA() {
  return (
    <section className="relative py-16 sm:py-20 md:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl glass-strong p-6 sm:p-10 md:p-14 section-glow">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[var(--color-brand-500)]/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-[var(--color-yt-500)]/20 blur-3xl" />
          <div className="relative grid md:grid-cols-5 gap-6 md:gap-8 items-center">
            <div className="md:col-span-3">
              <div className="text-xs tracking-[0.25em] text-[var(--color-brand-300)] uppercase">Testnet is live</div>
              <h3 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl text-white leading-tight">
                Split your first <span className="text-gradient">gFOGO</span> today.
              </h3>
              <p className="mt-4 text-white/70 max-w-lg text-sm sm:text-base">
                Connect a Solana wallet on FOGO testnet, mint test gFOGO, and choose your side: agFOGO (YT) for stable yield or xgFOGO (PT) for leveraged price. Try the full flow: mint, trade, redeem. Feedback welcome. This is an early build.
              </p>
            </div>
            <div className="md:col-span-2 flex md:justify-end">
              <Link href="/mint" className="btn-hemi justify-center w-full md:w-auto">
                <span>Launch App</span>
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2.5 text-white/70 text-sm">
          <LogoMark size={24} />
          <span>Twin<span className="text-[var(--color-brand-500)]">yield</span></span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[var(--color-brand-500)]/30 text-[var(--color-brand-300)] tracking-widest">
            FOGO TESTNET
          </span>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-sm text-white/50">
          <Link href="/dashboard" className="hover:text-[var(--color-brand-400)] transition">Dashboard</Link>
          <Link href="/mint" className="hover:text-[var(--color-brand-400)] transition">Mint</Link>
        </div>
      </div>
    </footer>
  );
}

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto px-2">
      <div className="text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] text-[var(--color-brand-300)] uppercase">{eyebrow}</div>
      <h2 className="mt-3 font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-white leading-tight">{title}</h2>
      <p className="mt-3 sm:mt-4 text-sm sm:text-base text-white/65">{subtitle}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inline token marks (no PNG assets)                                 */
/* ------------------------------------------------------------------ */

export function TokenMark({ kind, size = 32 }: { kind: "PT" | "YT"; size?: number }) {
  const src = kind === "PT" ? "/PT_FOGO.png" : "/YT_FOGO.png";
  const alt = kind === "PT" ? "agFOGO (YT)" : "xgFOGO (PT)";
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="object-contain"
    />
  );
}

export function BaseTokenIcon({ size = 18 }: { size?: number }) {
  return (
    <img
      src="/fogo_token.png"
      alt="gFOGO"
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 0 8px rgba(255, 107, 51, 0.45))",
      }}
      className="object-contain"
    />
  );
}

/* Icons */

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 5l7 7-7 7" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ShieldIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
    </svg>
  );
}

function ClockIcon({ small }: { small?: boolean }) {
  const s = small ? 14 : 20;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function FogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2 C 14 7, 19 8, 19 14 C 19 19, 16 22, 12 22 C 8 22, 5 19, 5 14 C 5 11, 7 9, 8 6 C 10 9, 11 9, 12 9 C 11 7, 12 4, 12 2 Z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l10 6-10 6L2 8l10-6z" />
      <path d="M2 14l10 6 10-6" />
      <path d="M2 11l10 6 10-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function VaultIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 9V7M12 17v-2M9 12H7M17 12h-2" />
    </svg>
  );
}

function SplitIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v6" />
      <path d="M12 9l-6 6" />
      <path d="M12 9l6 6" />
      <circle cx="6" cy="17" r="2.5" />
      <circle cx="18" cy="17" r="2.5" />
      <circle cx="12" cy="3" r="1" fill="currentColor" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h14l-3-3" />
      <path d="M20 17H6l3 3" />
    </svg>
  );
}
