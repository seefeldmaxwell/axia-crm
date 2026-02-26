"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useAccounts, useCreateAccount } from "@/hooks/use-data";
import { Account } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Plus, Building2 } from "lucide-react";

export default function AccountsPage() {
  const { org } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);

  const { data: accounts, loading, error, refetch } = useAccounts(org?.id);
  const createAccount = useCreateAccount();

  const filtered = useMemo(() => {
    if (!search) return accounts;
    const s = search.toLowerCase();
    return accounts.filter(
      (a) =>
        a.name.toLowerCase().includes(s) ||
        a.industry.toLowerCase().includes(s) ||
        a.type.toLowerCase().includes(s)
    );
  }, [accounts, search]);

  const [form, setForm] = useState({
    name: "", industry: "", type: "Prospect", phone: "", website: "",
  });

  const handleCreate = async () => {
    if (!org) return;
    try {
      await createAccount.mutate({
        name: form.name,
        industry: form.industry,
        type: form.type,
        phone: form.phone,
        website: form.website,
        orgId: org.id,
        ownerId: "1",
        ownerName: "Demo User",
      });
      await refetch();
      setShowNew(false);
      setForm({ name: "", industry: "", type: "Prospect", phone: "", website: "" });
      toast("Account created successfully");
    } catch {
      toast("Failed to create account");
    }
  };

  const typeVariant = (type: string) => {
    if (type === "Customer") return "success";
    if (type === "Partner") return "info";
    return "neutral";
  };

  const columns = [
    {
      key: "name",
      label: "Account Name",
      sortable: true,
      render: (a: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-zen-primary shrink-0" />
          <span className="font-medium text-zen-primary hover:underline">{String(a.name)}</span>
        </div>
      ),
    },
    { key: "industry", label: "Industry", sortable: true },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (a: Record<string, unknown>) => (
        <Badge variant={typeVariant(String(a.type))}>{String(a.type)}</Badge>
      ),
    },
    { key: "phone", label: "Phone" },
    { key: "website", label: "Website" },
    { key: "ownerName", label: "Owner", sortable: true },
  ];

  if (!org) return null;

  if (loading) return (
    <DashboardLayout>
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-zen-surface-hover rounded w-1/4"></div>
          <div className="h-64 bg-zen-surface-hover rounded"></div>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-zen-text">Accounts</h1>
            <p className="text-sm text-zen-text-secondary">{filtered.length} items</p>
          </div>
          <div className="flex items-center gap-3">
            <Search value={search} onChange={setSearch} placeholder="Search accounts..." className="w-64" />
            <Button onClick={() => setShowNew(true)}>
              <Plus size={16} className="mr-1" /> New Account
            </Button>
          </div>
        </div>

        <Card>
          <DataTable
            columns={columns}
            data={filtered as unknown as Record<string, unknown>[]}
            onRowClick={(item) => router.push(`/accounts/${(item as unknown as Account).id}`)}
            emptyMessage="No accounts found"
          />
        </Card>
      </div>

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Account" size="md">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Account Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Input label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="col-span-2" />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Save</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
