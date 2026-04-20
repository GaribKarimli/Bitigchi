"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";
import { fetchStockLookup } from "@/lib/api";
import type { TickerItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import PriceChart from "@/components/PriceChart";
import SentimentGauge from "@/components/SentimentGauge";
import AnalystScore from "@/components/AnalystScore";
import DiscussionBoard from "@/components/DiscussionBoard";
import AIChatWidget from "@/components/AIChatWidget";

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const symbol = (params.symbol as string)?.toUpperCase();

  const [data, setData] = useState<TickerItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("3mo");

  useEffect(() => {
    if (!symbol) return;
    // Don't set loading to true for range changes to provide a snappier feel, 
    // but the actual chart will reflect the new data.
    if (!data) setLoading(true);
    
    setError("");
    fetchStockLookup(symbol, token || undefined, range)
      .then((res) => {
        // If we already have data, only update price_history to avoid layout jumps
        if (data) {
          setData({ ...data, price_history: res.price_history });
        } else {
          setData(res);
        }
      })
      .catch((err) => setError(err.message || `Stock '${symbol}' not found`))
      .finally(() => setLoading(false));
  }, [symbol, token, range]);

  if (loading) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={48}
            className="animate-spin mx-auto mb-4"
            style={{ color: "#c9a84c" }}
          />
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Looking up {symbol}...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <AlertCircle
            size={48}
            className="mx-auto mb-4"
            style={{ color: "#ef4444" }}
          />
          <h2 className="text-xl font-bold mb-2" style={{ color: "#e8e6e3" }}>
            Stock Not Found
          </h2>
          <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
            {error || `'${symbol}' is not a valid ticker symbol.`}
          </p>
          <button onClick={() => router.push("/")} className="btn-primary">
            ← Back to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const isPositive = (data.change_pct ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm mb-8 transition-colors hover:text-[#00d4ff]"
          style={{ color: "#6b7280" }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#e8e6e3" }}>
                {data.symbol}
              </h1>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                {data.name} · {data.sector}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-4 mt-4">
            <span
              className="text-4xl font-bold"
              style={{ color: "#e8e6e3" }}
            >
              ${data.current_price?.toLocaleString()}
            </span>
            <span
              className="text-lg font-semibold flex items-center gap-1"
              style={{ color: isPositive ? "#10b981" : "#ef4444" }}
            >
              {isPositive ? (
                <TrendingUp size={18} />
              ) : (
                <TrendingDown size={18} />
              )}
              {isPositive ? "+" : ""}
              {data.change_pct?.toFixed(2)}%
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 rounded-2xl p-6"
            style={{
              background: "rgba(26, 26, 46, 0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3
                className="font-semibold flex items-center gap-2"
                style={{ color: "#e8e6e3" }}
              >
                <BarChart3 size={18} style={{ color: "#00d4ff" }} />
                Price History
              </h3>
              
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/5 self-start sm:self-center">
                {["1d", "1mo", "3mo", "6mo", "1y"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="px-3 py-1 rounded-md text-[11px] font-bold uppercase transition-all"
                    style={{
                      background: range === r ? "rgba(0, 212, 255, 0.1)" : "transparent",
                      color: range === r ? "#00d4ff" : "#6b7280",
                    }}
                  >
                    {r.replace("mo", "m")}
                  </button>
                ))}
              </div>
            </div>
            {data.price_history && data.price_history.length > 0 ? (
              <PriceChart data={data.price_history} />
            ) : (
              <p style={{ color: "#6b7280" }}>No chart data available</p>
            )}
          </motion.div>

          {/* Technical Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(26, 26, 46, 0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <h3
                className="font-semibold mb-4 flex items-center gap-2"
                style={{ color: "#e8e6e3" }}
              >
                <Activity size={18} style={{ color: "#c9a84c" }} />
                Technical Indicators
              </h3>
              <div className="space-y-4">
                {/* RSI */}
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: "#6b7280" }}>
                      RSI (14)
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{
                        color:
                          (data.rsi ?? 50) > 70
                            ? "#ef4444"
                            : (data.rsi ?? 50) < 30
                            ? "#10b981"
                            : "#c9a84c",
                      }}
                    >
                      {data.rsi?.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(data.rsi ?? 50, 100)}%`,
                        background:
                          (data.rsi ?? 50) > 70
                            ? "#ef4444"
                            : (data.rsi ?? 50) < 30
                            ? "#10b981"
                            : "linear-gradient(90deg, #c9a84c, #00d4ff)",
                      }}
                    />
                  </div>
                  <div
                    className="flex justify-between mt-1 text-[10px]"
                    style={{ color: "#4a4a5a" }}
                  >
                    <span>Oversold</span>
                    <span>Overbought</span>
                  </div>
                </div>

                {/* SMA */}
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p
                      className="text-[10px] mb-1"
                      style={{ color: "#6b7280" }}
                    >
                      SMA 20
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#00d4ff" }}
                    >
                      {data.sma_20 ? `$${data.sma_20.toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p
                      className="text-[10px] mb-1"
                      style={{ color: "#6b7280" }}
                    >
                      SMA 50
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#10b981" }}
                    >
                      {data.sma_50 ? `$${data.sma_50.toFixed(2)}` : "—"}
                    </p>
                  </div>
                </div>

                {/* Volume */}
                {data.volume && (
                  <div
                    className="rounded-xl p-3 text-center"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p
                      className="text-[10px] mb-1"
                      style={{ color: "#6b7280" }}
                    >
                      Volume
                    </p>
                    <p
                      className="text-sm font-bold"
                      style={{ color: "#e8e6e3" }}
                    >
                      {(data.volume / 1_000_000).toFixed(1)}M
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Analyst Consensus / Bitigchi Score */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(26, 26, 46, 0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <AnalystScore ticker={data.symbol} price={data.current_price ?? undefined} />
            </div>

            {/* Sentiment */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(26, 26, 46, 0.6)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <SentimentGauge ticker={data.symbol} />
            </div>
          </motion.div>
          {/* Community & AI Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 mt-8"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <div className="lg:col-span-2 rounded-2xl p-6" 
                    style={{ background: "rgba(26, 26, 46, 0.4)", border: "1px solid rgba(255,255,255,0.06)" }}>
                   <DiscussionBoard ticker={symbol} />
               </div>
               
               {/* Side Widgets */}
               <div className="space-y-6">
                  {/* Bitigchi AI Pitch */}
                  <div className="rounded-2xl p-6 relative overflow-hidden group"
                       style={{ background: "linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(201, 168, 76, 0.1))", border: "1px solid rgba(0, 212, 255, 0.2)" }}>
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Sparkles size={64} />
                      </div>
                      <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                         <Bot size={18} className="text-[#00d4ff]" />
                         Bitigchi AI Analysis
                      </h4>
                      <p className="text-xs leading-relaxed mb-4" style={{ color: "#6b7280" }}>
                         I've analyzed the latest news, technicals, and community sentiment for {symbol}. 
                         Click the chat button below to get my deep dive!
                      </p>
                      <ul className="space-y-2 mb-4">
                         <li className="flex items-center gap-2 text-[10px]" style={{ color: "#e8e6e3" }}>
                            <div className="w-1 h-1 rounded-full bg-[#00d4ff]" /> GPT-4 Intelligence
                         </li>
                         <li className="flex items-center gap-2 text-[10px]" style={{ color: "#e8e6e3" }}>
                            <div className="w-1 h-1 rounded-full bg-[#c9a84c]" /> Real-time Price Context
                         </li>
                      </ul>
                  </div>

                  <SentimentGauge value={data.rsi ?? 50} label="Market Momentum" />
               </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating AI Widget */}
      <AIChatWidget symbol={symbol} />
    </div>
  );
}

// Sub-components used in layout
function Sparkles({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
    </svg>
  );
}

function Bot({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 8V4H8" /><rect width="16" height="12" x="4" y="8" rx="2" /><path d="M2 14h2" /><path d="M20 14h2" /><path d="M15 13v2" /><path d="M9 13v2" />
    </svg>
  );
}
