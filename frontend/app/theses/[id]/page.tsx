"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useWaitForTransactionReceipt, useWriteContract } from "wagmi";

import { CommentBox } from "@/components/dashboard/comment-box";
import { PremiumLock } from "@/components/dashboard/premium-lock";
import { RankBadge } from "@/components/dashboard/rank-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createComment,
  createSubscription,
  followCreator,
  getThesis,
  likeThesis,
  listComments,
  registerCommentOnchain,
  registerSubscriptionOnchain,
  unlikeThesis,
  walletLogin
} from "@/lib/api/client";
import { CommentResponse, ProfileResponse, ThesisResponse } from "@/lib/api/types";
import {
  hasValidContractAddress,
  signalForceLedgerAbi,
  signalForceChainId,
  signalForceLedgerAddress
} from "@/lib/contracts/risk-ledger";
import { extractWriteErrorMessage } from "@/lib/contracts/write-ledger";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
}

function formatEth(wei: string) {
  try {
    const value = BigInt(wei);
    const base = 10n ** 18n;
    const whole = value / base;
    const fraction = (value % base).toString().padStart(18, "0").slice(0, 4);
    return `${whole}.${fraction}`;
  } catch {
    return "0.0000";
  }
}

export default function ThesisDetailPage() {
  const params = useParams<{ id: string }>();
  const thesisId = params?.id ?? "";

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync, isPending: writingTx } = useWriteContract();

  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [thesis, setThesis] = useState<ThesisResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);

  const [pendingAction, setPendingAction] = useState<{ type: "comment" | "subscription"; id: string } | null>(null);
  const [pendingTxHash, setPendingTxHash] = useState<`0x${string}` | undefined>();
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const { isLoading: confirmingTx, isSuccess: confirmedTx, error: receiptError } = useWaitForTransactionReceipt({
    hash: pendingTxHash
  });

  const refresh = useCallback(async () => {
    if (!thesisId) {
      setLoading(false);
      setError("ID de tesis invalido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [thesisData, commentData] = await Promise.all([getThesis(thesisId, address), listComments(thesisId, address)]);
      setThesis(thesisData);
      setComments(commentData);
    } catch {
      setError("No se pudo cargar el detalle de la tesis.");
    } finally {
      setLoading(false);
    }
  }, [address, thesisId]);

  useEffect(() => {
    async function syncProfile() {
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

    void syncProfile();
  }, [address, isConnected]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!receiptError) {
      return;
    }

    setError(receiptError.message);
  }, [receiptError]);

  useEffect(() => {
    async function syncConfirmedAction() {
      if (!confirmedTx || !pendingAction || !pendingTxHash || !address) {
        return;
      }

      try {
        if (pendingAction.type === "comment") {
          await registerCommentOnchain(pendingAction.id, {
            wallet_address: address,
            tx_hash: pendingTxHash,
            chain_id: chainId
          });
          setActionMessage("Comentario anclado en blockchain.");
        } else {
          await registerSubscriptionOnchain(pendingAction.id, {
            tx_hash: pendingTxHash,
            chain_id: chainId
          });
          setActionMessage("Suscripcion activada y contenido premium desbloqueado.");
        }

        await refresh();
      } catch (syncError) {
        const message = syncError instanceof Error ? syncError.message : "No se pudo sincronizar la accion en backend.";
        setError(message);
      } finally {
        setPendingAction(null);
        setPendingTxHash(undefined);
      }
    }

    void syncConfirmedAction();
  }, [address, chainId, confirmedTx, pendingAction, pendingTxHash, refresh]);

  async function handleCommentSubmit(content: string) {
    if (!address) {
      setError("Conecta tu wallet para comentar.");
      return;
    }

    setError(null);

    try {
      const comment = await createComment(thesisId, {
        author_wallet: address,
        content,
        is_premium: false
      });

      setComments((prev) => [...prev, comment]);
      setActionMessage("Comentario creado. Falta anclarlo en blockchain.");
      await refresh();
    } catch (commentError) {
      const message = commentError instanceof Error ? commentError.message : "No se pudo publicar el comentario.";
      setError(message);
    }
  }

  async function handleAnchorComment(comment: CommentResponse) {
    if (!address) {
      setError("Conecta tu wallet para anclar comentarios.");
      return;
    }

    if (!hasValidContractAddress()) {
      setError("Configura NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS con el contrato desplegado.");
      return;
    }

    if (chainId !== signalForceChainId) {
      setError(`Cambia de red en MetaMask. Red actual: ${chainId}. Red esperada: ${signalForceChainId}.`);
      return;
    }

    try {
      const txHash = await writeContractAsync({
        abi: signalForceLedgerAbi,
        address: signalForceLedgerAddress,
        functionName: "recordComment",
        args: [comment.id, thesisId, comment.comment_hash],
        account: address
      });

      setPendingAction({ type: "comment", id: comment.id });
      setPendingTxHash(txHash);
      setActionMessage(`Transaccion enviada: ${txHash.slice(0, 10)}...`);
    } catch (anchorError) {
      const message = extractWriteErrorMessage(anchorError, "No se pudo anclar el comentario.");
      setError(message);
    }
  }

  async function handleLikeToggle() {
    if (!address || !thesis) {
      setError("Conecta tu wallet para dar like.");
      return;
    }

    setError(null);

    try {
      if (liked) {
        await unlikeThesis(thesis.id, address);
        setLiked(false);
      } else {
        await likeThesis(thesis.id, { wallet_address: address });
        setLiked(true);
      }

      await refresh();
    } catch (likeError) {
      const message = likeError instanceof Error ? likeError.message : "No se pudo actualizar el like.";
      setError(message);
    }
  }

  async function handleFollowAuthor() {
    if (!address || !thesis) {
      setError("Conecta tu wallet para seguir autores.");
      return;
    }

    setError(null);

    try {
      await followCreator(thesis.author_wallet, { follower_wallet: address });
      setActionMessage(`Ahora sigues a ${thesis.author_pseudonym}.`);
    } catch (followError) {
      const message = followError instanceof Error ? followError.message : "No se pudo seguir al autor.";
      setError(message);
    }
  }

  async function handleUnlockPremium() {
    if (!address || !thesis) {
      setError("Conecta tu wallet para suscribirte.");
      return;
    }

    if (!hasValidContractAddress()) {
      setError("Configura NEXT_PUBLIC_SIGNAL_FORCE_CONTRACT_ADDRESS con el contrato desplegado.");
      return;
    }

    if (chainId !== signalForceChainId) {
      setError(`Cambia de red en MetaMask. Red actual: ${chainId}. Red esperada: ${signalForceChainId}.`);
      return;
    }

    try {
      const amount = thesis.premium_price_wei && thesis.premium_price_wei !== "0" ? thesis.premium_price_wei : "1000000000000000";

      const pendingSubscription = await createSubscription({
        subscriber_wallet: address,
        creator_wallet: thesis.author_wallet,
        amount_wei: amount
      });

      const txHash = await writeContractAsync({
        abi: signalForceLedgerAbi,
        address: signalForceLedgerAddress,
        functionName: "recordSubscription",
        args: [thesis.author_wallet],
        account: address,
        value: BigInt(amount)
      });

      setPendingAction({ type: "subscription", id: pendingSubscription.id });
      setPendingTxHash(txHash);
      setActionMessage(`Suscripcion enviada: ${txHash.slice(0, 10)}...`);
    } catch (subscriptionError) {
      const message = extractWriteErrorMessage(subscriptionError, "No se pudo completar la suscripcion.");
      setError(message);
    }
  }

  const processing = writingTx || confirmingTx;

  if (loading) {
    return (
      <main className="container py-8">
        <p className="text-sm text-muted-foreground">Cargando tesis...</p>
      </main>
    );
  }

  if (!thesisId) {
    return (
      <main className="container py-8">
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">ID de tesis invalido.</p>
      </main>
    );
  }

  if (error && !thesis) {
    return (
      <main className="container py-8 space-y-4">
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
        <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
          Volver al feed
        </Link>
      </main>
    );
  }

  if (!thesis) {
    return null;
  }

  return (
    <main className="container space-y-6 py-8">
      <Link href="/" className="text-sm text-primary underline-offset-4 hover:underline">
        ← Volver al feed
      </Link>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">
              {thesis.asset} · {thesis.horizon}
            </Badge>
            <Badge variant="outline">{thesis.bias}</Badge>
            {thesis.is_premium ? <Badge variant="warning">Premium</Badge> : <Badge variant="outline">Publico</Badge>}
          </div>
          <CardTitle className="mt-3">{thesis.summary}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2">
            <span>{thesis.author_pseudonym}</span>
            <RankBadge rank={thesis.author_rank} />
            <span>· {formatDate(thesis.created_at)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs uppercase text-muted-foreground">Riesgo</p>
              <p className="text-xl font-semibold">{thesis.risk_score.toFixed(2)}</p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs uppercase text-muted-foreground">Nivel</p>
              <p className="text-xl font-semibold">{thesis.risk_level}</p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs uppercase text-muted-foreground">Likes</p>
              <p className="text-xl font-semibold">{thesis.likes_count}</p>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs uppercase text-muted-foreground">Comentarios</p>
              <p className="text-xl font-semibold">{thesis.comments_count}</p>
            </div>
          </div>

          {thesis.premium_locked ? (
            <PremiumLock premiumPriceWei={thesis.premium_price_wei} loading={processing} onUnlock={handleUnlockPremium} />
          ) : (
            <>
              <div className="rounded-lg border border-border/70 bg-background/50 p-4">
                <p className="text-sm leading-7">{thesis.thesis_text ?? "Contenido principal no disponible."}</p>
              </div>
              {thesis.premium_text && (
                <div className="rounded-lg border border-accent/35 bg-accent/10 p-4">
                  <p className="text-sm leading-7">{thesis.premium_text}</p>
                </div>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={handleLikeToggle}>
              {liked ? "Quitar like" : "Dar like"}
            </Button>
            <Button variant="outline" onClick={handleFollowAuthor} disabled={!profile || thesis.author_wallet === address}>
              Seguir autor
            </Button>
            <Badge variant={thesis.tx_hash ? "success" : "outline"}>{thesis.tx_hash ? "Post anclado" : "Post pendiente"}</Badge>
            {thesis.premium_price_wei !== "0" && <Badge variant="warning">{formatEth(thesis.premium_price_wei)} ETH</Badge>}
          </div>

          <p className="font-mono text-xs text-muted-foreground">Contrato: {signalForceLedgerAddress}</p>
          <p className="font-mono text-xs text-muted-foreground">Hash post: {thesis.post_hash}</p>
          <p className="text-xs text-muted-foreground">Deadline: {formatDate(thesis.evaluation_deadline)}</p>

          {actionMessage && <p className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">{actionMessage}</p>}
          {error && <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentarios</CardTitle>
          <CardDescription>Cada comentario debe anclarse en blockchain para trazabilidad.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <CommentBox loading={processing} onSubmit={handleCommentSubmit} />

          <div className="space-y-3">
            {comments.length === 0 && <p className="text-sm text-muted-foreground">Aun no hay comentarios.</p>}

            {comments.map((comment) => {
              const canAnchor = Boolean(address && comment.author_wallet === address && !comment.tx_hash);

              return (
                <div key={comment.id} className="rounded-lg border border-border/70 bg-background/50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{comment.author_pseudonym}</span>
                    <RankBadge rank={comment.author_rank} />
                    <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                    <Badge variant={comment.tx_hash ? "success" : "outline"}>{comment.tx_hash ? "On-chain" : "Pendiente"}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6">{comment.content}</p>
                  <p className="mt-2 font-mono text-xs text-muted-foreground">{comment.comment_hash}</p>
                  {canAnchor && (
                    <Button className="mt-2" size="sm" onClick={() => handleAnchorComment(comment)} disabled={processing}>
                      {processing ? "Anclando..." : "Anclar comentario"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
