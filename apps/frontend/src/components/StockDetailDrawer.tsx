"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Loader2, Lock, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { TickerItem, SentimentResponse } from "@/lib/api";
import { fetchSentiment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import SentimentGauge from "./SentimentGauge";
import PriceChart from "./PriceChart";
import AnalystScore from "./AnalystScore";

interface StockDetailDrawerProps {
  ticker: TickerItem | null;
  onClose: () => void;
}

export default function StockDetailDrawer({ ticker, onClose }: StockDetailDrawerProps) {
  const { token, isAuthenticated } = useAuth();
  const [sentiment, setSentiment] = useState<SentimentResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticker && token) {
      setLoading(true);
      setError(null);
      setSentiment(null);
      fetchSentiment(ticker.symbol, token)
        .then((data) => setSentiment(data))
        .catch((err) => setError(err.message || "Failed to fetch sentiment"))
        .finally(() => setLoading(false));
    }
  }, [ticker, token]);

  const sentimentIcon = (s: string) => {
    if (s === "positive") return <TrendingUp size={12} style={{ color: "#10b981" }} />;
    if (s === "negative") return <TrendingDown size={12} style={{ color: "#ef4444" }} />;
    return <Minus size={12} style={{ color: "#c9a84c" }} />;
  };

  const sentimentColor = (s: string) => {
    if (s === "positive") return "#10b981";
    if (s === "negative") return "#ef4444";
    return "#c9a84c";
  };

  return (
    <AnimatePresence>
      {ticker && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-lg overflow-y-auto"
            style={{
              background: "linear-gradient(180deg, #12121a 0%, #0a0a0f 100%)",
              borderLeft: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between p-6"
              style={{
                background: "rgba(18,18,26,0.9)",
                backdropFilter: "blur(12px)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#e8e6e3" }}>
                  {ticker.symbol}
                </h2>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                  {ticker.name}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                style={{ color: "#6b7280" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* Price Summary */}
              <div className="flex items-end gap-4">
                <span className="text-4xl font-bold tabular-nums" style={{ color: "#e8e6e3" }}>
                  ${ticker.current_price?.toFixed(2) ?? "—"}
                </span>
                <span
                  className="text-lg font-semibold tabular-nums pb-1"
                  style={{ color: (ticker.change_pct ?? 0) >= 0 ? "#10b981" : "#ef4444" }}
                >
                  {(ticker.change_pct ?? 0) >= 0 ? "+" : ""}
                  {ticker.change_pct?.toFixed(2)}%
                </span>
              </div>

              {/* Price Chart */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#a0a0b0" }}>
                  Price History (3M)
                </h3>
                <div
                  className="rounded-xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <PriceChart data={ticker.price_history} />
                </div>
              </div>

              {/* Technical Indicators */}
              <div>
                <h3 className="text-sm font-semibold mb-3" style={{ color: "#a0a0b0" }}>
                  Technical Indicators
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "RSI (14)", value: ticker.rsi?.toFixed(1), color: (ticker.rsi ?? 50) > 70 ? "#ef4444" : (ticker.rsi ?? 50) < 30 ? "#10b981" : "#00d4ff" },
                    { label: "SMA 20", value: ticker.sma_20 ? `$${ticker.sma_20.toFixed(2)}` : "—", color: "#00d4ff" },
                    { label: "SMA 50", value: ticker.sma_50 ? `$${ticker.sma_50.toFixed(2)}` : "—", color: "#c9a84c" },
                  ].map((ind) => (
                    <div
                      key={ind.label}
                      className="rounded-xl p-3 text-center"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: "#6b7280" }}>
                        {ind.label}
                      </p>
                      <p className="text-lg font-bold tabular-nums" style={{ color: ind.color }}>
                        {ind.value ?? "—"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Sentiment */}
              <div>
                <h3 className="text-sm font-semibold mb-4" style={{ color: "#a0a0b0" }}>
                  🤖 AI Sentiment Analysis
                </h3>

                {!isAuthenticated ? (
                  <div
                    className="rounded-xl p-8 text-center"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <Lock size={32} style={{ color: "#6b7280" }} className="mx-auto mb-3" />
                    <p className="text-sm mb-1" style={{ color: "#e8e6e3" }}>
                      Sign in to access AI Sentiment
                    </p>
                    <p className="text-xs" style={{ color: "#6b7280" }}>
                      Free users get 5 analyses per day
                    </p>
                  </div>
                ) : loading ? (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 size={32} className="animate-spin mb-3" style={{ color: "#00d4ff" }} />
                    <p className="text-sm" style={{ color: "#6b7280" }}>
                      Analyzing market sentiment...
                    </p>
                  </div>
                ) : error ? (
                  <div
                    className="rounded-xl p-6 text-center"
                    style={{
                      background: "rgba(239,68,68,0.08)",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    <p className="text-sm" style={{ color: "#ef4444" }}>{error}</p>
                  </div>
                ) : sentiment ? (
                  <div className="space-y-6">
                    {/* Analyst Score (Bitigchi Signal) */}
                    <AnalystScore ticker={ticker.symbol} price={ticker.current_price ?? undefined} />

                    {/* Gauge */}
                    <div className="flex justify-center border-t border-white/5 pt-4">
                      <SentimentGauge
                        bullish={sentiment.bullish_pct}
                        neutral={sentiment.neutral_pct}
                        bearish={sentiment.bearish_pct}
                        overall={sentiment.overall_sentiment}
                      />
                    </div>

                    {/* Reddit status */}
                    <div className="text-center">
                      <span
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                          background: sentiment.reddit_available
                            ? "rgba(16,185,129,0.1)"
                            : "rgba(107,114,128,0.1)",
                          color: sentiment.reddit_available ? "#10b981" : "#6b7280",
                        }}
                      >
                        {sentiment.reddit_available
                          ? "📡 News + Reddit"
                          : "📰 News Only"}
                      </span>
                    </div>

                    {/* Articles */}
                    <div>
                      <h4 className="text-xs uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>
                        Analyzed Sources ({sentiment.article_count})
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {sentiment.articles.map((article, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-white/[0.03]"
                            style={{ border: "1px solid rgba(255,255,255,0.04)" }}
                          >
                            <div className="mt-0.5">{sentimentIcon(article.sentiment)}</div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "#e8e6e3" }}>
                                {article.title}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="text-[10px] uppercase font-semibold"
                                  style={{ color: sentimentColor(article.sentiment) }}
                                >
                                  {article.sentiment}
                                </span>
                                <span className="text-[10px]" style={{ color: "#4a4a5a" }}>
                                  {(article.confidence * 100).toFixed(0)}% conf.
                                </span>
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded"
                                  style={{ background: "rgba(255,255,255,0.05)", color: "#6b7280" }}
                                >
                                  {article.source}
                                </span>
                              </div>
                            </div>
                            {article.url && (
                              <a
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-shrink-0 mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink size={12} style={{ color: "#6b7280" }} />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
