"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, User, Clock, ShieldCheck, ChevronRight, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMyProfileViews, ProfileView } from "@/lib/api";
import Link from "next/link";

export default function ProfileViewsPage() {
  const { token, isPremium, user } = useAuth();
  const [views, setViews] = useState<ProfileView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token && isPremium) {
      loadViews();
    } else {
      setLoading(false);
    }
  }, [token, isPremium]);

  const loadViews = async () => {
    try {
      const data = await fetchMyProfileViews(token!);
      setViews(data);
    } catch (err) {
      console.error("Failed to load profile views", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="w-20 h-20 rounded-3xl bg-[#c9a84c]/10 flex items-center justify-center mb-6 border border-[#c9a84c]/20">
           <ShieldCheck size={40} className="text-[#c9a84c]" />
        </div>
        <h1 className="text-3xl font-black mb-4 tracking-tight" style={{ color: "#e8e6e3" }}>
          Premium Feature
        </h1>
        <p className="text-[#6b7280] max-w-md mb-8 leading-relaxed">
          The "Who viewed my profile" feature is exclusive to PRO members. 
          See which institutional investors and top traders are watching your strategy.
        </p>
        <Link href="/pricing" className="btn-primary py-3 px-8 rounded-2xl font-bold uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(201,168,76,0.3)]">
          Upgrade to Bitigchi Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: "#e8e6e3" }}>
            Profile Analytics
          </h1>
          <p className="text-sm" style={{ color: "#6b7280" }}>
            Tracking who has accessed your investment profile.
          </p>
        </div>
        <div className="px-5 py-2.5 rounded-full bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-[#c9a84c]">Pro Status</span>
           <div className="w-2 h-2 rounded-full bg-[#c9a84c] animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         {[
           { label: "Total Views", value: views.length, icon: Users, color: "#00d4ff" },
           { label: "Reach", value: "Global", icon: LayoutDashboard, color: "#c9a84c" },
           { label: "Profile Health", value: "92%", icon: ShieldCheck, color: "#10b981" },
         ].map((stat, i) => (
           <motion.div 
             key={i}
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: i * 0.1 }}
             className="p-6 rounded-3xl bg-white/[0.02] border border-white/5"
           >
              <div className="flex items-center gap-3 mb-4">
                 <stat.icon size={18} style={{ color: stat.color }} />
                 <span className="text-[10px] uppercase font-bold tracking-widest text-[#6b7280]">{stat.label}</span>
              </div>
              <div className="text-2xl font-black text-[#e8e6e3]">{stat.value}</div>
           </motion.div>
         ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="h-40 rounded-3xl bg-white/[0.01] animate-pulse border border-dashed border-white/5 flex items-center justify-center">
             <span className="text-sm text-[#4a4a5a]">Analyzing viewer traffic...</span>
          </div>
        ) : views.length === 0 ? (
          <div className="py-20 text-center rounded-3xl border border-dashed border-white/10">
             <p style={{ color: "#6b7280" }}>No significant views recorded in the last 30 days.</p>
          </div>
        ) : (
          <AnimatePresence>
            {views.map((v, idx) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d4ff]/10 to-[#c9a84c]/10 flex items-center justify-center border border-white/10 group-hover:border-[#00d4ff]/30 transition-colors">
                   <User size={20} className="text-[#00d4ff]" />
                </div>
                <div className="flex-1">
                   <h3 className="text-sm font-bold text-[#e8e6e3]">{v.viewer_name}</h3>
                   <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-[#4a4a5a]">
                         <Clock size={12} />
                         <span>{new Date(v.viewed_at).toLocaleDateString()}</span>
                      </div>
                      <span className="text-[10px] text-[#00d4ff] opacity-0 group-hover:opacity-100 transition-opacity">View Profile</span>
                   </div>
                </div>
                <button className="p-2 rounded-xl bg-white/5 text-[#6b7280] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors">
                   <ChevronRight size={18} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
