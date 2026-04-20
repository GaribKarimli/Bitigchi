"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, TrendingUp, ShieldCheck, Target, Users } from "lucide-react";
import { fetchAnalystData, AnalystResponse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function AnalystScore({ ticker, price }: { ticker: string; price?: number }) {
  const { token } = useAuth();
  const [data, setData] = useState<AnalystResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker || !token) return;
    setLoading(true);
    fetchAnalystData(ticker, token)
      .then((res) => setData(res))
      .catch((err) => console.log("Analyst data not available:", err))
      .finally(() => setLoading(false));
  }, [ticker, token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <Loader2 size={24} className="animate-spin mb-2" style={{ color: "#00d4ff" }} />
        <p className="text-xs" style={{ color: "#6b7280" }}>Loading Wall Street Consensus...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-6">
        <p className="text-xs text-center" style={{ color: "#6b7280" }}>
          Analyst coverage not available for {ticker}
        </p>
      </div>
    );
  }

  const { strong_buy, buy, hold, sell, strong_sell, total_analysts, consensus, analyst_score } = data;
  
  // Calculate a "Bitigchi Signal" combination from the Analyst Score
  const bitigchiIndicator = analyst_score >= 70 ? "Strong Focus" : 
                             analyst_score >= 50 ? "Moderate Potential" : "High Risk";

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between mb-4">
         <div className="flex items-center gap-2">
           <ShieldCheck size={20} style={{ color: "#00d4ff" }} />
           <span className="font-semibold text-lg" style={{ color: "#e8e6e3" }}>Wall Street Consensus</span>
         </div>
         <div className="px-2.5 py-1 rounded-md text-xs font-bold uppercase"
              style={{
                background: consensus.includes("Buy") ? "rgba(16,185,129,0.15)" : 
                            consensus.includes("Sell") ? "rgba(239,68,68,0.15)" : "rgba(201,168,76,0.15)",
                color: consensus.includes("Buy") ? "#10b981" : 
                       consensus.includes("Sell") ? "#ef4444" : "#c9a84c"
              }}>
           {consensus}
         </div>
      </div>

      <div className="flex items-center gap-6 mb-6">
        {/* Main Score Ring */}
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            <path className="stroke-current" fill="none" strokeWidth="3" stroke="rgba(255,255,255,0.05)"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className="stroke-current" fill="none" strokeWidth="3" 
                  stroke={analyst_score >= 60 ? "#10b981" : analyst_score >= 40 ? "#c9a84c" : "#ef4444"}
                  strokeDasharray={`${analyst_score}, 100`}
                  strokeLinecap="round"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold" style={{ color: "#e8e6e3" }}>{analyst_score}</span>
            <span className="text-[9px]" style={{ color: "#6b7280" }}>/100</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 w-full space-y-2">
          {/* Buy */}
          <div className="flex items-center gap-2">
            <span className="text-xs w-10 text-right font-medium" style={{ color: "#10b981" }}>Buy</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
               <div className="h-full" style={{ width: `${(strong_buy / total_analysts) * 100}%`, background: "#059669" }} />
               <div className="h-full" style={{ width: `${(buy / total_analysts) * 100}%`, background: "#10b981" }} />
            </div>
            <span className="text-xs w-4" style={{ color: "#e8e6e3" }}>{strong_buy + buy}</span>
          </div>

          {/* Hold */}
          <div className="flex items-center gap-2">
            <span className="text-xs w-10 text-right font-medium" style={{ color: "#c9a84c" }}>Hold</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
               <div className="h-full" style={{ width: `${(hold / total_analysts) * 100}%`, background: "#c9a84c" }} />
            </div>
            <span className="text-xs w-4" style={{ color: "#e8e6e3" }}>{hold}</span>
          </div>

          {/* Sell */}
          <div className="flex items-center gap-2">
            <span className="text-xs w-10 text-right font-medium" style={{ color: "#ef4444" }}>Sell</span>
            <div className="flex-1 h-2 rounded-full overflow-hidden flex" style={{ background: "rgba(255,255,255,0.05)" }}>
               <div className="h-full" style={{ width: `${(sell / total_analysts) * 100}%`, background: "#ef4444" }} />
               <div className="h-full" style={{ width: `${(strong_sell / total_analysts) * 100}%`, background: "#b91c1c" }} />
            </div>
            <span className="text-xs w-4" style={{ color: "#e8e6e3" }}>{sell + strong_sell}</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mt-2">
         <div className="p-3 rounded-xl border" style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider" style={{ color: "#6b7280" }}>
              <Users size={12} /> Total Analysts
            </div>
            <div className="text-lg font-bold" style={{ color: "#e8e6e3" }}>{total_analysts}</div>
         </div>
         <div className="p-3 rounded-xl border relative overflow-hidden" style={{ background: "rgba(0, 212, 255, 0.05)", borderColor: "rgba(0, 212, 255, 0.15)" }}>
            <div className="absolute top-0 right-0 p-1 opacity-20"><Target size={32} /></div>
            <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider" style={{ color: "#00d4ff" }}>
              Prediction
            </div>
            <div className="text-sm font-bold" style={{ color: "#e8e6e3" }}>{bitigchiIndicator}</div>
         </div>
      </div>
    </div>
  );
}
