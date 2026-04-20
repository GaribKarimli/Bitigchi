"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, TrendingUp, MessageSquare, ArrowRight } from "lucide-react";
import { fetchCommunityFeed, Comment } from "@/lib/api";
import Link from "next/link";

export default function CommunityPage() {
  const [feed, setFeed] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityFeed()
      .then(setFeed)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-grid pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] text-[10px] font-bold uppercase tracking-wider mb-4"
            >
              <Users size={12} />
              Bitigchi Global
            </motion.div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">
              Investor Community
            </h1>
            <p className="text-sm" style={{ color: "#6b7280" }}>
               Real-time analyst insights and discussions from smart investors worldwide.
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-xs" style={{ color: "#6b7280" }}>
             <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span>1.2k Active Now</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-white mb-4">
              <TrendingUp size={20} className="text-[#c9a84c]" />
              Hot Discussions
            </h2>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-40 rounded-2xl bg-white/[0.02] border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : feed.length === 0 ? (
               <div className="py-20 text-center border border-dashed border-white/5 rounded-2xl">
                  <p style={{ color: "#4a4a5a" }}>The community is quiet. Start a discussion on any stock page!</p>
               </div>
            ) : (
              feed.map((comment, idx) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#00d4ff]/20 to-[#c9a84c]/20 flex items-center justify-center border border-white/5">
                           <span className="text-xs font-bold text-[#e8e6e3]">{comment.user.full_name?.[0] || "U"}</span>
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">{comment.user.full_name || "Anonymous"}</span>
                              <span className="text-[10px]" style={{ color: "#6b7280" }}>• {new Date(comment.created_at).toLocaleDateString()}</span>
                           </div>
                           <Link 
                             href={`/stock/${comment.symbol}`}
                             className="text-[10px] font-black text-[#00d4ff] hover:underline"
                           >
                              ${comment.symbol}
                           </Link>
                        </div>
                     </div>
                     {comment.sentiment && (
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${comment.sentiment === 'bullish' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                           {comment.sentiment}
                        </span>
                     )}
                  </div>
                  
                  <p className="text-sm leading-relaxed text-[#e8e6e3] mb-6">
                    {comment.content}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-xs" style={{ color: "#6b7280" }}>
                           <MessageSquare size={14} /> {comment.likes_count} Reactions
                        </div>
                     </div>
                     <Link 
                       href={`/stock/${comment.symbol}`}
                       className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#00d4ff] group-hover:translate-x-1 transition-all"
                     >
                        View Analysis <ArrowRight size={14} />
                     </Link>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
                <h3 className="font-bold text-white mb-4">Trending Tickers</h3>
                <div className="space-y-3">
                   {["AAPL", "TSLA", "NVDA", "RZLV", "COIN"].map(t => (
                      <Link 
                        key={t} 
                        href={`/stock/${t}`}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors group"
                      >
                         <span className="text-sm font-bold text-[#e8e6e3] group-hover:text-[#00d4ff]">${t}</span>
                         <span className="text-[10px] text-green-500">+2.4%</span>
                      </Link>
                   ))}
                </div>
             </div>

             <div className="p-6 rounded-2xl border border-[#c9a84c]/20 bg-[#c9a84c]/5">
                <h3 className="font-bold text-white mb-2">Bitigchi Vision</h3>
                <p className="text-xs leading-relaxed" style={{ color: "#6b7280" }}>
                   Our goal is to build the most transparent financial network. Share your charts, arrows, and analysis to help others grow.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
