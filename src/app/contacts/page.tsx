"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { getContacts, setContacts } from "@/lib/store";
import { generateId } from "@/lib/utils";
import type { Contact } from "@/lib/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

export default function ContactsPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const contacts = useMemo(() => {
    if (!org) return [];
    return getContacts(org.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [org, refreshKey]);

  const filtered = useMemo(() => {
    if (!search) return contacts;
    const s = search.toLowerCase();
    return contacts.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(s) ||
        c.email.toLowerCase().includes(s) ||
        c.phone.toLowerCase().includes(s) ||
        c.accountName.toLowerCase().includes(s)
    );
  }, [contacts, search]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    phone: "",
    accountName: "",
  });

  const resetForm = () =>
    setForm({ firstName: "", lastName: "", title: "", email: "", phone: "", accountName: "" });

  const handleCreate = () => {
    if (!org || !form.firstName.trim() || !form.lastName.trim()) return;
    const now = new Date().toISOString().split("T")[0];
    const newContact: Contact = {
      id: generateId(),
      firstName: form.firstName,
      lastName: form.lastName,
      title: form.title,
      accountId: "",
      accountName: form.accountName,
      phone: form.phone,
      email: form.email,
      mailingAddress: "",
      ownerId: user?.id || "1",
      ownerName: user?.name || "Demo User",
      orgId: org.id,
      createdAt: now,
      updatedAt: now,
    };
    const all = (() => {
      try {
        const raw = localStorage.getItem("axia_contacts");
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    })();
    setContacts([...all, newContact]);
    setShowNew(false);
    resetForm();
    setRefreshKey((k) => k + 1);
    toast("Contact created successfully");
  };

  const handleEdit = (contact: Contact) => {
    setEditId(contact.id);
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      title: contact.title,
      email: contact.email,
      phone: contact.phone,
      accountName: contact.accountName,
    });
  };

  const handleSaveEdit = () => {
    if (!editId) return;
    const all = (() => {
      try {
        const raw = localStorage.getItem("axia_contacts");
        return raw ? (JSON.parse(raw) as Contact[]) : [];
      } catch {
        return [] as Contact[];
      }
    })();
    const updated = all.map((c) =>
      c.id === editId
        ? {
            ...c,
            firstName: form.firstName,
            lastName: form.lastName,
            title: form.title,
            email: form.email,
            phone: form.phone,
            accountName: form.accountName,
            updatedAt: new Date().toISOString().split("T")[0],
          }
        : c
    );
    setContacts(updated);
    setEditId(null);
    resetForm();
    setRefreshKey((k) => k + 1);
    toast("Contact updated");
  };

  const handleDelete = (id: string) => {
    const all = (() => {
      try {
        const raw = localStorage.getItem("axia_contacts");
        return raw ? (JSON.parse(raw) as Contact[]) : [];
      } catch {
        return [] as Contact[];
      }
    })();
    setContacts(all.filter((c) => c.id !== id));
    setRefreshKey((k) => k + 1);
    toast("Contact deleted");
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const c = row as unknown as Contact;
        return (
          <div className="flex items-center gap-2">
            <Avatar name={`${c.firstName} ${c.lastName}`} size="sm" />
            <span className="font-medium" style={{ color: "var(--accent-blue)" }}>
              {c.firstName} {c.lastName}
            </span>
          </div>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ color: "var(--text-primary)" }}>{String(row.email)}</span>
      ),
    },
    { key: "phone", label: "Phone" },
    {
      key: "accountName",
      label: "Company",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span style={{ color: "var(--text-primary)" }}>{String(row.accountName)}</span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="data-value" style={{ fontSize: "12px" }}>
          {String(row.createdAt)}
        </span>
      ),
    },
    {
      key: "_actions",
      label: "Actions",
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleEdit(row as unknown as Contact)}
            className="p-1.5 transition-colors"
            style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text-primary)";
              e.currentTarget.style.background = "var(--bg-tertiary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => handleDelete(String(row.id))}
            className="p-1.5 transition-colors"
            style={{ color: "var(--text-secondary)", borderRadius: "var(--radius-sm)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--accent-red)";
              e.currentTarget.style.background = "var(--accent-red-muted)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text-secondary)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
      className: "w-24",
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
              className="text-[20px] font-bold tracking-[-0.02em]"
              style={{ color: "var(--text-primary)" }}
            >
              Contacts
            </h1>
            <span className="data-label">CONTACT DATABASE</span>
          </div>
          <div className="flex items-center gap-3">
            <Search
              value={search}
              onChange={setSearch}
              placeholder="Search contacts..."
              className="w-64"
            />
            <Button onClick={() => setShowNew(true)}>
              <Plus size={14} /> Add Contact
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <DataTable
            columns={columns}
            data={
              filtered.map((c) => ({
                ...c,
                name: `${c.firstName} ${c.lastName}`,
              })) as unknown as Record<string, unknown>[]
            }
            emptyMessage="No contacts found"
          />
        </Card>
      </div>

      {/* Add Contact Modal */}
      <Modal
        open={showNew}
        onClose={() => { setShowNew(false); resetForm(); }}
        title="Add Contact"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="First name"
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Last name"
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. VP of Sales"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@company.com"
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(555) 000-0000"
          />
          <Input
            label="Company"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            placeholder="Company name"
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => { setShowNew(false); resetForm(); }}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate}>Save</Button>
        </div>
      </Modal>

      {/* Edit Contact Modal */}
      <Modal
        open={!!editId}
        onClose={() => { setEditId(null); resetForm(); }}
        title="Edit Contact"
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            label="Last Name"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <Input
            label="Company"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => { setEditId(null); resetForm(); }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveEdit}>Update</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
