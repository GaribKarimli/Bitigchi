"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/api";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import BitigchiLogo from "@/components/BitigchiLogo";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in URL.");
      return;
    }

    verifyEmail(token)
      .then((res) => {
        setStatus("success");
        setMessage(res.message);
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err.message || "Failed to verify email.");
      });
  }, [token]);

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
        className="w-full max-w-md text-center"
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
          <div className="flex justify-center mb-6">
            <BitigchiLogo size={48} />
          </div>

          {status === "loading" && (
            <div className="flex flex-col items-center">
              <Loader2 size={48} className="animate-spin mb-4" style={{ color: "#00d4ff" }} />
              <h2 className="text-xl font-bold" style={{ color: "#e8e6e3" }}>Verifying...</h2>
              <p className="mt-2 text-sm" style={{ color: "#a0a0b0" }}>Please wait while we verify your email address.</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center">
              <CheckCircle2 size={48} className="mb-4" style={{ color: "#10b981" }} />
              <h2 className="text-xl font-bold" style={{ color: "#e8e6e3" }}>Email Verified!</h2>
              <p className="mt-2 text-sm" style={{ color: "#a0a0b0" }}>{message}</p>
              <button
                onClick={() => router.push("/login")}
                className="btn-primary w-full mt-6"
              >
                Go to Login
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center">
              <XCircle size={48} className="mb-4" style={{ color: "#ef4444" }} />
              <h2 className="text-xl font-bold" style={{ color: "#e8e6e3" }}>Verification Failed</h2>
              <p className="mt-2 text-sm" style={{ color: "#ef4444" }}>{message}</p>
              <button
                onClick={() => router.push("/signup")}
                className="btn-outline w-full mt-6"
              >
                Back to Sign Up
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
