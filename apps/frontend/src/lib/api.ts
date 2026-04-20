const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface FetchOptions extends RequestInit {
  token?: string;
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers,
    ...rest,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new ApiError(res.status, error.detail || error.message || "Request failed");
  }

  return res.json();
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

// ─── Auth ─────────────────────────────────────────────

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  plan: string;
  created_at: string;
}

export async function registerUser(email: string, password: string, fullName?: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
}

export async function verifyEmail(token: string): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/api/auth/verify-email?token=${token}`, {
    method: "GET",
  });
}

export async function loginUser(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function refreshToken(refreshToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function getMe(token: string): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/auth/me", { token });
}

export async function updateProfile(token: string, data: { full_name?: string }): Promise<UserProfile> {
  return apiFetch<UserProfile>("/api/auth/me", {
    method: "PATCH",
    token,
    body: JSON.stringify(data),
  });
}

export async function forgotPassword(email: string): Promise<void> {
  await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}

export async function getGoogleAuthUrl(): Promise<{ auth_url: string }> {
  return apiFetch<{ auth_url: string }>("/api/auth/google");
}

// ─── Screener ─────────────────────────────────────────

export interface TickerItem {
  symbol: string;
  name: string | null;
  sector: string | null;
  current_price: number | null;
  change_pct: number | null;
  volume: number | null;
  rsi: number | null;
  sma_20: number | null;
  sma_50: number | null;
  cluster: number | null;
  cluster_label: string | null;
  price_history: { date: string; open: number; high: number; low: number; close: number; volume: number }[];
}

export interface ScreenerResponse {
  tickers: TickerItem[];
  clusters: Record<string, string[]>;
  updated_at: string;
}

export async function fetchScreener(token?: string): Promise<ScreenerResponse> {
  return apiFetch<ScreenerResponse>("/api/screener", { token });
}

// ─── Sentiment ────────────────────────────────────────

export interface SentimentArticle {
  title: string;
  source: string;
  url: string | null;
  sentiment: string;
  confidence: number;
}

export interface SentimentResponse {
  ticker: string;
  bullish_pct: number;
  neutral_pct: number;
  bearish_pct: number;
  overall_sentiment: string;
  article_count: number;
  articles: SentimentArticle[];
  reddit_available: boolean;
  analyzed_at: string;
}

export interface SentimentLimit {
  allowed: boolean;
  remaining: number;
  limit: number;
  plan: string;
}

export async function fetchSentiment(ticker: string, token: string): Promise<SentimentResponse> {
  return apiFetch<SentimentResponse>(`/api/sentiment/${ticker}`, { token });
}

export async function fetchSentimentLimit(token: string): Promise<SentimentLimit> {
  return apiFetch<SentimentLimit>("/api/sentiment-limit", { token });
}

// ─── Billing ──────────────────────────────────────────

export async function createCheckout(token: string): Promise<{ checkout_url: string; session_id: string }> {
  return apiFetch("/api/billing/checkout", { method: "POST", token });
}

export async function getCustomerPortal(token: string): Promise<{ portal_url: string }> {
  return apiFetch("/api/billing/portal", { method: "POST", token });
}

// ─── Feedback ─────────────────────────────────────────

export interface FeedbackItem {
  id: number;
  user_id: number;
  user_email: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export async function submitFeedback(token: string, rating: number, comment?: string): Promise<FeedbackItem> {
  return apiFetch<FeedbackItem>("/api/feedback/", {
    method: "POST",
    token,
    body: JSON.stringify({ rating, comment }),
  });
}

// ─── Admin ────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  premium_users: number;
  free_users: number;
  total_feedback: number;
  total_sentiment_checks_today: number;
  avg_feedback_rating: number | null;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  plan: string;
  subscription_status: string | null;
  sentiment_checks_today: number;
  created_at: string;
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  return apiFetch<AdminStats>("/api/admin/stats", { token });
}

export async function fetchAdminUsers(token: string): Promise<AdminUser[]> {
  return apiFetch<AdminUser[]>("/api/admin/users", { token });
}

export async function toggleUserActive(token: string, userId: number): Promise<void> {
  await apiFetch(`/api/admin/users/${userId}/toggle-active`, { method: "PATCH", token });
}

export async function fetchAdminFeedback(token: string): Promise<FeedbackItem[]> {
  return apiFetch<FeedbackItem[]>("/api/admin/feedback", { token });
}

// ─── News ─────────────────────────────────────────────

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  image_url: string;
  published_at: string;
  provider: string;
}

export interface NewsResponse {
  articles: NewsArticle[];
  total: number;
  cached: boolean;
  newsapi_remaining: number;
}

export async function fetchNews(): Promise<NewsResponse> {
  return apiFetch<NewsResponse>("/api/news");
}

// ─── Stock Lookup ─────────────────────────────────────

export async function fetchStockLookup(
  symbol: string, 
  token?: string,
  period: string = "3mo",
  interval: string = "1d"
): Promise<TickerItem> {
  const url = `/api/lookup/${encodeURIComponent(symbol)}?period=${period}&interval=${interval}`;
  return apiFetch<TickerItem>(url, { token });
}

// ─── Analyst / Bitigchi Score ─────────────────────────

export interface AnalystTrend {
  period: string;
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}

export interface AnalystResponse {
  symbol: string;
  period: string;
  strong_buy: number;
  buy: number;
  hold: number;
  sell: number;
  strong_sell: number;
  total_analysts: number;
  consensus: string;
  analyst_score: number;
  trend: AnalystTrend[];
}

export async function fetchAnalystData(symbol: string, token?: string): Promise<AnalystResponse> {
  return apiFetch<AnalystResponse>(`/api/analyst/${encodeURIComponent(symbol)}`, { token });
}

// ─── Social / Discussion ──────────────────────────────

export interface Comment {
  id: number;
  user: {
    full_name: string | null;
    email: string;
  };
  symbol: string;
  content: string;
  sentiment: string | null;
  created_at: string;
  likes_count: number;
}

export async function fetchComments(symbol: string): Promise<Comment[]> {
  return apiFetch<Comment[]>(`/api/social/comments/${symbol}`);
}

export async function postComment(
  token: string, 
  symbol: string, 
  content: string, 
  sentiment?: string
): Promise<Comment> {
  return apiFetch<Comment>("/api/social/comments", {
    method: "POST",
    token,
    body: JSON.stringify({ symbol, content, sentiment }),
  });
}

export async function reactToComment(
  token: string,
  commentId: number,
  reactionType: string
): Promise<void> {
  await apiFetch("/api/social/react", {
    method: "POST",
    token,
    body: JSON.stringify({ comment_id: commentId, reaction_type: reactionType }),
  });
}

export async function fetchCommunityFeed(): Promise<Comment[]> {
  return apiFetch<Comment[]>("/api/social/community/feed");
}

