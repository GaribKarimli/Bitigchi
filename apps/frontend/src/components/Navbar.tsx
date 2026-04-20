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
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, isAuthenticated, isPremium, isAdmin, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

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
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <BitigchiLogo size={36} />
            <div className="flex flex-col">
              <span
                className="text-lg font-bold tracking-wide"
                style={{ color: "#c9a84c" }}
              >
                BITIGCHI
              </span>
              <span
                className="text-[10px] tracking-[0.3em] uppercase"
                style={{ color: "#6b7280" }}
              >
                Market Intelligence
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[#00d4ff]"
              style={{ color: "#a0a0b0" }}
            >
              <BarChart3 size={16} />
              Dashboard
            </Link>
            <Link
              href="/news"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[#00d4ff]"
              style={{ color: "#a0a0b0" }}
            >
              <Newspaper size={16} />
              News
            </Link>
            <Link
              href="/learn"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[#00d4ff]"
              style={{ color: "#a0a0b0" }}
            >
              <BookOpen size={16} />
              Learn
            </Link>
            <Link
              href="/community"
              className="flex items-center gap-2 text-sm transition-colors hover:text-[#00d4ff]"
              style={{ color: "#a0a0b0" }}
            >
              <Users size={16} />
              Community
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative hidden lg:block ml-4">
              <Search 
                size={14} 
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#4a4a5a" }}
              />
              <input 
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol (e.g. AAPL)..."
                className="bg-white/[0.03] border border-white/10 rounded-full py-1.5 pl-9 pr-4 text-xs text-white placeholder:text-[#4a4a5a] focus:border-[#00d4ff]/50 focus:ring-0 outline-none w-48 transition-all focus:w-64"
              />
            </form>

            {isAuthenticated ? (
              <>
                {!isPremium && (
                  <Link
                    href="/pricing"
                    className="text-sm px-4 py-1.5 rounded-full font-medium transition-all hover:scale-105"
                    style={{
                      background: "linear-gradient(135deg, #c9a84c, #b08d57)",
                      color: "#0a0a0f",
                    }}
                  >
                    Upgrade to Pro
                  </Link>
                )}
                {isPremium && (
                  <span
                    className="text-xs px-3 py-1 rounded-full font-bold tracking-wide"
                    style={{
                      background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(176,141,87,0.2))",
                      color: "#c9a84c",
                      border: "1px solid rgba(201,168,76,0.3)",
                    }}
                  >
                    ✦ PRO
                  </span>
                )}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm transition-colors hover:text-[#00d4ff]"
                    style={{ color: "#a0a0b0" }}
                  >
                    <Shield size={16} />
                    Admin
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative group">
                  <button
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors"
                    style={{
                      background: "rgba(255,255,255,0.05)",
                      color: "#e8e6e3",
                    }}
                  >
                    <User size={16} />
                    <span className="text-sm truncate max-w-[120px]">
                      {user?.full_name || user?.email?.split("@")[0]}
                    </span>
                  </button>
                  <div
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl"
                    style={{
                      background: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: "#e8e6e3" }}
                    >
                      <Settings size={14} />
                      Settings
                    </Link>
                    <Link
                      href="/pricing"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                      style={{ color: "#e8e6e3" }}
                    >
                      <CreditCard size={14} />
                      Billing
                    </Link>
                    <hr style={{ borderColor: "rgba(255,255,255,0.06)" }} className="my-1" />
                    <button
                      onClick={logout}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left transition-colors hover:bg-white/5"
                      style={{ color: "#ef4444" }}
                    >
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "#a0a0b0" }}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="text-sm px-5 py-2 rounded-lg font-medium transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #c9a84c, #b08d57)",
                    color: "#0a0a0f",
                  }}
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Language Selector */}
            <div className="relative group ml-2">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors hover:text-[#00d4ff]"
                style={{ color: "#a0a0b0", background: "rgba(255,255,255,0.05)" }}
              >
                <Globe size={16} />
                <span className="text-sm uppercase font-medium">{language}</span>
              </button>
              
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-32 rounded-xl py-2 shadow-2xl z-[100]"
                    style={{
                      background: "#1a1a2e",
                      border: "1px solid rgba(255,255,255,0.08)",
                      maxHeight: "300px",
                      overflowY: "auto"
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-white/5 ${language === lang.code ? 'text-[#00d4ff] bg-white/5' : 'text-[#e8e6e3]'}`}
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
