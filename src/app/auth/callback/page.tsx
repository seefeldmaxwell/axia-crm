"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { parseOAuthCallback } from "@/lib/oauth";
import { storeUser, storeOrg } from "@/lib/auth";
import { api } from "@/lib/api";
import { User } from "@/lib/types";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const oauthUser = await parseOAuthCallback();

      if (oauthUser) {
        try {
          // POST to backend to check org domain and get/create user
          const response = await api.loginWithOAuth(
            oauthUser.provider,
            oauthUser.email,
            oauthUser.name,
            oauthUser.avatar
          );

          if (response.error === "org_not_found") {
            setError("No organization found for your email domain. Contact your admin to get access.");
            return;
          }

          if (response.error) {
            setError(response.message || response.error);
            return;
          }

          // Map backend user to frontend User type
          const user: User = {
            id: response.user.id,
            name: response.user.name,
            email: response.user.email,
            role: response.user.role === "admin" || response.user.is_admin === 1 ? "admin" : "rep",
            orgId: response.user.org_id,
            orgName: response.org?.name || "My Organization",
            avatar: response.user.avatar_url || oauthUser.avatar,
          };

          // Store avatar separately if available
          if (oauthUser.avatar) {
            localStorage.setItem("axia_user_avatar", oauthUser.avatar);
          }
          localStorage.setItem("axia_auth_provider", oauthUser.provider);

          storeUser(user);
          if (response.org) {
            storeOrg({
              id: response.org.id,
              name: response.org.name,
              logo: response.org.logo_url || undefined,
              timezone: response.org.timezone || "America/New_York",
              fiscalYear: "January",
            });
          }

          // Clean the URL hash and redirect
          window.location.replace("/home");
        } catch (e: any) {
          // If the API call itself fails (403, etc)
          if (e.message?.includes("403")) {
            setError("No organization found for your email domain. Contact your admin to get access.");
          } else {
            setError(e.message || "Authentication failed");
          }
        }
      } else {
        // Check for error in query params (Google code flow) or hash (MS implicit flow)
        const queryParams = new URLSearchParams(window.location.search);
        const hashStr = window.location.hash;
        const queryError = queryParams.get("error_description") || queryParams.get("error");
        if (queryError) {
          setError(queryError);
        } else if (hashStr.includes("error")) {
          const hashParams = new URLSearchParams(hashStr.substring(1));
          setError(hashParams.get("error_description") || hashParams.get("error") || "Authentication failed");
        } else {
          setError("No authentication response received");
        }
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="max-w-md p-8 text-center"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--accent-red-muted)", borderRadius: "50%" }}
          >
            <span style={{ color: "var(--accent-red)", fontSize: "20px" }}>!</span>
          </div>
          <h2
            className="text-[16px] font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Authentication Failed
          </h2>
          <p className="text-[13px] mb-6" style={{ color: "var(--text-secondary)" }}>
            {error}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 text-[13px] font-medium text-white transition-colors"
            style={{
              background: "var(--accent-blue)",
              borderRadius: "var(--radius-sm)",
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="text-center">
        <div
          className="w-8 h-8 mx-auto mb-3 border-2 rounded-full animate-spin"
          style={{ borderColor: "var(--border-primary)", borderTopColor: "var(--accent-blue)" }}
        />
        <p className="text-[12px]" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
          AUTHENTICATING...
        </p>
      </div>
    </div>
  );
}
