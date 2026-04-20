"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Zap,
  Brain,
  Layers,
  LineChart,
  Volume2,
  Tag,
  ArrowUpDown,
} from "lucide-react";
import { useLanguage, LanguageCode } from "@/contexts/LanguageContext";

const DIC: Record<LanguageCode, {
  guide: string;
  title1: string;
  title2: string;
  desc: string;
  example: string;
  terms: any[];
}> = {
  en: {
    guide: "Investment Guide",
    title1: "Learn ",
    title2: "Market Terms",
    desc: "A complete guide to understanding Bitigchi's indicators and signals",
    example: "Example",
    terms: [
      {
        icon: Tag,
        title: "Ticker Symbol",
        color: "#c9a84c",
        short: "The short code for each stock",
        detail: "A ticker is a unique symbol for a company listed on the stock exchange. For example: AAPL = Apple, TSLA = Tesla. You can search for any ticker to get information about the stock.",
        example: "AAPL → Apple Inc. | MSFT → Microsoft",
      },
      {
        icon: Activity,
        title: "RSI (Relative Strength Index)",
        color: "#00d4ff",
        short: "Stock's buying/selling balance (0-100)",
        detail: "RSI analyzes the speed and change of price movements over the last 14 days. RSI < 30 means 'oversold' (potential buy). RSI > 70 means 'overbought' (potential drop).",
        example: "RSI 25 → Oversold (Buy signal) | RSI 78 → Overbought (Caution)",
        visual: "rsi",
      },
      {
        icon: LineChart,
        title: "SMA (Simple Moving Average)",
        color: "#10b981",
        short: "Average price over N days",
        detail: "SMA shows the average closing price over a set period. SMA 20 = 20-day average. If price > SMA, it's an uptrend. If SMA 20 crosses above SMA 50, it's a 'Golden Cross' (strong buy signal).",
        example: "Price $180, SMA 20 $175 → Uptrend",
      },
      {
        icon: Brain,
        title: "AI Sentiment Analysis",
        color: "#a855f7",
        short: "AI analyzes financial news",
        detail: "Bitigchi uses FinBERT to read financial news and categorize it into: Bullish (positive, price may rise), Bearish (negative, price may fall), and Neutral. This helps gauge market mood.",
        example: "'Apple launches new iPhone' → Bullish (87%)",
      },
      {
        icon: Layers,
        title: "Smart Patterns (Clusters)",
        color: "#f59e0b",
        short: "Groups stocks by similar behavior",
        detail: "The system analyzes all stocks based on RSI, price change, and volume, dividing them into clusters. This helps you find stocks that move similarly.",
        example: "Tesla, Coinbase, NVIDIA → Volatile cluster",
      },
      {
        icon: Zap,
        title: "Volatile",
        color: "#ef4444",
        short: "Price changes rapidly and sharply",
        detail: "Volatile stocks experience wild price swings from day to day. They offer both high profit potential and high risk. TSLA, COIN, NVDA are typically volatile.",
        example: "TSLA: yesterday +5%, today -4% → High volatility",
      },
      {
        icon: TrendingUp,
        title: "Momentum",
        color: "#10b981",
        short: "Stock is moving strongly in one direction",
        detail: "Momentum stocks show a strong upward (or downward) trend with consecutive days in the same direction. Strong momentum often persists for a time.",
        example: "NVDA: closed higher 5 days in a row → Strong upward momentum",
      },
      {
        icon: TrendingDown,
        title: "Oversold / Overbought",
        color: "#f97316",
        short: "RSI-based buy/sell signals",
        detail: "Oversold (RSI < 30): The market has sold heavily, potentially a buy. Overbought (RSI > 70): The market has bought too much, a drop may be imminent.",
        example: "PFE RSI 28 → Oversold | INTC RSI 85 → Overbought",
      },
      {
        icon: Volume2,
        title: "Volume",
        color: "#06b6d4",
        short: "Shares traded in a single day",
        detail: "Volume indicates trading activity. High volume = many buyers/sellers = strong liquidity. If price rises on high volume, it's a strong trend.",
        example: "AAPL: 85M volume (High) | PLTR: 15M (Average)",
      },
      {
        icon: ArrowUpDown,
        title: "Change %",
        color: "#8b5cf6",
        short: "Price change over the last 5 days",
        detail: "Indicates the percentage increase or decrease over 5 days. Red means negative change, green means positive. +3.5% = climbed 3.5%.",
        example: "+5.2% = Increased by 5.2% | -3.8% = Decreased by 3.8%",
      },
    ]
  },
  tr: {
    guide: "Yatırım Rehberi",
    title1: "Piyasa Terimlerini ",
    title2: "Öğrenin",
    desc: "Bitigchi göstergeleri ve sinyallerini anlamak için tam rehber",
    example: "Örnek",
    terms: [
      {
        icon: Tag,
        title: "Borsa Kodu (Ticker)",
        color: "#c9a84c",
        short: "Her hisse senedinin kısa kodu",
        detail: "Ticker, borsada işlem gören her şirketin benzersiz sembolüdür. Örneğin: AAPL = Apple, TSLA = Tesla. İstediğiniz tickeri arayarak bilgi alabilirsiniz.",
        example: "AAPL → Apple Inc. | MSFT → Microsoft",
      },
      {
        icon: Activity,
        title: "RSI (Göreceli Güç Endeksi)",
        color: "#00d4ff",
        short: "Hisse alış/satış dengesi (0-100)",
        detail: "RSI, son 14 gündeki fiyat hareketlerini analiz eder. RSI < 30 ise 'aşırı satım' (alım fırsatı). RSI > 70 ise 'aşırı alım' (dikkat, fiyat düşebilir).",
        example: "RSI 25 → Aşırı satım (Al) | RSI 78 → Aşırı alım (Dikkat)",
        visual: "rsi",
      },
      {
        icon: LineChart,
        title: "SMA (Basit Hareketli Ortalama)",
        color: "#10b981",
        short: "Son N günün ortalama fiyatı",
        detail: "SMA, belirli bir süredeki ortalama kapanış fiyatını gösterir. Fiyat SMA'nın üzerindeyse yükseliş trendi vardır. SMA 20, SMA 50'yi yukarı keserse 'Golden Cross' (Güçlü al) oluşur.",
        example: "Fiyat $180, SMA 20 $175 → Yükseliş trendi",
      },
      {
        icon: Brain,
        title: "Yapay Zeka (AI) Duyarlılık Analizi",
        color: "#a855f7",
        short: "Yapay zeka haberleri analiz eder",
        detail: "Bitigchi, FinBERT modelini kullanarak haberleri 3 kategoriye ayırır: Bullish (olumlu), Bearish (olumsuz) ve Neutral (nötr). Piyasa ruh halini anlamanızı sağlar.",
        example: "'Apple yeni iPhone tanıttı' → Bullish (%87)",
      },
      {
        icon: Layers,
        title: "Akıllı Desenler (Kümeler)",
        color: "#f59e0b",
        short: "Hisseleri benzer özelliklerine göre gruplar",
        detail: "Sistem tüm hisseleri RSI, fiyat değişimi ve hacme göre analiz edip benzerlerini gruplar. Aynı tip hareket eden hisseleri bulmanıza yardımcı olur.",
        example: "Tesla, Coinbase, NVIDIA → Volatil Grubu",
      },
      {
        icon: Zap,
        title: "Oynak (Volatile)",
        color: "#ef4444",
        short: "Fiyat çok hızlı ve keskin değişir",
        detail: "Volatil hisseler günden güne büyük fiyat dalgalanmaları yaşar. Yüksek kazanç ve zarar potansiyeli taşır. TSLA, COIN tipik volatil hisselerdir.",
        example: "TSLA: dün +%5, bugün -%4 → Yüksek oynaklık",
      },
      {
        icon: TrendingUp,
        title: "Momentum",
        color: "#10b981",
        short: "Hisse güçlü bir yönde hareket ediyor",
        detail: "Momentum hisseleri güçlü bir yükseliş (veya düşüş) trendi gösterir. Güçlü momentum genellikle bir süre daha aynı yönde devam eder.",
        example: "NVDA: son 5 günde hep arttı → Güçlü yukarı momentum",
      },
      {
        icon: TrendingDown,
        title: "Aşırı Satım / Aşırı Alım",
        color: "#f97316",
        short: "RSI tabanlı al/sat sinyalleri",
        detail: "Aşırı satım (RSI < 30): Piyasa hisseyi gereğinden fazla satmış (alım fırsatı). Aşırı alım (RSI > 70): Piyasa çok almış, düşüş kapıda olabilir.",
        example: "PFE RSI 28 → Aşırı Satım | INTC RSI 85 → Aşırı Alım",
      },
      {
        icon: Volume2,
        title: "Hacim (Volume)",
        color: "#06b6d4",
        short: "Bir günde el değiştiren hisse miktarı",
        detail: "İşlem aktivitesini gösterir. Yüksek hacim = güçlü likidite. Fiyat artıyor ve hacim yüksekse, trend güçlüdür.",
        example: "AAPL: 85M hacim (Yüksek) | PLTR: 15M (Orta)",
      },
      {
        icon: ArrowUpDown,
        title: "Değişim % (Change)",
        color: "#8b5cf6",
        short: "Son 5 gündeki fiyat değişimi",
        detail: "Hissenin 5 günde ne kadar arttığını veya düştüğünü gösterir. Kırmızı negatif, yeşil pozitif değişimi ifade eder.",
        example: "+%5.2 = 5 günde %5.2 arttı",
      },
    ]
  },
  es: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] },
  fr: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] },
  de: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] },
  it: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] },
  ru: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] },
  zh: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] },
  ja: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] },
  ar: { guide: "Investment Guide", title1: "Learn ", title2: "Market Terms", desc: "Guide translated soon...", example: "Example", terms: [] }
};

function RSIVisual() {
  return (
    <div className="flex items-center gap-1 mt-3 mb-1">
      <div className="flex-1 h-3 rounded-full overflow-hidden flex">
        <div className="w-[30%] bg-gradient-to-r from-red-600 to-red-400" />
        <div className="w-[40%] bg-gradient-to-r from-yellow-500 to-green-400" />
        <div className="w-[30%] bg-gradient-to-r from-green-400 to-red-500" />
      </div>
    </div>
  );
}

export default function LearnPage() {
  const { language } = useLanguage();
  const text = DIC[language] || DIC["en"];
  const termsToMap = text.terms.length > 0 ? text.terms : DIC["en"].terms;

  return (
    <div className="min-h-screen bg-grid">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(168,85,247,0.06) 0%, transparent 70%)",
          }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
              style={{
                background: "rgba(168,85,247,0.08)",
                border: "1px solid rgba(168,85,247,0.15)",
              }}
            >
              <BookOpen size={16} style={{ color: "#a855f7" }} />
              <span className="text-sm" style={{ color: "#a855f7" }}>
                {text.guide}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span style={{ color: "#e8e6e3" }}>{text.title1}</span>
              <span className="text-gradient-gold">{text.title2}</span>
            </h1>
            <p
              className="text-lg max-w-xl mx-auto"
              style={{ color: "#6b7280" }}
            >
              {text.desc}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Terms Grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {termsToMap.map((term, i) => {
            const Icon = term.icon;
            return (
              <motion.div
                key={term.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01]"
                style={{
                  background: "rgba(26, 26, 46, 0.6)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                }}
              >
                {/* Header */}
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: `${term.color}15`,
                      border: `1px solid ${term.color}30`,
                    }}
                  >
                    <Icon size={20} style={{ color: term.color }} />
                  </div>
                  <div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: "#e8e6e3" }}
                    >
                      {term.title}
                    </h3>
                    <p
                      className="text-xs font-medium"
                      style={{ color: term.color }}
                    >
                      {term.short}
                    </p>
                  </div>
                </div>

                {/* RSI Visual */}
                {term.visual === "rsi" && (
                  <div className="mb-3">
                    <RSIVisual />
                    <div className="flex justify-between text-[10px]" style={{ color: "#6b7280" }}>
                      <span>0 — Oversold</span>
                      <span>50 — Neutral</span>
                      <span>100 — Overbought</span>
                    </div>
                  </div>
                )}

                {/* Detail */}
                <p
                  className="text-sm leading-relaxed mb-3"
                  style={{ color: "#9ca3af" }}
                >
                  {term.detail}
                </p>

                {/* Example */}
                <div
                  className="rounded-lg px-3 py-2 text-xs"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.04)",
                    color: "#6b7280",
                  }}
                >
                  <span className="font-semibold" style={{ color: "#a0a0b0" }}>
                    {text.example}:{" "}
                  </span>
                  {term.example}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
