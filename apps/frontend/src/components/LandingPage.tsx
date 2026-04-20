"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, BarChart3, Activity, Shield, Brain, Zap, Globe } from "lucide-react";
import BitigchiLogo from "./BitigchiLogo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-grid overflow-hidden">
      {/* Background Ornaments */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(201,168,76,0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-40 right-1/4 w-[500px] h-[500px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,212,255,0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-0 left-1/4 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(16,185,129,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 relative z-10">
        
        {/* Navigation / Header simple */}
        <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BitigchiLogo size={32} />
            <span className="font-bold text-xl text-gradient-gold">Bitigchi</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-sm font-medium transition-colors hover:text-[#c9a84c]" style={{ color: "#e8e6e3" }}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mt-12 mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8" style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)" }}>
            <span className="animate-pulse w-2 h-2 rounded-full bg-[#c9a84c]"></span>
            <span className="text-sm font-medium" style={{ color: "#c9a84c" }}>Bitigchi Engine v2.0 Live</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight">
            <span className="text-gradient-gold">AI-Powered</span> <br />
            <span style={{ color: "#e8e6e3" }}>Market Intelligence</span>
          </h1>
          
          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "#a0a0b0" }}>
            Unleash the power of advanced machine learning algorithms. Bitigchi processes chaotic market signals, news sentiment, and technical patterns into crystal-clear trading insights.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary flex items-center justify-center gap-2 text-lg h-14 px-8 w-full sm:w-auto">
              Get Started for Free <ArrowRight size={20} />
            </Link>
            <Link href="/learn" className="btn-outline flex items-center justify-center gap-2 text-lg h-14 px-8 w-full sm:w-auto">
              Explore the Academy
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Feature 1 */}
          <div className="p-8 rounded-2xl glass-panel group transition-all duration-300 hover:border-[#c9a84c]/50 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "rgba(0, 212, 255, 0.1)" }}>
              <Brain size={28} style={{ color: "#00d4ff" }} />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: "#e8e6e3" }}>Deep Sentiment AI</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#a0a0b0" }}>
              We analyze thousands of news articles and social media posts daily using advanced NLP to accurately gauge market sentiment before the crowd moves.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-2xl glass-panel group transition-all duration-300 hover:border-[#10b981]/50 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "rgba(16, 185, 129, 0.1)" }}>
              <Activity size={28} style={{ color: "#10b981" }} />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: "#e8e6e3" }}>Pattern Recognition</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#a0a0b0" }}>
              Our proprietary ML screener scans global markets to identify high-probability chart patterns precisely when they form.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-2xl glass-panel group transition-all duration-300 hover:border-[#c9a84c]/50 hover:-translate-y-2">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: "rgba(201, 168, 76, 0.1)" }}>
              <Zap size={28} style={{ color: "#c9a84c" }} />
            </div>
            <h3 className="text-xl font-bold mb-3" style={{ color: "#e8e6e3" }}>Real-time Delivery</h3>
            <p className="text-sm leading-relaxed" style={{ color: "#a0a0b0" }}>
              Don't miss the next big move. Get instant execution data and dynamic clustering to visualize which sectors are heating up.
            </p>
          </div>
        </motion.div>
        
        {/* Statistics or Trust banner */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1, delay: 0.6 }}
           className="mt-20 py-10 border-t border-b flex flex-wrap gap-8 justify-around"
           style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          <div className="text-center">
             <h4 className="text-3xl font-black text-gradient-gold">500+</h4>
             <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#6b7280" }}>Tickers Monitored</p>
          </div>
          <div className="text-center">
             <h4 className="text-3xl font-black text-gradient-gold">10ms</h4>
             <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#6b7280" }}>Latency</p>
          </div>
          <div className="text-center">
             <h4 className="text-3xl font-black text-gradient-gold">24/7</h4>
             <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#6b7280" }}>AI Operations</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
