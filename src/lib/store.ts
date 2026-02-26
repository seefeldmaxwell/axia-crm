"use client";

import {
  Contact, Account, Deal, Activity, Lead, Case,
  CallScript, Campaign, Product, Integration, CallRecord,
} from "./types";
import {
  contacts as defaultContacts,
  accounts as defaultAccounts,
  deals as defaultDeals,
  activities as defaultActivities,
  leads as defaultLeads,
  cases as defaultCases,
  callScripts as defaultScripts,
  campaigns as defaultCampaigns,
  products as defaultProducts,
  integrations as defaultIntegrations,
} from "./mock-data";

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Initialize data on first load
function initData<T>(key: string, defaults: T): T {
  const existing = getItem<T | null>(key, null);
  if (existing === null) {
    setItem(key, defaults);
    return defaults;
  }
  return existing;
}

export function getContacts(orgId: string): Contact[] {
  const all = initData("axia_contacts", defaultContacts);
  return all.filter((c) => c.orgId === orgId);
}

export function setContacts(data: Contact[]): void {
  setItem("axia_contacts", data);
}

export function getAccounts(orgId: string): Account[] {
  const all = initData("axia_accounts", defaultAccounts);
  return all.filter((a) => a.orgId === orgId);
}

export function setAccounts(data: Account[]): void {
  setItem("axia_accounts", data);
}

export function getDeals(orgId: string): Deal[] {
  const all = initData("axia_deals", defaultDeals);
  return all.filter((d) => d.orgId === orgId);
}

export function setDeals(data: Deal[]): void {
  setItem("axia_deals", data);
}

export function getActivities(orgId: string): Activity[] {
  const all = initData("axia_activities", defaultActivities);
  return all.filter((a) => a.orgId === orgId);
}

export function setActivities(data: Activity[]): void {
  setItem("axia_activities", data);
}

export function getLeads(orgId: string): Lead[] {
  const all = initData("axia_leads", defaultLeads);
  return all.filter((l) => l.orgId === orgId);
}

export function setLeads(data: Lead[]): void {
  setItem("axia_leads", data);
}

export function getCases(orgId: string): Case[] {
  const all = initData("axia_cases", defaultCases);
  return all.filter((c) => c.orgId === orgId);
}

export function setCases(data: Case[]): void {
  setItem("axia_cases", data);
}

export function getCallScripts(orgId: string): CallScript[] {
  const all = initData("axia_scripts", defaultScripts);
  return all.filter((s) => s.orgId === orgId);
}

export function setCallScripts(data: CallScript[]): void {
  setItem("axia_scripts", data);
}

export function getCallRecords(orgId: string): CallRecord[] {
  const all = getItem<CallRecord[]>("axia_call_records", []);
  return all.filter((r) => r.orgId === orgId);
}

export function setCallRecords(data: CallRecord[]): void {
  setItem("axia_call_records", data);
}

export function getCampaigns(orgId: string): Campaign[] {
  const all = initData("axia_campaigns", defaultCampaigns);
  return all.filter((c) => c.orgId === orgId);
}

export function setCampaigns(data: Campaign[]): void {
  setItem("axia_campaigns", data);
}

export function getProducts(orgId: string): Product[] {
  const all = initData("axia_products", defaultProducts);
  return all.filter((p) => p.orgId === orgId);
}

export function setProducts(data: Product[]): void {
  setItem("axia_products", data);
}

export function getIntegrations(orgId: string): Integration[] {
  const all = initData("axia_integrations", defaultIntegrations);
  return all.filter((i) => i.orgId === orgId);
}

export function setIntegrations(data: Integration[]): void {
  setItem("axia_integrations", data);
}
