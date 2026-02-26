"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Search } from "@/components/ui/search";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { TransferModal } from "@/components/ui/transfer-modal";
import { ShareModal } from "@/components/ui/share-modal";
import { api, mapClient, toSnake } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Client } from "@/lib/types";
import { Plus, Pencil, Trash2, Briefcase, MoreVertical, ArrowRight, Share2, Loader2 } from "lucide-react";

function getStatusColor(status: string): string {
  if (status === "Active") return "var(--accent-green)";
  if (status === "At Risk") return "var(--accent-yellow)";
  if (status === "Churned") return "var(--accent-red)";
  return "var(--text-tertiary)";
}

export default function ClientsPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | Client["status"]>("All");

  // Transfer & Share
  const [transferTarget, setTransferTarget] = useState<Client | null>(null);
  const [shareTarget, setShareTarget] = useState<Client | null>(null);

  const [form, setForm] = useState({
    name: "",
    industry: "",
    contact: "",
    contractValue: "",
    startDate: "",
    status: "Active" as Client["status"],
  });

  const resetForm = () =>
    setForm({ name: "", industry: "", contact: "", contractValue: "", startDate: "", status: "Active" });

  const fetchClients = useCallback(async () => {
    if (!org) return;
    try {
      const raw = await api.getClients();
      setClients(raw.map(mapClient));
    } catch {
      toast("Failed to load clients");
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const clientTabs: { label: string; value: "All" | Client["status"] }[] = [
    { label: "All", value: "All" },
    { label: "Active", value: "Active" },
    { label: "At Risk", value: "At Risk" },
    { label: "Churned", value: "Churned" },
  ];
  const countByStatus = (s: Client["status"]) => clients.filter((c) => c.status === s).length;

  const filtered = clients.filter((c) => {
    const matchesTab = activeTab === "All" || c.status === activeTab;
    if (!search) return matchesTab;
    const s = search.toLowerCase();
    return matchesTab && (
      c.name.toLowerCase().includes(s) ||
      c.industry.toLowerCase().includes(s) ||
      c.contact.toLowerCase().includes(s)
    );
  });

  const handleAdd = async () => {
    if (!org || !form.name.trim()) return;
    try {
      await api.createClient(toSnake({
        name: form.name,
        industry: form.industry,
        contact: form.contact,
        contractValue: Number(form.contractValue) || 0,
        startDate: form.startDate || new Date().toISOString().split("T")[0],
        status: form.status,
        ownerId: user?.id || "",
        ownerName: user?.name || "",
        orgId: org.id,
      }));
      setShowAdd(false);
      resetForm();
      await fetchClients();
      toast("Client added successfully");
    } catch {
      toast("Failed to add client");
    }
  };

  const openEdit = (client: Client) => {
    setForm({
      name: client.name,
      industry: client.industry,
      contact: client.contact,
      contractValue: String(client.contractValue),
      startDate: client.startDate,
      status: client.status,
    });
    setEditingClient(client);
  };

  const handleSaveEdit = async () => {
    if (!editingClient) return;
    try {
      await api.updateClient(editingClient.id, toSnake({
        name: form.name,
        industry: form.industry,
        contact: form.contact,
        contractValue: Number(form.contractValue) || 0,
        startDate: form.startDate,
        status: form.status,
      }));
      setEditingClient(null);
      resetForm();
      await fetchClients();
      toast("Client updated");
    } catch {
      toast("Failed to update client");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteClient(id);
      await fetchClients();
      toast("Client deleted");
    } catch {
      toast("Failed to delete client");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Client",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <Briefcase size={15} className="shrink-0" style={{ color: "var(--accent-blue)" }} />
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {String(row.name)}
          </span>
        </div>
      ),
    },
    { key: "industry", label: "Industry", sortable: true },
    { key: "contact", label: "Contact", sortable: true },
    {
      key: "contractValue",
      label: "Contract Value",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {formatCurrency(Number(row.contractValue))}
        </span>
      ),
    },
    {
      key: "ownerName",
      label: "Owner",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const name = String(row.ownerName || "");
        if (!name) return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
        return (
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: "var(--accent-blue)", color: "#fff" }}
            >
              {name[0]}
            </div>
            <span className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{name.split(" ")[0]}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const status = String(row.status);
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: getStatusColor(status) }}
            />
            <span className="text-[12px] font-medium" style={{ color: getStatusColor(status), fontFamily: "var(--font-mono)" }}>
              {status}
            </span>
          </div>
        );
      },
    },
    {
      key: "_actions",
      label: "Actions",
      className: "w-16",
      render: (row: Record<string, unknown>) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Dropdown
            align="right"
            trigger={
              <button
                className="w-7 h-7 flex items-center justify-center transition-colors"
                style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                <MoreVertical size={14} />
              </button>
            }
            items={[
              {
                label: "Edit",
                icon: <Pencil size={14} />,
                onClick: () => openEdit(row as unknown as Client),
              },
              {
                label: "Transfer",
                icon: <ArrowRight size={14} />,
                onClick: () => setTransferTarget(row as unknown as Client),
              },
              {
                label: "Share",
                icon: <Share2 size={14} />,
                onClick: () => setShareTarget(row as unknown as Client),
              },
              {
                label: "Delete",
                icon: <Trash2 size={14} />,
                destructive: true,
                onClick: () => handleDelete(String(row.id)),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  if (!org) return null;

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1
              className="text-[20px] font-semibold tracking-[-0.02em]"
              style={{ color: "var(--text-primary)" }}
            >
              Clients
            </h1>
            <p
              className="mt-1"
              style={{
                fontSize: "10px",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              RELATIONSHIP TRACKING
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus size={14} /> Add Client
          </Button>
        </div>

        {/* Stage Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {clientTabs.map((tab) => {
            const count = tab.value === "All" ? clients.length : countByStatus(tab.value as Client["status"]);
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: isActive ? "var(--accent-blue)" : "transparent",
                  color: isActive ? "#fff" : "var(--text-secondary)",
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-tertiary)"; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                {tab.label}
                <span
                  className="text-[11px] px-1.5 py-0.5"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    background: isActive ? "rgba(255,255,255,0.2)" : "var(--bg-tertiary)",
                    color: isActive ? "#fff" : "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="mb-4">
          <Search value={search} onChange={setSearch} placeholder="Search clients..." className="max-w-md" />
        </div>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filtered as unknown as Record<string, unknown>[]}
              emptyMessage={activeTab === "All" ? "No clients found" : `No ${activeTab.toLowerCase()} clients`}
            />
          )}
        </Card>
      </div>

      {/* Add Client Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="Add Client" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Client Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company name" />
          <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Technology" />
          <Input label="Primary Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Full name" />
          <Input label="Contract Value ($)" type="number" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} placeholder="0" />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Client["status"] })}
            options={[
              { value: "Active", label: "Active" },
              { value: "At Risk", label: "At Risk" },
              { value: "Churned", label: "Churned" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleAdd}>Save</Button>
        </div>
      </Modal>

      {/* Edit Client Modal */}
      <Modal open={!!editingClient} onClose={() => { setEditingClient(null); resetForm(); }} title="Edit Client" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Client Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Input label="Primary Contact" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <Input label="Contract Value ($)" type="number" value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Client["status"] })}
            options={[
              { value: "Active", label: "Active" },
              { value: "At Risk", label: "At Risk" },
              { value: "Churned", label: "Churned" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { setEditingClient(null); resetForm(); }}>Cancel</Button>
          <Button onClick={handleSaveEdit}>Update</Button>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <TransferModal
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        recordType="client"
        recordId={transferTarget?.id || ""}
        recordLabel={transferTarget?.name || ""}
        currentOwnerName={transferTarget?.ownerName}
        onTransferred={fetchClients}
      />

      {/* Share Modal */}
      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        recordType="client"
        recordId={shareTarget?.id || ""}
        recordLabel={shareTarget?.name || ""}
        onShared={fetchClients}
      />
    </DashboardLayout>
  );
}
