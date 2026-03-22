import {
  CommentCreateRequest,
  CommentOnchainUpdateRequest,
  CommentResponse,
  FeedResponse,
  FollowRequest,
  LikeRequest,
  ProfileResponse,
  ReputationCheckpointOnchainUpdateRequest,
  ReputationHistoryResponse,
  ReputationRecalculateResponse,
  SubscriptionCreateRequest,
  SubscriptionOnchainUpdateRequest,
  SubscriptionResponse,
  ThesisCreateRequest,
  ThesisOnchainUpdateRequest,
  ThesisResponse,
  WalletLoginRequest,
  WalletLoginResponse
} from "@/lib/api/types";

const API_BASE_URL = (() => {
  const cleaned = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/+$/, "");

  if (!cleaned) {
    return process.env.NODE_ENV === "development" ? "http://localhost:8000/api/v1" : "";
  }

  return cleaned.endsWith("/api/v1") ? cleaned : `${cleaned}/api/v1`;
})();

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let detail = "No se pudo procesar la solicitud";

    try {
      const body = (await response.json()) as { detail?: string };
      detail = body.detail || detail;
    } catch {
      detail = response.statusText || detail;
    }

    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export async function walletLogin(payload: WalletLoginRequest): Promise<WalletLoginResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/wallet-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<WalletLoginResponse>(response);
}

export async function getProfile(walletAddress: string): Promise<ProfileResponse> {
  const response = await fetch(`${API_BASE_URL}/profiles/${walletAddress}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  return parseJson<ProfileResponse>(response);
}

export async function createThesis(payload: ThesisCreateRequest): Promise<ThesisResponse> {
  const response = await fetch(`${API_BASE_URL}/theses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<ThesisResponse>(response);
}

export async function listTheses(params?: {
  includePending?: boolean;
  authorWallet?: string;
  viewerWallet?: string;
}): Promise<ThesisResponse[]> {
  const query = new URLSearchParams();
  if (params?.includePending) {
    query.set("include_pending", "true");
  }
  if (params?.authorWallet) {
    query.set("author_wallet", params.authorWallet);
  }
  if (params?.viewerWallet) {
    query.set("viewer_wallet", params.viewerWallet);
  }

  const response = await fetch(`${API_BASE_URL}/theses?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  return parseJson<ThesisResponse[]>(response);
}

export async function listFeed(params?: { viewerWallet?: string; onlyFollowing?: boolean }): Promise<FeedResponse> {
  const query = new URLSearchParams();
  if (params?.viewerWallet) {
    query.set("viewer_wallet", params.viewerWallet);
  }
  if (params?.onlyFollowing) {
    query.set("only_following", "true");
  }

  const response = await fetch(`${API_BASE_URL}/feed?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  return parseJson<FeedResponse>(response);
}

export async function getThesis(thesisId: string, viewerWallet?: string): Promise<ThesisResponse> {
  const query = new URLSearchParams();
  if (viewerWallet) {
    query.set("viewer_wallet", viewerWallet);
  }

  const response = await fetch(`${API_BASE_URL}/theses/${thesisId}?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  return parseJson<ThesisResponse>(response);
}

export async function registerThesisOnchain(thesisId: string, payload: ThesisOnchainUpdateRequest): Promise<ThesisResponse> {
  const response = await fetch(`${API_BASE_URL}/theses/${thesisId}/onchain`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<ThesisResponse>(response);
}

export async function createComment(thesisId: string, payload: CommentCreateRequest): Promise<CommentResponse> {
  const response = await fetch(`${API_BASE_URL}/theses/${thesisId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<CommentResponse>(response);
}

export async function listComments(thesisId: string, viewerWallet?: string): Promise<CommentResponse[]> {
  const query = new URLSearchParams();
  if (viewerWallet) {
    query.set("viewer_wallet", viewerWallet);
  }

  const response = await fetch(`${API_BASE_URL}/theses/${thesisId}/comments?${query.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  return parseJson<CommentResponse[]>(response);
}

export async function registerCommentOnchain(commentId: string, payload: CommentOnchainUpdateRequest): Promise<CommentResponse> {
  const response = await fetch(`${API_BASE_URL}/theses/comments/${commentId}/onchain`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<CommentResponse>(response);
}

export async function likeThesis(thesisId: string, payload: LikeRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/theses/${thesisId}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseJson(response);
  }
}

export async function unlikeThesis(thesisId: string, walletAddress: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/theses/${thesisId}/likes?wallet_address=${walletAddress}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    await parseJson(response);
  }
}

export async function followCreator(creatorWallet: string, payload: FollowRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/profiles/${creatorWallet}/follow`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    await parseJson(response);
  }
}

export async function unfollowCreator(creatorWallet: string, followerWallet: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/profiles/${creatorWallet}/follow?follower_wallet=${followerWallet}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    await parseJson(response);
  }
}

export async function createSubscription(payload: SubscriptionCreateRequest): Promise<SubscriptionResponse> {
  const response = await fetch(`${API_BASE_URL}/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<SubscriptionResponse>(response);
}

export async function registerSubscriptionOnchain(
  subscriptionId: string,
  payload: SubscriptionOnchainUpdateRequest
): Promise<SubscriptionResponse> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/${subscriptionId}/onchain`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<SubscriptionResponse>(response);
}

export async function listCreatorSubscriptions(walletAddress: string): Promise<SubscriptionResponse[]> {
  const response = await fetch(`${API_BASE_URL}/subscriptions/creator/${walletAddress}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  return parseJson<SubscriptionResponse[]>(response);
}

export async function recalculateReputation(walletAddress: string): Promise<ReputationRecalculateResponse> {
  const response = await fetch(`${API_BASE_URL}/reputation/recalculate/${walletAddress}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  return parseJson<ReputationRecalculateResponse>(response);
}

export async function listReputationHistory(walletAddress: string): Promise<ReputationHistoryResponse[]> {
  const response = await fetch(`${API_BASE_URL}/reputation/${walletAddress}/history`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store"
  });

  return parseJson<ReputationHistoryResponse[]>(response);
}

export async function registerReputationCheckpointOnchain(
  checkpointId: string,
  payload: ReputationCheckpointOnchainUpdateRequest
): Promise<ReputationHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/reputation/checkpoints/${checkpointId}/onchain`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  return parseJson<ReputationHistoryResponse>(response);
}
