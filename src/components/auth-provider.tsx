"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthContext, getStoredUser, storeUser, clearUser, getStoredOrg, storeOrg } from "@/lib/auth";
import { User, Org } from "@/lib/types";
import { initiateGoogleLogin, initiateMicrosoftLogin } from "@/lib/oauth";
import { api } from "@/lib/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      const storedOrg = getStoredOrg();
      if (storedOrg) {
        setOrg(storedOrg);
      }
    } else if (pathname !== "/" && !pathname.startsWith("/auth")) {
      router.push("/");
    }
    setLoading(false);
  }, [pathname, router]);

  const login = async (provider: "google" | "microsoft") => {
    if (provider === "google") {
      initiateGoogleLogin();
    } else {
      // Microsoft: if not configured, fall back to mock login via backend
      initiateMicrosoftLogin();
      const mockProvider = sessionStorage.getItem("oauth_provider");
      if (mockProvider === "microsoft_mock") {
        sessionStorage.removeItem("oauth_provider");
        try {
          // Use the backend to login — this checks org_domains
          const response = await api.loginWithOAuth(
            "microsoft",
            "seefeldmaxwell1@gmail.com",
            "Maxwell Seefeld"
          );

          if (response.error) {
            console.error("Login error:", response.error);
            return;
          }

          const mockUser: User = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role === "admin" || response.user.is_admin === 1 ? "admin" : "rep",
            orgId: response.user.org_id,
            orgName: response.org?.name || "My Organization",
          };

          const mockOrg: Org = {
            id: response.org?.id || "org-1",
            name: response.org?.name || "My Organization",
            timezone: response.org?.timezone || "America/New_York",
            fiscalYear: "January",
          };

          storeUser(mockUser);
          storeOrg(mockOrg);
          setUser(mockUser);
          setOrg(mockOrg);
          router.push("/home");
        } catch (e) {
          console.error("Mock login failed:", e);
        }
      }
    }
  };

  const logout = () => {
    clearUser();
    localStorage.removeItem("axia_org");
    localStorage.removeItem("axia_user_avatar");
    localStorage.removeItem("axia_auth_provider");
    setUser(null);
    setOrg(null);
    router.push("/");
  };

  const switchOrg = (orgId: string) => {
    // For now, org switching is not supported with backend auth
    // Would need to re-authenticate
    console.warn("Org switching not yet supported with backend auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1B1A19]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0078D4] border-t-transparent" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, org, login, logout, switchOrg }}>
      {children}
    </AuthContext.Provider>
  );
}
