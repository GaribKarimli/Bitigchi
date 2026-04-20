"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdminStats, fetchAdminUsers, fetchAdminFeedback, toggleUserActive } from "@/lib/api";
import type { AdminStats, AdminUser, FeedbackItem } from "@/lib/api";
import {
  Users, CreditCard, MessageSquare, Activity,
  Shield, Star, UserCheck, UserX, Loader2, BarChart3,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const { token, isAdmin, isAuthenticated } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "feedback">("overview");

  useEffect(() => {
    if (!isAuthenticated) { router.push("/login"); return; }
    if (!isAdmin) { router.push("/"); return; }
    loadData();
  }, [isAuthenticated, isAdmin]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [s, u, f] = await Promise.all([
        fetchAdminStats(token),
        fetchAdminUsers(token),
        fetchAdminFeedback(token),
      ]);
      setStats(s);
      setUsers(u);
      setFeedback(f);
    } catch (err) {
      console.error("Admin data load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUser = async (userId: number) => {
    if (!token) return;
    try {
      await toggleUserActive(token, userId);
      await loadData();
    } catch {
      alert("Failed to toggle user status");
    }
  };

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: BarChart3 },
    { id: "users" as const, label: "Users", icon: Users },
    { id: "feedback" as const, label: "Feedback", icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin" style={{ color: "#c9a84c" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-3 mb-8">
            <Shield size={28} style={{ color: "#c9a84c" }} />
            <h1 className="text-3xl font-bold" style={{ color: "#e8e6e3" }}>Admin Dashboard</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-all"
                style={{
                  background: activeTab === tab.id ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)",
                  color: activeTab === tab.id ? "#c9a84c" : "#6b7280",
                  border: `1px solid ${activeTab === tab.id ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && stats && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { label: "Total Users", value: stats.total_users, icon: Users, color: "#00d4ff" },
                { label: "Premium Users", value: stats.premium_users, icon: CreditCard, color: "#c9a84c" },
                { label: "Free Users", value: stats.free_users, icon: Users, color: "#6b7280" },
                { label: "Feedback", value: stats.total_feedback, icon: MessageSquare, color: "#10b981" },
                { label: "Checks Today", value: stats.total_sentiment_checks_today, icon: Activity, color: "#a855f7" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-5 text-center"
                  style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
                >
                  <stat.icon size={20} className="mx-auto mb-2" style={{ color: stat.color }} />
                  <p className="text-2xl font-bold tabular-nums" style={{ color: "#e8e6e3" }}>{stat.value}</p>
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>{stat.label}</p>
                </div>
              ))}
              {stats.avg_feedback_rating && (
                <div className="rounded-xl p-5 text-center col-span-2 md:col-span-1" style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <Star size={20} className="mx-auto mb-2" style={{ color: "#c9a84c" }} />
                  <p className="text-2xl font-bold" style={{ color: "#e8e6e3" }}>{stats.avg_feedback_rating}/5</p>
                  <p className="text-xs mt-1" style={{ color: "#6b7280" }}>Avg Rating</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                      {["User", "Role", "Plan", "Status", "Checks Today", "Joined", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#6b7280" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                        <td className="px-4 py-3">
                          <p className="font-medium" style={{ color: "#e8e6e3" }}>{u.full_name || "—"}</p>
                          <p className="text-xs" style={{ color: "#6b7280" }}>{u.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full" style={{ background: u.role === "admin" ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)", color: u.role === "admin" ? "#c9a84c" : "#6b7280" }}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold" style={{ color: u.plan === "premium" ? "#c9a84c" : "#6b7280" }}>
                            {u.plan}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: u.is_active ? "#10b981" : "#ef4444" }}>
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 tabular-nums" style={{ color: "#a0a0b0" }}>{u.sentiment_checks_today}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "#6b7280" }}>
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleToggleUser(u.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
                              title={u.is_active ? "Deactivate" : "Activate"}
                            >
                              {u.is_active ? (
                                <UserX size={16} style={{ color: "#ef4444" }} />
                              ) : (
                                <UserCheck size={16} style={{ color: "#10b981" }} />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Feedback Tab */}
          {activeTab === "feedback" && (
            <div className="space-y-3">
              {feedback.length === 0 ? (
                <p className="text-center py-12" style={{ color: "#6b7280" }}>No feedback yet</p>
              ) : (
                feedback.map((f) => (
                  <div key={f.id} className="rounded-xl p-4 flex items-start gap-4" style={{ background: "rgba(26,26,46,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={14} fill={n <= f.rating ? "#c9a84c" : "none"} style={{ color: n <= f.rating ? "#c9a84c" : "#4a4a5a" }} />
                      ))}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm" style={{ color: "#e8e6e3" }}>{f.comment || <em style={{ color: "#4a4a5a" }}>No comment</em>}</p>
                      <p className="text-xs mt-1" style={{ color: "#6b7280" }}>
                        {f.user_email} · {new Date(f.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
