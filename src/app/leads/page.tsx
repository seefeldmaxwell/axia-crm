"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Tabs } from "@/components/ui/tabs";
import { Dropdown } from "@/components/ui/dropdown";
import { useToast } from "@/components/ui/toast";
import { TransferModal } from "@/components/ui/transfer-modal";
import { ShareModal } from "@/components/ui/share-modal";
import { api, mapLead, toSnake } from "@/lib/api";
import { Lead } from "@/lib/types";
import { Plus, Upload, Pencil, Trash2, UserPlus, MoreVertical, ArrowRight, Share2, Loader2 } from "lucide-react";

type TabId = "ALL" | "COLD" | "WARM" | "HOT" | "CONVERTED";

function getTempColor(rating: string): string {
  if (rating === "Cold") return "var(--accent-blue)";
  if (rating === "Warm") return "var(--accent-yellow)";
  if (rating === "Hot") return "var(--accent-red)";
  return "var(--text-tertiary)";
}

export default function LeadsPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("ALL");
  const [showNew, setShowNew] = useState(false);
  const [showCSV, setShowCSV] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Transfer & Share state
  const [transferTarget, setTransferTarget] = useState<Lead | null>(null);
  const [shareTarget, setShareTarget] = useState<Lead | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    company: "",
    email: "",
    phone: "",
    source: "Website",
    rating: "Cold" as "Hot" | "Warm" | "Cold",
    industry: "",
  });

  const resetForm = () =>
    setForm({ firstName: "", lastName: "", company: "", email: "", phone: "", source: "Website", rating: "Cold", industry: "" });

  const fetchLeads = useCallback(async () => {
    if (!org) return;
    try {
      const raw = await api.getLeads();
      setAllLeads(raw.map(mapLead));
    } catch (e: any) {
      toast("Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const filtered = useMemo(() => {
    let result = allLeads;

    if (activeTab === "COLD") result = result.filter((l) => l.rating === "Cold");
    else if (activeTab === "WARM") result = result.filter((l) => l.rating === "Warm");
    else if (activeTab === "HOT") result = result.filter((l) => l.rating === "Hot");
    else if (activeTab === "CONVERTED") result = result.filter((l) => l.status !== "New");

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (l) =>
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(s) ||
          l.company.toLowerCase().includes(s) ||
          l.email.toLowerCase().includes(s) ||
          l.phone.toLowerCase().includes(s) ||
          l.source.toLowerCase().includes(s)
      );
    }

    return result;
  }, [allLeads, activeTab, search]);

  const counts = useMemo(() => {
    const c = { ALL: allLeads.length, COLD: 0, WARM: 0, HOT: 0, CONVERTED: 0 };
    allLeads.forEach((l) => {
      if (l.rating === "Cold") c.COLD++;
      else if (l.rating === "Warm") c.WARM++;
      else if (l.rating === "Hot") c.HOT++;
      if (l.status !== "New") c.CONVERTED++;
    });
    return c;
  }, [allLeads]);

  const handleCreate = async () => {
    if (!org || !user) return;
    try {
      const statusMap: Record<string, string> = { Cold: "New", Warm: "Contacted", Hot: "Qualified" };
      await api.createLead(toSnake({
        firstName: form.firstName,
        lastName: form.lastName,
        company: form.company,
        email: form.email,
        phone: form.phone,
        source: form.source,
        rating: form.rating,
        industry: form.industry,
        status: statusMap[form.rating] || "New",
        ownerId: user.id,
        ownerName: user.name,
        orgId: org.id,
      }));
      setShowNew(false);
      resetForm();
      await fetchLeads();
      toast("Lead created successfully");
    } catch {
      toast("Failed to create lead");
    }
  };

  const handleUpdate = async () => {
    if (!editingLead) return;
    try {
      await api.updateLead(editingLead.id, toSnake({
        firstName: form.firstName,
        lastName: form.lastName,
        company: form.company,
        email: form.email,
        phone: form.phone,
        source: form.source,
        rating: form.rating,
        industry: form.industry,
      }));
      setEditingLead(null);
      resetForm();
      await fetchLeads();
      toast("Lead updated");
    } catch {
      toast("Failed to update lead");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteLead(id);
      await fetchLeads();
      toast("Lead deleted");
    } catch {
      toast("Failed to delete lead");
    }
  };

  const openEdit = (lead: Lead) => {
    setForm({
      firstName: lead.firstName,
      lastName: lead.lastName,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      rating: lead.rating,
      industry: lead.industry,
    });
    setEditingLead(lead);
  };

  const tabs = [
    { id: "ALL", label: `All (${counts.ALL})` },
    { id: "COLD", label: `Cold (${counts.COLD})` },
    { id: "WARM", label: `Warm (${counts.WARM})` },
    { id: "HOT", label: `Hot (${counts.HOT})` },
    { id: "CONVERTED", label: `Converted (${counts.CONVERTED})` },
  ];

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <UserPlus size={15} className="shrink-0" style={{ color: "var(--accent-blue)" }} />
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {String(row.firstName)} {String(row.lastName)}
          </span>
        </div>
      ),
    },
    { key: "company", label: "Company", sortable: true },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email", sortable: true },
    { key: "source", label: "Source", sortable: true },
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
      key: "rating",
      label: "Temp",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const rating = String(row.rating);
        return (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: getTempColor(rating) }}
            />
            <span
              className="text-[12px] font-medium"
              style={{ color: getTempColor(rating), fontFamily: "var(--font-mono)" }}
            >
              {rating.toUpperCase()}
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
                onClick: () => openEdit(row as unknown as Lead),
              },
              {
                label: "Transfer",
                icon: <ArrowRight size={14} />,
                onClick: () => setTransferTarget(row as unknown as Lead),
              },
              {
                label: "Share",
                icon: <Share2 size={14} />,
                onClick: () => setShareTarget(row as unknown as Lead),
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
              Leads
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
              PIPELINE MANAGEMENT
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowCSV(true)}>
              <Upload size={14} /> Upload CSV
            </Button>
            <Button onClick={() => { resetForm(); setShowNew(true); }}>
              <Plus size={14} /> Add Lead
            </Button>
          </div>
        </div>

        {/* Temperature tabs */}
        <Tabs
          tabs={tabs}
          active={activeTab}
          onChange={(id) => setActiveTab(id as TabId)}
          className="mb-4"
        />

        {/* Search */}
        <div className="mb-4">
          <Search value={search} onChange={setSearch} placeholder="Search leads..." className="max-w-md" />
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
              data={filtered.map((l) => ({ ...l, name: `${l.firstName} ${l.lastName}` })) as unknown as Record<string, unknown>[]}
              emptyMessage="No leads in this category"
            />
          )}
        </Card>
      </div>

      {/* Add Lead Modal */}
      <Modal open={showNew} onClose={() => { setShowNew(false); resetForm(); }} title="Add Lead" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="First name" />
          <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="Last name" />
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" />
          <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. Technology" />
          <Select
            label="Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            options={[
              { value: "Website", label: "Website" },
              { value: "Referral", label: "Referral" },
              { value: "LinkedIn", label: "LinkedIn" },
              { value: "Cold Call", label: "Cold Call" },
              { value: "Trade Show", label: "Trade Show" },
              { value: "Other", label: "Other" },
            ]}
          />
          <Select
            label="Temperature"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value as "Hot" | "Warm" | "Cold" })}
            options={[
              { value: "Cold", label: "Cold" },
              { value: "Warm", label: "Warm" },
              { value: "Hot", label: "Hot" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { setShowNew(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleCreate}>Save</Button>
        </div>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal open={!!editingLead} onClose={() => { setEditingLead(null); resetForm(); }} title="Edit Lead" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last Name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Industry" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
          <Select
            label="Source"
            value={form.source}
            onChange={(e) => setForm({ ...form, source: e.target.value })}
            options={[
              { value: "Website", label: "Website" },
              { value: "Referral", label: "Referral" },
              { value: "LinkedIn", label: "LinkedIn" },
              { value: "Cold Call", label: "Cold Call" },
              { value: "Trade Show", label: "Trade Show" },
              { value: "Other", label: "Other" },
            ]}
          />
          <Select
            label="Temperature"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value as "Hot" | "Warm" | "Cold" })}
            options={[
              { value: "Cold", label: "Cold" },
              { value: "Warm", label: "Warm" },
              { value: "Hot", label: "Hot" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { setEditingLead(null); resetForm(); }}>Cancel</Button>
          <Button onClick={handleUpdate}>Save Changes</Button>
        </div>
      </Modal>

      {/* CSV Upload Modal */}
      <Modal open={showCSV} onClose={() => setShowCSV(false)} title="Upload CSV" size="md">
        <div className="space-y-4">
          <div
            className="p-8 text-center transition-colors"
            style={{
              border: "2px dashed var(--border-primary)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <Upload size={32} className="mx-auto mb-3" style={{ color: "var(--text-tertiary)" }} />
            <p className="text-[14px] mb-1" style={{ color: "var(--text-primary)" }}>
              Drag & drop your CSV file here
            </p>
            <p className="text-[12px] mb-3" style={{ color: "var(--text-tertiary)" }}>
              or click to browse
            </p>
            <input type="file" accept=".csv" className="hidden" id="csv-upload" />
            <Button variant="secondary" size="sm" onClick={() => document.getElementById("csv-upload")?.click()}>
              Choose File
            </Button>
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-tertiary)" }}>
            CSV should include columns: First Name, Last Name, Company, Email, Phone, Source
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowCSV(false)}>Cancel</Button>
          <Button disabled>Import</Button>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <TransferModal
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        recordType="lead"
        recordId={transferTarget?.id || ""}
        recordLabel={transferTarget ? `${transferTarget.firstName} ${transferTarget.lastName}` : ""}
        currentOwnerName={transferTarget?.ownerName}
        onTransferred={fetchLeads}
      />

      {/* Share Modal */}
      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        recordType="lead"
        recordId={shareTarget?.id || ""}
        recordLabel={shareTarget ? `${shareTarget.firstName} ${shareTarget.lastName}` : ""}
        onShared={fetchLeads}
      />
    </DashboardLayout>
  );
}
