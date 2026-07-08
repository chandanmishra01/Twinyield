"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useIsAdmin } from "@/lib/hooks";

const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false },
);

type Tab = { href: string; label: string };

const BASE_TABS: Tab[] = [
  { href: "/mint", label: "App" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  // History hidden for now — re-enable for mainnet
  // { href: "/history", label: "History" },
  { href: "/faucet", label: "Faucet" },
];
const ADMIN_TAB: Tab = { href: "/admin", label: "Admin" };

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = useIsAdmin();
  const { connected, connecting, wallet } = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);

  // On refresh the wallet adapter restores the previously-selected wallet and
  // starts auto-connecting in a mount effect that runs *after* this component's
  // effects. So on the first tick `wallet` is null and `connecting` is false
  // even when the deployer is about to reconnect. Read the adapter's persisted
  // selection (localStorage key "walletName") during the first render so the
  // guard below doesn't kick the admin to /dashboard before the reconnect runs.
  const [autoReconnectPending] = useState(() => {
    try {
      return typeof window !== "undefined" && !!window.localStorage.getItem("walletName");
    } catch {
      return false;
    }
  });

  // The wallet auto-connects asynchronously after a refresh, so `isAdmin` is
  // briefly false on mount. Wait until the wallet state has settled — connected,
  // or (no reconnect pending, no wallet selected, and not mid-connect).
  const walletSettled =
    connected || (!autoReconnectPending && !wallet && !connecting);

  // Kick anyone off /admin who isn't the deployer (once the wallet has settled)
  useEffect(() => {
    if (walletSettled && pathname.startsWith("/admin") && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [walletSettled, pathname, isAdmin, router]);

  if (pathname === "/") return null;

  const tabs = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS;
  const activeLabel = tabs.find((t) => pathname.startsWith(t.href))?.label ?? "Menu";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#05070d]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
            <LogoMark />
            <span className="hidden sm:inline font-display text-lg text-white/90 tracking-tight">
              Twin<span className="text-[var(--color-brand-500)]">yield</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <nav className="hidden md:flex items-center gap-1 mr-1">
              {tabs.map((t) => {
                const active = pathname === t.href || pathname.startsWith(t.href + "/");
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      "px-4 py-2 rounded-full text-sm font-medium transition " +
                      (active
                        ? "bg-[var(--color-brand-500)] text-white shadow-sm"
                        : "text-white/75 hover:bg-white/[0.05] hover:text-white")
                    }
                  >
                    {t.label}
                  </Link>
                );
              })}
            </nav>

            <button
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Open menu"
              className="md:hidden flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--color-brand-500)] text-white text-xs font-medium shadow-sm hover:brightness-110 transition shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
              <span className="hidden sm:inline">{activeLabel}</span>
            </button>

            <div className="shrink-0">
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </header>

      {menuOpen && (
        <MobileMenu tabs={tabs} pathname={pathname} onClose={() => setMenuOpen(false)} />
      )}
    </>
  );
}

function MobileMenu({ tabs, pathname, onClose }: { tabs: Tab[]; pathname: string; onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      <div onClick={onClose} className="absolute inset-0 bg-[#05070d]/60 backdrop-blur-sm" />
      <div className="relative mt-16 sm:mt-20 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0a0d16]/95 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="font-display text-base text-white/90">Menu</div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="w-9 h-9 rounded-full border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition grid place-items-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        <nav className="p-3 flex flex-col gap-1">
          {tabs.map((t) => {
            const active = pathname === t.href || pathname.startsWith(t.href + "/");
            return (
              <Link
                key={t.href}
                href={t.href}
                onClick={onClose}
                className={
                  "w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition flex items-center justify-between " +
                  (active
                    ? "bg-[var(--color-brand-500)] text-white shadow-sm"
                    : "text-white/75 hover:bg-white/[0.05]")
                }
              >
                <span>{t.label}</span>
                {active && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 pb-4 pt-1">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full border border-white/[0.12] text-white/60 hover:border-[var(--color-brand-500)]/50 hover:text-[var(--color-brand-400)] font-semibold text-sm transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo.png"
      alt="TwinYield"
      width={size}
      height={size}
      className="object-contain"
      style={{
        width: size,
        height: size,
        filter: "drop-shadow(0 0 12px rgba(255, 107, 51, 0.35))",
      }}
    />
  );
}
