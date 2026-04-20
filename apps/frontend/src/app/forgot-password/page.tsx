"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import BitigchiLogo from "@/components/BitigchiLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await forgotPassword(email);
    } catch {
      // Don't reveal if email exists
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ background: "rgba(26,26,46,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4"><BitigchiLogo size={48} /></div>
            <h1 className="text-2xl font-bold" style={{ color: "#e8e6e3" }}>Reset Password</h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>We&apos;ll send you a reset link</p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#10b981" }} />
              <p className="text-sm" style={{ color: "#e8e6e3" }}>If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
              <Link href="/login" className="btn-secondary inline-flex items-center gap-2 mt-6">
                <ArrowLeft size={14} /> Back to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="input-bitigchi" style={{ paddingLeft: "48px" }} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <p className="text-center text-sm" style={{ color: "#6b7280" }}>
                <Link href="/login" style={{ color: "#c9a84c" }}>Back to login</Link>
              </p>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
