import { PublicClient } from "viem";

import { ThesisResponse } from "@/lib/api/types";
import {
  hasValidContractAddress,
  signalForceChainId,
  signalForceLedgerAbi,
  signalForceLedgerAddress
} from "@/lib/contracts/risk-ledger";

const POST_ACTION_TYPE = 0;
const ZERO_HASH = `0x${"0".repeat(64)}` as `0x${string}`;
const deployBlock = BigInt(process.env.NEXT_PUBLIC_SIGNAL_FORCE_DEPLOY_BLOCK || "0");
const configuredLimit = Number(process.env.NEXT_PUBLIC_ONCHAIN_FEED_LIMIT || "100");
const feedLimit = Number.isFinite(configuredLimit) && configuredLimit > 0 ? Math.min(configuredLimit, 500) : 100;
const configuredLookback = BigInt(process.env.NEXT_PUBLIC_ONCHAIN_FEED_LOOKBACK_BLOCKS || "3000");
const configuredRange = BigInt(process.env.NEXT_PUBLIC_ONCHAIN_LOG_BLOCK_RANGE || "2000");
const configuredMaxCalls = Number(process.env.NEXT_PUBLIC_ONCHAIN_MAX_LOG_CALLS || "350");
const maxCalls = Number.isFinite(configuredMaxCalls) && configuredMaxCalls > 0 ? configuredMaxCalls : 350;

function toIsoDate(timestamp: bigint | undefined) {
  if (!timestamp) {
    return new Date().toISOString();
  }

  return new Date(Number(timestamp) * 1000).toISOString();
}

function shortWallet(wallet: string) {
  return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
}

export async function listOnchainPosts(publicClient: PublicClient): Promise<ThesisResponse[]> {
  if (!hasValidContractAddress()) {
    return [];
  }

  const chainId = await publicClient.getChainId();
  if (chainId !== signalForceChainId) {
    return [];
  }

  const latestBlock = await publicClient.getBlockNumber();
  const startBlock = deployBlock > 0n ? deployBlock : (latestBlock > configuredLookback ? latestBlock - configuredLookback : 0n);

  let blockRange = configuredRange > 0n ? configuredRange : 2000n;
  let calls = 0;
  let cursor = latestBlock;
  const logs: Array<Record<string, unknown>> = [];

  while (cursor >= startBlock && calls < maxCalls) {
    const tentativeFrom = cursor >= (blockRange - 1n) ? cursor - (blockRange - 1n) : 0n;
    const fromBlock = tentativeFrom > startBlock ? tentativeFrom : startBlock;

    try {
      const batch = await publicClient.getLogs({
        address: signalForceLedgerAddress,
        event: signalForceLedgerAbi[0],
        fromBlock,
        toBlock: cursor
      });

      logs.push(...(batch as Array<Record<string, unknown>>));
      calls += 1;

      if (fromBlock === startBlock) {
        break;
      }

      cursor = fromBlock - 1n;
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const providerWantsTinyRange =
        (message.includes("10 block range") || message.includes("block range")) && blockRange > 10n;

      if (providerWantsTinyRange) {
        blockRange = 10n;
        continue;
      }

      throw error;
    }
  }

  const itemsById = new Map<string, ThesisResponse>();

  for (const rawLog of logs) {
    const log = rawLog as {
      args?: {
        actionId?: string;
        author?: `0x${string}`;
        actionType?: number | bigint;
        timestamp?: bigint;
        contentHash?: `0x${string}`;
      };
      transactionHash?: `0x${string}` | null;
    };

    const actionId = typeof log.args?.actionId === "string" ? log.args.actionId : undefined;
    const author = log.args?.author;
    const actionType = Number(log.args?.actionType ?? -1);
    if (!actionId || !author || actionType !== POST_ACTION_TYPE) {
      continue;
    }

    const createdAt = toIsoDate(log.args?.timestamp as bigint | undefined);
    const contentHash = (log.args?.contentHash as `0x${string}` | undefined) || ZERO_HASH;

    itemsById.set(actionId, {
      id: actionId,
      author_wallet: author,
      author_pseudonym: `Wallet ${shortWallet(author)}`,
      author_rank: "Bronce",
      asset: "ONCHAIN",
      horizon: "n/a",
      bias: "neutral",
      price_volatility: null,
      context_climate: null,
      expected_demand: null,
      author_confidence: null,
      risk_score: 50,
      risk_level: "medium",
      summary: `Publicacion anclada en blockchain (${actionId.slice(0, 8)}...)`,
      thesis_text: null,
      premium_text: null,
      is_premium: false,
      premium_price_wei: "0",
      premium_locked: false,
      evaluation_deadline: createdAt,
      reference_price: 0,
      invalidation_condition: null,
      status: "active",
      is_useful: null,
      resolution_note: null,
      post_hash: contentHash,
      tx_hash: (log.transactionHash as `0x${string}` | undefined) || null,
      chain_id: signalForceChainId,
      onchain_recorded_at: createdAt,
      likes_count: 0,
      comments_count: 0,
      created_at: createdAt,
      updated_at: createdAt,
      source: "onchain"
    });
  }

  return [...itemsById.values()]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, feedLimit);
}
