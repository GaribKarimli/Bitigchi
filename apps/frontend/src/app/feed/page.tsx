"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageCircle, Share2, User as UserIcon, MoreVertical, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";

// Represents a Post/Reel from MongoDB
interface FeedPost {
  _id: string;
  user_id: number;
  user_name: string;
  user_avatar?: string;
  content: string;
  ticker?: string;
  media_url?: string;
  media_type?: string;
  sentiment?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function FeedPage() {
  const { token, user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"for_you" | "following">("for_you");

  // In a real app, you would fetch from /api/v2/social/feed/global or /following
  const loadMockFeed = () => {
    setLoading(true);
    // Simulating fetched data including new media_url from MinIO
    setTimeout(() => {
      setPosts([
        {
          _id: "1",
          user_id: 101,
          user_name: "ProTrader99",
          content: "AAPL is showing massive breakout potential on the daily chart. The cup and handle pattern is fully formed. Expecting a push towards $280 this week if volume sustains.",
          ticker: "AAPL",
          sentiment: "BULLISH",
          likes_count: 342,
          comments_count: 56,
          created_at: new Date().toISOString(),
          // Placeholder for MinIO WebP uploaded image
          media_url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80" 
        },
        {
          _id: "2",
          user_id: 102,
          user_name: "BearSlayer",
          content: "Tech sector looks overheated. Taking profits on NVDA here. Might re-enter around $110 level. Stay cautious and watch the macro economic data tomorrow.",
          ticker: "NVDA",
          sentiment: "BEARISH",
          likes_count: 128,
          comments_count: 22,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          _id: "3",
          user_id: 103,
          user_name: "CryptoWhale",
          content: "Just loaded up more bags! This is the accumulation zone.",
          media_url: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=800&q=80",
          likes_count: 890,
          comments_count: 120,
          created_at: new Date(Date.now() - 172800000).toISOString(),
        }
      ]);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    loadMockFeed();
  }, [activeTab]);

  return (
    <div className="min-h-screen pt-16 flex justify-center bg-[#0a0a0f]">
      <Navbar />
      
      {/* Mobile-first Reels Layout */}
      <div className="w-full max-w-[500px] h-[calc(100vh-64px)] overflow-y-scroll snap-y snap-mandatory hide-scrollbar relative">
        
        {/* Top Tab Switcher */}
        <div className="absolute top-0 left-0 w-full z-10 flex justify-center pt-6 pointer-events-none">
           <div className="flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 pointer-events-auto">
             <button 
               onClick={() => setActiveTab("following")}
               className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "following" ? "text-white" : "text-white/40 hover:text-white/80"}`}
             >
               Following
             </button>
             <button 
               onClick={() => setActiveTab("for_you")}
               className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${activeTab === "for_you" ? "text-white" : "text-white/40 hover:text-white/80"}`}
             >
               For You
             </button>
           </div>
        </div>

        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-pulse text-[#00d4ff]">Loading Feed...</div>
          </div>
        ) : (
          posts.map((post) => (
            <div 
              key={post._id} 
              className="w-full h-[calc(100vh-64px)] snap-start snap-always relative bg-black flex flex-col justify-end overflow-hidden border-b border-white/5"
            >
              {/* Media Background (MinIO mapped image or video) */}
              {post.media_url ? (
                <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: `url(${post.media_url})` }}>
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
                </div>
              ) : (
                <div className="absolute inset-0 z-0 bg-[#0d0d17] flex items-center justify-center">
                   <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent z-10" />
                   <div className="text-white/5 text-9xl font-black rotate-[-15deg] uppercase">Text Post</div>
                </div>
              )}

              {/* Right Sidebar Actions */}
              <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-6">
                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white transition-all group-hover:scale-110 group-hover:text-pink-500">
                    <Heart fill="currentColor" className="opacity-80 group-hover:opacity-100" />
                  </div>
                  <span className="text-xs font-bold text-white drop-shadow-md">{post.likes_count}</span>
                </button>
                
                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white transition-all group-hover:scale-110">
                    <MessageCircle fill="currentColor" className="opacity-80" />
                  </div>
                  <span className="text-xs font-bold text-white drop-shadow-md">{post.comments_count}</span>
                </button>
                
                <button className="flex flex-col items-center gap-1 group">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-lg flex items-center justify-center text-white transition-all group-hover:scale-110">
                    <Share2 />
                  </div>
                  <span className="text-xs font-bold text-white drop-shadow-md">Share</span>
                </button>
                
                <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/60 hover:text-white mt-4">
                  <MoreVertical />
                </button>
              </div>

              {/* Bottom Info Area */}
              <div className="relative z-20 p-4 pb-8 w-[80%]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full border border-white/20 bg-gradient-to-br from-[#00d4ff] to-[#c9a84c] flex items-center justify-center text-black font-bold">
                    {post.user_avatar ? (
                      <img src={post.user_avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                       <UserIcon size={20} />
                    )}
                  </div>
                  <h3 className="font-bold text-white text-base drop-shadow-lg">@{post.user_name}</h3>
                  <button className="px-3 py-1 rounded-full border border-white/40 text-xs font-bold text-white backdrop-blur-sm hover:bg-white/10">
                    Follow
                  </button>
                </div>
                
                {post.ticker && (
                   <span className="inline-block px-2.5 py-1 bg-[#00d4ff]/20 text-[#00d4ff] text-xs font-black rounded backdrop-blur-md mb-2">
                     ${post.ticker}
                   </span>
                )}
                {post.sentiment && (
                   <span className={`inline-block ml-2 px-2.5 py-1 text-xs font-black rounded backdrop-blur-md mb-2 uppercase ${post.sentiment === "BULLISH" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                     {post.sentiment}
                   </span>
                )}
                
                <p className="text-sm font-medium text-white/90 drop-shadow-md leading-relaxed line-clamp-3">
                  {post.content}
                </p>
                <button className="text-xs text-white/50 font-bold mt-2">See more</button>
              </div>

              {/* Progress Line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20">
                 <div className="h-full bg-gradient-to-r from-[#00d4ff] to-[#c9a84c] w-1/3" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
