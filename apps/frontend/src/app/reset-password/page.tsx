"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPassword, ApiError } from "@/lib/api";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import BitigchiLogo from "@/components/BitigchiLogo";
import Link from "next/link";

function ResetContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resetToken = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await resetPassword(resetToken, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-4" style={{ color: "#ef4444" }} />
        <p style={{ color: "#e8e6e3" }}>Invalid reset link</p>
        <Link href="/login" className="btn-primary inline-block mt-4">Back to Login</Link>
      </div>
    );
  }

  return done ? (
    <div className="text-center py-4">
      <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "#10b981" }} />
      <p className="text-sm mb-4" style={{ color: "#e8e6e3" }}>Password reset successfully!</p>
      <Link href="/login" className="btn-primary inline-block">Sign In</Link>
    </div>
  ) : (
    <>
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
          <AlertCircle size={16} />{error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }} />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password (min 8 chars)" required minLength={8} className="input-bitigchi" style={{ paddingLeft: "48px" }} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="rounded-2xl p-8" style={{ background: "rgba(26,26,46,0.7)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4"><BitigchiLogo size={48} /></div>
            <h1 className="text-2xl font-bold" style={{ color: "#e8e6e3" }}>New Password</h1>
          </div>
          <Suspense fallback={<Loader2 size={24} className="animate-spin mx-auto" style={{ color: "#c9a84c" }} />}>
            <ResetContent />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
