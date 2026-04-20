"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Newspaper,
  ExternalLink,
  Clock,
  Loader2,
  RefreshCw,
  Zap,
  Rss,
} from "lucide-react";
import type { NewsArticle } from "@/lib/api";
import { fetchNews } from "@/lib/api";

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchNews();
      setArticles(res.articles);
    } catch {
      setError("Failed to load news");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(0,212,255,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.15)",
              }}
            >
              <Newspaper size={16} style={{ color: "#00d4ff" }} />
              <span className="text-sm" style={{ color: "#00d4ff" }}>
                Live Market News
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span style={{ color: "#e8e6e3" }}>Market </span>
              <span className="text-gradient-gold">News Feed</span>
            </h1>
            <p className="text-lg max-w-xl mx-auto" style={{ color: "#6b7280" }}>
              Stay ahead with the latest financial news from trusted sources
            </p>
          </motion.div>
        </div>
      </section>

      {/* Refresh */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex justify-end">
        <button
          onClick={loadNews}
          disabled={loading}
          className="btn-secondary flex items-center gap-2 text-xs !py-2 !px-4"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2
              size={40}
              className="animate-spin mb-4"
              style={{ color: "#00d4ff" }}
            />
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Fetching latest headlines...
            </p>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-lg mb-2" style={{ color: "#ef4444" }}>
              {error}
            </p>
            <button onClick={loadNews} className="btn-primary mt-4">
              Try Again
            </button>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg" style={{ color: "#6b7280" }}>
              No news available right now
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {articles.map((article, i) => (
              <motion.a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(26, 26, 46, 0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(201,168,76,0.1))",
                      }}
                    >
                      <Newspaper size={40} style={{ color: "#3a3a4a" }} />
                    </div>
                  )}
                  {/* Provider badge */}
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold"
                    style={{
                      background: "rgba(0,0,0,0.6)",
                      backdropFilter: "blur(8px)",
                      color:
                        article.provider === "newsapi"
                          ? "#00d4ff"
                          : "#c9a84c",
                    }}
                  >
                    {article.provider === "newsapi" ? (
                      <Zap size={10} />
                    ) : (
                      <Rss size={10} />
                    )}
                    {article.source}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  <h3
                    className="font-semibold text-sm leading-snug mb-2 line-clamp-2 group-hover:text-[#00d4ff] transition-colors"
                    style={{ color: "#e8e6e3" }}
                  >
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p
                      className="text-xs leading-relaxed mb-3 line-clamp-2"
                      style={{ color: "#6b7280" }}
                    >
                      {article.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-1 text-[11px]"
                      style={{ color: "#4a4a5a" }}
                    >
                      <Clock size={12} />
                      {timeAgo(article.published_at)}
                    </div>
                    <ExternalLink
                      size={14}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: "#00d4ff" }}
                    />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
