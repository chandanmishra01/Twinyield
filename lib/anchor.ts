"use client";

import { AnchorProvider, BN, Idl, Program } from "@coral-xyz/anchor";
import {
  AccountMeta,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import twinyieldIdl from "./idl/twinyield.json";
import mocksIdl from "./idl/mocks.json";
import rebalancePoolIdl from "./idl/rebalance_pool.json";
import { PK, DEPLOYMENT } from "./deployment";
import { depositorPda, fetchDepositor, ytPositionPda } from "./onchain";

export type WalletLike = {
  publicKey: PublicKey;
  signTransaction<T extends Transaction | VersionedTransaction>(t: T): Promise<T>;
  signAllTransactions<T extends Transaction | VersionedTransaction>(t: T[]): Promise<T[]>;
};

export function buildProvider(connection: Connection, wallet: WalletLike) {
  return new AnchorProvider(connection, wallet as never, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export function buildTwinyieldProgram(connection: Connection, wallet: WalletLike) {
  const provider = buildProvider(connection, wallet);
  return new Program(twinyieldIdl as Idl, provider);
}

export function buildMocksProgram(connection: Connection, wallet: WalletLike) {
  const provider = buildProvider(connection, wallet);
  return new Program(mocksIdl as Idl, provider);
}

export function buildRebalancePoolProgram(connection: Connection, wallet: WalletLike) {
  const provider = buildProvider(connection, wallet);
  return new Program(rebalancePoolIdl as Idl, provider);
}

async function ensureAta(
  conn: Connection,
  owner: PublicKey,
  mint: PublicKey,
  payer: PublicKey,
  preIxs: import("@solana/web3.js").TransactionInstruction[],
) {
  const ata = await getAssociatedTokenAddress(mint, owner, true);
  const info = await conn.getAccountInfo(ata);
  if (!info) {
    const { createAssociatedTokenAccountInstruction } = await import("@solana/spl-token");
    preIxs.push(createAssociatedTokenAccountInstruction(payer, ata, owner, mint));
  }
  return ata;
}

export async function mintAToken(
  conn: Connection,
  wallet: WalletLike,
  baseInUi: number,
): Promise<string> {
  const program = buildTwinyieldProgram(conn, wallet);
  const user = wallet.publicKey;
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userBase = await ensureAta(conn, user, PK.baseMint, user, preIxs);
  const userA = await ensureAta(conn, user, PK.aMint, user, preIxs);
  const adminBase = await getAssociatedTokenAddress(
    PK.baseMint,
    new PublicKey(DEPLOYMENT.admin),
    true,
  );

  const baseIn = new BN(Math.floor(baseInUi * 1e9));

  return await program.methods
    .mintAtoken(baseIn, new BN(0))
    .accounts({
      user,
      treasuryConfig: PK.treasuryConfig,
      treasuryRuntime: PK.treasuryRuntime,
      marketConfig: PK.marketConfig,
      baseMint: PK.baseMint,
      atokenMint: PK.aMint,
      xtokenMint: PK.xMint,
      userBaseAta: userBase,
      treasuryBaseAta: PK.treasuryBaseAta,
      platformBaseAta: adminBase,
      recipientAtokenAta: userA,
      // YT yield-accrual position for the recipient — checkpointed on mint so
      // freshly-minted agFOGO can't over-claim past yield (redesign).
      ytPosition: ytPositionPda(user),
      priceOracle: PK.oracle,
      rateProvider: PK.rate,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions(preIxs)
    .rpc();
}

// Collect accrued YT (agFOGO) staking yield. agFOGO holders earn the pool's
// yield via `harvest` → `yt_reward_index`; this pays out their share in gFOGO.
export async function claimYield(
  conn: Connection,
  wallet: WalletLike,
): Promise<string> {
  const program = buildTwinyieldProgram(conn, wallet);
  const user = wallet.publicKey;
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userA = await ensureAta(conn, user, PK.aMint, user, preIxs);
  const userBase = await ensureAta(conn, user, PK.baseMint, user, preIxs);

  return await program.methods
    .claimYield()
    .accounts({
      user,
      treasuryConfig: PK.treasuryConfig,
      treasuryRuntime: PK.treasuryRuntime,
      atokenMint: PK.aMint,
      userAtokenAta: userA,
      ytPosition: ytPositionPda(user),
      baseMint: PK.baseMint,
      treasuryBaseAta: PK.treasuryBaseAta,
      recipientBaseAta: userBase,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .preInstructions(preIxs)
    .rpc();
}

export async function mintXToken(
  conn: Connection,
  wallet: WalletLike,
  baseInUi: number,
): Promise<string> {
  const program = buildTwinyieldProgram(conn, wallet);
  const user = wallet.publicKey;
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userBase = await ensureAta(conn, user, PK.baseMint, user, preIxs);
  const userX = await ensureAta(conn, user, PK.xMint, user, preIxs);
  const adminBase = await getAssociatedTokenAddress(
    PK.baseMint,
    new PublicKey(DEPLOYMENT.admin),
    true,
  );

  const baseIn = new BN(Math.floor(baseInUi * 1e9));

  return await program.methods
    .mintXtoken(baseIn, new BN(0))
    .accounts({
      user,
      treasuryConfig: PK.treasuryConfig,
      treasuryRuntime: PK.treasuryRuntime,
      marketConfig: PK.marketConfig,
      baseMint: PK.baseMint,
      atokenMint: PK.aMint,
      xtokenMint: PK.xMint,
      userBaseAta: userBase,
      treasuryBaseAta: PK.treasuryBaseAta,
      platformBaseAta: adminBase,
      recipientXtokenAta: userX,
      priceOracle: PK.oracle,
      rateProvider: PK.rate,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preIxs)
    .rpc();
}

export async function redeem(
  conn: Connection,
  wallet: WalletLike,
  aInUi: number,
  xInUi: number,
): Promise<string> {
  const program = buildTwinyieldProgram(conn, wallet);
  const user = wallet.publicKey;
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userBase = await ensureAta(conn, user, PK.baseMint, user, preIxs);
  const userA = await ensureAta(conn, user, PK.aMint, user, preIxs);
  const userX = await ensureAta(conn, user, PK.xMint, user, preIxs);
  const adminBase = await getAssociatedTokenAddress(
    PK.baseMint,
    new PublicKey(DEPLOYMENT.admin),
    true,
  );

  return await program.methods
    .redeem(
      new BN(Math.floor(aInUi * 1e9)),
      new BN(Math.floor(xInUi * 1e9)),
      new BN(0),
    )
    .accounts({
      user,
      treasuryConfig: PK.treasuryConfig,
      treasuryRuntime: PK.treasuryRuntime,
      marketConfig: PK.marketConfig,
      baseMint: PK.baseMint,
      atokenMint: PK.aMint,
      xtokenMint: PK.xMint,
      userAtokenAta: userA,
      userXtokenAta: userX,
      treasuryBaseAta: PK.treasuryBaseAta,
      platformBaseAta: adminBase,
      recipientBaseAta: userBase,
      priceOracle: PK.oracle,
      rateProvider: PK.rate,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preIxs)
    .rpc();
}

export async function mockMintGfogo(
  conn: Connection,
  wallet: WalletLike,
  amountUi: number,
): Promise<string> {
  return mockMintGfogoTo(conn, wallet, wallet.publicKey, amountUi);
}

export async function mockMintGfogoTo(
  conn: Connection,
  wallet: WalletLike,
  recipientOwner: PublicKey,
  amountUi: number,
): Promise<string> {
  const program = buildMocksProgram(conn, wallet);
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];
  const recipientAta = await ensureAta(
    conn,
    recipientOwner,
    PK.baseMint,
    wallet.publicKey,
    preIxs,
  );
  return await program.methods
    .mockGfogoMintTo(new BN(Math.floor(amountUi * 1e9)))
    .accounts({
      admin: wallet.publicKey,
      rate: PK.rate,
      mint: PK.baseMint,
      recipient: recipientAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(preIxs)
    .rpc();
}

function toScaled18(amountUi: number): BN {
  const PRECISION = 1_000_000_000_000_000_000n; // 10^18
  const [int, fracRaw = ""] = amountUi.toString().split(".");
  const frac = (fracRaw + "0".repeat(18)).slice(0, 18);
  const value = BigInt(int) * PRECISION + BigInt(frac || "0");
  return new BN(value.toString());
}

export async function mockSetPrice(
  conn: Connection,
  wallet: WalletLike,
  newPriceUi: number,
): Promise<string> {
  const program = buildMocksProgram(conn, wallet);
  return await program.methods
    .mockSetPrice(toScaled18(newPriceUi))
    .accounts({
      admin: wallet.publicKey,
      oracle: PK.oracle,
    })
    .rpc();
}

export async function mockSetRate(
  conn: Connection,
  wallet: WalletLike,
  newRateUi: number,
): Promise<string> {
  const program = buildMocksProgram(conn, wallet);
  return await program.methods
    .mockSetRate(toScaled18(newRateUi))
    .accounts({
      admin: wallet.publicKey,
      rate: PK.rate,
    })
    .rpc();
}

export async function mockOracleTransferAdmin(
  conn: Connection,
  wallet: WalletLike,
  newAdmin: PublicKey,
): Promise<string> {
  const program = buildMocksProgram(conn, wallet);
  return await program.methods
    .mockOracleTransferAdmin(newAdmin)
    .accounts({
      admin: wallet.publicKey,
      oracle: PK.oracle,
    })
    .rpc();
}

export async function mockGfogoTransferAdmin(
  conn: Connection,
  wallet: WalletLike,
  newAdmin: PublicKey,
): Promise<string> {
  const program = buildMocksProgram(conn, wallet);
  return await program.methods
    .mockGfogoTransferAdmin(newAdmin)
    .accounts({
      admin: wallet.publicKey,
      rate: PK.rate,
    })
    .rpc();
}

/* --------------------------------------------------------------------------
 *  RebalancePool (stability pool)
 * ------------------------------------------------------------------------ */

const BASE_CHECKPOINT_SEED = "rebal_base_ckpt";

function u64le(v: bigint): Buffer {
  return new BN(v.toString()).toArrayLike(Buffer, "le", 8);
}

// The pool's `refresh_depositor` credits base rewards by reading the S-sum at
// the depositor's snapshot scale and the next scale. When those live in past
// `(epoch, scale)` checkpoint PDAs (i.e. after liquidations bumped the scale),
// the program expects them attached as remaining accounts. On a pristine
// testnet with no liquidations these don't exist, so this returns []. Attaching
// only accounts that actually exist keeps us correct in both cases.
async function baseCheckpointRemaining(
  conn: Connection,
  snapEpoch: bigint,
  snapScale: bigint,
): Promise<AccountMeta[]> {
  const metas: AccountMeta[] = [];
  for (const scale of [snapScale, snapScale + 1n]) {
    const pda = PublicKey.findProgramAddressSync(
      [Buffer.from(BASE_CHECKPOINT_SEED), u64le(snapEpoch), u64le(scale)],
      PK.rebalancePool,
    )[0];
    const info = await conn.getAccountInfo(pda);
    if (info) metas.push({ pubkey: pda, isWritable: false, isSigner: false });
  }
  return metas;
}

// Deposit agFOGO into the stability pool. Auto-creates the caller's Depositor
// PDA on first deposit (bundled as a pre-instruction, so it stays one signature).
export async function poolDeposit(
  conn: Connection,
  wallet: WalletLike,
  amountUi: number,
): Promise<string> {
  const program = buildRebalancePoolProgram(conn, wallet);
  const user = wallet.publicKey;
  const dep = depositorPda(user);
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userA = await ensureAta(conn, user, PK.aMint, user, preIxs);

  const view = await fetchDepositor(conn, user);
  if (!view.exists) {
    preIxs.push(
      await program.methods
        .initializeDepositor()
        .accounts({
          user,
          poolState: PK.poolState,
          depositor: dep,
          systemProgram: SystemProgram.programId,
        })
        .instruction(),
    );
  }

  const remaining = view.exists
    ? await baseCheckpointRemaining(conn, view.snapEpoch, view.snapScale)
    : [];

  return await program.methods
    .deposit(new BN(Math.floor(amountUi * 1e9)))
    .accounts({
      user,
      poolState: PK.poolState,
      depositor: dep,
      assetMint: PK.aMint,
      userAssetAta: userA,
      poolAssetAta: PK.poolAssetAta,
      baseMint: PK.baseMint,
      poolBaseAta: PK.poolBaseAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remaining)
    .preInstructions(preIxs)
    .rpc();
}

// Begin the cooldown on `amountUi` of staked agFOGO (step 1 of withdrawal).
export async function poolUnlock(
  conn: Connection,
  wallet: WalletLike,
  amountUi: number,
): Promise<string> {
  const program = buildRebalancePoolProgram(conn, wallet);
  const user = wallet.publicKey;
  const dep = depositorPda(user);
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userA = await ensureAta(conn, user, PK.aMint, user, preIxs);
  const view = await fetchDepositor(conn, user);
  const remaining = await baseCheckpointRemaining(conn, view.snapEpoch, view.snapScale);

  return await program.methods
    .unlock(new BN(Math.floor(amountUi * 1e9)))
    .accounts({
      user,
      poolState: PK.poolState,
      depositor: dep,
      assetMint: PK.aMint,
      userAssetAta: userA,
      poolAssetAta: PK.poolAssetAta,
      baseMint: PK.baseMint,
      poolBaseAta: PK.poolBaseAta,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remaining)
    .preInstructions(preIxs)
    .rpc();
}

// Withdraw unlocked agFOGO back to the wallet (step 2, after the cooldown).
// `doClaim` also sweeps pending base (gFOGO) rewards in the same tx.
export async function poolWithdraw(
  conn: Connection,
  wallet: WalletLike,
  doClaim: boolean,
): Promise<string> {
  const program = buildRebalancePoolProgram(conn, wallet);
  const user = wallet.publicKey;
  const dep = depositorPda(user);
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userA = await ensureAta(conn, user, PK.aMint, user, preIxs);
  const userBase = await ensureAta(conn, user, PK.baseMint, user, preIxs);
  const view = await fetchDepositor(conn, user);
  const remaining = await baseCheckpointRemaining(conn, view.snapEpoch, view.snapScale);

  return await program.methods
    .withdrawUnlocked(doClaim, false)
    .accounts({
      user,
      poolState: PK.poolState,
      depositor: dep,
      assetMint: PK.aMint,
      userAssetAta: userA,
      poolAssetAta: PK.poolAssetAta,
      baseMint: PK.baseMint,
      poolBaseAta: PK.poolBaseAta,
      userBaseAta: userBase,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remaining)
    .preInstructions(preIxs)
    .rpc();
}

// Claim accrued base (gFOGO) rewards without touching the staked principal.
export async function poolClaimBase(
  conn: Connection,
  wallet: WalletLike,
): Promise<string> {
  const program = buildRebalancePoolProgram(conn, wallet);
  const user = wallet.publicKey;
  const dep = depositorPda(user);
  const preIxs: import("@solana/web3.js").TransactionInstruction[] = [];

  const userBase = await ensureAta(conn, user, PK.baseMint, user, preIxs);
  const view = await fetchDepositor(conn, user);
  const remaining = await baseCheckpointRemaining(conn, view.snapEpoch, view.snapScale);

  return await program.methods
    .claimBase()
    .accounts({
      user,
      poolState: PK.poolState,
      depositor: dep,
      baseMint: PK.baseMint,
      poolBaseAta: PK.poolBaseAta,
      userBaseAta: userBase,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .remainingAccounts(remaining)
    .preInstructions(preIxs)
    .rpc();
}
