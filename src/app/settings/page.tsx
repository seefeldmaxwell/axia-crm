"use client";

import { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tabs } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth";
import { api, mapIntegration } from "@/lib/api";
import {
  Upload,
  Plus,
  Phone,
  Check,
  Zap,
  Database,
  UserPlus,
  Loader2,
} from "lucide-react";

// ── Toggle Switch ──

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 transition-colors"
      style={{
        backgroundColor: checked
          ? "var(--accent-blue)"
          : "var(--text-tertiary)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 bg-white transition-transform mt-[2px]"
        style={{
          borderRadius: "var(--radius-sm)",
          transform: checked ? "translateX(18px)" : "translateX(2px)",
        }}
      />
    </button>
  );
}

// ── Progress Bar ──

function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div
      className="w-full h-2"
      style={{
        backgroundColor: "var(--bg-quaternary)",
        borderRadius: "var(--radius-sm)",
      }}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${pct}%`,
          backgroundColor: color,
          borderRadius: "var(--radius-sm)",
        }}
      />
    </div>
  );
}

// ── Google SVG Icon ──

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.04 24.04 0 0 0 0 21.56l7.98-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

// ── Microsoft SVG Icon ──

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21">
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

// ── Static descriptions for integration types ──

const INTEGRATION_DESCRIPTIONS: Record<string, string> = {
  google: "Sync contacts, calendar, and email with Google.",
  microsoft: "Connect Outlook, Teams, and OneDrive.",
  mailgun: "Transactional email delivery and tracking.",
  "data-intel": "Enrich leads and contacts with external data.",
};

function getIntegrationDescription(nameOrType: string): string {
  const key = nameOrType.toLowerCase();
  for (const [k, desc] of Object.entries(INTEGRATION_DESCRIPTIONS)) {
    if (key.includes(k)) return desc;
  }
  return `Connect with ${nameOrType}.`;
}

function getIntegrationIcon(nameOrType: string): string {
  const key = nameOrType.toLowerCase();
  if (key.includes("google")) return "google";
  if (key.includes("microsoft") || key.includes("outlook") || key.includes("365")) return "microsoft";
  if (key.includes("mailgun") || key.includes("mail")) return "mailgun";
  if (key.includes("data") || key.includes("intel")) return "data-intel";
  return "default";
}

// ══════════════════════════════════════════════════════════════
// Main Settings Page
// ══════════════════════════════════════════════════════════════

export default function SettingsPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");

  // ── General state ──
  const [orgName, setOrgName] = useState(org?.name ?? "");
  const [timezone, setTimezone] = useState(
    org?.timezone ?? "America/New_York"
  );
  const [savingOrg, setSavingOrg] = useState(false);

  // ── Team state ──
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("rep");
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  // ── Phone state ──
  const [callerId, setCallerId] = useState(true);
  const [callRecording, setCallRecording] = useState(true);

  // ── Integrations state ──
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const tabs = [
    { id: "general", label: "General" },
    { id: "team", label: "Team" },
    { id: "phone", label: "Phone" },
    { id: "integrations", label: "Integrations" },
    { id: "billing", label: "Billing" },
  ];

  // ── Fetch team members ──
  const fetchMembers = useCallback(async () => {
    try {
      setMembersLoading(true);
      const raw = await api.getOrgUsers();
      const mapped = (Array.isArray(raw) ? raw : []).map((u: any) => ({
        id: u.id,
        name: u.name || u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email,
        email: u.email,
        role: u.role || "rep",
        joined: u.created_at || u.joined || "",
      }));
      setMembers(mapped);
    } catch (err) {
      console.error("Failed to fetch team members:", err);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  // ── Fetch integrations ──
  const fetchIntegrations = useCallback(async () => {
    try {
      setIntegrationsLoading(true);
      const raw = await api.getIntegrations();
      const mapped = (Array.isArray(raw) ? raw : []).map((r: any) => {
        const m = mapIntegration(r);
        return {
          ...m,
          description: getIntegrationDescription(m.type || m.name),
          icon: getIntegrationIcon(m.type || m.name),
        };
      });
      setIntegrations(mapped);
    } catch (err) {
      console.error("Failed to fetch integrations:", err);
    } finally {
      setIntegrationsLoading(false);
    }
  }, []);

  // ── Fetch org details to populate general form ──
  const fetchOrg = useCallback(async () => {
    try {
      const orgData = await api.getOrg();
      if (orgData) {
        if (orgData.name) setOrgName(orgData.name);
        if (orgData.timezone) setTimezone(orgData.timezone);
      }
    } catch (err) {
      console.error("Failed to fetch org details:", err);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
    fetchIntegrations();
    fetchOrg();
  }, [fetchMembers, fetchIntegrations, fetchOrg]);

  if (!user || !org) return null;

  const roleVariant = (
    role: string
  ): "error" | "warning" | "info" | "neutral" => {
    switch (role) {
      case "admin":
        return "error";
      case "manager":
        return "warning";
      case "rep":
        return "info";
      default:
        return "neutral";
    }
  };

  const handleToggleIntegration = async (id: string) => {
    const integ = integrations.find((i) => i.id === id);
    if (!integ) return;
    const next = !integ.enabled;
    try {
      setTogglingId(id);
      await api.updateIntegration(id, { enabled: next });
      toast(
        `${integ.name} ${next ? "connected" : "disconnected"}`,
        next ? "success" : "info"
      );
      await fetchIntegrations();
    } catch (err) {
      console.error("Failed to toggle integration:", err);
      toast("Failed to update integration", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const handleRoleChange = (memberId: string, newRole: string) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    );
    toast("Role updated", "success");
  };

  const handleSaveOrg = async () => {
    try {
      setSavingOrg(true);
      await api.updateOrg({ name: orgName, timezone });
      toast("Settings saved", "success");
    } catch (err) {
      console.error("Failed to save org settings:", err);
      toast("Failed to save settings", "error");
    } finally {
      setSavingOrg(false);
    }
  };

  const renderIntegrationIcon = (icon: string) => {
    switch (icon) {
      case "google":
        return <GoogleIcon />;
      case "microsoft":
        return <MicrosoftIcon />;
      case "mailgun":
        return (
          <div
            className="w-5 h-5 flex items-center justify-center"
            style={{ color: "var(--accent-yellow)" }}
          >
            <Zap size={20} />
          </div>
        );
      case "data-intel":
        return (
          <div
            className="w-5 h-5 flex items-center justify-center"
            style={{ color: "var(--accent-purple)" }}
          >
            <Database size={20} />
          </div>
        );
      default:
        return (
          <div
            className="w-5 h-5 flex items-center justify-center"
            style={{ color: "var(--accent-blue)" }}
          >
            <Zap size={20} />
          </div>
        );
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-[20px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Settings
          </h1>
          <span className="data-label">SYSTEM CONFIGURATION</span>
        </div>

        {/* Tab bar */}
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

        {/* ──────────────────────── GENERAL ──────────────────────── */}
        {activeTab === "general" && (
          <Card>
            <CardHeader>
              <h2
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Organization Details
              </h2>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                label="Organization Name"
                id="org-name"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />

              <Select
                label="Default Timezone"
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                options={[
                  {
                    value: "America/New_York",
                    label: "Eastern Time (US & Canada)",
                  },
                  {
                    value: "America/Chicago",
                    label: "Central Time (US & Canada)",
                  },
                  {
                    value: "America/Denver",
                    label: "Mountain Time (US & Canada)",
                  },
                  {
                    value: "America/Los_Angeles",
                    label: "Pacific Time (US & Canada)",
                  },
                  { value: "Europe/London", label: "London (GMT)" },
                  { value: "Europe/Berlin", label: "Berlin (CET)" },
                  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
                  { value: "Australia/Sydney", label: "Sydney (AEST)" },
                ]}
              />

              {/* Logo upload area */}
              <div>
                <label
                  className="block text-[12px] font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Organization Logo
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 flex items-center justify-center text-white text-[20px] font-bold"
                    style={{
                      backgroundColor: "var(--accent-blue)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    {org.name.charAt(0)}
                  </div>
                  <div>
                    <div
                      className="w-48 h-20 flex flex-col items-center justify-center cursor-pointer transition-colors"
                      style={{
                        border: "2px dashed var(--border-primary)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--text-tertiary)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--accent-blue)";
                        e.currentTarget.style.color = "var(--accent-blue)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--border-primary)";
                        e.currentTarget.style.color = "var(--text-tertiary)";
                      }}
                    >
                      <Upload size={16} />
                      <span className="text-[11px] mt-1">
                        Drop logo or click
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  onClick={handleSaveOrg}
                  disabled={savingOrg}
                >
                  {savingOrg && (
                    <Loader2 size={14} className="animate-spin mr-1.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ──────────────────────── TEAM ──────────────────────── */}
        {activeTab === "team" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2
                className="text-[15px] font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Team Members
              </h2>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowInvite(true)}
              >
                <UserPlus size={14} />
                + Invite Member
              </Button>
            </div>

            {/* Team table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-primary)",
                      }}
                    >
                      <th className="px-4 py-3 text-left">NAME</th>
                      <th className="px-4 py-3 text-left">EMAIL</th>
                      <th className="px-4 py-3 text-left">ROLE</th>
                      <th className="px-4 py-3 text-left">JOINED</th>
                      <th className="px-4 py-3 text-left">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersLoading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <div className="flex items-center justify-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                            <Loader2 size={18} className="animate-spin" />
                            <span className="text-[13px]">Loading team members...</span>
                          </div>
                        </td>
                      </tr>
                    ) : members.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center">
                          <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                            No team members found.
                          </span>
                        </td>
                      </tr>
                    ) : (
                      members.map((m) => (
                        <tr key={m.id}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={m.name} size="sm" />
                              <span
                                className="text-[13px] font-medium"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {m.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[13px]"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {m.email}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={roleVariant(m.role)}>
                              {m.role}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="text-[13px] data-value"
                              style={{ color: "var(--text-secondary)" }}
                            >
                              {m.joined}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={m.role}
                              onChange={(e) =>
                                handleRoleChange(m.id, e.target.value)
                              }
                              className="text-[12px] px-2 py-1"
                              style={{
                                backgroundColor: "var(--bg-quaternary)",
                                border: "1px solid var(--border-primary)",
                                borderRadius: "var(--radius-sm)",
                                color: "var(--text-primary)",
                              }}
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="rep">Rep</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Invite modal */}
            <Modal
              open={showInvite}
              onClose={() => setShowInvite(false)}
              title="Invite Team Member"
              size="sm"
            >
              <div className="space-y-4">
                <Input
                  label="Email Address"
                  id="invite-email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
                <Select
                  label="Role"
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "manager", label: "Manager" },
                    { value: "rep", label: "Rep" },
                    { value: "viewer", label: "Viewer" },
                  ]}
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowInvite(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={async () => {
                      if (!inviteEmail) {
                        toast("Please enter an email address", "error");
                        return;
                      }
                      try {
                        await api.inviteUser(inviteEmail);
                        toast(
                          `Invitation sent to ${inviteEmail}`,
                          "success"
                        );
                        setInviteEmail("");
                        setInviteRole("rep");
                        setShowInvite(false);
                      } catch {
                        toast("Failed to send invitation", "error");
                      }
                    }}
                  >
                    Send Invitation
                  </Button>
                </div>
              </div>
            </Modal>
          </div>
        )}

        {/* ──────────────────────── PHONE ──────────────────────── */}
        {activeTab === "phone" && (
          <div className="space-y-5">
            {/* Current number */}
            <Card>
              <CardHeader>
                <h2
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Active Phone Number
                </h2>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--accent-green-muted)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <Phone
                      size={18}
                      style={{ color: "var(--accent-green)" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[16px] font-semibold data-value"
                      style={{ color: "var(--text-primary)" }}
                    >
                      (305) 555-0100
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: "var(--accent-green)" }}
                      />
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--accent-green)" }}
                      >
                        Active
                      </span>
                      <span
                        className="text-[12px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        -- Local number -- Miami, FL
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Buy Number */}
            <Card>
              <CardHeader>
                <h2
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Buy New Number
                </h2>
              </CardHeader>
              <CardContent>
                <div
                  className="flex flex-col items-center justify-center py-8"
                  style={{
                    border: "2px dashed var(--border-primary)",
                    borderRadius: "var(--radius-md)",
                    color: "var(--text-tertiary)",
                  }}
                >
                  <Plus size={24} />
                  <p className="text-[13px] mt-2">
                    Search and purchase phone numbers
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Local and toll-free numbers available
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() =>
                      toast("Number purchasing coming soon", "info")
                    }
                  >
                    Browse Numbers
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Phone settings */}
            <Card>
              <CardHeader>
                <h2
                  className="text-[15px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Phone Settings
                </h2>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Caller ID
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Display your company name on outbound calls
                    </p>
                  </div>
                  <Toggle checked={callerId} onChange={setCallerId} />
                </div>
                <hr />
                <div className="flex items-center justify-between">
                  <div>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Call Recording
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      Automatically record all outbound calls
                    </p>
                  </div>
                  <Toggle
                    checked={callRecording}
                    onChange={setCallRecording}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ──────────────────────── INTEGRATIONS ──────────────────────── */}
        {activeTab === "integrations" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {integrationsLoading ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <div className="flex items-center gap-2" style={{ color: "var(--text-tertiary)" }}>
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-[13px]">Loading integrations...</span>
                </div>
              </div>
            ) : integrations.length === 0 ? (
              <div className="col-span-full flex items-center justify-center py-12">
                <span className="text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                  No integrations available.
                </span>
              </div>
            ) : (
              integrations.map((integ) => (
                <Card key={integ.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: "var(--bg-tertiary)",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        {renderIntegrationIcon(integ.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="text-[14px] font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {integ.name}
                          </p>
                          <Badge
                            variant={
                              integ.enabled ? "success" : "neutral"
                            }
                          >
                            {integ.enabled
                              ? "Connected"
                              : "Disconnected"}
                          </Badge>
                        </div>
                        <p
                          className="text-[12px] mb-3"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {integ.description}
                        </p>
                        <Button
                          variant={
                            integ.enabled ? "secondary" : "primary"
                          }
                          size="sm"
                          disabled={togglingId === integ.id}
                          onClick={() =>
                            handleToggleIntegration(integ.id)
                          }
                        >
                          {togglingId === integ.id && (
                            <Loader2 size={12} className="animate-spin mr-1" />
                          )}
                          {integ.enabled ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ──────────────────────── BILLING ──────────────────────── */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            {/* Current plan */}
            <Card>
              <CardHeader>
                <span className="data-label">CURRENT PLAN</span>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 flex items-center justify-center"
                    style={{
                      backgroundColor: "var(--accent-blue-muted)",
                      borderRadius: "var(--radius-md)",
                    }}
                  >
                    <Check
                      size={22}
                      style={{ color: "var(--accent-blue)" }}
                    />
                  </div>
                  <div>
                    <p
                      className="text-[18px] font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Pro Plan
                    </p>
                    <p
                      className="text-[13px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      $49/month -- Billed monthly
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage meters */}
            <Card>
              <CardHeader>
                <span className="data-label">USAGE THIS PERIOD</span>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      API Calls
                    </p>
                    <span
                      className="text-[12px] data-value"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      2,847 / 10,000
                    </span>
                  </div>
                  <ProgressBar value={2847} max={10000} color="#2D7FF9" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Storage
                    </p>
                    <span
                      className="text-[12px] data-value"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      1.2 GB / 5 GB
                    </span>
                  </div>
                  <ProgressBar value={1.2} max={5} color="#FFAB00" />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Team Members
                    </p>
                    <span
                      className="text-[12px] data-value"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      4 / 10
                    </span>
                  </div>
                  <ProgressBar value={4} max={10} color="#36B37E" />
                </div>
              </CardContent>
            </Card>

            {/* Plan comparison */}
            <div>
              <span className="data-label block mb-3">
                AVAILABLE PLANS
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Free */}
                <Card>
                  <CardContent className="py-5 space-y-4">
                    <div>
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Free
                      </p>
                      <p
                        className="text-[28px] font-bold mt-1 data-value"
                        style={{ color: "var(--text-primary)" }}
                      >
                        $0
                        <span
                          className="text-[13px] font-normal"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          /mo
                        </span>
                      </p>
                    </div>
                    <ul
                      className="space-y-2 text-[13px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Up to 3 users
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        500 contacts
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Basic reporting
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        1 GB storage
                      </li>
                    </ul>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() =>
                        toast("Downgrade flow coming soon", "info")
                      }
                    >
                      Downgrade
                    </Button>
                  </CardContent>
                </Card>

                {/* Pro (current) */}
                <Card
                  style={{
                    border: "2px solid var(--accent-blue)",
                  }}
                >
                  <CardContent className="py-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Pro
                      </p>
                      <Badge variant="info">Current</Badge>
                    </div>
                    <p
                      className="text-[28px] font-bold data-value"
                      style={{ color: "var(--text-primary)" }}
                    >
                      $49
                      <span
                        className="text-[13px] font-normal"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        /mo
                      </span>
                    </p>
                    <ul
                      className="space-y-2 text-[13px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Up to 10 users
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        10,000 contacts
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Advanced analytics
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        5 GB storage
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        10,000 API calls/mo
                      </li>
                    </ul>
                    <Button variant="primary" className="w-full" disabled>
                      Current Plan
                    </Button>
                  </CardContent>
                </Card>

                {/* Enterprise */}
                <Card>
                  <CardContent className="py-5 space-y-4">
                    <div>
                      <p
                        className="text-[14px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Enterprise
                      </p>
                      <p
                        className="text-[28px] font-bold mt-1 data-value"
                        style={{ color: "var(--text-primary)" }}
                      >
                        $199
                        <span
                          className="text-[13px] font-normal"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          /mo
                        </span>
                      </p>
                    </div>
                    <ul
                      className="space-y-2 text-[13px]"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Unlimited users
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Unlimited contacts
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Custom integrations
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        100 GB storage
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Unlimited API calls
                      </li>
                      <li className="flex items-start gap-2">
                        <Check
                          size={14}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--accent-green)" }}
                        />
                        Priority support
                      </li>
                    </ul>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={() =>
                        toast("Upgrade flow coming soon", "info")
                      }
                    >
                      Upgrade
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
