"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import {
  Inbox,
  Send,
  FileText,
  Star,
  Archive,
  Mail as MailIcon,
  Plus,
  Zap,
  CheckCircle,
  Loader2,
} from "lucide-react";

/* ── Types ── */
interface Email {
  id: string;
  sender: string;
  senderEmail: string;
  subject: string;
  preview: string;
  body: string;
  date: string;
  folder: "Inbox" | "Sent" | "Drafts" | "Starred" | "Archive";
  read: boolean;
  starred: boolean;
}

/* ── Map D1 row to Email ── */
function mapEmail(r: any): Email {
  return {
    id: r.id,
    sender: r.sender,
    senderEmail: r.sender_email,
    subject: r.subject,
    preview: r.preview || "",
    body: r.body || "",
    date: r.date || r.created_at || "",
    folder: r.folder || "Inbox",
    read: r.read === 1 || r.read === true,
    starred: r.starred === 1 || r.starred === true,
  };
}

/* ── Folders ── */
const FOLDERS = [
  { id: "Inbox" as const, label: "Inbox", icon: Inbox },
  { id: "Sent" as const, label: "Sent", icon: Send },
  { id: "Drafts" as const, label: "Drafts", icon: FileText },
  { id: "Starred" as const, label: "Starred", icon: Star },
  { id: "Archive" as const, label: "Archive", icon: Archive },
];

export default function MailPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string>("Inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({
    to: "",
    subject: "",
    body: "",
  });

  const fetchEmails = useCallback(async () => {
    if (!org) return;
    try {
      setLoading(true);
      const raw = await api.getEmails();
      setEmails(raw.map(mapEmail));
    } catch {
      toast("Failed to load emails");
    } finally {
      setLoading(false);
    }
  }, [org]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  /* ── Filtered emails ── */
  const filteredEmails = useMemo(() => {
    let result: Email[];
    if (selectedFolder === "Starred") {
      result = emails.filter((e) => e.starred);
    } else {
      result = emails.filter((e) => e.folder === selectedFolder);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.sender.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.preview.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.date.localeCompare(a.date));
  }, [emails, selectedFolder, searchQuery]);

  /* ── Folder counts ── */
  const folderCounts = useMemo(() => {
    const c: Record<string, number> = {
      Inbox: 0, Sent: 0, Drafts: 0, Starred: 0, Archive: 0,
    };
    emails.forEach((e) => {
      c[e.folder]++;
      if (e.starred) c.Starred++;
    });
    return c;
  }, [emails]);

  const unreadCount = useMemo(
    () => emails.filter((e) => e.folder === "Inbox" && !e.read).length,
    [emails]
  );

  /* ── Handlers ── */
  const handleSelectEmail = async (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
      );
      try { await api.updateEmail(email.id, { read: 1 }); } catch { /* silent */ }
    }
  };

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find((em) => em.id === id);
    if (!email) return;
    const next = !email.starred;
    setEmails((prev) =>
      prev.map((em) =>
        em.id === id ? { ...em, starred: next } : em
      )
    );
    try { await api.updateEmail(id, { starred: next ? 1 : 0 }); } catch { /* silent */ }
  };

  const handleComposeSend = async () => {
    if (!org || !user) return;
    try {
      const emailData = {
        org_id: org.id,
        sender: "You",
        sender_email: user.email || "demo@axia.crm",
        subject: composeForm.subject || "(no subject)",
        preview: composeForm.body.slice(0, 120),
        body: composeForm.body,
        date: new Date().toISOString().split("T")[0],
        folder: "Sent",
        read: 1,
        starred: 0,
      };
      await api.createEmail(emailData);
      setShowCompose(false);
      setComposeForm({ to: "", subject: "", body: "" });
      toast("Email sent");
      fetchEmails();
    } catch {
      toast("Failed to send email");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return d.toLocaleDateString("en-US", { weekday: "short" });
    }
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (!org) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="flex h-full overflow-hidden"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* ── Left Panel: Folders (200px) ── */}
        <div
          className="w-[200px] shrink-0 flex flex-col"
          style={{
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-primary)",
          }}
        >
          {/* Compose button */}
          <div className="p-3">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setShowCompose(true)}
            >
              <Plus size={14} />
              Compose
            </Button>
          </div>

          {/* Folder list */}
          <div className="flex-1 py-1">
            {FOLDERS.map((f) => {
              const active = selectedFolder === f.id;
              const count =
                f.id === "Inbox"
                  ? unreadCount
                  : f.id === "Starred"
                  ? 0
                  : folderCounts[f.id] || 0;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFolder(f.id);
                    setSelectedEmail(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors"
                  style={{
                    color: active
                      ? "var(--accent-blue)"
                      : "var(--text-secondary)",
                    background: active
                      ? "var(--accent-blue-muted)"
                      : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.background =
                        "var(--bg-tertiary)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <f.icon size={15} className="shrink-0" />
                  <span className="flex-1 text-left truncate">
                    {f.label}
                  </span>
                  {count > 0 && (
                    <span
                      className="text-[11px] font-semibold"
                      style={{
                        color: active
                          ? "var(--accent-blue)"
                          : "var(--text-tertiary)",
                      }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bulk Email section */}
          <div
            className="px-3 pt-3 shrink-0"
            style={{
              borderTop: "1px solid var(--border-primary)",
            }}
          >
            <p
              className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              BULK EMAIL
            </p>
            <div
              className="p-3 mb-3"
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Zap
                  size={14}
                  style={{ color: "var(--accent-yellow)" }}
                />
                <span
                  className="text-[12px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Mailgun
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle
                  size={10}
                  style={{ color: "var(--accent-green)" }}
                />
                <span
                  className="text-[10px]"
                  style={{
                    color: "var(--accent-green)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  CONNECTED
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Center Panel: Email List ── */}
        <div
          className="flex-1 min-w-0 flex flex-col"
          style={{
            borderRight: "1px solid var(--border-primary)",
          }}
        >
          {/* Search bar */}
          <div
            className="px-3 py-2 shrink-0"
            style={{
              borderBottom: "1px solid var(--border-primary)",
            }}
          >
            <Search
              placeholder="Search emails..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>

          {/* Email rows */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <MailIcon
                  size={32}
                  style={{
                    color: "var(--text-tertiary)",
                    opacity: 0.2,
                  }}
                />
                <p
                  className="mt-3 text-[13px]"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  No emails in this folder
                </p>
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      background: isSelected
                        ? "var(--bg-tertiary)"
                        : "var(--bg-secondary)",
                      borderBottom:
                        "1px solid var(--border-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background =
                          "var(--bg-tertiary)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background =
                          "var(--bg-secondary)";
                      }
                    }}
                  >
                    {/* Avatar */}
                    <Avatar name={email.sender} size="sm" />

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[13px] truncate"
                          style={{
                            color: !email.read
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                            fontWeight: !email.read ? 600 : 400,
                          }}
                        >
                          {email.sender}
                        </span>
                        <span
                          className="text-[11px] shrink-0 ml-auto"
                          style={{
                            color: "var(--text-tertiary)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {formatDate(email.date)}
                        </span>
                      </div>
                      <p
                        className="text-[13px] truncate mt-0.5"
                        style={{
                          color: !email.read
                            ? "var(--text-primary)"
                            : "var(--text-secondary)",
                          fontWeight: !email.read ? 600 : 400,
                        }}
                      >
                        {email.subject}
                      </p>
                      <p
                        className="text-[12px] truncate mt-0.5"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {email.preview}
                      </p>
                    </div>

                    {/* Star */}
                    <button
                      onClick={(e) => toggleStar(email.id, e)}
                      className="shrink-0 p-1"
                    >
                      <Star
                        size={14}
                        style={{
                          color: email.starred
                            ? "var(--accent-yellow)"
                            : "var(--text-tertiary)",
                          fill: email.starred
                            ? "var(--accent-yellow)"
                            : "none",
                        }}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right Panel: Email Detail ── */}
        <div
          className="flex-1 min-w-0 flex flex-col"
          style={{ background: "var(--bg-secondary)" }}
        >
          {selectedEmail ? (
            <>
              {/* Email header */}
              <div
                className="px-5 py-4 shrink-0"
                style={{
                  borderBottom: "1px solid var(--border-primary)",
                }}
              >
                <h2
                  className="text-[16px] font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {selectedEmail.subject}
                </h2>
                <div className="flex items-center gap-3 mt-3">
                  <Avatar name={selectedEmail.sender} size="md" />
                  <div>
                    <p
                      className="text-[13px] font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {selectedEmail.sender}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {selectedEmail.senderEmail}
                    </p>
                  </div>
                  <span
                    className="ml-auto text-[11px]"
                    style={{
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {selectedEmail.date}
                  </span>
                </div>
              </div>

              {/* Email body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <pre
                  className="text-[13px] leading-relaxed whitespace-pre-wrap"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-sans)",
                    maxWidth: "65ch",
                  }}
                >
                  {selectedEmail.body}
                </pre>
              </div>

              {/* Reply bar */}
              <div
                className="px-5 py-3 shrink-0 flex gap-2"
                style={{
                  borderTop: "1px solid var(--border-primary)",
                }}
              >
                <Button size="sm" variant="secondary">
                  Reply
                </Button>
                <Button size="sm" variant="secondary">
                  Forward
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1">
              <MailIcon
                size={48}
                style={{
                  color: "var(--text-tertiary)",
                  opacity: 0.15,
                }}
              />
              <p
                className="mt-3 text-[13px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                Select an email to read
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Compose Modal ── */}
      <Modal
        open={showCompose}
        onClose={() => setShowCompose(false)}
        title="New Message"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="To"
            value={composeForm.to}
            onChange={(e) =>
              setComposeForm({ ...composeForm, to: e.target.value })
            }
            placeholder="recipient@email.com"
          />
          <Input
            label="Subject"
            value={composeForm.subject}
            onChange={(e) =>
              setComposeForm({
                ...composeForm,
                subject: e.target.value,
              })
            }
            placeholder="Email subject..."
          />
          <Textarea
            label="Message"
            value={composeForm.body}
            onChange={(e) =>
              setComposeForm({ ...composeForm, body: e.target.value })
            }
            placeholder="Write your message..."
            rows={10}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowCompose(false)}
          >
            Discard
          </Button>
          <Button onClick={handleComposeSend}>Send</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
