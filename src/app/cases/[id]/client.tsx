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
import { useCase, useUpdateCase, useActivities } from "@/hooks/use-data";
import { Case } from "@/lib/types";
import { Briefcase, ArrowLeft, Phone, Mail, Calendar, CheckSquare, Clock } from "lucide-react";
import Link from "next/link";

export function CaseDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { org } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: caseItem, loading: caseLoading, refetch } = useCase(id);
  const updateCase = useUpdateCase();
  const { data: allActivities = [], loading: activitiesLoading } = useActivities(org?.id);

  const activities = useMemo(() => {
    if (!caseItem) return [];
    return allActivities.filter(
      (a) => a.contactId === caseItem.contactId || a.accountId === caseItem.accountId
    ).slice(0, 10);
  }, [allActivities, caseItem]);

  const updateField = async (field: keyof Case, value: string) => {
    if (!org || !caseItem) return;
    try {
      await updateCase.mutate(id, { [field]: value });
      refetch();
      toast("Field updated");
    } catch {
      toast("Failed to update field");
    }
  };

  const loading = caseLoading || activitiesLoading;

  if (loading) return <DashboardLayout><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-zen-surface-hover rounded w-1/4"></div><div className="h-64 bg-zen-surface-hover rounded"></div></div></div></DashboardLayout>;

  if (!caseItem || !org) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-zen-text-secondary">Case not found</p>
          <Button variant="secondary" onClick={() => router.push("/cases")} className="mt-4">
            <ArrowLeft size={16} className="mr-1" /> Back to Cases
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const priorityVariant = (p: string) => {
    if (p === "High") return "error" as const;
    if (p === "Medium") return "warning" as const;
    return "success" as const;
  };

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
            <Briefcase size={24} className="text-zen-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-zen-text">{caseItem.subject}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={priorityVariant(caseItem.priority)}>{caseItem.priority} Priority</Badge>
              <Badge variant={caseItem.status === "Closed" ? "success" : caseItem.status === "Escalated" ? "error" : "info"}>
                {caseItem.status}
              </Badge>
            </div>
          </div>
          <Button variant="secondary" onClick={() => router.push("/cases")}>
            <ArrowLeft size={16} className="mr-1" /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <Collapsible title="Case Details">
                <div className="space-y-3">
                  <InlineEdit label="Subject" value={caseItem.subject} onSave={(v) => updateField("subject", v)} />
                  <InlineEdit label="Status" value={caseItem.status} onSave={(v) => updateField("status", v)} />
                  <InlineEdit label="Priority" value={caseItem.priority} onSave={(v) => updateField("priority", v)} />
                  <InlineEdit label="Owner" value={caseItem.ownerName} onSave={(v) => updateField("ownerName", v)} />
                  {caseItem.contactName && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zen-text-secondary uppercase tracking-wide min-w-[100px]">Contact</span>
                      <Link href={`/contacts/${caseItem.contactId}`} className="text-sm text-zen-primary hover:underline">
                        {caseItem.contactName}
                      </Link>
                    </div>
                  )}
                  {caseItem.accountName && (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-zen-text-secondary uppercase tracking-wide min-w-[100px]">Account</span>
                      <Link href={`/accounts/${caseItem.accountId}`} className="text-sm text-zen-primary hover:underline">
                        {caseItem.accountName}
                      </Link>
                    </div>
                  )}
                </div>
              </Collapsible>

              <Collapsible title="Description">
                <InlineEdit value={caseItem.description} onSave={(v) => updateField("description", v)} />
              </Collapsible>

              {caseItem.resolution && (
                <Collapsible title="Resolution">
                  <InlineEdit value={caseItem.resolution} onSave={(v) => updateField("resolution", v)} />
                </Collapsible>
              )}
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
