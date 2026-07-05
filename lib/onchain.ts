import { Connection, PublicKey } from "@solana/web3.js";
import { getAccount, getMint } from "@solana/spl-token";
import { BorshAccountsCoder, Idl } from "@coral-xyz/anchor";
import { PK, PRECISION, TOKEN_SCALE, MAX_LEVERAGE } from "./deployment";
import rebalancePoolIdl from "./idl/rebalance_pool.json";
import twinyieldIdl from "./idl/twinyield.json";

// Read-only Borsh coders. Decoding through the IDL keeps us correct even if the
// on-chain struct layout shifts (e.g. an inserted field), unlike hand-rolled
// byte offsets — important now that TreasuryRuntime carries the YT yield index.
const poolCoder = new BorshAccountsCoder(rebalancePoolIdl as Idl);
const twinyieldCoder = new BorshAccountsCoder(twinyieldIdl as Idl);

export const DEPOSITOR_SEED = "rebal_depositor";
export const YT_POSITION_SEED = "yt_position";

export function depositorPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(DEPOSITOR_SEED), user.toBuffer()],
    PK.rebalancePool,
  )[0];
}

// Per-holder YT (agFOGO) yield-accrual position — seeds ["yt_position", owner].
export function ytPositionPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(YT_POSITION_SEED), user.toBuffer()],
    PK.twinyield,
  )[0];
}

export interface PoolStateView {
  totalSupply9: bigint; // agFOGO currently staked
  totalUnlocking9: bigint; // agFOGO in the unlock cooldown
  unlockDuration: bigint; // seconds between unlock and withdraw
  epoch: bigint;
  scale: bigint;
  liquidatableCr: bigint; // 1e18-scaled CR threshold
}

export async function fetchPoolState(conn: Connection): Promise<PoolStateView | null> {
  const info = await conn.getAccountInfo(PK.poolState);
  if (!info) return null;
  const d = poolCoder.decode("PoolState", info.data as Buffer);
  return {
    totalSupply9: BigInt(d.total_supply.toString()),
    totalUnlocking9: BigInt(d.total_unlocking.toString()),
    unlockDuration: BigInt(d.unlock_duration.toString()),
    epoch: BigInt(d.epoch.toString()),
    scale: BigInt(d.scale.toString()),
    liquidatableCr: BigInt(d.liquidatable_cr.toString()),
  };
}

export interface DepositorView {
  exists: boolean;
  initialDeposit9: bigint; // active staked agFOGO
  initialUnlockAmount9: bigint; // agFOGO unlocking
  initialUnlockAt: bigint; // unix ts when withdrawable
  basePending9: bigint; // pending base (gFOGO) reward, 9-dec units
  snapEpoch: bigint;
  snapScale: bigint;
}

export async function fetchDepositor(
  conn: Connection,
  user: PublicKey,
): Promise<DepositorView> {
  const info = await conn.getAccountInfo(depositorPda(user));
  if (!info) {
    return {
      exists: false,
      initialDeposit9: 0n,
      initialUnlockAmount9: 0n,
      initialUnlockAt: 0n,
      basePending9: 0n,
      snapEpoch: 0n,
      snapScale: 0n,
    };
  }
  const d = poolCoder.decode("Depositor", info.data as Buffer);
  return {
    exists: true,
    initialDeposit9: BigInt(d.initial_deposit.toString()),
    initialUnlockAmount9: BigInt(d.initial_unlock_amount.toString()),
    initialUnlockAt: BigInt(d.initial_unlock_at.toString()),
    basePending9: BigInt(d.base_pending.toString()),
    snapEpoch: BigInt(d.snap_epoch.toString()),
    snapScale: BigInt(d.snap_scale.toString()),
  };
}

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

// Borsh-decoded (EmaStorage sits before the YT fields, so hand-rolled offsets
// for yt_reward_index would be fragile — decode through the IDL instead).
export function decodeTreasuryRuntime(buf: Buffer): {
  totalBase9: bigint;
  ytRewardIndex: bigint;
  ytYieldReserve9: bigint;
} {
  const d = twinyieldCoder.decode("TreasuryRuntime", buf) as {
    total_base_token: { toString(): string };
    yt_reward_index: { toString(): string };
    yt_yield_reserve: { toString(): string };
  };
  return {
    totalBase9: BigInt(d.total_base_token.toString()),
    ytRewardIndex: BigInt(d.yt_reward_index.toString()),
    ytYieldReserve9: BigInt(d.yt_yield_reserve.toString()),
  };
}

export interface YtPositionView {
  exists: boolean;
  rewardDebtIndex: bigint;
  unclaimed9: bigint;
  claimable9: bigint; // unclaimed + pending, in 9-dec gFOGO units
}

// A holder's claimable YT yield = unclaimed + balance * (index - debt) / 1e18.
// Mirrors the on-chain `YtPosition::pending` + `unclaimed` exactly. A missing
// position means the holder hasn't registered yet → nothing claimable.
export async function fetchYtPosition(
  conn: Connection,
  user: PublicKey,
  aBalance9: bigint,
  ytRewardIndex: bigint,
): Promise<YtPositionView> {
  const info = await conn.getAccountInfo(ytPositionPda(user));
  if (!info) {
    return { exists: false, rewardDebtIndex: 0n, unclaimed9: 0n, claimable9: 0n };
  }
  const d = twinyieldCoder.decode("YtPosition", info.data as Buffer) as {
    reward_debt_index: { toString(): string };
    unclaimed: { toString(): string };
  };
  const rewardDebtIndex = BigInt(d.reward_debt_index.toString());
  const unclaimed9 = BigInt(d.unclaimed.toString());
  const delta = ytRewardIndex > rewardDebtIndex ? ytRewardIndex - rewardDebtIndex : 0n;
  const pending9 = (aBalance9 * delta) / PRECISION;
  return { exists: true, rewardDebtIndex, unclaimed9, claimable9: unclaimed9 + pending9 };
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
  ytRewardIndex: bigint; // cumulative YT yield-per-token (1e18-scaled)
  ytYieldReserve9: bigint; // gFOGO retained in the treasury for YT holders
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
  const { totalBase9, ytRewardIndex, ytYieldReserve9 } = decodeTreasuryRuntime(
    runtimeInfo.data as Buffer,
  );
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
    ytRewardIndex,
    ytYieldReserve9,
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
