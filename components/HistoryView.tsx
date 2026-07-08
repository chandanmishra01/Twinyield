"use client";

import useSWR from "swr";
import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

interface Row {
  day: number;
  price: number;
  rate: number;
  total_base: number;
  a_supply: number;
  x_supply: number;
  treasury_ata: number;
  a_nav: number;
  x_nav: number;
  cr: number;
  leverage: number;
}

const fetcher = async (url: string): Promise<Row[]> => {
  const text = await fetch(url).then((r) => r.text());
  const lines = text.trim().split("\n");
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(",");
    rows.push({
      day: Number(c[0]),
      price: Number(c[1]),
      rate: Number(c[2]),
      total_base: Number(c[3]),
      a_supply: Number(c[4]),
      x_supply: Number(c[5]),
      treasury_ata: Number(c[6]),
      a_nav: Number(c[7]),
      x_nav: Number(c[8]),
      cr: parseFloat(c[9].replace("%", "")),
      leverage: Number(c[10]),
    });
  }
  return rows;
};

type Metric = "navs" | "price" | "cr" | "leverage";
const METRICS: { id: Metric; label: string }[] = [
  { id: "navs", label: "NAVs" },
  { id: "price", label: "Price + Rate" },
  { id: "cr", label: "CR" },
  { id: "leverage", label: "Leverage" },
];

export function HistoryView() {
  const { data, isLoading } = useSWR<Row[]>("/data/sim_90d.csv", fetcher);
  const [metric, setMetric] = useState<Metric>("navs");

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const first = data[0];
    const last = data[data.length - 1];
    return {
      days: data.length - 1,
      priceFrom: first.price,
      priceTo: last.price,
      pricePct: ((last.price - first.price) / first.price) * 100,
      ratePct: ((last.rate - first.rate) / first.rate) * 100,
      crMin: Math.min(...data.map((r) => r.cr)),
      crMax: Math.max(...data.map((r) => r.cr)),
      navStable: data.filter((r) => r.a_nav === 1).length,
      ytFrom: first.x_nav,
      ytTo: last.x_nav,
      ytPct: first.x_nav > 0 ? ((last.x_nav - first.x_nav) / first.x_nav) * 100 : 0,
    };
  }, [data]);

  return (
    <section className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-16 max-w-7xl mx-auto">
      <div className="mb-6 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-300)]">
          90-Day Simulation Replay
        </div>
        <h1 className="font-display text-3xl sm:text-[40px] text-white tracking-tight">
          How the tranches react over time
        </h1>
        <p className="text-white/55 text-sm max-w-xl">
          Telemetry from a 90-day on-chain Monte-Carlo walk: σ = 2%/day GBM on price,
          +5% APY compounding rate, refresh-mints every 10 days. agFOGO stays pinned.
          xgFOGO absorbs everything.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <MiniStat
            label="Price Δ"
            value={`${stats.pricePct > 0 ? "+" : ""}${stats.pricePct.toFixed(2)}%`}
            sub={`$${stats.priceFrom.toFixed(2)} → $${stats.priceTo.toFixed(2)}`}
            tone={stats.pricePct >= 0 ? "pt" : "yt"}
          />
          <MiniStat
            label="PT NAV Δ"
            value={`${stats.ytPct > 0 ? "+" : ""}${stats.ytPct.toFixed(2)}%`}
            sub={`$${stats.ytFrom.toFixed(2)} → $${stats.ytTo.toFixed(2)}`}
            tone="pt"
          />
          <MiniStat
            label="YT Stable Days"
            value={`${stats.navStable}/${stats.days + 1}`}
            sub="agFOGO held $1.00"
            tone="yt"
          />
          <MiniStat
            label="Yield (rate)"
            value={`+${stats.ratePct.toFixed(2)}%`}
            sub="rate provider, 90d"
          />
        </div>
      )}

      <div className="relative rounded-2xl glass p-5 sm:p-6">
        <div className="absolute inset-0 noise opacity-20 pointer-events-none rounded-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1 h-3 bg-[var(--color-brand-500)] rounded-full" />
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">
              Time Series · 90 days
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {METRICS.map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={
                  "px-3 py-1.5 text-[10px] uppercase tracking-widest rounded-full border transition tabular " +
                  (metric === m.id
                    ? "border-[var(--color-brand-500)] text-[var(--color-brand-300)] bg-[var(--color-brand-500)]/10"
                    : "border-white/[0.10] text-white/55 hover:text-white hover:border-white/[0.20]")
                }
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative h-[380px] sm:h-[420px]">
          {isLoading && (
            <div className="h-full flex items-center justify-center text-white/45 text-[11px] uppercase tracking-widest">
              loading telemetry…
            </div>
          )}
          {data && metric === "navs" && <NavsChart data={data} />}
          {data && metric === "price" && <PriceRateChart data={data} />}
          {data && metric === "cr" && <CRChart data={data} />}
          {data && metric === "leverage" && <LeverageChart data={data} />}
        </div>

        <div className="relative mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 text-[11px] text-white/55 leading-relaxed">
          <FindingBox
            tone="yt"
            title="agFOGO (YT) · pinned"
            body="Held $1.00 every single day. Senior tranche is paid first; absorbs zero volatility while CR > liquidation ratio."
          />
          <FindingBox
            tone="pt"
            title="xgFOGO (PT) · leveraged"
            body="NAV moved with realized leverage on top of the underlying price action. The junior tranche absorbs all price movement — no yield."
          />
          <FindingBox
            title="Yield · flows to YT"
            body="Rate provider grew over the window. Since agFOGO (YT) holds a steady $1 NAV, every cent of rate gain accrues to YT holders — claimable as gFOGO."
          />
        </div>
      </div>
    </section>
  );
}

function MiniStat({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "pt" | "yt";
}) {
  const c =
    tone === "pt" ? "text-[var(--color-brand-300)]" : tone === "yt" ? "text-[var(--color-yt-300)]" : "text-white/95";
  return (
    <div className="relative rounded-2xl glass p-4">
      <div className="absolute inset-0 noise opacity-20 pointer-events-none rounded-2xl" />
      <div className="relative">
        <div className="text-[10px] uppercase tracking-widest text-white/45 mb-2">{label}</div>
        <div className={`tabular text-[22px] ${c}`}>{value}</div>
        <div className="text-[10px] tabular text-white/45 mt-1">{sub}</div>
      </div>
    </div>
  );
}

function FindingBox({
  tone,
  title,
  body,
}: {
  tone?: "pt" | "yt";
  title: string;
  body: string;
}) {
  const c =
    tone === "pt"
      ? "border-[var(--color-brand-500)]/40 text-[var(--color-brand-300)]"
      : tone === "yt"
      ? "border-[var(--color-yt-500)]/40 text-[var(--color-yt-300)]"
      : "border-white/[0.10] text-white/85";
  return (
    <div className={`rounded-2xl border ${c} bg-white/[0.02] p-4`}>
      <div className="text-[10px] uppercase tracking-widest mb-1">{title}</div>
      <div className="text-[11px] text-white/55 leading-relaxed">{body}</div>
    </div>
  );
}

const axisStyle = {
  stroke: "#5a5a68",
  strokeWidth: 0.5,
  fontSize: 10,
  fontFamily: "var(--font-mono)",
};

function NavsChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="grad-yt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b33" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ff6b33" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" {...axisStyle} tick={{ fill: "#8a8a99" }} />
        <YAxis {...axisStyle} tick={{ fill: "#8a8a99" }} domain={[0, "dataMax + 1"]} />
        <Tooltip content={<DarkTooltip />} />
        <Area
          type="monotone"
          dataKey="x_nav"
          stroke="#ff6b33"
          strokeWidth={1.5}
          fill="url(#grad-yt)"
          name="xgFOGO NAV"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="a_nav"
          stroke="#33d2ff"
          strokeWidth={1.5}
          name="agFOGO NAV"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PriceRateChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" {...axisStyle} tick={{ fill: "#8a8a99" }} />
        <YAxis
          yAxisId="left"
          {...axisStyle}
          tick={{ fill: "#8a8a99" }}
          domain={["dataMin - 5", "dataMax + 5"]}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          {...axisStyle}
          tick={{ fill: "#8a8a99" }}
          domain={[1, "dataMax + 0.005"]}
        />
        <Tooltip content={<DarkTooltip />} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="price"
          stroke="#ff6b33"
          strokeWidth={1.5}
          name="Price ($)"
          dot={false}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="rate"
          stroke="#FFB454"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          name="Rate (×)"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function CRChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="grad-cr" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ff6b33" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#ff6b33" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" {...axisStyle} tick={{ fill: "#8a8a99" }} />
        <YAxis {...axisStyle} tick={{ fill: "#8a8a99" }} unit="%" />
        <Tooltip content={<DarkTooltip />} />
        <Area
          type="monotone"
          dataKey="cr"
          stroke="#ff6b33"
          strokeWidth={1.5}
          fill="url(#grad-cr)"
          name="CR (%)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function LeverageChart({ data }: { data: Row[] }) {
  return (
    <ResponsiveContainer>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="2 4" stroke="rgba(255,255,255,0.06)" />
        <XAxis dataKey="day" {...axisStyle} tick={{ fill: "#8a8a99" }} />
        <YAxis {...axisStyle} tick={{ fill: "#8a8a99" }} unit="×" />
        <Tooltip content={<DarkTooltip />} />
        <Line
          type="monotone"
          dataKey="leverage"
          stroke="#FF3D6E"
          strokeWidth={1.5}
          name="Leverage (×)"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function DarkTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-[#0a0d16]/95 border border-white/[0.10] px-3 py-2 tabular text-[11px] backdrop-blur">
      <div className="text-[10px] uppercase tracking-widest text-[var(--color-brand-300)] mb-1">
        DAY {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: p.color }} />
          <span className="text-white/55">{p.name}</span>
          <span className="ml-auto text-white/90">
            {typeof p.value === "number" ? p.value.toFixed(p.value < 10 ? 4 : 2) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}
