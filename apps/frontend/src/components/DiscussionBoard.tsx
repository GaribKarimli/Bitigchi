"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, ThumbsUp, TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon, Clock, User } from "lucide-react";
import { 
  fetchComments, 
  postComment, 
  SocialComment 
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export default function DiscussionBoard({ ticker }: { ticker: string }) {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<SocialComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sentiment, setSentiment] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    loadComments();
  }, [ticker]);

  const loadComments = async () => {
    try {
      setFetching(true);
      const data = await fetchComments(ticker);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;

    setLoading(true);
    try {
      const created = await postComment(token, {
        symbol: ticker,
        content: newComment,
        sentiment: sentiment || undefined
      });
      setComments([created, ...comments]);
      setNewComment("");
      setSentiment(null);
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (commentId: number) => {
    // Note: V1 react endpoint not used yet or slightly different, 
    // but we can optimize later. For now, just a UI mock or 
    // we could add reactToComment to api.ts
    console.log("Like clicked", commentId);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare size={20} style={{ color: "#00d4ff" }} />
          <h3 className="font-bold text-lg" style={{ color: "#e8e6e3" }}>Community Discussion</h3>
        </div>
        <span className="text-xs uppercase tracking-widest px-2 py-1 rounded bg-white/5" style={{ color: "#6b7280" }}>
          {comments.length} Posts
        </span>
      </div>

      {/* Post Box */}
      {token ? (
        <form onSubmit={handleSubmit} className="mb-8 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
           <textarea
             value={newComment}
             onChange={(e) => setNewComment(e.target.value)}
             placeholder="What's your analysis for this stock?..."
             className="w-full bg-transparent border-none focus:ring-0 text-sm resize-none h-20 placeholder:text-[#4a4a5a]"
             style={{ color: "#e8e6e3" }}
           />
           <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                 <button 
                   type="button"
                   onClick={() => setSentiment(sentiment === "bullish" ? null : "bullish")}
                   className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${sentiment === "bullish" ? "bg-green-500/20 text-green-500" : "bg-white/5 text-[#6b7280]"}`}
                 >
                   <TrendingUpIcon size={12} /> Bullish
                 </button>
                 <button 
                   type="button"
                   onClick={() => setSentiment(sentiment === "bearish" ? null : "bearish")}
                   className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${sentiment === "bearish" ? "bg-red-500/20 text-red-500" : "bg-white/5 text-[#6b7280]"}`}
                 >
                   <TrendingDownIcon size={12} /> Bearish
                 </button>
              </div>
              <button 
                type="submit" 
                disabled={loading || !newComment.trim()}
                className="btn-primary py-1.5 px-4 text-xs flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? "Posting..." : <><Send size={14} /> Post</>}
              </button>
           </div>
        </form>
      ) : (
         <div className="mb-8 p-6 text-center rounded-xl border border-dashed border-white/10 bg-white/[0.01]">
            <p className="text-sm mb-3" style={{ color: "#6b7280" }}>Join the conversation</p>
            <Link href="/login" className="text-xs font-bold text-[#00d4ff] hover:underline cursor-pointer">
              Login to post analysis
            </Link>
         </div>
      )}

      {/* Feed */}
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {fetching ? (
          <div className="py-20 text-center animate-pulse" style={{ color: "#6b7280" }}>Loading feed...</div>
        ) : comments.length === 0 ? (
          <div className="py-20 text-center" style={{ color: "#4a4a5a" }}>Be the first to share an analysis!</div>
        ) : (
          <AnimatePresence>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff]/20 to-[#c9a84c]/20 flex items-center justify-center border border-white/5">
                      <User size={14} style={{ color: "#00d4ff" }} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold" style={{ color: "#e8e6e3" }}>{comment.user.full_name || "Anonymous Investor"}</h4>
                      <p className="text-[10px]" style={{ color: "#4a4a5a" }}>@{comment.user.email.split('@')[0]}</p>
                    </div>
                  </div>
                  {comment.sentiment && (
                    <div className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${comment.sentiment === "bullish" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                      {comment.sentiment}
                    </div>
                  )}
                </div>
                
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#e8e6e3" }}>
                  {comment.content}
                </p>

                <div className="flex items-center gap-4 pt-3 border-t border-white/[0.03]">
                  <button 
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center gap-1.5 text-xs transition-colors hover:text-[#00d4ff]" 
                    style={{ color: "#6b7280" }}
                  >
                    <ThumbsUp size={14} />
                    <span>{comment.likes_count}</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-xs ml-auto" style={{ color: "#4a4a5a" }}>
                    <Clock size={12} />
                    <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
