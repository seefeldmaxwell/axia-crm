"use client";

import { createContext, useContext } from "react";
import { User, Org } from "./types";
import { orgs } from "./mock-data";

export interface AuthContextType {
  user: User | null;
  org: Org | null;
  login: (provider: "google" | "microsoft") => void;
  logout: () => void;
  switchOrg: (orgId: string) => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  org: null,
  login: () => {},
  logout: () => {},
  switchOrg: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("axia_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem("axia_user", JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem("axia_user");
}

export function getStoredOrg(): Org | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("axia_org");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeOrg(org: Org): void {
  localStorage.setItem("axia_org", JSON.stringify(org));
}

export function getOrgById(orgId: string): Org | undefined {
  return orgs.find((o) => o.id === orgId);
}
