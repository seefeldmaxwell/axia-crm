"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useLead, useUpdateLead, useDeleteLead, useConvertLead } from "@/hooks/use-data";
import { Lead } from "@/lib/types";
import { UserPlus, ArrowLeft, ArrowRight, Trash2 } from "lucide-react";

export function LeadDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { org } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: lead, loading, refetch } = useLead(id);
  const updateLead = useUpdateLead();
  const deleteLead = useDeleteLead();
  const convertLead = useConvertLead();

  const updateField = async (field: keyof Lead, value: string) => {
    if (!org || !lead) return;
    try {
      await updateLead.mutate(id, { [field]: value });
      refetch();
      toast("Field updated");
    } catch {
      toast("Failed to update field");
    }
  };

  const convertToContact = async () => {
    if (!org || !lead) return;
    try {
      const newContact = await convertLead.mutate(id);
      toast("Lead converted to contact");
      router.push(`/contacts/${newContact.id}`);
    } catch {
      toast("Failed to convert lead");
    }
  };

  if (loading) return <DashboardLayout><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-zen-surface-hover rounded w-1/4"></div><div className="h-64 bg-zen-surface-hover rounded"></div></div></div></DashboardLayout>;

  if (!lead || !org) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-zen-text-secondary">Lead not found</p>
          <Button variant="secondary" onClick={() => router.push("/leads")} className="mt-4">
            <ArrowLeft size={16} className="mr-1" /> Back to Leads
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const statusVariant = (s: string) => {
    if (s === "New") return "info" as const;
    if (s === "Contacted") return "warning" as const;
    if (s === "Qualified") return "success" as const;
    return "error" as const;
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-lg bg-zen-primary/10">
            <UserPlus size={24} className="text-zen-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-zen-text">{lead.firstName} {lead.lastName}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={statusVariant(lead.status)}>{lead.status}</Badge>
              <span className="text-sm text-zen-text-secondary">{lead.company}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={convertToContact}>
              <ArrowRight size={16} className="mr-1" /> Convert to Contact
            </Button>
            <Button variant="ghost" onClick={async () => {
              if (!confirm("Delete this lead?")) return;
              try { await deleteLead.mutate(id); router.push("/leads"); toast("Lead deleted"); } catch { toast("Failed to delete"); }
            }}>
              <Trash2 size={16} />
            </Button>
            <Button variant="secondary" onClick={() => router.push("/leads")}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <Collapsible title="Lead Information">
              <div className="space-y-3">
                <InlineEdit label="First Name" value={lead.firstName} onSave={(v) => updateField("firstName", v)} />
                <InlineEdit label="Last Name" value={lead.lastName} onSave={(v) => updateField("lastName", v)} />
                <InlineEdit label="Title" value={lead.title} onSave={(v) => updateField("title", v)} />
                <InlineEdit label="Company" value={lead.company} onSave={(v) => updateField("company", v)} />
                <InlineEdit label="Industry" value={lead.industry} onSave={(v) => updateField("industry", v)} />
                <InlineEdit label="Owner" value={lead.ownerName} onSave={(v) => updateField("ownerName", v)} />
              </div>
            </Collapsible>

            <Collapsible title="Contact Information">
              <div className="space-y-3">
                <InlineEdit label="Email" value={lead.email} onSave={(v) => updateField("email", v)} type="email" />
                <InlineEdit label="Phone" value={lead.phone} onSave={(v) => updateField("phone", v)} type="tel" />
              </div>
            </Collapsible>
          </Card>

          <Card>
            <Collapsible title="Lead Details">
              <div className="space-y-3">
                <InlineEdit label="Status" value={lead.status} onSave={(v) => updateField("status", v)} />
                <InlineEdit label="Source" value={lead.source} onSave={(v) => updateField("source", v)} />
                <InlineEdit label="Rating" value={lead.rating} onSave={(v) => updateField("rating", v)} />
                {lead.description && (
                  <InlineEdit label="Description" value={lead.description} onSave={(v) => updateField("description", v)} />
                )}
              </div>
            </Collapsible>

            <Collapsible title="Additional Info">
              <div className="space-y-2 text-sm text-zen-text-secondary">
                <p>Created: {lead.createdAt}</p>
              </div>
            </Collapsible>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
