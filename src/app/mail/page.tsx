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
  Loader2,
  RefreshCw,
  Trash2,
  AlertTriangle,
} from "lucide-react";

/* ── Types ── */
interface GmailMessage {
  id: string;
  threadId: string;
  sender: string;
  senderEmail: string;
  to: string;
  subject: string;
  snippet: string;
  body: string;
  bodyText: string;
  date: string;
  folder: string;
  read: boolean;
  starred: boolean;
  labels: string[];
}

/* ── Folders ── */
const FOLDERS = [
  { id: "Inbox", gmailLabel: "INBOX", icon: Inbox },
  { id: "Sent", gmailLabel: "SENT", icon: Send },
  { id: "Drafts", gmailLabel: "DRAFT", icon: FileText },
  { id: "Starred", gmailLabel: "STARRED", icon: Star },
  { id: "Trash", gmailLabel: "TRASH", icon: Archive },
];

export default function MailPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("Inbox");
  const [selectedEmail, setSelectedEmail] = useState<GmailMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [composeForm, setComposeForm] = useState({
    to: "",
    cc: "",
    subject: "",
    body: "",
  });

  const fetchEmails = useCallback(async (folder?: string) => {
    if (!org) return;
    const targetFolder = folder || selectedFolder;
    try {
      setLoading(true);
      setTokenExpired(false);
      const gmailFolder = FOLDERS.find(f => f.id === targetFolder)?.gmailLabel || "INBOX";
      const result = await api.getGmailInbox(gmailFolder, 30);
      setEmails(result.messages || []);
      setNextPageToken(result.nextPageToken || null);
    } catch (e: any) {
      if (e.message?.includes("401")) {
        setTokenExpired(true);
      } else {
        toast("Failed to load emails");
      }
    } finally {
      setLoading(false);
    }
  }, [org, selectedFolder]);

  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmails();
    setRefreshing(false);
  };

  /* ── Filtered emails ── */
  const filteredEmails = useMemo(() => {
    let result = emails;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) =>
          e.sender.toLowerCase().includes(q) ||
          e.subject.toLowerCase().includes(q) ||
          e.snippet.toLowerCase().includes(q)
      );
    }
    return result;
  }, [emails, searchQuery]);

  const unreadCount = useMemo(
    () => emails.filter((e) => !e.read).length,
    [emails]
  );

  /* ── Handlers ── */
  const handleSelectEmail = async (email: GmailMessage) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
      );
      try { await api.markGmailRead(email.id, true); } catch { /* silent */ }
    }
  };

  const toggleStar = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const email = emails.find((em) => em.id === id);
    if (!email) return;
    const next = !email.starred;
    setEmails((prev) =>
      prev.map((em) => (em.id === id ? { ...em, starred: next } : em))
    );
    try { await api.starGmail(id, next); } catch { /* silent */ }
  };

  const handleComposeSend = async () => {
    if (!composeForm.to || !composeForm.subject) {
      toast("Please fill in To and Subject");
      return;
    }
    try {
      setSending(true);
      await api.sendGmail({
        to: composeForm.to,
        subject: composeForm.subject,
        body: composeForm.body,
        cc: composeForm.cc || undefined,
      });
      setShowCompose(false);
      setComposeForm({ to: "", cc: "", subject: "", body: "" });
      toast("Email sent successfully");
      fetchEmails();
    } catch (e: any) {
      if (e.message?.includes("401")) {
        setTokenExpired(true);
        toast("Google token expired. Please reconnect.");
      } else {
        toast("Failed to send email");
      }
    } finally {
      setSending(false);
    }
  };

  const handleTrash = async (id: string) => {
    setEmails((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmail?.id === id) setSelectedEmail(null);
    try { await api.trashGmail(id); toast("Email trashed"); } catch { toast("Failed to trash"); }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) {
        return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      }
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) {
        return d.toLocaleDateString("en-US", { weekday: "short" });
      }
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const handleReconnect = () => {
    // Re-trigger Google OAuth to get fresh tokens
    window.location.href = "/";
  };

  if (!org) return null;

  // Token expired state
  if (tokenExpired) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle size={32} style={{ color: "var(--accent-yellow)" }} />
          <p className="text-[14px] font-medium" style={{ color: "var(--text-primary)" }}>
            Google connection expired
          </p>
          <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
            Your Gmail access token has expired. Please sign in again to reconnect.
          </p>
          <Button onClick={handleReconnect}>
            Reconnect Google
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
          <p className="text-[12px]" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            LOADING GMAIL...
          </p>
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
        {/* ── Left Panel: Folders ── */}
        <div
          className="w-[200px] shrink-0 flex flex-col hidden md:flex"
          style={{
            background: "var(--bg-secondary)",
            borderRight: "1px solid var(--border-primary)",
          }}
        >
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

          <div className="flex-1 py-1">
            {FOLDERS.map((f) => {
              const active = selectedFolder === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFolder(f.id);
                    setSelectedEmail(null);
                    fetchEmails(f.id);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] transition-colors"
                  style={{
                    color: active ? "var(--accent-blue)" : "var(--text-secondary)",
                    background: active ? "var(--accent-blue-muted)" : "transparent",
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.background = "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <f.icon size={15} className="shrink-0" />
                  <span className="flex-1 text-left truncate">{f.id}</span>
                  {f.id === "Inbox" && unreadCount > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5"
                      style={{
                        background: "var(--accent-blue)",
                        color: "#fff",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Gmail integration status */}
          <div
            className="px-3 py-3 shrink-0"
            style={{ borderTop: "1px solid var(--border-primary)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-green)" }} />
              <span className="text-[10px]" style={{ color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}>
                GMAIL CONNECTED
              </span>
            </div>
            <p className="text-[10px] truncate" style={{ color: "var(--text-tertiary)" }}>
              {user?.email}
            </p>
          </div>
        </div>

        {/* ── Center Panel: Email List ── */}
        <div
          className="flex-1 min-w-0 flex flex-col"
          style={{ borderRight: "1px solid var(--border-primary)" }}
        >
          {/* Toolbar */}
          <div
            className="px-3 py-2 shrink-0 flex items-center gap-2"
            style={{ borderBottom: "1px solid var(--border-primary)" }}
          >
            <div className="flex-1">
              <Search
                placeholder="Search emails..."
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>
            <button
              onClick={handleRefresh}
              className="p-1.5 transition-colors"
              style={{
                color: "var(--text-tertiary)",
                borderRadius: "var(--radius-sm)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-tertiary)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Mobile compose + folder */}
          <div className="flex md:hidden items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid var(--border-primary)" }}>
            <select
              value={selectedFolder}
              onChange={(e) => { setSelectedFolder(e.target.value); setSelectedEmail(null); fetchEmails(e.target.value); }}
              className="text-[12px] px-2 py-1"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-sm)" }}
            >
              {FOLDERS.map(f => <option key={f.id} value={f.id}>{f.id}</option>)}
            </select>
            <Button size="sm" onClick={() => setShowCompose(true)}>
              <Plus size={14} /> Compose
            </Button>
          </div>

          {/* Email rows */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <MailIcon size={32} style={{ color: "var(--text-tertiary)", opacity: 0.2 }} />
                <p className="mt-3 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
                  No emails in {selectedFolder}
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
                      background: isSelected ? "var(--bg-tertiary)" : "var(--bg-secondary)",
                      borderBottom: "1px solid var(--border-secondary)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "var(--bg-tertiary)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.background = "var(--bg-secondary)";
                    }}
                  >
                    <Avatar name={email.sender} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[13px] truncate"
                          style={{
                            color: !email.read ? "var(--text-primary)" : "var(--text-secondary)",
                            fontWeight: !email.read ? 600 : 400,
                          }}
                        >
                          {email.sender}
                        </span>
                        <span
                          className="text-[11px] shrink-0 ml-auto"
                          style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                        >
                          {formatDate(email.date)}
                        </span>
                      </div>
                      <p
                        className="text-[13px] truncate mt-0.5"
                        style={{
                          color: !email.read ? "var(--text-primary)" : "var(--text-secondary)",
                          fontWeight: !email.read ? 600 : 400,
                        }}
                      >
                        {email.subject}
                      </p>
                      <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {email.snippet}
                      </p>
                    </div>
                    <button onClick={(e) => toggleStar(email.id, e)} className="shrink-0 p-1">
                      <Star
                        size={14}
                        style={{
                          color: email.starred ? "var(--accent-yellow)" : "var(--text-tertiary)",
                          fill: email.starred ? "var(--accent-yellow)" : "none",
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
          className="flex-1 min-w-0 flex-col hidden md:flex"
          style={{ background: "var(--bg-secondary)" }}
        >
          {selectedEmail ? (
            <>
              <div
                className="px-5 py-4 shrink-0"
                style={{ borderBottom: "1px solid var(--border-primary)" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-[16px] font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
                    {selectedEmail.subject}
                  </h2>
                  <button
                    onClick={() => handleTrash(selectedEmail.id)}
                    className="p-1.5 transition-colors"
                    style={{ color: "var(--text-tertiary)", borderRadius: "var(--radius-sm)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "var(--accent-red-muted)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar name={selectedEmail.sender} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                      {selectedEmail.sender}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                      {selectedEmail.senderEmail}
                    </p>
                  </div>
                  <span
                    className="text-[11px] shrink-0"
                    style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                  >
                    {formatDate(selectedEmail.date)}
                  </span>
                </div>
                {selectedEmail.to && (
                  <p className="text-[11px] mt-2" style={{ color: "var(--text-tertiary)" }}>
                    To: {selectedEmail.to}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {selectedEmail.body.includes("<") ? (
                  <div
                    className="text-[13px] leading-relaxed"
                    style={{ color: "var(--text-primary)", maxWidth: "65ch" }}
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                  />
                ) : (
                  <pre
                    className="text-[13px] leading-relaxed whitespace-pre-wrap"
                    style={{ color: "var(--text-primary)", fontFamily: "var(--font-sans)", maxWidth: "65ch" }}
                  >
                    {selectedEmail.bodyText || selectedEmail.body}
                  </pre>
                )}
              </div>

              <div
                className="px-5 py-3 shrink-0 flex gap-2"
                style={{ borderTop: "1px solid var(--border-primary)" }}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setComposeForm({
                      to: selectedEmail.senderEmail,
                      cc: "",
                      subject: `Re: ${selectedEmail.subject}`,
                      body: "",
                    });
                    setShowCompose(true);
                  }}
                >
                  Reply
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setComposeForm({
                      to: "",
                      cc: "",
                      subject: `Fwd: ${selectedEmail.subject}`,
                      body: `\n\n---------- Forwarded message ----------\nFrom: ${selectedEmail.sender} <${selectedEmail.senderEmail}>\nDate: ${selectedEmail.date}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.bodyText || selectedEmail.snippet}`,
                    });
                    setShowCompose(true);
                  }}
                >
                  Forward
                </Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1">
              <MailIcon size={48} style={{ color: "var(--text-tertiary)", opacity: 0.15 }} />
              <p className="mt-3 text-[13px]" style={{ color: "var(--text-tertiary)" }}>
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
            onChange={(e) => setComposeForm({ ...composeForm, to: e.target.value })}
            placeholder="recipient@email.com"
          />
          <Input
            label="Cc"
            value={composeForm.cc}
            onChange={(e) => setComposeForm({ ...composeForm, cc: e.target.value })}
            placeholder="cc@email.com"
          />
          <Input
            label="Subject"
            value={composeForm.subject}
            onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
            placeholder="Email subject..."
          />
          <Textarea
            label="Message"
            value={composeForm.body}
            onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
            placeholder="Write your message..."
            rows={10}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowCompose(false)}>
            Discard
          </Button>
          <Button onClick={handleComposeSend} disabled={sending}>
            {sending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Sending...
              </>
            ) : (
              "Send"
            )}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
