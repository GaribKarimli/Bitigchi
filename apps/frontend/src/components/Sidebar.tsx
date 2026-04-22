"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
  LayoutDashboard, 
  TrendingUp, 
  MessageSquare, 
  Newspaper, 
  BookOpen, 
  Users, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  CreditCard
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BitigchiLogo from "./BitigchiLogo";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/" },
  { name: "Reels", icon: TrendingUp, href: "/feed" },
  { name: "Inbox", icon: MessageSquare, href: "/messages" },
  { name: "Global Feed", icon: Users, href: "/community" },
  { name: "News", icon: Newspaper, href: "/news" },
  { name: "Academy", icon: BookOpen, href: "/learn" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isPremium } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 80 : 260 }}
      className="fixed left-0 top-0 h-screen z-[60] flex flex-col border-r transition-all duration-300"
      style={{
        background: "rgba(10, 10, 15, 0.95)",
        backdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {/* Sidebar Header - Logo */}
      <div className="h-20 flex items-center px-6 relative">
        <Link href="/" className="flex items-center gap-3">
          <BitigchiLogo size={32} />
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col"
            >
              <span className="text-sm font-bold tracking-widest text-[#c9a84c]">𐰋𐰃𐱅𐰃𐰏𐰲𐰃</span>
              <span className="text-[9px] tracking-[0.2em] text-[#6b7280]">BITIGCHI</span>
            </motion.div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#1a1a2e] border border-white/10 flex items-center justify-center text-[#6b7280] hover:text-[#00d4ff] transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 select-none">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${
                  isActive 
                    ? "bg-[#00d4ff]/10 text-white" 
                    : "text-[#a0a0b0] hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-pill"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#00d4ff] rounded-r-full"
                  />
                )}
                <item.icon size={20} className={isActive ? "text-[#00d4ff]" : "group-hover:text-[#00d4ff]"} />
                {!collapsed && (
                  <span className="text-sm font-medium tracking-wide">{item.name}</span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Bottom Actions */}
      <div className="p-3 space-y-1 mb-4">
        {isAdmin && (
           <Link href="/admin">
             <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#a0a0b0] hover:bg-white/[0.03] transition-all group">
               <Shield size={20} className="group-hover:text-[#00d4ff]" />
               {!collapsed && <span className="text-sm font-medium">Admin Panel</span>}
             </div>
           </Link>
        )}
        {isPremium && (
           <Link href="/profile-views">
             <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${pathname === '/profile-views' ? 'bg-[#c9a84c]/10 text-white' : 'text-[#a0a0b0] hover:bg-white/[0.03] hover:text-white'}`}>
                <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 5, repeat: Infinity }}>
                  <Users size={20} className={pathname === '/profile-views' ? "text-[#c9a84c]" : "group-hover:text-[#c9a84c]"} />
                </motion.div>
                {!collapsed && <span className="text-sm font-medium">Profile Views</span>}
             </div>
           </Link>
        )}
        
        <Link href="/settings">
          <div className="flex items-center gap-4 px-4 py-3 rounded-xl text-[#a0a0b0] hover:bg-white/[0.03] transition-all group">
            <Settings size={20} className="group-hover:text-[#00d4ff]" />
            {!collapsed && <span className="text-sm font-medium">Settings</span>}
          </div>
        </Link>
        
        {isPremium && !collapsed && (
           <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-[#c9a84c]/10 to-[#b08d57]/10 border border-[#c9a84c]/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-[#c9a84c]/20 flex items-center justify-center">
                   <CreditCard size={12} className="text-[#c9a84c]" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#c9a84c]">Pro Version</span>
              </div>
              <p className="text-[11px] leading-relaxed text-[#a0a0b0]">Advanced analytics & priority signals active.</p>
           </div>
        )}
      </div>
    </motion.aside>
  );
}
