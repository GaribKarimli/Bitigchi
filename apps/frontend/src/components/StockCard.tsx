"use client";

import { motion } from "framer-motion";
import type { TickerItem } from "@/lib/api";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

interface StockCardProps {
  ticker: TickerItem;
  index: number;
  onClick: () => void;
}

const clusterColors: Record<string, string> = {
  Momentum: "#00d4ff",
  Oversold: "#ef4444",
  Stable: "#10b981",
  Volatile: "#f59e0b",
  Overbought: "#a855f7",
  Uncategorized: "#6b7280",
};

function MiniSparkline({ data }: { data: { close: number }[] }) {
  if (!data || data.length < 2) return null;

  const closes = data.map((d) => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const w = 100;
  const h = 32;

  const points = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * w;
    const y = h - ((c - min) / range) * h;
    return `${x},${y}`;
  });

  const isUp = closes[closes.length - 1] >= closes[0];
  const color = isUp ? "#10b981" : "#ef4444";

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="opacity-60">
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StockCard({ ticker, index, onClick }: StockCardProps) {
  const isPositive = (ticker.change_pct ?? 0) >= 0;
  const clusterColor = clusterColors[ticker.cluster_label ?? "Uncategorized"] ?? "#6b7280";

  const rsiLabel =
    (ticker.rsi ?? 50) > 70
      ? "Overbought"
      : (ticker.rsi ?? 50) < 30
        ? "Oversold"
        : "Neutral";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl p-5 transition-all duration-300 group"
      style={{
        background: "rgba(26, 26, 46, 0.6)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold" style={{ color: "#e8e6e3" }}>
            {ticker.symbol}
          </h3>
          <p className="text-xs truncate max-w-[140px]" style={{ color: "#6b7280" }}>
            {ticker.name}
          </p>
        </div>
        <span
          className="text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide uppercase"
          style={{
            background: `${clusterColor}15`,
            color: clusterColor,
            border: `1px solid ${clusterColor}30`,
          }}
        >
          {ticker.cluster_label}
        </span>
      </div>

      {/* Price & Change */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <span className="text-2xl font-bold tabular-nums" style={{ color: "#e8e6e3" }}>
            ${ticker.current_price?.toFixed(2) ?? "—"}
          </span>
          <div className="flex items-center gap-1 mt-1">
            {isPositive ? (
              <TrendingUp size={14} style={{ color: "#10b981" }} />
            ) : (
              <TrendingDown size={14} style={{ color: "#ef4444" }} />
            )}
            <span
              className="text-sm font-semibold tabular-nums"
              style={{ color: isPositive ? "#10b981" : "#ef4444" }}
            >
              {isPositive ? "+" : ""}
              {ticker.change_pct?.toFixed(2) ?? 0}%
            </span>
          </div>
        </div>
        <MiniSparkline data={ticker.price_history} />
      </div>

      {/* Indicators */}
      <div className="flex items-center gap-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-1.5">
          <Activity size={12} style={{ color: "#6b7280" }} />
          <span className="text-xs" style={{ color: "#6b7280" }}>RSI</span>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{
              color:
                (ticker.rsi ?? 50) > 70
                  ? "#ef4444"
                  : (ticker.rsi ?? 50) < 30
                    ? "#10b981"
                    : "#a0a0b0",
            }}
          >
            {ticker.rsi?.toFixed(1) ?? "—"}
          </span>
        </div>
        <div className="flex-1" />
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{
            background: "rgba(255,255,255,0.05)",
            color: "#6b7280",
          }}
        >
          {ticker.sector}
        </span>
      </div>
    </motion.div>
  );
}
