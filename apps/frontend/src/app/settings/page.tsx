"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { updateProfile, submitFeedback, getCustomerPortal } from "@/lib/api";
import { User, CreditCard, MessageSquare, Save, Loader2, Star, CheckCircle, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { user, token, isPremium, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Feedback
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleSaveProfile = async () => {
    if (!token) return;
    setSaving(true);
    try {
      await updateProfile(token, { full_name: fullName });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!token) return;
    setFeedbackLoading(true);
    try {
      await submitFeedback(token, rating, comment || undefined);
      setFeedbackSent(true);
      setComment("");
    } catch {
      alert("Failed to submit feedback");
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleManageBilling = async () => {
    if (!token) return;
    try {
      const { portal_url } = await getCustomerPortal(token);
      window.location.href = portal_url;
    } catch {
      alert("Billing portal is not available");
    }
  };

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-bold mb-8"
          style={{ color: "#e8e6e3" }}
        >
          Settings
        </motion.h1>

        <div className="space-y-6">
          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <User size={20} style={{ color: "#c9a84c" }} />
              <h2 className="text-lg font-semibold" style={{ color: "#e8e6e3" }}>Profile</h2>
              {isPremium && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-auto" style={{ background: "rgba(201,168,76,0.2)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}>
                  ✦ PRO
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#6b7280" }}>Email</label>
                <input type="email" value={user?.email || ""} disabled className="input-bitigchi opacity-50 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs font-medium mb-2 block" style={{ color: "#6b7280" }}>Full Name</label>
                <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input-bitigchi" placeholder="Your name" />
              </div>
              <button onClick={handleSaveProfile} disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
                {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
              </button>
            </div>
          </motion.div>

          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <CreditCard size={20} style={{ color: "#00d4ff" }} />
              <h2 className="text-lg font-semibold" style={{ color: "#e8e6e3" }}>Subscription</h2>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#e8e6e3" }}>
                  {isPremium ? "Premium Plan" : "Free Plan"}
                </p>
                <p className="text-xs" style={{ color: "#6b7280" }}>
                  {isPremium ? "$14.99/month — Unlimited access" : "5 sentiment checks/day"}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ background: isPremium ? "rgba(16,185,129,0.15)" : "rgba(107,114,128,0.15)", color: isPremium ? "#10b981" : "#6b7280" }}>
                {isPremium ? "Active" : "Free"}
              </span>
            </div>

            {isPremium ? (
              <button onClick={handleManageBilling} className="btn-secondary flex items-center gap-2">
                <ExternalLink size={14} />
                Manage Billing
              </button>
            ) : (
              <button onClick={() => router.push("/pricing")} className="btn-primary flex items-center gap-2">
                Upgrade to Premium
              </button>
            )}
          </motion.div>

          {/* Feedback */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl p-6"
            style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare size={20} style={{ color: "#10b981" }} />
              <h2 className="text-lg font-semibold" style={{ color: "#e8e6e3" }}>Feedback</h2>
            </div>

            {feedbackSent ? (
              <div className="text-center py-6">
                <CheckCircle size={40} className="mx-auto mb-3" style={{ color: "#10b981" }} />
                <p className="text-sm" style={{ color: "#e8e6e3" }}>Thank you for your feedback!</p>
                <button onClick={() => setFeedbackSent(false)} className="text-xs mt-3" style={{ color: "#c9a84c" }}>
                  Submit another
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-3 block" style={{ color: "#6b7280" }}>Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setRating(n)} className="transition-transform hover:scale-110">
                        <Star size={28} fill={n <= rating ? "#c9a84c" : "none"} style={{ color: n <= rating ? "#c9a84c" : "#4a4a5a" }} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block" style={{ color: "#6b7280" }}>Comment (optional)</label>
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} className="input-bitigchi resize-none" placeholder="Tell us what you think..." />
                </div>
                <button onClick={handleSubmitFeedback} disabled={feedbackLoading} className="btn-primary flex items-center gap-2">
                  {feedbackLoading ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                  {feedbackLoading ? "Sending..." : "Submit Feedback"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
