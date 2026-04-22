"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { fetchStockLookup } from "@/lib/api";
import type { TickerItem } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import PriceChart from "@/components/PriceChart";
import SentimentGauge from "@/components/SentimentGauge";
import AnalystScore from "@/components/AnalystScore";
import DiscussionBoard from "@/components/DiscussionBoard";
import AIChatWidget from "@/components/AIChatWidget";
import PerformanceStats from "@/components/PerformanceStats";
import { useStockWebSocket } from "@/hooks/useStockWebSocket";

// Hardcoded for development - in production this would be an env var
const FINNHUB_KEY = "d7ihg2pr01qn2qau1om0d7ihg2pr01qn2qau1omg";

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const symbol = (params.symbol as string)?.toUpperCase();

  const [data, setData] = useState<TickerItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("3mo");

  // Real-time WebSocket Data
  const { livePrice, pressure, isWsConnected } = useStockWebSocket(symbol, FINNHUB_KEY);

  useEffect(() => {
    if (!symbol) return;
    if (!data) setLoading(true);
    
    setError("");
    fetchStockLookup(symbol, token || undefined, range)
      .then((res) => {
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
          <Loader2 size={48} className="animate-spin mx-auto mb-4 text-[#00d4ff]" />
          <p className="text-sm font-mono tracking-tighter text-white/40">SYNCHRONIZING {symbol} DATA...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-grid flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2 text-white">Stock Not Found</h2>
          <p className="text-sm mb-6 text-white/60">{error || `'${symbol}' is not a valid ticker symbol.`}</p>
          <button onClick={() => router.push("/")} className="btn-primary">← DISCOVERY PANEL</button>
        </motion.div>
      </div>
    );
  }

  const effectivePrice = livePrice || data.current_price;
  const isPositive = (data.change_pct ?? 0) >= 0;

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/30 hover:text-[#00d4ff] transition-all"
          >
            <ArrowLeft size={16} />
            Market Grid
          </button>
          <div className="flex items-center gap-2 text-[10px] text-white/20 font-bold uppercase">
             <span>Markets</span> <ChevronRight size={10} /> <span>{data.sector}</span> <ChevronRight size={10} /> <span className="text-white/60">{symbol}</span>
          </div>
        </div>

        {/* Main Header with WebSocket Logic */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-5xl font-black tracking-tighter text-white mb-2">{data.symbol}</h1>
            <div className="flex items-center gap-3">
               <p className="text-sm font-bold text-white/40 uppercase tracking-widest">{data.name}</p>
               <span className="w-1 h-3 bg-white/10 rounded-full" />
               <p className="text-sm font-bold text-[#00d4ff]">{data.sector}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col items-start lg:items-end gap-2">
            <div className="flex items-baseline gap-4">
              <AnimatePresence mode="wait">
                <motion.span 
                  key={effectivePrice}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-6xl font-black tracking-tighter text-white"
                >
                  ${effectivePrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </motion.span>
              </AnimatePresence>
              
              <div className="flex flex-col gap-1">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-black ${isPositive ? 'text-[#10b981] bg-[#10b981]/10' : 'text-[#ef4444] bg-[#ef4444]/10'}`}>
                  {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  {isPositive ? "+" : ""}{data.change_pct?.toFixed(2)}%
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               {/* Buying vs Selling Pressure */}
               <div className="flex flex-col items-end gap-1">
                  <div className="flex justify-between w-32 text-[9px] font-bold text-white/30 uppercase tracking-tighter">
                     <span>Sell</span>
                     <span>Buy</span>
                  </div>
                  <div className="w-32 h-1.5 rounded-full bg-white/5 overflow-hidden flex">
                      <motion.div 
                        animate={{ width: `${100 - pressure}%` }}
                        className="h-full bg-red-500/50" 
                      />
                      <motion.div 
                        animate={{ width: `${pressure}%` }}
                        className="h-full bg-green-500/50" 
                      />
                  </div>
               </div>
               <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isWsConnected ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-[#00d4ff]/10 border-[#00d4ff]/20 text-[#00d4ff]'}`}>
                 <div className={`w-2 h-2 rounded-full animate-pulse ${isWsConnected ? 'bg-green-500' : 'bg-[#00d4ff]'}`} />
                 <span className="text-[10px] font-black uppercase tracking-widest">{isWsConnected ? 'WS Sync' : 'Live Poll'}</span>
               </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Chart Section */}
          <div className="lg:col-span-2 space-y-8">
            <PriceChart 
              data={data.price_history} 
              period={range}
              onPeriodChange={setRange}
            />
            
            {/* Multi-Period Performance Metrics */}
            <div className="pt-4">
               <h3 className="text-xs font-black text-white/20 uppercase tracking-[0.2em] mb-4">Historical Performance Engine</h3>
               <PerformanceStats history={data.price_history} currentPrice={effectivePrice || 0} />
            </div>
          </div>

          {/* Right Column: Intelligence & Community */}
          <div className="space-y-8">
            {/* Technical Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl p-6 bg-black/40 border border-white/5 backdrop-blur-xl"
            >
              <h3 className="text-xs font-black text-white/40 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Activity size={16} className="text-[#00d4ff]" />
                Momentum Matrix
              </h3>
              <div className="space-y-6">
                {/* RSI */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-bold text-white/30 uppercase">RSI (14)</span>
                    <span className={`text-sm font-black font-mono ${ (data.rsi ?? 50) > 70 ? "text-red-500" : (data.rsi ?? 50) < 30 ? "text-green-500" : "text-[#00d4ff]" }`}>
                      {data.rsi?.toFixed(1)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(data.rsi ?? 50, 100)}%` }}
                      className={`h-full transition-all ${ (data.rsi ?? 50) > 70 ? "bg-red-500" : (data.rsi ?? 50) < 30 ? "bg-green-500" : "bg-gradient-to-r from-blue-500 to-cyan-400" }`}
                    />
                  </div>
                </div>

                {/* SMA Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-[9px] font-bold text-white/20 uppercase mb-1">SMA 20</p>
                    <p className="text-sm font-black text-white font-mono">${data.sma20?.toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                    <p className="text-[9px] font-bold text-white/20 uppercase mb-1">SMA 50</p>
                    <p className="text-sm font-black text-white font-mono">${data.sma50?.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Analyst Consensus */}
            <div className="rounded-2xl p-6 bg-black/40 border border-white/5 backdrop-blur-xl">
               <AnalystScore ticker={data.symbol} price={effectivePrice ?? undefined} />
            </div>

            {/* Sentiment Gauge */}
            <div className="rounded-2xl p-6 bg-black/40 border border-white/5 backdrop-blur-xl">
               <SentimentGauge ticker={data.symbol} />
            </div>
          </div>
        </div>

        {/* Community & AI Section (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-12 border-t border-white/5"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 rounded-2xl p-8 bg-black/40 border border-white/5">
                <DiscussionBoard ticker={symbol} />
             </div>
             
             <div className="space-y-8">
                {/* AI Analysis Card */}
                <div className="rounded-3xl p-8 relative overflow-hidden group bg-gradient-to-br from-[#00d4ff]/10 to-transparent border border-[#00d4ff]/20">
                   <div className="relative z-10">
                      <h4 className="text-lg font-black text-white mb-4 flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-[#00d4ff] flex items-center justify-center">
                            <Activity size={18} className="text-black" />
                         </div>
                         AI Insights
                      </h4>
                      <p className="text-sm leading-relaxed text-white/60 mb-6 font-medium">
                         Deep-dive analysis of {symbol} reveals high liquidity and positive sentiment momentum.
                      </p>
                      <ul className="space-y-3">
                         <li className="flex items-center gap-3 text-xs font-bold text-white/80">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Bullish Order Flow
                         </li>
                         <li className="flex items-center gap-3 text-xs font-bold text-white/80">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#10b981]" /> Strong SMA Alignment
                         </li>
                      </ul>
                   </div>
                </div>
             </div>
          </div>
        </motion.div>
      </div>

      <AIChatWidget symbol={symbol} />
    </div>
  );
}
