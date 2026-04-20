"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, loginUser, registerUser, refreshToken as refreshTokenApi, type UserProfile, type TokenResponse } from "@/lib/api";

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName?: string) => Promise<{ message: string }>;
  logout: () => void;
  setTokens: (tokens: TokenResponse) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "bitigchi_access_token";
const REFRESH_KEY = "bitigchi_refresh_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveTokens = useCallback((tokens: TokenResponse) => {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
    setToken(tokens.access_token);
  }, []);

  const clearTokens = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async (accessToken: string) => {
    try {
      const profile = await getMe(accessToken);
      setUser(profile);
      setToken(accessToken);
    } catch {
      // Try refresh
      const rt = localStorage.getItem(REFRESH_KEY);
      if (rt) {
        try {
          const newTokens = await refreshTokenApi(rt);
          saveTokens(newTokens);
          const profile = await getMe(newTokens.access_token);
          setUser(profile);
        } catch {
          clearTokens();
        }
      } else {
        clearTokens();
      }
    }
  }, [saveTokens, clearTokens]);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      fetchUser(storedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const tokens = await loginUser(email, password);
    saveTokens(tokens);
    await fetchUser(tokens.access_token);
  };

  const register = async (email: string, password: string, fullName?: string) => {
    return await registerUser(email, password, fullName);
  };

  const logout = () => {
    clearTokens();
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        isPremium: user?.plan === "premium",
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        setTokens: saveTokens,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
