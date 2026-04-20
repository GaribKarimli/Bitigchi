"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { createCheckout } from "@/lib/api";
import { Check, Zap, Star, Shield, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

const features = {
  free: [
    "Basic stock screener",
    "5 AI sentiment checks/day",
    "Key market indicators",
    "Smart sector grouping",
  ],
  premium: [
    "Everything in Free",
    "Unlimited AI sentiment analysis",
    "News + Social media coverage",
    "Advanced market patterns",
    "Email alerts for sentiment shifts",
    "Priority data refresh",
    "Premium support",
  ],
};

export default function PricingPage() {
  const { isAuthenticated, isPremium, token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!isAuthenticated) {
      router.push("/signup");
      return;
    }
    if (!token) return;

    setLoading(true);
    try {
      const { checkout_url } = await createCheckout(token);
      window.location.href = checkout_url;
    } catch {
      alert("Billing is not configured yet. Contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient-gold">Choose Your Plan</span>
          </h1>
          <p className="text-lg" style={{ color: "#6b7280" }}>
            Unlock the full power of AI-driven market intelligence
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-8"
            style={{
              background: "rgba(26,26,46,0.6)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl" style={{ background: "rgba(107,114,128,0.2)" }}>
                <Star size={20} style={{ color: "#6b7280" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#e8e6e3" }}>Free</h2>
                <p className="text-xs" style={{ color: "#6b7280" }}>Get started</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold" style={{ color: "#e8e6e3" }}>$0</span>
              <span className="text-sm" style={{ color: "#6b7280" }}> /month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {features.free.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#a0a0b0" }}>
                  <Check size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#6b7280" }} />
                  {f}
                </li>
              ))}
            </ul>

            <button
              className="btn-secondary w-full"
              onClick={() => !isAuthenticated && router.push("/signup")}
            >
              {isAuthenticated ? "Current Plan" : "Get Started Free"}
            </button>
          </motion.div>

          {/* Premium Tier */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl p-8 relative overflow-hidden"
            style={{
              background: "rgba(26,26,46,0.8)",
              border: "1px solid rgba(201,168,76,0.2)",
              boxShadow: "0 0 40px rgba(201,168,76,0.08)",
            }}
          >
            {/* Popular badge */}
            <div
              className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
              style={{
                background: "linear-gradient(135deg, #c9a84c, #b08d57)",
                color: "#0a0a0f",
              }}
            >
              Popular
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl" style={{ background: "rgba(201,168,76,0.2)" }}>
                <Zap size={20} style={{ color: "#c9a84c" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "#e8e6e3" }}>Premium</h2>
                <p className="text-xs" style={{ color: "#c9a84c" }}>Full power</p>
              </div>
            </div>

            <div className="mb-8">
              <span className="text-4xl font-bold" style={{ color: "#e8e6e3" }}>$14.99</span>
              <span className="text-sm" style={{ color: "#6b7280" }}> /month</span>
            </div>

            <ul className="space-y-3 mb-8">
              {features.premium.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm" style={{ color: "#a0a0b0" }}>
                  <Check size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#c9a84c" }} />
                  {f}
                </li>
              ))}
            </ul>

            {isPremium ? (
              <button className="btn-primary w-full flex items-center justify-center gap-2" disabled>
                <Shield size={16} /> Active
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ArrowRight size={16} />
                )}
                {loading ? "Loading..." : "Upgrade Now"}
              </button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
