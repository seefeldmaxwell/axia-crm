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
import { api, mapVendor, toSnake } from "@/lib/api";
import { Vendor } from "@/lib/types";
import { StatusBadge, VENDOR_STATUSES } from "@/components/ui/status-badge";
import { Plus, Pencil, Trash2, Building2, MoreVertical, ArrowRight, Share2, Loader2 } from "lucide-react";

function getStatusColor(status: string): string {
  if (status === "Active") return "var(--accent-green)";
  if (status === "Pending") return "var(--accent-yellow)";
  return "var(--text-tertiary)";
}

export default function VendorsPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"All" | Vendor["status"]>("All");

  // Transfer & Share
  const [transferTarget, setTransferTarget] = useState<Vendor | null>(null);
  const [shareTarget, setShareTarget] = useState<Vendor | null>(null);

  const [form, setForm] = useState({
    name: "",
    contact: "",
    email: "",
    phone: "",
    category: "",
    status: "Pending" as Vendor["status"],
  });

  const resetForm = () =>
    setForm({ name: "", contact: "", email: "", phone: "", category: "", status: "Pending" });

  const fetchVendors = useCallback(async () => {
    if (!org) return;
    try {
      const raw = await api.getVendors();
      setVendors(raw.map(mapVendor));
    } catch {
      toast("Failed to load vendors");
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const tabs: { label: string; value: "All" | Vendor["status"] }[] = [
    { label: "All", value: "All" },
    { label: "Active", value: "Active" },
    { label: "Pending", value: "Pending" },
    { label: "Inactive", value: "Inactive" },
  ];

  const countByStatus = (s: Vendor["status"]) => vendors.filter((v) => v.status === s).length;

  const filtered = vendors.filter((v) => {
    const matchesTab = activeTab === "All" || v.status === activeTab;
    if (!search) return matchesTab;
    const s = search.toLowerCase();
    return matchesTab && (
      v.name.toLowerCase().includes(s) ||
      v.contact.toLowerCase().includes(s) ||
      v.email.toLowerCase().includes(s) ||
      v.category.toLowerCase().includes(s)
    );
  });

  const handleAdd = async () => {
    if (!org || !form.name.trim()) return;
    try {
      await api.createVendor(toSnake({
        name: form.name,
        contact: form.contact,
        email: form.email,
        phone: form.phone,
        category: form.category,
        status: form.status,
        ownerId: user?.id || "",
        ownerName: user?.name || "",
        orgId: org.id,
      }));
      setShowAdd(false);
      resetForm();
      await fetchVendors();
      toast("Vendor added successfully");
    } catch {
      toast("Failed to add vendor");
    }
  };

  const openEdit = (vendor: Vendor) => {
    setForm({
      name: vendor.name,
      contact: vendor.contact,
      email: vendor.email,
      phone: vendor.phone,
      category: vendor.category,
      status: vendor.status,
    });
    setEditingVendor(vendor);
  };

  const handleSaveEdit = async () => {
    if (!editingVendor) return;
    try {
      await api.updateVendor(editingVendor.id, toSnake({
        name: form.name,
        contact: form.contact,
        email: form.email,
        phone: form.phone,
        category: form.category,
        status: form.status,
      }));
      setEditingVendor(null);
      resetForm();
      await fetchVendors();
      toast("Vendor updated");
    } catch {
      toast("Failed to update vendor");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteVendor(id);
      await fetchVendors();
      toast("Vendor deleted");
    } catch {
      toast("Failed to delete vendor");
    }
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-2">
          <Building2 size={15} className="shrink-0" style={{ color: "var(--accent-blue)" }} />
          <span className="font-medium" style={{ color: "var(--text-primary)" }}>
            {String(row.name)}
          </span>
        </div>
      ),
    },
    { key: "contact", label: "Contact", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "phone", label: "Phone" },
    { key: "category", label: "Category", sortable: true },
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
      render: (row: Record<string, unknown>) => (
        <StatusBadge
          value={String(row.status)}
          options={VENDOR_STATUSES}
          onChange={async (newStatus) => {
            try {
              await api.updateVendor(String(row.id), toSnake({ status: newStatus }));
              await fetchVendors();
              toast(`Status updated to ${newStatus}`);
            } catch {
              toast("Failed to update status");
            }
          }}
        />
      ),
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
                onClick: () => openEdit(row as unknown as Vendor),
              },
              {
                label: "Transfer",
                icon: <ArrowRight size={14} />,
                onClick: () => setTransferTarget(row as unknown as Vendor),
              },
              {
                label: "Share",
                icon: <Share2 size={14} />,
                onClick: () => setShareTarget(row as unknown as Vendor),
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
              Vendors
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
              SUPPLIER MANAGEMENT
            </p>
          </div>
          <Button onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus size={14} /> Add Vendor
          </Button>
        </div>

        {/* Stage Tabs */}
        <div className="flex items-center gap-1 mb-4">
          {tabs.map((tab) => {
            const count = tab.value === "All" ? vendors.length : countByStatus(tab.value as Vendor["status"]);
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
          <Search value={search} onChange={setSearch} placeholder="Search vendors..." className="max-w-md" />
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
              emptyMessage={activeTab === "All" ? "No vendors found" : `No ${activeTab.toLowerCase()} vendors`}
            />
          )}
        </Card>
      </div>

      {/* Add Vendor Modal */}
      <Modal open={showAdd} onClose={() => { setShowAdd(false); resetForm(); }} title="Add Vendor" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vendor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Company name" />
          <Input label="Contact Person" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Full name" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 000-0000" />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Cloud Services" />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Vendor["status"] })}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
              { value: "Pending", label: "Pending" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { setShowAdd(false); resetForm(); }}>Cancel</Button>
          <Button onClick={handleAdd}>Save</Button>
        </div>
      </Modal>

      {/* Edit Vendor Modal */}
      <Modal open={!!editingVendor} onClose={() => { setEditingVendor(null); resetForm(); }} title="Edit Vendor" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <Input label="Vendor Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Contact Person" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as Vendor["status"] })}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" },
              { value: "Pending", label: "Pending" },
            ]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => { setEditingVendor(null); resetForm(); }}>Cancel</Button>
          <Button onClick={handleSaveEdit}>Update</Button>
        </div>
      </Modal>

      {/* Transfer Modal */}
      <TransferModal
        open={!!transferTarget}
        onClose={() => setTransferTarget(null)}
        recordType="vendor"
        recordId={transferTarget?.id || ""}
        recordLabel={transferTarget?.name || ""}
        currentOwnerName={transferTarget?.ownerName}
        onTransferred={fetchVendors}
      />

      {/* Share Modal */}
      <ShareModal
        open={!!shareTarget}
        onClose={() => setShareTarget(null)}
        recordType="vendor"
        recordId={shareTarget?.id || ""}
        recordLabel={shareTarget?.name || ""}
        onShared={fetchVendors}
      />
    </DashboardLayout>
  );
}
