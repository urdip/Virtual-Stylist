"use client";

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { getMe, login as loginApi, logout as logoutApi } from "./api";

interface User {
  id: string;
  email: string;
  name: string;
  photo_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use ref to track user state for interval checks (avoids stale closure issues)
  const userRef = useRef<User | null>(null);
  
  // Keep ref in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Function to check auth status
  const checkAuth = async () => {
    if (typeof window === "undefined") {
      setIsLoading(false);
      return;
    }
    
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const userData = await getMe();
        setUser(userData);
      } catch (err) {
        console.error("Auth error:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Initial auth check
    checkAuth();

    // Listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "token") {
        if (e.newValue) {
          // Token added - log in
          checkAuth();
        } else {
          // Token removed - log out
          setUser(null);
        }
      }
    };

    // Listen for custom auth events (same-tab sync)
    const handleAuthEvent = (e: CustomEvent) => {
      if (e.detail?.type === "login") {
        checkAuth();
      } else if (e.detail?.type === "logout") {
        setUser(null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("auth-change" as any, handleAuthEvent);

    // Periodic check for token/user mismatch (reduced frequency, uses ref to avoid stale closure)
    const interval = setInterval(() => {
      const token = localStorage.getItem("token");
      const hasUser = !!userRef.current;
      if (token && !hasUser) {
        checkAuth();
      } else if (!token && hasUser) {
        setUser(null);
      }
    }, 30000); // Reduced from 5s to 30s

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("auth-change" as any, handleAuthEvent);
      clearInterval(interval);
    };
  }, []); // Empty dependency array - effect runs only once

  const login = async (email: string, password: string) => {
    const data = await loginApi(email, password);
    setUser(data.user);
    // Dispatch event for other tabs
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { type: "login" } }));
  };

  const logout = async () => {
    await logoutApi();
    setUser(null);
    // Dispatch event for other tabs
    window.dispatchEvent(new CustomEvent("auth-change", { detail: { type: "logout" } }));
  };

  const refreshUser = async () => {
    const userData = await getMe();
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
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
