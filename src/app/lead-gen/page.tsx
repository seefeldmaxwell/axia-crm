"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { generateId } from "@/lib/utils";
import { api, toSnake } from "@/lib/api";
import type { WebForm, WebFormField } from "@/lib/types";
import {
  Plus, Search, FileText, Trash2, Copy, Rocket,
  ToggleLeft, ToggleRight, Download, MapPin, Star,
} from "lucide-react";

/* ── Prospecting mock results ── */

interface ProspectResult {
  id: string;
  business: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  rating: number;
}

const mockProspects: ProspectResult[] = [
  { id: "pr1", business: "Apex Security Solutions", address: "123 Main St, Austin, TX 78701", phone: "(512) 555-0101", email: "info@apexsec.com", website: "apexsec.com", rating: 4.8 },
  { id: "pr2", business: "Meridian IT Services", address: "456 Oak Ave, Austin, TX 78702", phone: "(512) 555-0202", email: "hello@meridianit.com", website: "meridianit.com", rating: 4.5 },
  { id: "pr3", business: "CloudVault Inc", address: "789 Pine Blvd, Austin, TX 78703", phone: "(512) 555-0303", email: "sales@cloudvault.io", website: "cloudvault.io", rating: 4.2 },
  { id: "pr4", business: "NetShield Corp", address: "321 Elm Dr, Austin, TX 78704", phone: "(512) 555-0404", email: "contact@netshield.com", website: "netshield.com", rating: 4.6 },
  { id: "pr5", business: "DataFort Analytics", address: "654 Cedar Ln, Austin, TX 78705", phone: "(512) 555-0505", email: "info@datafort.ai", website: "datafort.ai", rating: 4.9 },
];

/* ── Default web forms ── */

const defaultForms: WebForm[] = [
  {
    id: "wf1",
    name: "Contact Us",
    fields: [
      { id: "f1", label: "Full Name", type: "text", required: true },
      { id: "f2", label: "Email", type: "email", required: true },
      { id: "f3", label: "Message", type: "textarea", required: false },
    ],
    status: "active",
    submissions: 142,
    conversionRate: 12.5,
    orgId: "org1",
    createdAt: "2025-11-10",
    updatedAt: "2026-01-15",
  },
  {
    id: "wf2",
    name: "Free Security Assessment",
    fields: [
      { id: "f4", label: "Company Name", type: "text", required: true },
      { id: "f5", label: "Work Email", type: "email", required: true },
      { id: "f6", label: "Phone", type: "phone", required: true },
    ],
    status: "active",
    submissions: 87,
    conversionRate: 18.3,
    orgId: "org1",
    createdAt: "2025-12-01",
    updatedAt: "2026-02-01",
  },
  {
    id: "wf3",
    name: "Newsletter Signup",
    fields: [
      { id: "f7", label: "Email Address", type: "email", required: true },
    ],
    status: "draft",
    submissions: 256,
    conversionRate: 8.7,
    orgId: "org1",
    createdAt: "2025-12-20",
    updatedAt: "2026-01-28",
  },
];

/* ── Embed code generator ── */

function generateEmbed(form: { name: string; fields: WebFormField[] }): string {
  const fieldHtml = form.fields
    .map((f) => {
      const req = f.required ? " required" : "";
      const name = f.label.toLowerCase().replace(/\s+/g, "_");
      if (f.type === "textarea") {
        return `  <label>${f.label}</label>\n  <textarea name="${name}"${req}></textarea>`;
      }
      if (f.type === "select") {
        return `  <label>${f.label}</label>\n  <select name="${name}"${req}>\n    <option value="">Select...</option>\n  </select>`;
      }
      return `  <label>${f.label}</label>\n  <input type="${f.type}" name="${name}"${req} />`;
    })
    .join("\n");

  return `<!-- Axia CRM Lead Form: ${form.name} -->\n<form action="https://api.axiacrm.com/forms/submit" method="POST">\n${fieldHtml}\n  <button type="submit">Submit</button>\n</form>`;
}

/* ── localStorage helpers ── */

function getStoredForms(): WebForm[] {
  if (typeof window === "undefined") return defaultForms;
  try {
    const raw = localStorage.getItem("axia_webforms");
    return raw ? JSON.parse(raw) : defaultForms;
  } catch {
    return defaultForms;
  }
}

function setStoredForms(forms: WebForm[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("axia_webforms", JSON.stringify(forms));
}

/* ── Component ── */

export default function LeadGenPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("prospecting");

  /* ── Prospecting state ── */
  const [bizType, setBizType] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("5mi");
  const [searching, setSearching] = useState(false);
  const [prospects, setProspects] = useState<ProspectResult[]>([]);
  const [imported, setImported] = useState<Set<string>>(new Set());

  /* ── Web Forms state ── */
  const [forms, setForms] = useState<WebForm[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newFormName, setNewFormName] = useState("");
  const [newFields, setNewFields] = useState<WebFormField[]>([
    { id: generateId(), label: "", type: "text", required: false },
  ]);
  const [embedCode, setEmbedCode] = useState<string | null>(null);

  useEffect(() => {
    setForms(getStoredForms());
  }, []);

  const saveForms = (updated: WebForm[]) => {
    setForms(updated);
    setStoredForms(updated);
  };

  /* ── Prospecting handlers ── */

  const handleSearch = () => {
    setSearching(true);
    setProspects([]);
    setTimeout(() => {
      setProspects(mockProspects);
      setSearching(false);
    }, 1500);
  };

  const handleImport = async (prospect: ProspectResult) => {
    try {
      await api.createLead(toSnake({
        firstName: prospect.business.split(" ")[0],
        lastName: prospect.business.split(" ").slice(1).join(" ") || "Lead",
        company: prospect.business,
        email: prospect.email,
        phone: prospect.phone,
        source: "Prospecting",
        rating: prospect.rating >= 4.5 ? "Hot" : prospect.rating >= 4.0 ? "Warm" : "Cold",
        status: "New",
        ownerId: user?.id || "",
        ownerName: user?.name || "",
        orgId: org?.id || "",
      }));
      setImported((prev) => new Set(prev).add(prospect.id));
      toast(`Imported "${prospect.business}" to leads`);
    } catch {
      toast("Failed to import lead");
    }
  };

  const handleImportAll = async () => {
    const toImport = prospects.filter((p) => !imported.has(p.id));
    for (const p of toImport) {
      await handleImport(p);
    }
    toast(`Imported ${toImport.length} businesses to leads`);
  };

  /* ── Web Forms handlers ── */

  const resetCreate = () => {
    setNewFormName("");
    setNewFields([{ id: generateId(), label: "", type: "text", required: false }]);
  };

  const addField = () => {
    setNewFields((prev) => [
      ...prev,
      { id: generateId(), label: "", type: "text", required: false },
    ]);
  };

  const updateField = (id: string, updates: Partial<WebFormField>) => {
    setNewFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const removeField = (id: string) => {
    setNewFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleCreateForm = () => {
    if (!newFormName.trim()) return;
    const validFields = newFields.filter((f) => f.label.trim());
    if (validFields.length === 0) return;
    const newForm: WebForm = {
      id: generateId(),
      name: newFormName,
      fields: validFields,
      status: "draft",
      submissions: 0,
      conversionRate: 0,
      orgId: org?.id || "",
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };
    saveForms([...forms, newForm]);
    setShowCreate(false);
    resetCreate();
    toast("Form created successfully");
  };

  const handleGenerateEmbed = (form: WebForm) => {
    setEmbedCode(generateEmbed(form));
  };

  const handleCopyEmbed = () => {
    if (embedCode) {
      navigator.clipboard.writeText(embedCode);
      toast("Embed code copied to clipboard");
    }
  };

  const handleDeleteForm = (id: string) => {
    saveForms(forms.filter((f) => f.id !== id));
    toast("Form deleted");
  };

  /* ── Prospecting columns ── */

  const prospectColumns = [
    {
      key: "business",
      label: "Business",
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-medium" style={{ color: "var(--text-primary)" }}>
          {String(row.business)}
        </span>
      ),
    },
    { key: "address", label: "Address" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    {
      key: "website",
      label: "Website",
      render: (row: Record<string, unknown>) => (
        <span style={{ color: "var(--accent-blue)" }}>{String(row.website)}</span>
      ),
    },
    {
      key: "rating",
      label: "Rating",
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-1">
          <Star size={12} style={{ color: "var(--accent-yellow)" }} fill="var(--accent-yellow)" />
          <span className="data-value">{String(row.rating)}</span>
        </div>
      ),
    },
    {
      key: "_actions",
      label: "Actions",
      render: (row: Record<string, unknown>) => {
        const isImported = imported.has(String(row.id));
        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={isImported ? "secondary" : "primary"}
              disabled={isImported}
              onClick={() => handleImport(row as unknown as ProspectResult)}
            >
              <Download size={12} />
              {isImported ? "Imported" : "Import to Leads"}
            </Button>
          </div>
        );
      },
      className: "w-40",
    },
  ];

  const tabs = [
    { id: "prospecting", label: "Prospecting" },
    { id: "webforms", label: "Web Forms" },
    { id: "landing", label: "Landing Pages" },
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
              Lead Generation
            </h1>
            <span className="data-label">INTELLIGENCE ENGINE</span>
          </div>
          {activeTab === "webforms" && (
            <Button onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Form
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-5" />

        {/* ── Prospecting Tab ── */}
        {activeTab === "prospecting" && (
          <div>
            {/* Search interface */}
            <Card className="mb-5">
              <CardContent className="pt-4">
                <div className="flex items-end gap-3 flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <Input
                      label="Business Type"
                      placeholder="e.g. IT Services, MSP"
                      value={bizType}
                      onChange={(e) => setBizType(e.target.value)}
                    />
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <Input
                      label="Location"
                      placeholder="City, State or ZIP"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>
                  <div className="w-[120px]">
                    <Select
                      label="Radius"
                      value={radius}
                      onChange={(e) => setRadius(e.target.value)}
                      options={[
                        { value: "1mi", label: "1 mile" },
                        { value: "5mi", label: "5 miles" },
                        { value: "10mi", label: "10 miles" },
                        { value: "25mi", label: "25 miles" },
                      ]}
                    />
                  </div>
                  <Button onClick={handleSearch} disabled={searching}>
                    <Search size={14} />
                    {searching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Loading state */}
            {searching && (
              <div className="flex items-center justify-center py-16">
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full animate-spin"
                    style={{
                      border: "2px solid var(--border-primary)",
                      borderTopColor: "var(--accent-blue)",
                    }}
                  />
                  <span
                    className="text-[14px] font-medium"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Searching...
                  </span>
                </div>
              </div>
            )}

            {/* Results */}
            {!searching && prospects.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} style={{ color: "var(--accent-blue)" }} />
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Found {prospects.length} businesses
                    </span>
                  </div>
                  <Button size="sm" variant="secondary" onClick={handleImportAll}>
                    <Download size={12} /> Import All
                  </Button>
                </div>
                <Card>
                  <DataTable
                    columns={prospectColumns}
                    data={prospects as unknown as Record<string, unknown>[]}
                    emptyMessage="No results found"
                  />
                </Card>
              </div>
            )}

            {/* Empty state */}
            {!searching && prospects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Search
                  size={48}
                  style={{ color: "var(--text-tertiary)", opacity: 0.3 }}
                />
                <p
                  className="text-[14px] mt-4"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Search for businesses to prospect
                </p>
                <p
                  className="text-[12px] mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Enter a business type and location to get started
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Web Forms Tab ── */}
        {activeTab === "webforms" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {forms.map((form) => (
              <Card key={form.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} style={{ color: "var(--accent-blue)" }} />
                      <h3
                        className="text-[14px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {form.name}
                      </h3>
                    </div>
                    <Badge variant={form.status === "active" ? "success" : "neutral"}>
                      {form.status === "active" ? "Active" : "Draft"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="data-label mb-1">Submissions</p>
                      <p
                        className="text-[18px] font-bold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {form.submissions}
                      </p>
                    </div>
                    <div>
                      <p className="data-label mb-1">Conversion Rate</p>
                      <p
                        className="text-[18px] font-bold"
                        style={{ color: "var(--accent-blue)" }}
                      >
                        {form.conversionRate}%
                      </p>
                    </div>
                  </div>
                  <p
                    className="text-[12px] mb-4"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Last modified: {form.updatedAt}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleGenerateEmbed(form)}
                    >
                      <Copy size={12} /> Embed Code
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteForm(form.id)}
                    >
                      <Trash2 size={12} /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {forms.length === 0 && (
              <div className="col-span-2 py-16 text-center">
                <FileText
                  size={40}
                  className="mx-auto mb-3"
                  style={{ color: "var(--text-tertiary)", opacity: 0.4 }}
                />
                <p
                  className="text-[14px]"
                  style={{ color: "var(--text-secondary)" }}
                >
                  No forms created yet
                </p>
                <p
                  className="text-[12px] mt-1"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Click &quot;Create Form&quot; to get started
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Landing Pages Tab ── */}
        {activeTab === "landing" && (
          <div className="flex flex-col items-center justify-center py-24">
            <Rocket
              size={48}
              style={{ color: "var(--text-tertiary)", opacity: 0.3 }}
            />
            <p
              className="text-[16px] font-medium mt-4"
              style={{ color: "var(--text-secondary)" }}
            >
              Coming Soon
            </p>
            <p
              className="text-[13px] mt-1"
              style={{ color: "var(--text-tertiary)" }}
            >
              Landing page builder is under development
            </p>
          </div>
        )}
      </div>

      {/* ── Create Form Modal ── */}
      <Modal
        open={showCreate}
        onClose={() => { setShowCreate(false); resetCreate(); }}
        title="Create Web Form"
        size="lg"
      >
        <div className="space-y-5">
          <Input
            label="Form Name"
            value={newFormName}
            onChange={(e) => setNewFormName(e.target.value)}
            placeholder="e.g. Contact Us"
          />

          <div>
            <p
              className="text-[12px] font-medium mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              Form Fields
            </p>
            <div className="space-y-3">
              {newFields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-start gap-3 p-3"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input
                      label="Field Label"
                      value={field.label}
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      placeholder="e.g. Full Name"
                    />
                    <Select
                      label="Type"
                      value={field.type}
                      onChange={(e) =>
                        updateField(field.id, { type: e.target.value as WebFormField["type"] })
                      }
                      options={[
                        { value: "text", label: "Text" },
                        { value: "email", label: "Email" },
                        { value: "phone", label: "Phone" },
                        { value: "textarea", label: "Textarea" },
                        { value: "select", label: "Select" },
                      ]}
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <button
                      onClick={() => updateField(field.id, { required: !field.required })}
                      className="flex items-center gap-1 text-[12px] transition-colors"
                      style={{ color: "var(--text-secondary)" }}
                      title={field.required ? "Required" : "Optional"}
                    >
                      {field.required ? (
                        <ToggleRight size={18} style={{ color: "var(--accent-blue)" }} />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                      <span className="hidden sm:inline">
                        {field.required ? "Req" : "Opt"}
                      </span>
                    </button>
                    {newFields.length > 1 && (
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-1 transition-colors"
                        style={{
                          color: "var(--text-secondary)",
                          borderRadius: "var(--radius-sm)",
                        }}
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
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button size="sm" variant="ghost" className="mt-3" onClick={addField}>
              <Plus size={12} /> Add Field
            </Button>
          </div>

          {/* Preview panel */}
          <div>
            <p
              className="text-[12px] font-medium mb-2"
              style={{ color: "var(--text-secondary)" }}
            >
              Preview
            </p>
            <div
              className="p-4 space-y-3"
              style={{
                background: "var(--bg-quaternary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {newFields.filter((f) => f.label.trim()).length === 0 ? (
                <p
                  className="text-[12px] text-center py-4"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  Add fields above to see a preview
                </p>
              ) : (
                newFields
                  .filter((f) => f.label.trim())
                  .map((f) => (
                    <div key={f.id}>
                      <label
                        className="block text-[12px] font-medium mb-1"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {f.label}
                        {f.required && (
                          <span style={{ color: "var(--accent-red)" }}> *</span>
                        )}
                      </label>
                      {f.type === "textarea" ? (
                        <div
                          className="w-full h-16 px-3 py-2 text-[13px]"
                          style={{
                            border: "1px solid var(--border-primary)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--bg-secondary)",
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-9 px-3 py-2 text-[13px]"
                          style={{
                            border: "1px solid var(--border-primary)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--bg-secondary)",
                          }}
                        />
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              const validFields = newFields.filter((f) => f.label.trim());
              if (newFormName.trim() && validFields.length > 0) {
                setEmbedCode(generateEmbed({ name: newFormName, fields: validFields }));
              }
            }}
          >
            <Copy size={12} /> Generate Embed Code
          </Button>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => { setShowCreate(false); resetCreate(); }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateForm}>Create Form</Button>
          </div>
        </div>
      </Modal>

      {/* ── Embed Code Modal ── */}
      <Modal
        open={!!embedCode}
        onClose={() => setEmbedCode(null)}
        title="Embed Code"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            Copy the HTML snippet below and paste it into your website to embed
            this lead capture form.
          </p>
          <pre
            className="overflow-x-auto p-4 text-[12px]"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-sm)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-mono)",
            }}
          >
            <code>{embedCode}</code>
          </pre>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setEmbedCode(null)}>
            Close
          </Button>
          <Button onClick={handleCopyEmbed}>
            <Copy size={14} /> Copy to Clipboard
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
