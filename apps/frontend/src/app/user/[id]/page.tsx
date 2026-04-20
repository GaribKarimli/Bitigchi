"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserPlus, MessageCircle, BarChart3, Medal, ExternalLink, User as UserIcon, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useParams } from "next/navigation";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.id;
  
  const [isFollowing, setIsFollowing] = useState(false);

  // Mock static data
  const profile = {
    name: "Alex Sterling",
    username: "ProTrader99",
    bio: "Value investor and tech swing trader. Sharing insights on macro trends and setups.",
    followers: 12400,
    following: 154,
    winRate: "68%",
    topHoldings: ["AAPL", "NVDA", "BTC"],
    postsCount: 142
  };

  const posts = [
    {
       id: 1,
       image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80",
       ticker: "AAPL",
       sentiment: "BULLISH",
       likes: 342,
       comments: 56
    },
    {
       id: 2,
       image: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=500&q=80",
       ticker: "BTC",
       sentiment: "BULLISH",
       likes: 890,
       comments: 120
    },
    {
       id: 3,
       textOnly: true,
       content: "Massive drop coming for the software sector. Fundamentals don't support these multiples.",
       ticker: "SNOW",
       sentiment: "BEARISH",
       likes: 128,
       comments: 22
    }
  ];

  return (
    <div className="min-h-screen pt-16 bg-[#0a0a0f] flex justify-center">
      <Navbar />
      
      <div className="w-full max-w-4xl p-4 md:p-8">
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-12">
          {/* Avatar */}
          <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 rounded-full bg-gradient-to-br from-[#00d4ff] to-[#c9a84c] p-1">
             <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                <UserIcon size={60} className="text-white/20" />
             </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              <div className="flex items-center justify-center gap-2">
                <button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-6 py-1.5 rounded-lg text-sm font-bold transition-all ${
                    isFollowing 
                    ? "bg-white/10 text-white hover:bg-white/20" 
                    : "bg-[#00d4ff] text-black hover:bg-[#00b8e6]"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10">
                  <MessageCircle size={18} />
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-6 text-white mb-4">
               <div><span className="font-bold">{profile.postsCount}</span> <span className="text-sm text-white/60">posts</span></div>
               <div><span className="font-bold">{profile.followers.toLocaleString()}</span> <span className="text-sm text-white/60">followers</span></div>
               <div><span className="font-bold">{profile.following}</span> <span className="text-sm text-white/60">following</span></div>
            </div>
            
            <div>
               <h3 className="font-bold text-sm text-white">{profile.name}</h3>
               <p className="text-sm text-white/80 mt-1">{profile.bio}</p>
            </div>
            
            {/* Reputation Badges */}
            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
                 <Medal size={14} className="text-[#c9a84c]" />
                 Top 5% Analyst
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white">
                 <BarChart3 size={14} className="text-[#00d4ff]" />
                 {profile.winRate} Win Rate
               </div>
            </div>
          </div>
        </div>

        {/* Top Holdings Bar */}
        <div className="w-full flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/[0.02] mb-8">
           <span className="text-xs text-white/60 uppercase font-bold tracking-widest text-center w-full md:w-auto md:text-left">Top Holdings</span>
           <div className="hidden md:flex items-center gap-4">
             {profile.topHoldings.map(t => (
               <div key={t} className="px-3 py-1 bg-white/10 rounded font-bold text-sm text-white">
                 ${t}
               </div>
             ))}
           </div>
        </div>

        {/* Media Grid (Instagram Style) */}
        <div className="grid grid-cols-3 gap-1 md:gap-6">
          {posts.map(post => (
             <div key={post.id} className="aspect-square relative group bg-white/5 overflow-hidden rounded md:rounded-xl cursor-pointer">
               {post.textOnly ? (
                 <div className="absolute inset-0 p-4 flex items-center justify-center text-center bg-gradient-to-br from-[#0d0d17] to-black">
                   <p className="text-xs md:text-sm font-medium text-white/80 line-clamp-4">{post.content}</p>
                 </div>
               ) : (
                 <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }} />
               )}
               
               {/* Hover Overlay */}
               <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 md:gap-8 backdrop-blur-sm">
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <Heart fill="currentColor" size={20} />
                    <span>{post.likes}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white font-bold">
                    <MessageCircle fill="currentColor" size={20} />
                    <span>{post.comments}</span>
                  </div>
               </div>

               {/* Tags */}
               <div className="absolute top-2 right-2 flex gap-1">
                 {post.ticker && <span className="px-1.5 py-0.5 bg-black/60 backdrop-blur text-white text-[10px] font-bold rounded">${post.ticker}</span>}
               </div>
             </div>
          ))}
        </div>

      </div>
    </div>
  );
}
