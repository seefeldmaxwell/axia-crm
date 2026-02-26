"use client";

const GOOGLE_CLIENT_ID = "416218053988-rdvn9os69iid871l62dcvreqbt6ss550.apps.googleusercontent.com";
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://axia-crm-api.seefeldmaxwell1.workers.dev";

// Microsoft OAuth — not yet configured
const MS_CLIENT_ID = "";
const MS_TENANT = "common";

function getRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/callback`;
}

function generateState(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export interface OAuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "microsoft";
}

// ─── Google Sign-In (Authorization Code Flow) ───

export function initiateGoogleLogin(): void {
  const state = generateState();
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("oauth_provider", "google");

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "code",
    scope: "openid email profile",
    state: state,
    access_type: "offline",
    prompt: "select_account",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange auth code for user info via our Worker backend
async function exchangeGoogleCode(code: string): Promise<OAuthUser | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/google/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        redirect_uri: getRedirectUri(),
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Google token exchange failed:", err);
      return null;
    }

    const data = await res.json();
    return {
      id: data.email, // Will be replaced with DB user id after /auth/login
      name: data.name || "User",
      email: data.email || "",
      avatar: data.avatar || undefined,
      provider: "google",
    };
  } catch (e) {
    console.error("Google exchange error:", e);
    return null;
  }
}

// ─── Microsoft Sign-In ───

export function initiateMicrosoftLogin(): void {
  if (!MS_CLIENT_ID) {
    console.warn("Microsoft OAuth not configured — using mock login");
    sessionStorage.setItem("oauth_provider", "microsoft_mock");
    return;
  }

  const state = generateState();
  sessionStorage.setItem("oauth_state", state);
  sessionStorage.setItem("oauth_provider", "microsoft");

  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    response_type: "id_token",
    scope: "openid email profile",
    response_mode: "fragment",
    nonce: state,
    prompt: "select_account",
  });

  window.location.href = `https://login.microsoftonline.com/${MS_TENANT}/oauth2/v2.0/authorize?${params.toString()}`;
}

function parseMicrosoftIdToken(token: string): OAuthUser | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return {
      id: decoded.oid || decoded.sub,
      name: decoded.name || decoded.preferred_username || "User",
      email: decoded.preferred_username || decoded.email || "",
      avatar: undefined,
      provider: "microsoft",
    };
  } catch {
    return null;
  }
}

// ─── Callback Parser ───

export async function parseOAuthCallback(): Promise<OAuthUser | null> {
  if (typeof window === "undefined") return null;

  const provider = sessionStorage.getItem("oauth_provider");

  // Google: authorization code comes as ?code= query param
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");

  if (code && provider === "google") {
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_provider");
    return exchangeGoogleCode(code);
  }

  // Microsoft: id_token comes in hash fragment
  const hash = window.location.hash;
  if (hash && provider === "microsoft") {
    const hashParams = new URLSearchParams(hash.substring(1));
    const idToken = hashParams.get("id_token");
    sessionStorage.removeItem("oauth_state");
    sessionStorage.removeItem("oauth_provider");
    if (idToken) return parseMicrosoftIdToken(idToken);
  }

  return null;
}
