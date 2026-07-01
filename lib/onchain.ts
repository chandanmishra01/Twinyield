import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import { PK, PRECISION, TOKEN_SCALE, MAX_LEVERAGE } from "./deployment";

function readU64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset);
}

function readU128LE(buf: Buffer, offset: number): bigint {
  const lo = buf.readBigUInt64LE(offset);
  const hi = buf.readBigUInt64LE(offset + 8);
  return lo + (hi << 64n);
}

// Discriminator (8) + admin pubkey (32) = 40; then current_price (u128)
export function decodeOracle(buf: Buffer): { admin: PublicKey; price18: bigint; isValid: boolean } {
  const admin = new PublicKey(buf.subarray(8, 8 + 32));
  const price18 = readU128LE(buf, 8 + 32);
  const isValid = buf.readUInt8(8 + 32 + 16) === 1;
  return { admin, price18, isValid };
}

// Discriminator (8) + admin pubkey (32) + mint pubkey (32) = 72; then rate (u128)
export function decodeRate(buf: Buffer): { admin: PublicKey; rate18: bigint } {
  const admin = new PublicKey(buf.subarray(8, 8 + 32));
  const rate18 = readU128LE(buf, 8 + 32 + 32);
  return { admin, rate18 };
}

export async function fetchAdminStatus(
  conn: Connection,
  wallet: PublicKey,
): Promise<{ oracleAdmin: PublicKey | null; rateAdmin: PublicKey | null; isOracleAdmin: boolean; isRateAdmin: boolean }> {
  const [oracleInfo, rateInfo] = await Promise.all([
    conn.getAccountInfo(PK.oracle),
    conn.getAccountInfo(PK.rate),
  ]);
  const oracleAdmin = oracleInfo ? decodeOracle(oracleInfo.data as Buffer).admin : null;
  const rateAdmin = rateInfo ? decodeRate(rateInfo.data as Buffer).admin : null;
  return {
    oracleAdmin,
    rateAdmin,
    isOracleAdmin: !!oracleAdmin && oracleAdmin.equals(wallet),
    isRateAdmin: !!rateAdmin && rateAdmin.equals(wallet),
  };
}

// Discriminator (8); then total_base_token (u64)
export function decodeTreasuryRuntime(buf: Buffer): { totalBase9: bigint } {
  return { totalBase9: readU64LE(buf, 8) };
}

export interface ProtocolState {
  price18: bigint;
  rate18: bigint;
  totalBase9: bigint;
  aSupply9: bigint;
  xSupply9: bigint;
  treasuryAta9: bigint;
  aNav: bigint;
  xNav: bigint;
  cr: bigint;
  leverage: bigint;
}

export async function fetchProtocolState(conn: Connection): Promise<ProtocolState> {
  const [oracleInfo, rateInfo, runtimeInfo, aMint, xMint, treasuryAta] = await Promise.all([
    conn.getAccountInfo(PK.oracle),
    conn.getAccountInfo(PK.rate),
    conn.getAccountInfo(PK.treasuryRuntime),
    getMint(conn, PK.aMint),
    getMint(conn, PK.xMint),
    getAccount(conn, PK.treasuryBaseAta),
  ]);

  if (!oracleInfo || !rateInfo || !runtimeInfo) {
    throw new Error("missing on-chain accounts");
  }

  const { price18 } = decodeOracle(oracleInfo.data as Buffer);
  const { rate18 } = decodeRate(rateInfo.data as Buffer);
  const { totalBase9 } = decodeTreasuryRuntime(runtimeInfo.data as Buffer);
  const aSupply9 = aMint.supply;
  const xSupply9 = xMint.supply;
  const treasuryAta9 = treasuryAta.amount;

  return {
    price18,
    rate18,
    totalBase9,
    aSupply9,
    xSupply9,
    treasuryAta9,
    ...deriveNavs({ totalBase9, aSupply9, xSupply9, price18 }),
  };
}

export function deriveNavs(args: {
  totalBase9: bigint;
  aSupply9: bigint;
  xSupply9: bigint;
  price18: bigint;
}): { aNav: bigint; xNav: bigint; cr: bigint; leverage: bigint } {
  const { totalBase9, aSupply9, xSupply9, price18 } = args;
  const base18 = totalBase9 * TOKEN_SCALE;
  const a18 = aSupply9 * TOKEN_SCALE;
  const x18 = xSupply9 * TOKEN_SCALE;

  let xNav: bigint;
  if (base18 === 0n || x18 === 0n) xNav = PRECISION;
  else {
    const baseVal = base18 * price18;
    const aVal = a18 * PRECISION;
    xNav = baseVal >= aVal ? (baseVal - aVal) / x18 : 0n;
  }
  let aNav: bigint;
  if (a18 > 0n && xNav === 0n) aNav = (price18 * base18) / a18;
  else aNav = PRECISION;
  let cr: bigint;
  if (base18 === 0n) cr = PRECISION;
  else if (a18 === 0n) cr = PRECISION * PRECISION;
  else cr = (base18 * price18) / a18;

  let leverage: bigint;
  if (base18 === 0n || price18 === 0n) leverage = 0n;
  else {
    const rho = (a18 * PRECISION * PRECISION) / (base18 * price18);
    if (rho >= PRECISION) leverage = MAX_LEVERAGE;
    else {
      leverage = (PRECISION * PRECISION) / (PRECISION - rho);
      if (leverage > MAX_LEVERAGE) leverage = MAX_LEVERAGE;
    }
  }
  return { aNav, xNav, cr, leverage };
}

export async function fetchTokenBalance(
  conn: Connection,
  mint: PublicKey,
  owner: PublicKey,
): Promise<bigint> {
  try {
    const { getAssociatedTokenAddress } = await import("@solana/spl-token");
    const ata = await getAssociatedTokenAddress(mint, owner, true);
    const acct = await conn.getAccountInfo(ata);
    if (!acct) return 0n;
    // SPL token amount is at byte offset 64 (mint 32 + owner 32) as u64
    return readU64LE(acct.data as Buffer, 64);
  } catch {
    return 0n;
  }
}
