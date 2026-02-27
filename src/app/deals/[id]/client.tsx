"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useDeal, useUpdateDeal, useDeleteDeal, useActivities } from "@/hooks/use-data";
import { Deal } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, ArrowLeft, Calendar, DollarSign, Clock, Phone, Mail, CheckSquare, Trash2 } from "lucide-react";
import Link from "next/link";

export function DealDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { org } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: deal, loading: dealLoading, refetch: refetchDeal } = useDeal(id);
  const { data: allActivities, loading: activitiesLoading } = useActivities(org?.id);
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();

  const activities = useMemo(() => {
    if (!deal || !allActivities) return [];
    return allActivities.filter((a) => a.dealId === deal.id || a.contactId === deal.contactId);
  }, [allActivities, deal]);

  const updateField = async (field: keyof Deal, value: string) => {
    if (!org || !deal) return;
    try {
      await updateDeal.mutate(id, { [field]: value });
      await refetchDeal();
      toast("Field updated");
    } catch {
      toast("Failed to update field");
    }
  };

  if (dealLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-sm text-zen-text-secondary">Loading deal...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!deal || !org) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-zen-text-secondary">Deal not found</p>
          <Button variant="secondary" onClick={() => router.push("/deals")} className="mt-4">
            <ArrowLeft size={16} className="mr-1" /> Back to Deals
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const stageColor = deal.stage === "Closed Won" ? "success" : deal.stage === "Closed Lost" ? "error" : "info";

  const typeIcons: Record<string, React.ReactNode> = {
    call: <Phone size={14} className="text-zen-success" />,
    email: <Mail size={14} className="text-zen-primary" />,
    meeting: <Calendar size={14} className="text-purple-600" />,
    task: <CheckSquare size={14} className="text-orange-600" />,
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-lg bg-zen-primary/10">
            <TrendingUp size={24} className="text-zen-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-zen-text">{deal.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant={stageColor}>{deal.stage}</Badge>
              <span className="text-lg font-bold text-zen-text">{formatCurrency(deal.amount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={async () => {
              if (!confirm("Delete this deal?")) return;
              try { await deleteDeal.mutate(id); router.push("/deals"); toast("Deal deleted"); } catch { toast("Failed to delete"); }
            }}>
              <Trash2 size={16} />
            </Button>
            <Button variant="secondary" onClick={() => router.push("/deals")}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
        </div>

        {/* Stage progress */}
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center gap-1">
              {["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won"].map((stage) => (
                <div
                  key={stage}
                  className={`flex-1 h-2 rounded-full ${
                    ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won"].indexOf(deal.stage) >=
                    ["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won"].indexOf(stage)
                      ? "bg-zen-primary"
                      : "bg-zen-surface-hover"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-zen-text-secondary">
              {["Prospecting", "Qualification", "Proposal", "Negotiation", "Closed Won"].map((s) => (
                <span key={s} className={deal.stage === s ? "font-semibold text-zen-primary" : ""}>{s}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <Collapsible title="Deal Details">
                <div className="space-y-3">
                  <InlineEdit label="Deal Name" value={deal.name} onSave={(v) => updateField("name", v)} />
                  <InlineEdit label="Amount" value={String(deal.amount)} onSave={(v) => updateField("amount", v)} />
                  <InlineEdit label="Close Date" value={deal.closeDate} onSave={(v) => updateField("closeDate", v)} />
                  <InlineEdit label="Stage" value={deal.stage} onSave={(v) => updateField("stage", v)} />
                  <InlineEdit label="Probability" value={`${deal.probability}%`} onSave={(v) => updateField("probability", v)} />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zen-text-secondary uppercase tracking-wide min-w-[100px]">Account</span>
                    <Link href={`/accounts/${deal.accountId}`} className="text-sm text-zen-primary hover:underline">
                      {deal.accountName}
                    </Link>
                  </div>
                  {deal.contactName && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zen-text-secondary uppercase tracking-wide min-w-[100px]">Contact</span>
                      <Link href={`/contacts/${deal.contactId}`} className="text-sm text-zen-primary hover:underline">
                        {deal.contactName}
                      </Link>
                    </div>
                  )}
                  <InlineEdit label="Owner" value={deal.ownerName} onSave={(v) => updateField("ownerName", v)} />
                </div>
              </Collapsible>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-zen-text">Activity Timeline</h2>
              </CardHeader>
              <CardContent className="p-0">
                {activities.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-zen-text-secondary text-center">No activities</p>
                ) : (
                  activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 px-4 py-3 border-b border-zen-border last:border-0">
                      <div className="mt-0.5 p-1.5 rounded bg-zen-surface-hover">
                        {typeIcons[act.type]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zen-text">{act.subject}</p>
                        {act.description && (
                          <p className="text-xs text-zen-text-secondary mt-0.5">{act.description}</p>
                        )}
                        <p className="text-xs text-zen-text-secondary mt-1">{act.dueDate} &middot; {act.ownerName}</p>
                      </div>
                      <Badge variant={act.status === "Done" ? "success" : act.status === "In Progress" ? "info" : "neutral"}>
                        {act.status}
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
