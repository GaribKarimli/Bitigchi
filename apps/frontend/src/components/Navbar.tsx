"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import BitigchiLogo from "./BitigchiLogo";
import { motion, AnimatePresence } from "framer-motion";
import {
  LogOut,
  User,
  Settings,
  Shield,
  CreditCard,
  BarChart3,
  Menu,
  X,
  Newspaper,
  BookOpen,
  Globe,
  Users,
  Search,
  Bell,
  ChevronDown,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { searchUsers, recordProfileView, UserSearchItem } from "@/lib/api";

export default function Navbar() {
  const { user, isAuthenticated, isPremium, isAdmin, logout, token } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (search.length >= 2) {
        try {
          const results = await searchUsers(search);
          setSearchResults(results);
          setShowSearch(true);
        } catch (err) {
          console.error("Search failed", err);
        }
      } else {
        setSearchResults([]);
        setShowSearch(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUserSelect = async (targetId: number) => {
    if (token) {
      await recordProfileView(token, targetId);
    }
    router.push(`/user/${targetId}`);
    setShowSearch(false);
    setSearch("");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/stock/${search.trim().toUpperCase()}`);
      setSearch("");
      setMobileOpen(false);
    }
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        background: "rgba(10, 10, 15, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Placeholder or spacer if needed, or just nothing */}
          <div className="flex-1 lg:flex-none"></div>

          {/* Desktop Nav Actions */}
          <div className="flex items-center gap-6">
            {/* Search Bar */}
            <div className="relative hidden lg:block" ref={searchRef}>
              <form onSubmit={handleSearch} className="relative">
                <Search 
                  size={14} 
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "#4a4a5a" }}
                />
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onFocus={() => search.length >= 2 && setShowSearch(true)}
                  placeholder="Search Bitigchi users..."
                  className="bg-white/[0.03] border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-[#4a4a5a] focus:border-[#00d4ff]/50 focus:ring-0 outline-none w-48 transition-all focus:w-64"
                />
              </form>

              <AnimatePresence>
                {showSearch && searchResults.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-0 top-full mt-2 w-72 rounded-2xl py-2 shadow-2xl z-[110]"
                    style={{
                      background: "rgba(20, 20, 30, 0.98)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <p className="px-4 py-2 text-[10px] uppercase font-bold tracking-widest text-[#4a4a5a]">Users</p>
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => handleUserSelect(u.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/5 text-left group"
                      >
                         <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00d4ff]/20 to-[#c9a84c]/20 flex items-center justify-center border border-white/5">
                            <User size={14} className="text-[#00d4ff]" />
                         </div>
                         <div className="flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#e8e6e3]">{u.full_name}</span>
                              {u.is_premium && <span className="text-[9px] text-[#c9a84c] tracking-widest font-black uppercase">Pro</span>}
                            </div>
                            <p className="text-[10px] text-[#4a4a5a] group-hover:text-[#6b7280]">View Profile</p>
                         </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-white/5 mx-2 hidden md:block" />

            {isAuthenticated ? (
              <>
                {!isPremium && (
                  <Link
                    href="/pricing"
                    className="text-[11px] px-4 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #c9a84c, #b08d57)",
                      color: "#0a0a0f",
                    }}
                  >
                    Upgrade
                  </Link>
                )}
                {isPremium && (
                  <div
                    className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full font-black tracking-widest"
                    style={{
                      background: "linear-gradient(135deg, rgba(201,168,76,0.15), rgba(176,141,87,0.15))",
                      color: "#e8d48b",
                      border: "1px solid rgba(201,168,76,0.2)",
                      boxShadow: "0 0 20px rgba(201,168,76,0.1)"
                    }}
                  >
                    <motion.div
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ✦
                    </motion.div>
                    <span>PRO</span>
                  </div>
                )}

                {/* User Menu */}
                <div className="relative group">
                  <button
                    className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl transition-all hover:bg-white/5"
                    style={{
                      border: "1px solid rgba(255,255,255,0.05)",
                      color: "#e8e6e3",
                    }}
                  >
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#00d4ff]/20 to-[#c9a84c]/20 flex items-center justify-center border border-white/5">
                       <User size={14} className="text-[#00d4ff]" />
                    </div>
                    <span className="text-xs font-semibold truncate max-w-[120px]">
                      {user?.full_name || user?.email?.split("@")[0]}
                    </span>
                  </button>
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 shadow-2xl z-[100]"
                    style={{
                      background: "rgba(20, 20, 30, 0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Link
                      href={`/user/${user?.id}`}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-medium transition-colors hover:bg-white/5"
                      style={{ color: "#e8e6e3" }}
                    >
                      <User size={14} className="text-[#00d4ff]" />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-xs font-medium transition-colors hover:bg-white/5"
                      style={{ color: "#e8e6e3" }}
                    >
                      <Settings size={14} className="text-[#6b7280]" />
                      Account Settings
                    </Link>
                    <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} className="my-1 mx-2" />
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-4 py-3 text-xs font-medium w-full text-left transition-colors hover:bg-white/5"
                      style={{ color: "#ef4444" }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  href="/login"
                  className="text-xs font-bold uppercase tracking-widest transition-colors hover:text-white"
                  style={{ color: "#6b7280" }}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-xs px-5 py-2 rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #c9a84c, #b08d57)",
                    color: "#0a0a0f",
                  }}
                >
                  Join
                </Link>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative group">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all bg-white/[0.03] border border-white/5"
                style={{ color: "#a0a0b0" }}
              >
                <Globe size={14} />
                <span className="text-[10px] uppercase font-bold tracking-widest">{language}</span>
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-36 rounded-2xl py-2 shadow-2xl z-[100]"
                    style={{
                      background: "rgba(26, 26, 46, 0.95)",
                      backdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-bold transition-colors hover:bg-white/5 ${language === lang.code ? 'text-[#00d4ff]' : 'text-[#e8e6e3]'}`}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: "#e8e6e3" }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden pb-4 space-y-2"
          >
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="px-3 py-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search symbol..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white outline-none focus:border-[#00d4ff]/50"
                />
              </div>
            </form>

            <Link href="/" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
              Dashboard
            </Link>
            <Link href="/feed" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm font-bold text-[#00d4ff] rounded-lg hover:bg-white/5">
              Reels
            </Link>
            <Link href="/messages" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
              Inbox
            </Link>
            <div className="px-3 py-2">
              <label className="text-xs text-gray-500 mb-2 block uppercase tracking-wider">Language</label>
              <div className="grid grid-cols-2 gap-2">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setMobileOpen(false); }}
                    className={`text-left text-sm py-1.5 px-2 rounded-md ${language === lang.code ? 'bg-[#00d4ff]/10 text-[#00d4ff]' : 'text-[#a0a0b0]'}`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            </div>
            <Link href="/news" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
              News
            </Link>
            <Link href="/learn" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
              Learn
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/settings" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
                  Settings
                </Link>
                <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
                  Pricing
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
                    Admin
                  </Link>
                )}
                <button onClick={() => { logout(); setMobileOpen(false); }} className="block w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#ef4444" }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg hover:bg-white/5" style={{ color: "#e8e6e3" }}>
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm rounded-lg" style={{ background: "linear-gradient(135deg, #c9a84c, #b08d57)", color: "#0a0a0f" }}>
                  Get Started
                </Link>
              </>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
