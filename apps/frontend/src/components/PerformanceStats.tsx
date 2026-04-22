"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Clock, Calendar, BarChart3 } from "lucide-react";

interface PerformanceStatsProps {
  history: { close: number; date: string }[];
  currentPrice: number;
}

export default function PerformanceStats({ history, currentPrice }: PerformanceStatsProps) {
  const stats = useMemo(() => {
    if (!history || history.length === 0) return [];

    const sortedHistory = [...history].sort((a, b) => (a.date > b.date ? 1 : -1));
    const firstPrice = sortedHistory[0].close;

    // Helper to find price closest to X days/months ago
    const getChange = (periodLabel: string, daysAgo: number) => {
      const now = new Date();
      const targetDate = new Date();
      targetDate.setDate(now.getDate() - daysAgo);
      
      const targetIso = targetDate.toISOString().split("T")[0];
      
      // Find the first record that is on or after the target date
      const record = sortedHistory.find(h => h.date >= targetIso) || sortedHistory[0];
      const startPrice = record.close;
      const pct = ((currentPrice - startPrice) / startPrice) * 100;
      
      return { label: periodLabel, pct: pct, isPositive: pct >= 0 };
    };

    return [
      getChange("1M", 30),
      getChange("6M", 180),
      getChange("1Y", 365),
      getChange("5Y", 365 * 5),
      { 
        label: "MAX", 
        pct: ((currentPrice - firstPrice) / firstPrice) * 100, 
        isPositive: currentPrice >= firstPrice 
      }
    ];
  }, [history, currentPrice]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 w-full">
      {stats.map((stat) => (
        <div 
          key={stat.label}
          className="p-4 rounded-xl border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center transition-all hover:bg-white/[0.04]"
        >
          <span className="text-[10px] uppercase tracking-widest text-[#6b7280] font-bold mb-2">{stat.label} Return</span>
          <div className="flex items-center gap-1.5">
            {stat.isPositive ? (
              <TrendingUp size={14} className="text-[#10b981]" />
            ) : (
              <TrendingDown size={14} className="text-[#ef4444]" />
            )}
            <span 
              className="text-sm font-bold font-mono"
              style={{ color: stat.isPositive ? "#10b981" : "#ef4444" }}
            >
              {stat.pct >= 0 ? "+" : ""}{stat.pct.toFixed(2)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
