"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setTokens } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");

    if (accessToken && refreshToken) {
      setTokens({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_type: "bearer",
      });
      router.push("/");
    } else {
      router.push("/login?error=oauth_failed");
    }
  }, [searchParams, router, setTokens]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: "#c9a84c" }} />
        <p style={{ color: "#6b7280" }}>Completing sign in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={40} className="animate-spin" style={{ color: "#c9a84c" }} />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
