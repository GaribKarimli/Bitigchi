"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-grid flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full rounded-3xl p-8 text-center relative overflow-hidden"
        style={{
          background: "rgba(26, 26, 46, 0.8)",
          border: "1px solid rgba(239, 68, 68, 0.2)",
          boxShadow: "0 0 40px rgba(239, 68, 68, 0.1)",
        }}
      >
        {/* Decorative Glow */}
        <div 
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[100px] opacity-20"
          style={{ background: "#ef4444" }}
        />

        <div className="relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-500" />
          </div>

          <h1 className="text-2xl font-bold mb-3 tracking-tight text-white">
            Something went wrong
          </h1>
          
          <p className="text-sm leading-relaxed mb-8" style={{ color: "#6b7280" }}>
            The application encountered an unexpected error. Our system has been notified. 
            Please try refreshing or return to the dashboard.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-bold transition-all text-white"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl btn-primary text-sm font-bold transition-all"
            >
              <Home size={16} />
              Dashboard
            </Link>
          </div>
          
          {error.digest && (
            <p className="mt-8 text-[10px] font-mono opacity-30 select-all" style={{ color: "#6b7280" }}>
              ID: {error.digest}
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
