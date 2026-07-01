"use client";

import { AnchorProvider, BN, Idl, Program } from "@coral-xyz/anchor";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
} from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import twinyieldIdl from "./idl/twinyield.json";
import mocksIdl from "./idl/mocks.json";
import { PK, DEPLOYMENT } from "./deployment";

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
      priceOracle: PK.oracle,
      rateProvider: PK.rate,
      tokenProgram: TOKEN_PROGRAM_ID,
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
