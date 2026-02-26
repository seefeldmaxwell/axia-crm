"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "@/components/ui/search";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useCases, useCreateCase } from "@/hooks/use-data";
import { Case, CasePriority, CaseStatus } from "@/lib/types";
import { Plus, Briefcase } from "lucide-react";

export default function CasesPage() {
  const { org } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { data: cases = [], loading, refetch } = useCases(org?.id);
  const createCase = useCreateCase();

  const filtered = useMemo(() => {
    if (!search) return cases;
    const s = search.toLowerCase();
    return cases.filter(
      (c) =>
        c.subject.toLowerCase().includes(s) ||
        (c.accountName || "").toLowerCase().includes(s) ||
        (c.contactName || "").toLowerCase().includes(s)
    );
  }, [cases, search]);

  const [form, setForm] = useState({
    subject: "", priority: "Medium" as CasePriority, status: "New" as CaseStatus, description: "",
  });

  const handleCreate = async () => {
    if (!org) return;
    await createCase.mutate({
      subject: form.subject,
      status: form.status,
      priority: form.priority,
      description: form.description,
      ownerId: "1",
      ownerName: "Demo User",
      orgId: org.id,
      createdAt: new Date().toISOString().split("T")[0],
    });
    setShowNew(false);
    setForm({ subject: "", priority: "Medium", status: "New", description: "" });
    refetch();
    toast("Case created successfully");
  };

  const priorityVariant = (p: string) => {
    if (p === "High") return "error";
    if (p === "Medium") return "warning";
    return "success";
  };

  const statusVariant = (s: string) => {
    if (s === "Closed") return "success";
    if (s === "Escalated") return "error";
    if (s === "Working") return "info";
    return "neutral";
  };

  const columns = [
    {
      key: "subject", label: "Subject", sortable: true,
      render: (c: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <Briefcase size={16} className="text-zen-primary shrink-0" />
          <span className="font-medium text-zen-primary hover:underline">{String(c.subject)}</span>
        </div>
      ),
    },
    {
      key: "priority", label: "Priority", sortable: true,
      render: (c: Record<string, unknown>) => (
        <Badge variant={priorityVariant(String(c.priority)) as "error" | "warning" | "success"}>{String(c.priority)}</Badge>
      ),
    },
    {
      key: "status", label: "Status", sortable: true,
      render: (c: Record<string, unknown>) => (
        <Badge variant={statusVariant(String(c.status)) as "success" | "error" | "info" | "neutral"}>{String(c.status)}</Badge>
      ),
    },
    { key: "contactName", label: "Contact", sortable: true },
    { key: "accountName", label: "Account", sortable: true },
    { key: "ownerName", label: "Owner", sortable: true },
    { key: "createdAt", label: "Created", sortable: true },
  ];

  if (!org) return null;

  if (loading) return <DashboardLayout><div className="p-6"><div className="animate-pulse space-y-4"><div className="h-8 bg-zen-surface-hover rounded w-1/4"></div><div className="h-64 bg-zen-surface-hover rounded"></div></div></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-zen-text">Cases</h1>
            <p className="text-sm text-zen-text-secondary">{filtered.length} items</p>
          </div>
          <div className="flex items-center gap-3">
            <Search value={search} onChange={setSearch} placeholder="Search cases..." className="w-64" />
            <Button onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1" /> New Case
            </Button>
          </div>
        </div>

        <Card>
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            onRowClick={(item) => router.push(`/cases/${(item as unknown as Case).id}`)}
          />
        </Card>
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Case" size="md">
        <div className="space-y-4">
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as CasePriority })} options={[
              { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" },
            ]} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CaseStatus })} options={[
              { value: "New", label: "New" }, { value: "Working", label: "Working" },
              { value: "Escalated", label: "Escalated" }, { value: "Closed", label: "Closed" },
            ]} />
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Save</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
