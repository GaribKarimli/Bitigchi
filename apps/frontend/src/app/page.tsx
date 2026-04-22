"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Filter,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Loader2,
  Flame,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { TickerItem, ScreenerResponse } from "@/lib/api";
import { fetchScreener } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import StockCard from "@/components/StockCard";
import StockDetailDrawer from "@/components/StockDetailDrawer";
import BitigchiLogo from "@/components/BitigchiLogo";
import LandingPage from "@/components/LandingPage";

function MiniStockCard({
  ticker,
  rank,
  variant,
  onClick,
}: {
  ticker: TickerItem;
  rank: number;
  variant: "gainer" | "loser" | "popular";
  onClick: () => void;
}) {
  const isPositive = (ticker.change_pct ?? 0) >= 0;
  const accentColor =
    variant === "gainer" ? "#10b981" : variant === "loser" ? "#ef4444" : "#00d4ff";

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.02] shrink-0 min-w-[220px]"
      style={{
        background: "rgba(26, 26, 46, 0.5)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="text-xs font-bold w-5 text-center"
        style={{ color: accentColor }}
      >
        #{rank}
      </span>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold" style={{ color: "#e8e6e3" }}>
          {ticker.symbol}
        </p>
        <p className="text-[10px] truncate max-w-[100px]" style={{ color: "#6b7280" }}>
          {ticker.name}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-semibold" style={{ color: "#e8e6e3" }}>
          ${ticker.current_price?.toLocaleString()}
        </p>
        <p
          className="text-[11px] font-semibold"
          style={{ color: isPositive ? "#10b981" : "#ef4444" }}
        >
          {isPositive ? "+" : ""}
          {ticker.change_pct?.toFixed(2)}%
        </p>
      </div>
    </button>
  );
}

const DASHBOARD_DIC: Record<string, Record<string, string>> = {
  en: {
    heroTitle1: "AI-Powered",
    heroTitle2: "Market Intelligence",
    heroDesc: "Bitigchi reads chaotic market signals — news, social media, technicals — and translates them into clear, actionable insights.",
    tickers: "Tickers",
    smartPatterns: "Smart Patterns",
    sentimentAI: "Sentiment AI",
    topGainers: "Top Gainers",
    topLosers: "Top Losers",
    mostPopular: "Most Popular",
    searchPlaceholder: "Search any stock (e.g., AAPL) or type custom ticker...",
    customLookup: "Custom Lookup",
    runAI: "Run AI Analysis on",
    noResults: "No stocks found matching your criteria.",
    allClusters: "All Clusters",
    errorLoading: "Failed to load market data",
    marketOverview: "Market Overview",
  },
  tr: {
    heroTitle1: "Yapay Zeka Destekli",
    heroTitle2: "Piyasa İstihbaratı",
    heroDesc: "Bitigchi karmaşık piyasa sinyallerini (haberler, sosyal medya, teknik veriler) okur ve bunları net, uygulanabilir içgörülere dönüştürür.",
    tickers: "Hisse Senedi",
    smartPatterns: "Akıllı Formasyonlar",
    sentimentAI: "Duyarlılık YZ",
    topGainers: "Kazandıranlar",
    topLosers: "Kaybettirenler",
    mostPopular: "En Popüler",
    searchPlaceholder: "Hisse senedi arayın (örn. AAPL) veya borsa kodu...",
    customLookup: "Özel Arama",
    runAI: "YZ Analizi Başlat:",
    noResults: "Kriterlerinize uygun hisse bulunamadı.",
    allClusters: "Tüm Kümeler",
    errorLoading: "Piyasa verileri yüklenemedi",
    marketOverview: "Piyasaya Bakış",
  }
};

export default function DashboardPage() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();

  const t = (key: string) => DASHBOARD_DIC[language]?.[key] || DASHBOARD_DIC["en"][key];
  const [data, setData] = useState<ScreenerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCluster, setActiveCluster] = useState<string | null>(null);
  const [selectedTicker, setSelectedTicker] = useState<TickerItem | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchScreener(token || undefined);
      setData(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load screener data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isLoading, isAuthenticated, router]);

  // Derived lists
  const tickers = data?.tickers ?? [];
  const topGainers = [...tickers]
    .sort((a, b) => (b.change_pct ?? 0) - (a.change_pct ?? 0))
    .slice(0, 5);
  const topLosers = [...tickers]
    .sort((a, b) => (a.change_pct ?? 0) - (b.change_pct ?? 0))
    .slice(0, 5);
  const mostPopular = [...tickers]
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0))
    .slice(0, 5);

  // Search logic: filter within screener OR suggest custom lookup
  const searchTrimmed = search.trim();
  const matchesScreener = tickers.filter((t) => {
    const q = searchTrimmed.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      (t.name ?? "").toLowerCase().includes(q)
    );
  });
  const isCustomSearch =
    searchTrimmed.length >= 1 &&
    matchesScreener.length === 0 &&
    /^[A-Za-z0-9.\-]+$/.test(searchTrimmed);

  const filteredTickers = searchTrimmed
    ? matchesScreener.filter(
        (t) => !activeCluster || t.cluster_label === activeCluster
      )
    : tickers.filter((t) => !activeCluster || t.cluster_label === activeCluster);

  const clusterNames = data ? Object.keys(data.clusters) : [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-grid">
        <Loader2 size={48} className="animate-spin" style={{ color: "#c9a84c" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  return (
    <>
      <div className="min-h-screen bg-grid">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse, rgba(201,168,76,0.08) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute top-20 right-1/4 w-[400px] h-[400px] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 70%)",
            }}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <BitigchiLogo size={64} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient-gold">AI-Powered</span>{" "}
                <span style={{ color: "#e8e6e3" }}>Market Intelligence</span>
              </h1>
              <p className="text-lg max-w-2xl mx-auto mb-2" style={{ color: "#6b7280" }}>
                Bitigchi reads chaotic market signals — news, social media, technicals —
                and translates them into clear, actionable insights.
              </p>
              <div className="flex items-center justify-center gap-6 mt-6">
                <div className="flex items-center gap-2">
                  <BarChart3 size={16} style={{ color: "#00d4ff" }} />
                  <span className="text-sm" style={{ color: "#a0a0b0" }}>
                    {tickers.length || 30} Tickers
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{ color: "#10b981" }} />
                  <span className="text-sm" style={{ color: "#a0a0b0" }}>
                    Smart Patterns
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity size={16} style={{ color: "#c9a84c" }} />
                  <span className="text-sm" style={{ color: "#a0a0b0" }}>
                    AI Sentiment
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Top Gainers / Losers / Popular ── */}
        {!loading && !error && tickers.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Top Gainers */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(16, 185, 129, 0.04)",
                  border: "1px solid rgba(16, 185, 129, 0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} style={{ color: "#10b981" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "#10b981" }}>
                    📈 Top Gainers
                  </h3>
                </div>
                <div className="space-y-2">
                  {topGainers.map((t, i) => (
                    <MiniStockCard
                      key={t.symbol}
                      ticker={t}
                      rank={i + 1}
                      variant="gainer"
                      onClick={() => setSelectedTicker(t)}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Top Losers */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(239, 68, 68, 0.04)",
                  border: "1px solid rgba(239, 68, 68, 0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown size={16} style={{ color: "#ef4444" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "#ef4444" }}>
                    📉 Top Losers
                  </h3>
                </div>
                <div className="space-y-2">
                  {topLosers.map((t, i) => (
                    <MiniStockCard
                      key={t.symbol}
                      ticker={t}
                      rank={i + 1}
                      variant="loser"
                      onClick={() => setSelectedTicker(t)}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Most Popular (by Volume) */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(0, 212, 255, 0.04)",
                  border: "1px solid rgba(0, 212, 255, 0.12)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={16} style={{ color: "#00d4ff" }} />
                  <h3 className="text-sm font-semibold" style={{ color: "#00d4ff" }}>
                    🔥 Most Popular
                  </h3>
                </div>
                <div className="space-y-2">
                  {mostPopular.map((t, i) => (
                    <MiniStockCard
                      key={t.symbol}
                      ticker={t}
                      rank={i + 1}
                      variant="popular"
                      onClick={() => setSelectedTicker(t)}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* Controls */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full"
          >
            {/* Search */}
            <div className="relative w-full sm:max-w-md">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: "#6b7280" }}
              />
              <input
                type="text"
                placeholder="Search any ticker (e.g., AAPL, RZLV, BTC-USD)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isCustomSearch) {
                    router.push(`/stock/${searchTrimmed.toUpperCase()}`);
                  }
                }}
                className="input-bitigchi"
                style={{ paddingLeft: "48px" }}
              />
            </div>

            {/* Cluster Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={14} style={{ color: "#6b7280" }} />
              <button
                onClick={() => setActiveCluster(null)}
                className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                style={{
                  background: !activeCluster ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.05)",
                  color: !activeCluster ? "#c9a84c" : "#6b7280",
                  border: `1px solid ${!activeCluster ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                All
              </button>
              {clusterNames.map((name) => (
                <button
                  key={name}
                  onClick={() => setActiveCluster(activeCluster === name ? null : name)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
                  style={{
                    background: activeCluster === name ? "rgba(0,212,255,0.15)" : "rgba(255,255,255,0.05)",
                    color: activeCluster === name ? "#00d4ff" : "#6b7280",
                    border: `1px solid ${activeCluster === name ? "rgba(0,212,255,0.3)" : "rgba(255,255,255,0.06)"}`,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={loadData}
              disabled={loading}
              className="btn-secondary flex items-center gap-2 text-xs !py-2 !px-4"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </motion.div>

          {/* Custom search prompt */}
          {isCustomSearch && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <button
                onClick={() => router.push(`/stock/${searchTrimmed.toUpperCase()}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{
                  background: "rgba(201,168,76,0.1)",
                  border: "1px solid rgba(201,168,76,0.25)",
                  color: "#c9a84c",
                }}
              >
                <ExternalLink size={14} />
                Search for <strong>{searchTrimmed.toUpperCase()}</strong> on market
                <ArrowRight size={14} />
              </button>
            </motion.div>
          )}

          {/* Updated at */}
          {data?.updated_at && (
            <p className="text-xs mt-3" style={{ color: "#4a4a5a" }}>
              Last updated: {new Date(data.updated_at).toLocaleString()}
            </p>
          )}
        </section>

        {/* Stock Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 size={40} className="animate-spin mb-4" style={{ color: "#c9a84c" }} />
              <p className="text-sm" style={{ color: "#6b7280" }}>
                Scanning markets and identifying patterns...
              </p>
              <p className="text-xs mt-1" style={{ color: "#4a4a5a" }}>
                This may take a moment on first load
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <p className="text-lg mb-2" style={{ color: "#ef4444" }}>
                Failed to load data
              </p>
              <p className="text-sm mb-4" style={{ color: "#6b7280" }}>{error}</p>
              <button onClick={loadData} className="btn-primary">
                Try Again
              </button>
            </div>
          ) : filteredTickers.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-lg" style={{ color: "#6b7280" }}>
                No tickers match your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredTickers.map((ticker, i) => (
                <StockCard
                  key={ticker.symbol}
                  ticker={ticker}
                  index={i}
                  onClick={() => setSelectedTicker(ticker)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Detail Drawer */}
      <StockDetailDrawer
        ticker={selectedTicker}
        onClose={() => setSelectedTicker(null)}
      />
    </>
  );
}
