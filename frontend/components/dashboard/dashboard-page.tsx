"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAccount, useChainId, usePublicClient, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { HistoryTable } from "@/components/dashboard/history-table";
import { RankBadge } from "@/components/dashboard/rank-badge";
import { ResultCard } from "@/components/dashboard/result-card";
import { RiskForm, type RiskFormValues } from "@/components/dashboard/risk-form";
import { Badge } from "@/components/ui/badge";
import { createThesis, listFeed, registerThesisOnchain, walletLogin } from "@/lib/api/client";
import { ProfileResponse, ThesisResponse } from "@/lib/api/types";
import {
  hasValidContractAddress,
  signalForceLedgerAbi,
  signalForceChainId,
  signalForceLedgerAddress
} from "@/lib/contracts/risk-ledger";
import { extractWriteErrorMessage, maybeEstimateBufferedGas } from "@/lib/contracts/write-ledger";

import { WalletButton } from "../wallet/wallet-button";

export function DashboardPage() {
  const [feed, setFeed] = useState<ThesisResponse[]>([]);
  const [result, setResult] = useState<ThesisResponse | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingFeed, setLoadingFeed] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [chainError, setChainError] = useState<string | null>(null);
  const [chainSuccess, setChainSuccess] = useState<string | null>(null);
  const [pendingThesisId, setPendingThesisId] = useState<string | null>(null);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();
  const [syncingBackend, setSyncingBackend] = useState(false);

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync, isPending: writingTx } = useWriteContract();
  const { isLoading: confirmingTx, isSuccess: confirmedTx, error: receiptError } = useWaitForTransactionReceipt({
    hash: pendingTxHash
  });

  const refreshFeed = useCallback(async () => {
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const response = await listFeed({ viewerWallet: address, onlyFollowing: false });
      setFeed(response.items);
    } catch {
      setFeedError("No se pudo cargar el feed.");
    } finally {
      setLoadingFeed(false);
    }
  }, [address]);

  useEffect(() => {
    void refreshFeed();
  }, [refreshFeed]);

  useEffect(() => {
    async function syncWalletProfile() {
      if (!isConnected || !address) {
        setProfile(null);
        return;
      }

      try {
        const response = await walletLogin({ wallet_address: address });
        setProfile(response.profile);
      } catch {
        setProfile(null);
      }
    }

    void syncWalletProfile();
  }, [address, isConnected]);

  useEffect(() => {
    if (receiptError) {
      setChainError(receiptError.message);
    }
  }, [receiptError]);

  useEffect(() => {
    async function syncOnchainResult() {
      if (!confirmedTx || !pendingTxHash || !pendingThesisId || !address) {
        return;
      }

      setSyncingBackend(true);
      setChainError(null);

      try {
        const updated = await registerThesisOnchain(pendingThesisId, {
          wallet_address: address,
          tx_hash: pendingTxHash,
          chain_id: chainId
        });

        setResult(updated);
        setChainSuccess(`Publicacion anclada: ${pendingTxHash.slice(0, 10)}...`);
        await refreshFeed();
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : "Fallo al sincronizar transaccion en backend.";
        setChainError(message);
      } finally {
        setPendingTxHash(undefined);
        setPendingThesisId(null);
        setSyncingBackend(false);
      }
    }

    void syncOnchainResult();
  }, [address, chainId, confirmedTx, pendingThesisId, pendingTxHash, refreshFeed]);

  async function handleCreate(values: RiskFormValues) {
    setLoadingCreate(true);
    setError(null);
    setChainError(null);
    setChainSuccess(null);
    setResult(null);

    try {
      if (!address) {
        throw new Error("Conecta tu wallet para crear tesis.");
      }

      const response = await createThesis({
        author_wallet: address,
        asset: values.asset,
        horizon: values.horizon,
        bias: values.bias,
        price_volatility: values.priceVolatility,
        expected_demand: values.expectedDemand,
        summary: values.summary,
        thesis_text: values.thesisText,
        premium_text: values.premiumText,
        is_premium: values.isPremium,
        premium_price_wei: values.isPremium ? values.premiumPriceWei : "0",
        invalidation_condition: values.invalidationCondition
      });

      setResult(response);
      await refreshFeed();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : "No se pudo crear la tesis.";
      setError(message);
    } finally {
      setLoadingCreate(false);
    }
  }

  async function handleRecordOnchain() {
    setChainError(null);
    setChainSuccess(null);

    if (!result) {
      setChainError("Primero debes crear una tesis.");
      return;
    }

    if (result.tx_hash || result.onchain_recorded_at || result.status !== "pending_onchain") {
      setChainSuccess("Esta publicacion ya fue anclada en blockchain.");
      return;
    }

    if (!isConnected || !address) {
      setChainError("Conecta tu wallet para registrar la publicacion en blockchain.");
      return;
    }

    if (!hasValidContractAddress()) {
      setChainError("Configura NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS con el contrato desplegado.");
      return;
    }

    if (chainId !== signalForceChainId) {
      setChainError(`Cambia de red en MetaMask. Red actual: ${chainId}. Red esperada: ${signalForceChainId}.`);
      return;
    }

    try {
      let estimatedGas = 350000n;

      if (publicClient) {
        try {
          const existingPostLogs = await publicClient.getLogs({
            address: signalForceLedgerAddress,
            event: signalForceLedgerAbi[0],
            args: {
              actionId: result.id,
              author: address
            },
            fromBlock: "earliest",
            toBlock: "latest"
          });

          if (existingPostLogs.length > 0) {
            const existingTxHash = existingPostLogs[existingPostLogs.length - 1]?.transactionHash;
            if (existingTxHash) {
              const synced = await registerThesisOnchain(result.id, {
                wallet_address: address,
                tx_hash: existingTxHash,
                chain_id: chainId
              });

              setResult(synced);
              setChainSuccess(`La publicacion ya estaba anclada. Sincronizada con tx ${existingTxHash.slice(0, 10)}...`);
              await refreshFeed();
              return;
            }
          }

          estimatedGas = await maybeEstimateBufferedGas({
            publicClient,
            abi: signalForceLedgerAbi,
            address: signalForceLedgerAddress,
            functionName: "recordPost",
            args: [result.id, result.post_hash],
            account: address
          });
        } catch {
          estimatedGas = 350000n;
        }
      }

      const txHash = await writeContractAsync({
        abi: signalForceLedgerAbi,
        address: signalForceLedgerAddress,
        functionName: "recordPost",
        args: [result.id, result.post_hash],
        account: address,
        gas: estimatedGas
      });

      setPendingThesisId(result.id);
      setPendingTxHash(txHash);
      setChainSuccess(`Transaccion enviada: ${txHash.slice(0, 10)}...`);
    } catch (chainTxError) {
      const message = extractWriteErrorMessage(chainTxError, "No fue posible registrar en blockchain.");

      if (message.includes("post already anchored")) {
        setChainError("La publicacion ya estaba registrada on-chain. Refresca el feed para sincronizar estado.");
        return;
      }

      if (message.includes("post id required") || message.includes("post hash required")) {
        setChainError("La publicacion no tiene datos validos para anclaje (postId/postHash).");
        return;
      }

      if (message.includes("EnforcedPause")) {
        setChainError("El contrato esta pausado y no acepta publicaciones temporalmente.");
        return;
      }

      if (message.includes("execution reverted")) {
        setChainError(
          `El contrato rechazo la publicacion (revert). Verifica que ${signalForceLedgerAddress} sea SignalForceLedger en Sepolia.`
        );
        return;
      }

      setChainError(message);
    }
  }

  const recordingOnchain = writingTx || confirmingTx || syncingBackend;
  const canRecordOnchain =
    Boolean(result && isConnected && !result.tx_hash && result.status === "pending_onchain") && !recordingOnchain;

  const stats = useMemo(
    () => ({
      total: feed.length,
      anchored: feed.filter((item) => item.tx_hash).length,
      premium: feed.filter((item) => item.is_premium).length
    }),
    [feed]
  );

  return (
    <main className="relative min-h-screen overflow-hidden pb-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(14,116,144,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.15),transparent_30%)]" />

      <div className="container space-y-6 py-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-sm md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <Badge variant="secondary">SignalForce · Social + On-chain</Badge>
            <div>
              <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">SignalForce</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Red social pseudonima de tesis y senales de mercado con trazabilidad en Sepolia.
              </p>
              {profile && (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{profile.pseudonym}</span>
                  <RankBadge rank={profile.rank} />
                </div>
              )}
            </div>
          </div>

          <WalletButton />
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border/70 bg-card/90 p-4">
            <p className="text-xs uppercase text-muted-foreground">Tesis</p>
            <p className="font-display text-3xl font-semibold">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/90 p-4">
            <p className="text-xs uppercase text-muted-foreground">Ancladas en blockchain</p>
            <p className="font-display text-3xl font-semibold">{stats.anchored}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/90 p-4">
            <p className="text-xs uppercase text-muted-foreground">Tesis premium</p>
            <p className="font-display text-3xl font-semibold">{stats.premium}</p>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <RiskForm isLoading={loadingCreate} onSubmit={handleCreate} />
          <ResultCard
            result={result}
            loading={loadingCreate}
            error={error}
            chainError={chainError}
            chainSuccess={chainSuccess}
            canRecordOnchain={canRecordOnchain}
            recordingOnchain={recordingOnchain}
            onRecordOnchain={handleRecordOnchain}
          />
        </section>

        <section className="rounded-xl border border-border/70 bg-card/90 p-4">
          <p className="text-xs uppercase text-muted-foreground">Contrato</p>
          <p className="truncate font-mono text-xs text-muted-foreground">{signalForceLedgerAddress}</p>
        </section>

        <HistoryTable items={feed} loading={loadingFeed} error={feedError} />
      </div>
    </main>
  );
}
