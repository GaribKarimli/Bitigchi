"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchSentiment } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface SentimentGaugeProps {
  // Can be used two ways:
  // 1. Pass ticker — component fetches sentiment itself
  // 2. Pass bullish/neutral/bearish/overall directly (pre-fetched)
  ticker?: string;
  bullish?: number;
  neutral?: number;
  bearish?: number;
  overall?: string;
  articles?: Array<{ title: string; url: string; sentiment: string; confidence: number; source: string }>;
  size?: number;
}

export default function SentimentGauge({
  ticker,
  bullish: bullishProp,
  neutral: neutralProp,
  bearish: bearishProp,
  overall: overallProp,
  articles: articlesProp,
  size = 200,
}: SentimentGaugeProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<{
    bullish: number; neutral: number; bearish: number;
    overall: string; articles: typeof articlesProp;
  } | null>(null);
  const [fetchError, setFetchError] = useState("");

  // Fetch sentiment if ticker is provided and props are not
  useEffect(() => {
    if (!ticker || bullishProp !== undefined) return;
    if (!token) return;

    setLoading(true);
    setFetchError("");
    fetchSentiment(ticker, token)
      .then((res) => {
        setFetchedData({
          bullish: res.bullish_pct,
          neutral: res.neutral_pct,
          bearish: res.bearish_pct,
          overall: res.overall_sentiment,
          articles: res.articles,
        });
      })
      .catch((err) => {
        setFetchError(err.message || "Failed to load sentiment");
      })
      .finally(() => setLoading(false));
  }, [ticker, token, bullishProp]);

  // Resolve values — prefer fetched data, fall back to props, then defaults
  const bullish = fetchedData?.bullish ?? bullishProp ?? 0;
  const neutral = fetchedData?.neutral ?? neutralProp ?? 100;
  const bearish = fetchedData?.bearish ?? bearishProp ?? 0;
  const overall = fetchedData?.overall ?? overallProp ?? "neutral";
  const articles = fetchedData?.articles ?? articlesProp ?? [];

  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 20;
  const strokeWidth = 12;

  const total = bullish + neutral + bearish || 1;
  const bullishAngle = (bullish / total) * 360;
  const neutralAngle = (neutral / total) * 360;
  const bearishAngle = (bearish / total) * 360;

  function polarToCartesian(angle: number): { x: number; y: number } {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(startAngle: number, endAngle: number): string {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  const overallColor =
    overall === "bullish" ? "#10b981" : overall === "bearish" ? "#ef4444" : "#c9a84c";
  const overallEmoji =
    overall === "bullish" ? "🟢" : overall === "bearish" ? "🔴" : "🟡";

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-4">
        <Loader2 size={32} className="animate-spin" style={{ color: "#c9a84c" }} />
        <p className="text-xs" style={{ color: "#6b7280" }}>Analyzing sentiment for {ticker}...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <p className="text-xs text-center" style={{ color: "#6b7280" }}>
          Sentiment unavailable
        </p>
        <p className="text-xs text-center" style={{ color: "#4a4a5a" }}>{fetchError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={strokeWidth} />

        {bearishAngle > 0.5 && (
          <motion.path d={describeArc(0, Math.max(bearishAngle, 1))} fill="none" stroke="#ef4444"
            strokeWidth={strokeWidth} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.2 }} opacity={0.9} />
        )}
        {neutralAngle > 0.5 && (
          <motion.path d={describeArc(bearishAngle, bearishAngle + Math.max(neutralAngle, 1))} fill="none" stroke="#c9a84c"
            strokeWidth={strokeWidth} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.5 }} opacity={0.9} />
        )}
        {bullishAngle > 0.5 && (
          <motion.path d={describeArc(bearishAngle + neutralAngle, bearishAngle + neutralAngle + Math.max(bullishAngle, 1))}
            fill="none" stroke="#10b981" strokeWidth={strokeWidth} strokeLinecap="round"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.8 }}
            filter="url(#gauge-glow)" opacity={0.9} />
        )}

        <text x={cx} y={cy - 12} textAnchor="middle" fill={overallColor} fontSize="28" fontWeight="bold" fontFamily="Inter, sans-serif">
          {overallEmoji}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill={overallColor} fontSize="16" fontWeight="bold" fontFamily="Inter, sans-serif">
          {overall.toUpperCase()}
        </text>
        <text x={cx} y={cy + 32} textAnchor="middle" fill="#6b7280" fontSize="11" fontFamily="Inter, sans-serif">
          AI Sentiment
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#10b981" }} />
          <span className="text-xs font-semibold" style={{ color: "#10b981" }}>{bullish.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#c9a84c" }} />
          <span className="text-xs font-semibold" style={{ color: "#c9a84c" }}>{neutral.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444" }} />
          <span className="text-xs font-semibold" style={{ color: "#ef4444" }}>{bearish.toFixed(1)}%</span>
        </div>
      </div>

      {/* Articles list */}
      {articles && articles.length > 0 && (
        <div className="w-full mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#6b7280" }}>
            Analyzed Sources ({articles.length})
          </p>
          {articles.slice(0, 5).map((a, i) => (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer"
              className="block rounded-xl p-3 transition-all hover:border-[#c9a84c]/40"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-xs leading-snug mb-1.5" style={{ color: "#e8e6e3" }}>{a.title}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: a.sentiment === "positive" ? "#10b981" : a.sentiment === "negative" ? "#ef4444" : "#c9a84c",
                    background: a.sentiment === "positive" ? "rgba(16,185,129,0.1)" : a.sentiment === "negative" ? "rgba(239,68,68,0.1)" : "rgba(201,168,76,0.1)",
                  }}>
                  {a.sentiment}
                </span>
                <span className="text-[10px]" style={{ color: "#4a4a5a" }}>{Math.round(a.confidence * 100)}% conf.</span>
                <span className="text-[10px]" style={{ color: "#4a4a5a" }}>{a.source}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
