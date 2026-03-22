export type RiskLevel = "low" | "medium" | "high";
export type Bias = "bullish" | "bearish" | "neutral";
export type ThesisStatus = "pending_onchain" | "active" | "resolved" | "invalidated";
export type ReputationRank = "Bronce" | "Plata" | "Oro" | "Pro" | "Experto";

export interface ProfileResponse {
  wallet_address: `0x${string}`;
  pseudonym: string;
  bio: string | null;
  verifiable_score: number;
  social_score: number;
  reputation_score: number;
  rank: ReputationRank;
  creator_earnings_wei: string;
  followers_count: number;
  following_count: number;
  theses_count: number;
  created_at: string;
  updated_at: string;
}

export interface WalletLoginRequest {
  wallet_address: `0x${string}`;
  pseudonym_hint?: string;
}

export interface WalletLoginResponse {
  profile: ProfileResponse;
}

export interface ThesisCreateRequest {
  author_wallet: `0x${string}`;
  asset: string;
  horizon: string;
  bias: Bias;
  price_volatility: number;
  context_climate?: number;
  expected_demand: number;
  author_confidence?: number;
  summary: string;
  thesis_text: string;
  premium_text?: string;
  is_premium: boolean;
  premium_price_wei: string;
  evaluation_deadline?: string;
  reference_price?: number;
  invalidation_condition?: string;
}

export interface ThesisResponse {
  id: string;
  author_wallet: `0x${string}`;
  author_pseudonym: string;
  author_rank: ReputationRank;
  asset: string;
  horizon: string;
  bias: Bias;
  price_volatility: number | null;
  context_climate: number | null;
  expected_demand: number | null;
  author_confidence: number | null;
  risk_score: number;
  risk_level: RiskLevel;
  summary: string;
  thesis_text: string | null;
  premium_text: string | null;
  is_premium: boolean;
  premium_price_wei: string;
  premium_locked: boolean;
  evaluation_deadline: string;
  reference_price: number;
  invalidation_condition: string | null;
  status: ThesisStatus;
  is_useful: boolean | null;
  resolution_note: string | null;
  post_hash: `0x${string}`;
  tx_hash: `0x${string}` | null;
  chain_id: number | null;
  onchain_recorded_at: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  source?: "backend" | "onchain";
}

export interface ThesisOnchainUpdateRequest {
  wallet_address: `0x${string}`;
  tx_hash: `0x${string}`;
  chain_id: number;
}

export interface CommentCreateRequest {
  author_wallet: `0x${string}`;
  content: string;
  parent_comment_id?: string;
  is_premium: boolean;
}

export interface CommentResponse {
  id: string;
  thesis_id: string;
  parent_comment_id: string | null;
  author_wallet: `0x${string}`;
  author_pseudonym: string;
  author_rank: ReputationRank;
  content: string;
  is_premium: boolean;
  status: ThesisStatus;
  comment_hash: `0x${string}`;
  tx_hash: `0x${string}` | null;
  chain_id: number | null;
  onchain_recorded_at: string | null;
  created_at: string;
}

export interface CommentOnchainUpdateRequest {
  wallet_address: `0x${string}`;
  tx_hash: `0x${string}`;
  chain_id: number;
}

export interface LikeRequest {
  wallet_address: `0x${string}`;
}

export interface FollowRequest {
  follower_wallet: `0x${string}`;
}

export interface FeedResponse {
  items: ThesisResponse[];
}

export interface SubscriptionCreateRequest {
  subscriber_wallet: `0x${string}`;
  creator_wallet: `0x${string}`;
  amount_wei: string;
}

export interface SubscriptionOnchainUpdateRequest {
  tx_hash: `0x${string}`;
  chain_id: number;
}

export interface SubscriptionResponse {
  id: string;
  subscriber_wallet: `0x${string}`;
  creator_wallet: `0x${string}`;
  amount_wei: string;
  status: string;
  tx_hash: `0x${string}` | null;
  chain_id: number | null;
  recorded_onchain_at: string | null;
  started_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ReputationRecalculateResponse {
  wallet_address: `0x${string}`;
  verifiable_score: number;
  social_score: number;
  reputation_score: number;
  rank: ReputationRank;
  checkpoint_id: string;
}

export interface ReputationCheckpointOnchainUpdateRequest {
  tx_hash: `0x${string}`;
  chain_id: number;
}

export interface ReputationHistoryResponse {
  id: string;
  wallet_address: `0x${string}`;
  verifiable_score: number;
  social_score: number;
  reputation_score: number;
  rank: ReputationRank;
  tx_hash: `0x${string}` | null;
  chain_id: number | null;
  recorded_onchain_at: string | null;
  created_at: string;
}
