"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  apiGet, apiPost, apiPut, apiDelete, toSnake,
  mapContact, mapAccount, mapDeal, mapActivity, mapLead, mapCase,
  mapCallScript, mapCallRecord, mapCampaign, mapProduct, mapIntegration, mapMarketingPost,
} from "@/lib/api";
import type {
  Contact, Account, Deal, Activity, Lead, Case,
  CallScript, CallRecord, Campaign, Product, Integration,
} from "@/lib/types";

// ─── Generic list hook ───
function useList<T>(path: string, mapper: (r: any) => T, orgId: string | undefined) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await apiGet<any[]>(path);
      if (mountedRef.current) setData(raw.map(mapper));
    } catch (e: any) {
      if (mountedRef.current) setError(e.message);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [path, orgId]);

  useEffect(() => {
    mountedRef.current = true;
    fetch();
    return () => { mountedRef.current = false; };
  }, [fetch]);

  return { data, loading, error, refetch: fetch, setData };
}

// ─── Generic single-item hook ───
function useItem<T>(path: string, mapper: (r: any) => T) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await apiGet<any>(path);
      setData(mapper(raw));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

// ─── Contacts ───
export function useContacts(orgId: string | undefined) {
  return useList<Contact>("/api/contacts", mapContact, orgId);
}

export function useContact(id: string) {
  return useItem<Contact>(`/api/contacts/${id}`, mapContact);
}

export function useCreateContact() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mutate = async (data: Partial<Contact> & { orgId: string }) => {
    setLoading(true); setError(null);
    try {
      const res = await apiPost<any>("/api/contacts", toSnake(data));
      return mapContact(res);
    } catch (e: any) { setError(e.message); throw e; }
    finally { setLoading(false); }
  };
  return { mutate, loading, error };
}

export function useUpdateContact() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string, data: Partial<Contact>) => {
    setLoading(true);
    try {
      const res = await apiPut<any>(`/api/contacts/${id}`, toSnake(data));
      return mapContact(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useDeleteContact() {
  const mutate = async (id: string) => { await apiDelete(`/api/contacts/${id}`); };
  return { mutate };
}

// ─── Accounts ───
export function useAccounts(orgId: string | undefined) {
  return useList<Account>("/api/accounts", mapAccount, orgId);
}

export function useAccount(id: string) {
  return useItem<Account>(`/api/accounts/${id}`, mapAccount);
}

export function useCreateAccount() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<Account> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/accounts", toSnake(data));
      return mapAccount(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useUpdateAccount() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string, data: Partial<Account>) => {
    setLoading(true);
    try {
      const res = await apiPut<any>(`/api/accounts/${id}`, toSnake(data));
      return mapAccount(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useDeleteAccount() {
  const mutate = async (id: string) => { await apiDelete(`/api/accounts/${id}`); };
  return { mutate };
}

// ─── Deals ───
export function useDeals(orgId: string | undefined) {
  return useList<Deal>("/api/deals", mapDeal, orgId);
}

export function useDeal(id: string) {
  return useItem<Deal>(`/api/deals/${id}`, mapDeal);
}

export function useCreateDeal() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<Deal> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/deals", toSnake(data));
      return mapDeal(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useUpdateDeal() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string, data: Partial<Deal>) => {
    setLoading(true);
    try {
      const res = await apiPut<any>(`/api/deals/${id}`, toSnake(data));
      return mapDeal(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useDeleteDeal() {
  const mutate = async (id: string) => { await apiDelete(`/api/deals/${id}`); };
  return { mutate };
}

// ─── Activities ───
export function useActivities(orgId: string | undefined, filters?: { contactId?: string; accountId?: string; dealId?: string }) {
  let path = "/api/activities";
  const params = new URLSearchParams();
  if (filters?.contactId) params.set("contact_id", filters.contactId);
  if (filters?.accountId) params.set("account_id", filters.accountId);
  if (filters?.dealId) params.set("deal_id", filters.dealId);
  const qs = params.toString();
  if (qs) path += `?${qs}`;
  return useList<Activity>(path, mapActivity, orgId);
}

export function useCreateActivity() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<Activity> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/activities", toSnake(data));
      return mapActivity(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useUpdateActivity() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string, data: Partial<Activity>) => {
    setLoading(true);
    try {
      const res = await apiPut<any>(`/api/activities/${id}`, toSnake(data));
      return mapActivity(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

// ─── Leads ───
export function useLeads(orgId: string | undefined) {
  return useList<Lead>("/api/leads", mapLead, orgId);
}

export function useLead(id: string) {
  return useItem<Lead>(`/api/leads/${id}`, mapLead);
}

export function useCreateLead() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<Lead> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/leads", toSnake(data));
      return mapLead(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useUpdateLead() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string, data: Partial<Lead>) => {
    setLoading(true);
    try {
      const res = await apiPut<any>(`/api/leads/${id}`, toSnake(data));
      return mapLead(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useDeleteLead() {
  const mutate = async (id: string) => { await apiDelete(`/api/leads/${id}`); };
  return { mutate };
}

export function useConvertLead() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string) => {
    setLoading(true);
    try {
      const res = await apiPost<any>(`/api/leads/${id}/convert`, {});
      return mapContact(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

// ─── Cases ───
export function useCases(orgId: string | undefined) {
  return useList<Case>("/api/cases", mapCase, orgId);
}

export function useCase(id: string) {
  return useItem<Case>(`/api/cases/${id}`, mapCase);
}

export function useCreateCase() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<Case> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/cases", toSnake(data));
      return mapCase(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useUpdateCase() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string, data: Partial<Case>) => {
    setLoading(true);
    try {
      const res = await apiPut<any>(`/api/cases/${id}`, toSnake(data));
      return mapCase(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

export function useDeleteCase() {
  const mutate = async (id: string) => { await apiDelete(`/api/cases/${id}`); };
  return { mutate };
}

// ─── Call Scripts ───
export function useCallScripts(orgId: string | undefined) {
  return useList<CallScript>("/api/dialer/scripts", mapCallScript, orgId);
}

export function useCreateCallScript() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<CallScript> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/dialer/scripts", toSnake(data));
      return mapCallScript(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

// ─── Call Records ───
export function useCallRecords(orgId: string | undefined) {
  return useList<CallRecord>("/api/dialer/records", mapCallRecord, orgId);
}

export function useCreateCallRecord() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<CallRecord> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/dialer/records", toSnake(data));
      return mapCallRecord(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

// ─── Marketing Posts ───
export function useMarketingPosts(orgId: string | undefined) {
  return useList("/api/marketing/posts", mapMarketingPost, orgId);
}

export function useCreateMarketingPost() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: any) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/marketing/posts", toSnake(data));
      return mapMarketingPost(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

// ─── Campaigns ───
export function useCampaigns(orgId: string | undefined) {
  return useList<Campaign>("/api/marketing/campaigns", mapCampaign, orgId);
}

export function useCreateCampaign() {
  const [loading, setLoading] = useState(false);
  const mutate = async (data: Partial<Campaign> & { orgId: string }) => {
    setLoading(true);
    try {
      const res = await apiPost<any>("/api/marketing/campaigns", toSnake(data));
      return mapCampaign(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

// ─── Products ───
export function useProducts(orgId: string | undefined) {
  return useList<Product>("/api/products", mapProduct, orgId);
}

// ─── Integrations ───
export function useIntegrations(orgId: string | undefined) {
  return useList<Integration>("/api/integrations", mapIntegration, orgId);
}

export function useUpdateIntegration() {
  const [loading, setLoading] = useState(false);
  const mutate = async (id: string, data: { enabled: boolean }) => {
    setLoading(true);
    try {
      const res = await apiPut<any>(`/api/integrations/${id}`, data);
      return mapIntegration(res);
    } finally { setLoading(false); }
  };
  return { mutate, loading };
}

// ─── Reports Dashboard ───
export function useReportsDashboard(orgId: string | undefined) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    if (!orgId) return;
    setLoading(true); setError(null);
    try {
      const raw = await apiGet<any>("/api/reports/dashboard");
      setData(raw);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
