"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useAccount, useUpdateAccount, useDeleteAccount, useContacts, useDeals, useCases, useActivities } from "@/hooks/use-data";
import { Account, Contact, Deal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Building2, Phone, Globe, MapPin, ArrowLeft, Users, TrendingUp, Briefcase, Clock, Trash2 } from "lucide-react";
import Link from "next/link";

export function AccountDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { org } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: account, loading: accountLoading, refetch: refetchAccount } = useAccount(id);
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const { data: allContacts } = useContacts(org?.id);
  const { data: allDeals } = useDeals(org?.id);
  const { data: allCases } = useCases(org?.id);
  const { data: relatedActivities } = useActivities(org?.id, { accountId: id });

  const relatedContacts = useMemo(() => {
    if (!account) return [];
    return allContacts.filter((c) => c.accountId === account.id);
  }, [allContacts, account]);

  const relatedDeals = useMemo(() => {
    if (!account) return [];
    return allDeals.filter((d) => d.accountId === account.id);
  }, [allDeals, account]);

  const relatedCases = useMemo(() => {
    if (!account) return [];
    return allCases.filter((c) => c.accountId === account.id);
  }, [allCases, account]);

  const updateField = async (field: keyof Account, value: string) => {
    if (!org || !account) return;
    try {
      await updateAccount.mutate(id, { [field]: value });
      await refetchAccount();
      toast("Field updated");
    } catch {
      toast("Failed to update field");
    }
  };

  if (accountLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zen-surface-hover rounded w-1/4"></div>
            <div className="h-64 bg-zen-surface-hover rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!account || !org) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-zen-text-secondary">Account not found</p>
          <Button variant="secondary" onClick={() => router.push("/accounts")} className="mt-4">
            <ArrowLeft size={16} className="mr-1" /> Back to Accounts
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-lg bg-zen-primary/10">
            <Building2 size={24} className="text-zen-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-zen-text">{account.name}</h1>
            <p className="text-sm text-zen-text-secondary">{account.industry} &middot; {account.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={async () => {
              if (!confirm("Delete this account?")) return;
              try { await deleteAccount.mutate(id); router.push("/accounts"); toast("Account deleted"); } catch { toast("Failed to delete"); }
            }}>
              <Trash2 size={16} />
            </Button>
            <Button variant="secondary" onClick={() => router.push("/accounts")}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <Collapsible title="Account Details">
                <div className="space-y-3">
                  <InlineEdit label="Name" value={account.name} onSave={(v) => updateField("name", v)} />
                  <InlineEdit label="Industry" value={account.industry} onSave={(v) => updateField("industry", v)} />
                  <InlineEdit label="Type" value={account.type} onSave={(v) => updateField("type", v)} />
                  <InlineEdit label="Employees" value={String(account.employees || "")} onSave={(v) => updateField("employees", v)} />
                  <InlineEdit label="Revenue" value={account.annualRevenue ? formatCurrency(account.annualRevenue) : ""} onSave={(v) => updateField("annualRevenue", v)} />
                  <InlineEdit label="Owner" value={account.ownerName} onSave={(v) => updateField("ownerName", v)} />
                </div>
              </Collapsible>

              <Collapsible title="Contact Information">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-zen-text-secondary" />
                    <InlineEdit label="Phone" value={account.phone} onSave={(v) => updateField("phone", v)} type="tel" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-zen-text-secondary" />
                    <InlineEdit label="Website" value={account.website} onSave={(v) => updateField("website", v)} type="url" />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zen-text-secondary" />
                    <InlineEdit label="Address" value={account.billingAddress} onSave={(v) => updateField("billingAddress", v)} />
                  </div>
                </div>
              </Collapsible>

              <Collapsible title="Description">
                <InlineEdit value={account.description} onSave={(v) => updateField("description", v)} />
              </Collapsible>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {/* Related Contacts */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-zen-text-secondary" />
                  <h2 className="font-semibold text-zen-text">Contacts ({relatedContacts.length})</h2>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {relatedContacts.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-zen-text-secondary">No contacts</p>
                ) : (
                  relatedContacts.map((c) => (
                    <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 px-4 py-2.5 border-b border-zen-border last:border-0 hover:bg-zen-surface-hover">
                      <Avatar name={`${c.firstName} ${c.lastName}`} size="sm" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zen-primary">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-zen-text-secondary">{c.title}</p>
                      </div>
                      <span className="text-xs text-zen-text-secondary">{c.email}</span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Related Deals */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} className="text-zen-text-secondary" />
                  <h2 className="font-semibold text-zen-text">Opportunities ({relatedDeals.length})</h2>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {relatedDeals.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-zen-text-secondary">No opportunities</p>
                ) : (
                  relatedDeals.map((d) => (
                    <Link key={d.id} href={`/deals/${d.id}`} className="flex items-center justify-between px-4 py-2.5 border-b border-zen-border last:border-0 hover:bg-zen-surface-hover">
                      <div>
                        <p className="text-sm font-medium text-zen-primary">{d.name}</p>
                        <p className="text-xs text-zen-text-secondary">{d.stage} &middot; {d.closeDate}</p>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(d.amount)}</span>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Related Cases */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Briefcase size={16} className="text-zen-text-secondary" />
                  <h2 className="font-semibold text-zen-text">Cases ({relatedCases.length})</h2>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {relatedCases.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-zen-text-secondary">No cases</p>
                ) : (
                  relatedCases.map((c) => (
                    <Link key={c.id} href={`/cases/${c.id}`} className="flex items-center justify-between px-4 py-2.5 border-b border-zen-border last:border-0 hover:bg-zen-surface-hover">
                      <div>
                        <p className="text-sm font-medium text-zen-primary">{c.subject}</p>
                        <p className="text-xs text-zen-text-secondary">{c.status}</p>
                      </div>
                      <Badge variant={c.priority === "High" ? "error" : c.priority === "Medium" ? "warning" : "success"}>
                        {c.priority}
                      </Badge>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Activity */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-zen-text-secondary" />
                  <h2 className="font-semibold text-zen-text">Activity ({relatedActivities.length})</h2>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {relatedActivities.length === 0 ? (
                  <p className="px-4 py-4 text-sm text-zen-text-secondary">No activities</p>
                ) : (
                  relatedActivities.slice(0, 10).map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-4 py-2.5 border-b border-zen-border last:border-0">
                      <div>
                        <p className="text-sm text-zen-text">{a.subject}</p>
                        <p className="text-xs text-zen-text-secondary">{a.dueDate} &middot; {a.ownerName}</p>
                      </div>
                      <Badge variant={a.status === "Done" ? "success" : a.status === "In Progress" ? "info" : "neutral"}>
                        {a.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
