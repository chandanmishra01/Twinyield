"use client";

import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import dynamic from "next/dynamic";
import { PublicKey } from "@solana/web3.js";
import { useIsAdmin, useProtocolState } from "@/lib/hooks";
import { fetchAdminStatus } from "@/lib/onchain";
import { DEPLOYMENT } from "@/lib/deployment";
import { fmt18, fmtToken9 } from "@/lib/format";
import { classifyTxError } from "@/lib/txError";
import {
  mockSetPrice,
  mockSetRate,
  mockMintGfogoTo,
  mockOracleTransferAdmin,
  mockGfogoTransferAdmin,
} from "@/lib/anchor";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

type Status =
  | { kind: "idle" }
  | { kind: "ok"; msg: string; sig: string }
  | { kind: "err"; msg: string }
  | { kind: "cancelled"; msg: string };

export function AdminPanel() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const isAdmin = useIsAdmin();
  const { data: state, mutate: mutateState } = useProtocolState();

  const [isOracleAdmin, setIsOracleAdmin] = useState(false);
  const [isRateAdmin, setIsRateAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  // Detect admin authority on connect / state refresh
  useEffect(() => {
    let cancelled = false;
    if (!wallet.publicKey) {
      setIsOracleAdmin(false);
      setIsRateAdmin(false);
      return;
    }
    fetchAdminStatus(connection, wallet.publicKey).then((r) => {
      if (cancelled) return;
      setIsOracleAdmin(r.isOracleAdmin);
      setIsRateAdmin(r.isRateAdmin);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [connection, wallet.publicKey, state?.price18, state?.rate18]);

  const w = wallet.publicKey && wallet.signTransaction
    ? {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction.bind(wallet) as never,
        signAllTransactions: wallet.signAllTransactions!.bind(wallet) as never,
      }
    : null;

  const run = async (fn: () => Promise<string>, label: string) => {
    if (!w) {
      setStatus({ kind: "err", msg: "Connect wallet first" });
      return;
    }
    setBusy(true);
    setStatus({ kind: "idle" });
    try {
      const sig = await fn();
      setStatus({ kind: "ok", msg: `${label} confirmed`, sig });
      mutateState();
    } catch (e) {
      const { cancelled, message } = classifyTxError(e, 240);
      setStatus({ kind: cancelled ? "cancelled" : "err", msg: message });
    } finally {
      setBusy(false);
    }
  };

  if (!wallet.connected) {
    return (
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-24 pb-24 max-w-3xl mx-auto text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-brand-300)] mb-4">
          Wallet required
        </div>
        <h1 className="font-display text-[32px] sm:text-[40px] text-white tracking-tight mb-3">
          Admin Panel
        </h1>
        <p className="text-white/55 text-sm max-w-md mx-auto mb-8">
          Connect with the deployer wallet to operate the testnet oracle, rate
          provider, and admin mint.
        </p>
        <div className="flex justify-center">
          <WalletMultiButton />
        </div>
      </section>
    );
  }

  if (!isAdmin) {
    const me = wallet.publicKey!.toBase58();
    const meShort = `${me.slice(0, 4)}…${me.slice(-4)}`;
    const adminShort = `${DEPLOYMENT.admin.slice(0, 4)}…${DEPLOYMENT.admin.slice(-4)}`;
    return (
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-24 pb-24 max-w-3xl mx-auto text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-danger)] mb-4">
          Restricted
        </div>
        <h1 className="font-display text-[32px] sm:text-[40px] text-white tracking-tight mb-3">
          Admin only
        </h1>
        <p className="text-white/55 text-sm max-w-md mx-auto mb-2">
          This page is reserved for the wallet that deployed the TwinYield program.
        </p>
        <p className="text-white/40 text-xs tabular max-w-md mx-auto mb-8">
          Connected · <span className="text-white/70">{meShort}</span> · expected{" "}
          <span className="text-[var(--color-brand-300)]">{adminShort}</span>
        </p>
        <a
          href="/dashboard"
          className="btn-ghost inline-flex text-sm"
        >
          Back to Dashboard
        </a>
      </section>
    );
  }

  const anyAdmin = isOracleAdmin || isRateAdmin;
  const allAdmin = isOracleAdmin && isRateAdmin;

  return (
    <section className="relative px-4 sm:px-6 pt-8 sm:pt-12 pb-16 max-w-3xl mx-auto">
      <div className="mb-6 space-y-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--color-brand-300)]">
          Admin
        </div>
        <h1 className="font-display text-3xl sm:text-[40px] text-white tracking-tight">
          Admin Panel
        </h1>
        <div className="text-xs sm:text-sm text-white/55">
          You are{" "}
          {anyAdmin ? (
            <span className="text-[var(--color-brand-300)] font-semibold">
              {allAdmin ? "fully authorized" : isOracleAdmin ? "oracle admin only" : "rate admin only"}
            </span>
          ) : (
            <span className="text-[var(--color-danger)] font-semibold">not an admin</span>
          )}{" "}
          on gFOGO.
        </div>
      </div>

      {/* NAV preview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <NavTile
          label="agFOGO NAV"
          value={state ? `$${fmt18(state.aNav, 4)}` : "·"}
          sub={state ? `supply ${fmtToken9(state.aSupply9, 2)}` : ""}
          tone="pt"
        />
        <NavTile
          label="xgFOGO NAV"
          value={state ? `$${fmt18(state.xNav, 4)}` : "·"}
          sub={state ? `supply ${fmtToken9(state.xSupply9, 2)}` : ""}
          tone="yt"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Oracle price */}
        <OraclePriceCard
          state={state}
          busy={busy}
          disabled={!isOracleAdmin}
          onSet={(price) => run(() => mockSetPrice(connection, w!, price), "Set price")}
        />

        {/* Staking rate */}
        <StakingRateCard
          state={state}
          busy={busy}
          disabled={!isRateAdmin}
          onSet={(rate) => run(() => mockSetRate(connection, w!, rate), "Set rate")}
        />

        {/* Admin mint gFOGO */}
        <MintCard
          busy={busy}
          disabled={!isRateAdmin}
          onMint={(to, amt) =>
            run(() => mockMintGfogoTo(connection, w!, to, amt), "Mint")
          }
          selfPubkey={wallet.publicKey!.toBase58()}
        />

        {/* Transfer admin */}
        <TransferAdminCard
          busy={busy}
          isOracleAdmin={isOracleAdmin}
          isRateAdmin={isRateAdmin}
          onTransferOracle={(pk) =>
            run(() => mockOracleTransferAdmin(connection, w!, pk), "Transfer oracle admin")
          }
          onTransferRate={(pk) =>
            run(() => mockGfogoTransferAdmin(connection, w!, pk), "Transfer rate admin")
          }
        />
      </div>

      {status.kind === "ok" && (
        <div className="mt-4 px-3 py-2 rounded-xl border border-[var(--color-brand-500)]/40 bg-[var(--color-brand-500)]/10 text-[11px] tabular">
          <div className="uppercase tracking-widest text-[9px] mb-1 text-[var(--color-brand-300)]">
            OK
          </div>
          <div className="text-white/85">{status.msg}</div>
          <div className="text-[10px] text-white/45 mt-1 break-all">sig: {status.sig}</div>
        </div>
      )}
      {status.kind === "err" && (
        <div className="mt-4 px-3 py-2 rounded-xl border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 text-[11px] tabular">
          <div className="uppercase tracking-widest text-[9px] mb-1 text-[var(--color-danger)]">
            ERR
          </div>
          <div className="text-white/85 break-words">{status.msg}</div>
        </div>
      )}
      {status.kind === "cancelled" && (
        <div className="mt-4 px-3 py-2 rounded-xl border border-white/20 bg-white/[0.05] text-[11px] tabular">
          <div className="uppercase tracking-widest text-[9px] mb-1 text-white/60">
            CANCELLED
          </div>
          <div className="text-white/85 break-words">{status.msg}</div>
        </div>
      )}
    </section>
  );
}

/* ---------------- Sub-cards ---------------- */

function NavTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "pt" | "yt";
}) {
  const c = tone === "pt" ? "text-[var(--color-brand-300)]" : "text-[var(--color-yt-300)]";
  return (
    <div className="relative rounded-2xl glass p-4">
      <div className="absolute inset-0 noise opacity-20 pointer-events-none rounded-2xl" />
      <div className="relative">
        <div className={`text-[10px] uppercase tracking-widest ${c}`}>{label}</div>
        <div className="tabular text-xl sm:text-2xl font-semibold text-white mt-1">{value}</div>
        <div className="text-[11px] text-white/45 mt-1 tabular">{sub}</div>
      </div>
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl glass p-5 flex flex-col gap-3">
      <div className="absolute inset-0 noise opacity-20 pointer-events-none rounded-2xl" />
      <div className="relative">
        <div className="font-semibold text-white/90">{title}</div>
        {subtitle && <div className="text-xs text-white/45 mt-0.5">{subtitle}</div>}
      </div>
      <div className="relative flex flex-col gap-3">{children}</div>
    </div>
  );
}

const inputCls =
  "bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 outline-none text-white/85 placeholder:text-white/25 focus:border-[var(--color-brand-500)]/60 transition text-sm font-mono tabular";

const bumperCls =
  "px-2.5 py-1 rounded-lg text-xs font-semibold border border-white/[0.10] text-white/70 hover:border-[var(--color-brand-500)]/50 hover:text-[var(--color-brand-300)] transition disabled:opacity-40";

function OraclePriceCard({
  state,
  busy,
  disabled,
  onSet,
}: {
  state: ReturnType<typeof useProtocolState>["data"] | undefined;
  busy: boolean;
  disabled: boolean;
  onSet: (priceUi: number) => void;
}) {
  const [price, setPrice] = useState("");
  const current = state ? Number(state.price18) / 1e18 : 0;

  const bump = (pct: number) => {
    if (!current) return;
    const next = Math.max(0, current * (1 + pct / 100));
    onSet(Number(next.toFixed(8)));
  };

  return (
    <Card
      title="Oracle Price"
      subtitle={
        <>
          Current: ${current ? current.toFixed(4) : "·"} · drives agFOGO &amp; xgFOGO NAV
        </>
      }
    >
      <input
        type="number"
        min="0"
        placeholder="e.g. 100"
        value={price}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || parseFloat(v) >= 0) setPrice(v);
        }}
        className={inputCls}
        disabled={disabled || busy}
      />
      <button
        disabled={disabled || busy || !price}
        onClick={() => onSet(parseFloat(price))}
        className="btn-hemi py-2 text-sm disabled:opacity-50"
      >
        {busy ? "…" : "Set Price"}
      </button>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-white/40 self-center mr-1">
          Quick
        </span>
        {[-10, -5, 5, 10].map((p) => (
          <button
            key={p}
            disabled={disabled || busy || !current}
            onClick={() => bump(p)}
            className={bumperCls}
          >
            {p > 0 ? `+${p}%` : `${p}%`}
          </button>
        ))}
      </div>
      {disabled && (
        <div className="text-[10px] text-[var(--color-danger)] tabular">
          You are not the oracle admin.
        </div>
      )}
    </Card>
  );
}

function StakingRateCard({
  state,
  busy,
  disabled,
  onSet,
}: {
  state: ReturnType<typeof useProtocolState>["data"] | undefined;
  busy: boolean;
  disabled: boolean;
  onSet: (rateUi: number) => void;
}) {
  const [rate, setRate] = useState("");
  const current = state ? Number(state.rate18) / 1e18 : 0;

  const bump = (pct: number) => {
    if (!current) return;
    const next = Math.max(0, current * (1 + pct / 100));
    onSet(Number(next.toFixed(8)));
  };

  return (
    <Card
      title="Staking Rate (Yield)"
      subtitle={
        <>
          Current: {current ? current.toFixed(6) : "·"} · accrues yield to xgFOGO
        </>
      }
    >
      <input
        type="number"
        min="0"
        placeholder="e.g. 1.05"
        value={rate}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || parseFloat(v) >= 0) setRate(v);
        }}
        className={inputCls}
        disabled={disabled || busy}
      />
      <button
        disabled={disabled || busy || !rate}
        onClick={() => onSet(parseFloat(rate))}
        className="btn-hemi py-2 text-sm disabled:opacity-50"
      >
        {busy ? "…" : "Set Rate"}
      </button>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-widest text-white/40 self-center mr-1">
          Quick
        </span>
        {[-1, 1, 3, 5].map((p) => (
          <button
            key={p}
            disabled={disabled || busy || !current}
            onClick={() => bump(p)}
            className={bumperCls}
          >
            {p > 0 ? `+${p}%` : `${p}%`}
          </button>
        ))}
      </div>
      {disabled && (
        <div className="text-[10px] text-[var(--color-danger)] tabular">
          You are not the rate admin.
        </div>
      )}
    </Card>
  );
}

function MintCard({
  busy,
  disabled,
  onMint,
  selfPubkey,
}: {
  busy: boolean;
  disabled: boolean;
  onMint: (to: PublicKey, amountUi: number) => void;
  selfPubkey: string;
}) {
  const [to, setTo] = useState("");
  const [amt, setAmt] = useState("1000");

  const submit = () => {
    const recipient = to.trim() ? to.trim() : selfPubkey;
    try {
      const pk = new PublicKey(recipient);
      onMint(pk, parseFloat(amt));
    } catch {
      // invalid pubkey, leave silent; the parent's error banner is for tx errors
    }
  };

  return (
    <Card title="Mint gFOGO" subtitle="Admin-only faucet (mint to any wallet)">
      <input
        placeholder="Recipient (empty = self)"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className={inputCls}
        disabled={disabled || busy}
      />
      <input
        type="number"
        min="0"
        placeholder="Amount"
        value={amt}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "" || parseFloat(v) >= 0) setAmt(v);
        }}
        className={inputCls}
        disabled={disabled || busy}
      />
      <button
        disabled={disabled || busy || !amt}
        onClick={submit}
        className="btn-hemi py-2 text-sm disabled:opacity-50"
      >
        {busy ? "…" : "Mint"}
      </button>
      {disabled && (
        <div className="text-[10px] text-[var(--color-danger)] tabular">
          You are not the rate admin (rate authority signs the mint).
        </div>
      )}
    </Card>
  );
}

function TransferAdminCard({
  busy,
  isOracleAdmin,
  isRateAdmin,
  onTransferOracle,
  onTransferRate,
}: {
  busy: boolean;
  isOracleAdmin: boolean;
  isRateAdmin: boolean;
  onTransferOracle: (pk: PublicKey) => void;
  onTransferRate: (pk: PublicKey) => void;
}) {
  const [target, setTarget] = useState<"oracle" | "rate">("oracle");
  const [newAdmin, setNewAdmin] = useState("");

  const canSign = target === "oracle" ? isOracleAdmin : isRateAdmin;

  const submit = () => {
    try {
      const pk = new PublicKey(newAdmin.trim());
      if (target === "oracle") onTransferOracle(pk);
      else onTransferRate(pk);
    } catch {
      // invalid pubkey, silent
    }
  };

  return (
    <Card
      title="Transfer Admin"
      subtitle="Single-owner authority transfer for oracle or rate"
    >
      <div className="flex items-center gap-2 text-xs text-white/55">
        <span>Target:</span>
        <select
          value={target}
          onChange={(e) => setTarget(e.target.value as "oracle" | "rate")}
          className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-2 py-1 text-white/80 outline-none"
          disabled={busy}
        >
          <option value="oracle" className="bg-[#0a0d16]">Oracle</option>
          <option value="rate" className="bg-[#0a0d16]">Rate provider</option>
        </select>
      </div>
      <input
        placeholder="New admin pubkey"
        value={newAdmin}
        onChange={(e) => setNewAdmin(e.target.value)}
        className={inputCls}
        disabled={!canSign || busy}
      />
      <button
        disabled={!canSign || busy || !newAdmin.trim()}
        onClick={submit}
        className="btn-hemi py-2 text-sm disabled:opacity-50"
      >
        {busy ? "…" : "Transfer"}
      </button>
      {!canSign && (
        <div className="text-[10px] text-[var(--color-danger)] tabular">
          You are not the {target} admin.
        </div>
      )}
    </Card>
  );
}
