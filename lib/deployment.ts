import { PublicKey } from "@solana/web3.js";
import raw from "../public/data/deployment.json";

export const FOGO_RPC = process.env.NEXT_PUBLIC_FOGO_RPC ?? "https://testnet.fogo.io";

export const DEPLOYMENT = raw as {
  network: string;
  rpc: string;
  deployedAt: string;
  admin: string;
  programs: { twinyield: string; rebalance_pool: string; mocks: string };
  mints: { base_gfogo: string; atoken_agfogo: string; xtoken_xgfogo: string };
  pdas: {
    treasury_config: string;
    treasury_runtime: string;
    market_config: string;
    harvest_config: string;
    pool_state: string;
    mock_oracle: string;
    mock_gfogo_rate: string;
  };
  atas: { treasury_base: string; pool_asset: string; pool_base: string };
  config: Record<string, string | number>;
};

export const PK = {
  twinyield: new PublicKey(DEPLOYMENT.programs.twinyield),
  mocks: new PublicKey(DEPLOYMENT.programs.mocks),
  rebalancePool: new PublicKey(DEPLOYMENT.programs.rebalance_pool),
  baseMint: new PublicKey(DEPLOYMENT.mints.base_gfogo),
  aMint: new PublicKey(DEPLOYMENT.mints.atoken_agfogo),
  xMint: new PublicKey(DEPLOYMENT.mints.xtoken_xgfogo),
  treasuryConfig: new PublicKey(DEPLOYMENT.pdas.treasury_config),
  treasuryRuntime: new PublicKey(DEPLOYMENT.pdas.treasury_runtime),
  marketConfig: new PublicKey(DEPLOYMENT.pdas.market_config),
  oracle: new PublicKey(DEPLOYMENT.pdas.mock_oracle),
  rate: new PublicKey(DEPLOYMENT.pdas.mock_gfogo_rate),
  treasuryBaseAta: new PublicKey(DEPLOYMENT.atas.treasury_base),
} as const;

export const PRECISION = 10n ** 18n;
export const TOKEN_SCALE = 10n ** 9n;
export const MAX_LEVERAGE = 100n * PRECISION;
