"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ApiError } from "@/lib/api";
import { Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import BitigchiLogo from "@/components/BitigchiLogo";

export default function SignupPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMode, setSuccessMode] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(email, password, fullName || undefined);
      setSuccessMode(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-grid">
      <div
        className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(0,212,255,0.05) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(26, 26, 46, 0.7)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <BitigchiLogo size={48} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: "#e8e6e3" }}>
              {successMode ? "Check Your Email" : "Create Account"}
            </h1>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              {successMode ? "We've sent a verification link to your inbox" : "Start your AI-powered market journey"}
            </p>
          </div>

          {successMode ? (
            <div className="text-center space-y-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                <Mail size={32} />
              </div>
              <p style={{ color: "#a0a0b0" }} className="text-sm">
                To complete your registration, please click the verification link we sent to <strong>{email}</strong>.
              </p>
              <button onClick={() => router.push("/login")} className="btn-primary w-full mt-4">
                Back to Login
              </button>
            </div>
          ) : (
            <>
              {error && (
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-6 text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#ef4444",
              }}
            >
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#a0a0b0" }}>
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="input-bitigchi" style={{ paddingLeft: "48px" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#a0a0b0" }}>
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-bitigchi" style={{ paddingLeft: "48px" }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "#a0a0b0" }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#6b7280" }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  minLength={8}
                  className="input-bitigchi" style={{ paddingLeft: "48px" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: "#4a4a5a" }}>
            By signing up, you agree to our Terms of Service
          </p>

          <p className="text-center text-sm mt-4" style={{ color: "#6b7280" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium" style={{ color: "#c9a84c" }}>
              Sign in
            </Link>
          </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
