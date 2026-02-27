"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
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

/* ── Mock emails ── */
const MOCK_EMAILS: Email[] = [
  {
    id: "em-1", sender: "Sarah Chen", senderEmail: "sarah.chen@acmecorp.com",
    subject: "RE: Q1 Pipeline Review",
    preview: "Thanks for the updated numbers. I think we should schedule a follow-up to discuss the Globex opportunity before end of week...",
    body: "Hi,\n\nThanks for the updated numbers. I think we should schedule a follow-up to discuss the Globex opportunity before end of week. The pricing looks competitive but we need to finalize the discount structure.\n\nAlso, can you loop in Mike from engineering? They had some questions about the integration timeline.\n\nBest,\nSarah",
    date: "2026-02-25", folder: "Inbox", read: false, starred: true,
  },
  {
    id: "em-2", sender: "John Smith", senderEmail: "john.smith@globex.com",
    subject: "Proposal for Globex Enterprise License",
    preview: "Attached is the revised proposal with the updated pricing tiers. Let me know if the discount structure works for their budget...",
    body: "Hello,\n\nAttached is the revised proposal with the updated pricing tiers. Let me know if the discount structure works for their budget. We are flexible on the payment terms.\n\nKey changes:\n- Volume discount increased from 15% to 20% for 100+ seats\n- Added 90-day free trial for analytics module\n- Removed setup fee for first year\n\nLet me know your thoughts.\n\nRegards,\nJohn Smith\nVP of Sales, Globex Corporation",
    date: "2026-02-24", folder: "Inbox", read: false, starred: false,
  },
  {
    id: "em-3", sender: "Maria Garcia", senderEmail: "maria.garcia@stark.com",
    subject: "Meeting Recap: Stark Industries",
    preview: "Great call today. Key takeaways: they want a demo of the analytics module next Tuesday, and need SOC2 compliance docs...",
    body: "Team,\n\nGreat call today with Stark Industries. Here are the key takeaways:\n\n1. They want a demo of the analytics module next Tuesday at 2pm EST\n2. Need SOC2 compliance documentation before procurement can sign off\n3. Budget has been approved for Q1 implementation\n4. Maria Garcia will be the primary point of contact going forward\n\nAction items:\n- Send SOC2 docs to Maria by Thursday\n- Prepare analytics demo environment\n- Schedule follow-up with their IT team\n\nLet me know if you have any questions.\n\nBest,\nMaria",
    date: "2026-02-23", folder: "Inbox", read: true, starred: false,
  },
  {
    id: "em-4", sender: "Accounting", senderEmail: "accounting@axiacrm.com",
    subject: "Invoice #INV-2026-001 - Payment Due",
    preview: "Please find attached the invoice for Q4 services. Payment terms are Net-30. Contact us if you have any questions...",
    body: "Dear Customer,\n\nPlease find attached the invoice for Q4 services rendered.\n\nInvoice Details:\n- Invoice #: INV-2026-001\n- Amount: $45,000.00\n- Due Date: March 25, 2026\n- Payment Terms: Net-30\n\nPlease remit payment to the account details listed on the invoice. Contact us if you have any questions.\n\nThank you for your business.\n\nAccounting Department\nAxia CRM",
    date: "2026-02-22", folder: "Inbox", read: true, starred: false,
  },
  {
    id: "em-5", sender: "David Park", senderEmail: "david.park@wayneent.com",
    subject: "RE: Contract Renewal Discussion",
    preview: "We are looking to expand our seats from 50 to 120. Can you send over an updated quote reflecting the volume discount...",
    body: "Hi,\n\nWe are looking to expand our seats from 50 to 120. Can you send over an updated quote reflecting the volume discount?\n\nAlso, a few things we would like to discuss:\n- Custom API integrations for our internal tools\n- SSO setup with our Azure AD\n- Dedicated account manager for the expanded team\n\nLet me know when you are available for a call.\n\nThanks,\nDavid Park\nHead of Procurement, Wayne Enterprises",
    date: "2026-02-21", folder: "Inbox", read: true, starred: false,
  },
  {
    id: "em-6", sender: "Lisa Thompson", senderEmail: "lisa.t@initech.com",
    subject: "Product Demo Request - Forecasting Features",
    preview: "Our VP of Sales would like to see a live demo of the forecasting features. Available next Thursday or Friday afternoon...",
    body: "Hello,\n\nOur VP of Sales, James Taylor, would like to see a live demo of the forecasting features in Axia CRM. He is particularly interested in:\n\n- AI-powered deal scoring\n- Revenue forecasting accuracy\n- Pipeline velocity metrics\n- Custom report builder\n\nHe is available next Thursday or Friday afternoon (EST). Would either of those work?\n\nBest regards,\nLisa Thompson\nInitech",
    date: "2026-02-20", folder: "Inbox", read: true, starred: false,
  },
  {
    id: "em-7", sender: "Kevin O'Brien", senderEmail: "kobrien@umbrellacorp.com",
    subject: "Integration API Documentation Request",
    preview: "Our engineering team needs the API documentation for the webhook and REST endpoints. Rate limits and auth flow details...",
    body: "Hi,\n\nOur engineering team is starting the integration work and needs the following documentation:\n\n1. REST API endpoint reference\n2. Webhook configuration and event types\n3. Authentication flow (OAuth 2.0 details)\n4. Rate limiting policies\n5. Sample code for common operations\n\nCan you share the developer portal link or send the docs directly?\n\nThanks,\nKevin O'Brien\nUmbrella Corp",
    date: "2026-02-19", folder: "Inbox", read: true, starred: true,
  },
  {
    id: "em-8", sender: "Rachel Kim", senderEmail: "rachel.kim@soylent.co",
    subject: "RE: Onboarding Checklist Complete",
    preview: "All items on the checklist are complete. The team has been trained and we have migrated all historical data into the new...",
    body: "Hi,\n\nGreat news - all items on the onboarding checklist are complete!\n\nCompleted items:\n- User accounts created for all 25 team members\n- Historical data migration (15,000 contacts, 3,200 deals)\n- Custom fields configured\n- Email integration set up\n- Training sessions completed (3 sessions)\n\nThe team is ready to go live on Monday. Thanks for all the support during the onboarding process.\n\nBest,\nRachel Kim\nSoylent Corp",
    date: "2026-02-18", folder: "Inbox", read: true, starred: false,
  },
  {
    id: "em-9", sender: "You", senderEmail: "demo@axia.crm",
    subject: "RE: Partnership Opportunity with CloudFirst",
    preview: "Thanks for reaching out. I would love to explore the integration partnership. Let me loop in our product team...",
    body: "Hi Alex,\n\nThanks for reaching out about the partnership opportunity. I would love to explore the integration between CloudFirst and Axia CRM.\n\nI am looping in our product team to discuss technical feasibility. A few initial thoughts:\n\n- Cloud infrastructure monitoring data in CRM could be valuable for our customers\n- We could build a native integration in our marketplace\n- Co-marketing opportunities at upcoming cloud conferences\n\nLet me know when your team is available for a discovery call.\n\nBest,\nDemo User",
    date: "2026-02-23", folder: "Sent", read: true, starred: false,
  },
  {
    id: "em-10", sender: "You", senderEmail: "demo@axia.crm",
    subject: "Follow-up: Wayne Enterprises Renewal",
    preview: "Hi team, just wanted to follow up on the Wayne Enterprises renewal. The decision maker has confirmed they want to proceed...",
    body: "Hi team,\n\nJust wanted to follow up on the Wayne Enterprises renewal. David Park has confirmed they want to proceed with the expanded license.\n\nKey details:\n- Expanding from 50 to 120 seats\n- 2-year commitment with annual billing\n- Requesting custom API integration support\n- Need SSO configuration\n\nNext steps:\n1. Finance to prepare updated quote with volume discount\n2. Engineering to scope SSO and API work\n3. Schedule contract review call for next week\n\nLet me know if there are any blockers.\n\nThanks,\nDemo User",
    date: "2026-02-22", folder: "Sent", read: true, starred: false,
  },
  {
    id: "em-11", sender: "You", senderEmail: "demo@axia.crm",
    subject: "Q1 Pipeline Projections Report",
    preview: "Attached is the Q1 projection report. Highlights: 23% increase in pipeline value, 4 new enterprise accounts added...",
    body: "Team,\n\nAttached is the Q1 2026 pipeline projection report.\n\nHighlights:\n- Total pipeline value: $3.2M (up 23% from Q4)\n- 4 new enterprise accounts added\n- 3 deals in negotiation stage ($1.1M combined)\n- Win rate trending at 32% (target: 35%)\n\nAreas of focus:\n- Accelerate Globex Enterprise License negotiation\n- Move Cyberdyne AI Module from qualification to proposal\n- Close Wayne Digital Transformation by end of month\n\nFull report attached. Questions welcome.\n\nBest,\nDemo User",
    date: "2026-02-21", folder: "Sent", read: true, starred: false,
  },
  {
    id: "em-12", sender: "You", senderEmail: "demo@axia.crm",
    subject: "Draft: New Enterprise Plus Tier Announcement",
    preview: "We are excited to announce our new Enterprise Plus tier, designed for organizations with 500+ seats. Features include...",
    body: "DRAFT - DO NOT SEND\n\nSubject: Introducing Enterprise Plus\n\nDear valued customers,\n\nWe are excited to announce our new Enterprise Plus tier, designed for organizations with 500+ seats.\n\nNew features include:\n- Dedicated infrastructure\n- 99.99% SLA guarantee\n- Custom AI model training\n- White-label options\n- Priority 24/7 support with 15-minute response time\n\nPricing starts at $199/seat/month with annual billing.\n\nLaunch date: March 15, 2026. Existing Enterprise customers can migrate with zero downtime through our automated upgrade wizard.",
    date: "2026-02-24", folder: "Drafts", read: true, starred: false,
  },
  {
    id: "em-13", sender: "You", senderEmail: "demo@axia.crm",
    subject: "Draft: Customer Success Playbook v2",
    preview: "This playbook outlines the key touchpoints and milestones for onboarding new enterprise customers over a 90-day period...",
    body: "DRAFT\n\nCustomer Success Playbook v2\n\nPhase 1 - Week 1-2: Kickoff\n- Welcome call with stakeholders\n- Technical requirements gathering\n- Data migration planning\n\nPhase 2 - Week 3-6: Implementation\n- System configuration\n- Data import and validation\n- Integration setup\n\nPhase 3 - Week 7-10: Training\n- Admin training sessions\n- End-user training\n- Best practices workshop\n\nPhase 4 - Week 11-12: Go-Live\n- Soft launch with pilot team\n- Full rollout\n- Post-launch review\n\nSuccess Metrics:\n- 90% user adoption within 30 days of go-live\n- CSAT score of 4.5+ at 90-day review\n- Less than 3 support tickets per week after go-live\n\nEscalation: Issues unresolved within 24hrs escalate to VP of Customer Success.",
    date: "2026-02-22", folder: "Drafts", read: true, starred: false,
  },
  {
    id: "em-14", sender: "Alex Turner", senderEmail: "aturner@massivedev.io",
    subject: "Feature Request: Bulk Email Templates",
    preview: "Our marketing team has requested the ability to create and manage bulk email templates with merge fields and scheduled...",
    body: "Hi Axia team,\n\nOur marketing team has a feature request: the ability to create and manage bulk email templates with merge fields and scheduled sending.\n\nSpecifically:\n- Template builder with rich text editor\n- Merge fields for contact/account data\n- A/B testing support\n- Scheduled sending with timezone awareness\n- Open/click tracking\n- Unsubscribe management\n\nThis would significantly reduce our reliance on third-party email tools. Happy to discuss further or participate in a beta program.\n\nThanks,\nAlex Turner\nMassiveDev",
    date: "2026-02-17", folder: "Inbox", read: true, starred: false,
  },
  {
    id: "em-15", sender: "Axia Team", senderEmail: "team@axiacrm.com",
    subject: "Welcome to Axia CRM - Getting Started Guide",
    preview: "Welcome aboard! Here are some quick tips to get started with your new CRM. First, import your contacts from your existing...",
    body: "Welcome to Axia CRM!\n\nHere are some quick tips to get started:\n\n1. Import your contacts from CSV or connect your email\n2. Set up your deal pipeline stages\n3. Configure your team members and roles\n4. Install the mobile app for on-the-go access\n5. Explore the power dialer for outbound calling\n\nNeed help? Our support team is available 24/7.\n\nHappy selling!\nThe Axia Team",
    date: "2026-02-15", folder: "Inbox", read: true, starred: false,
  },
];

/* ── Folders ── */
const FOLDERS = [
  { id: "Inbox" as const, label: "Inbox", icon: Inbox },
  { id: "Sent" as const, label: "Sent", icon: Send },
  { id: "Drafts" as const, label: "Drafts", icon: FileText },
  { id: "Starred" as const, label: "Starred", icon: Star },
  { id: "Archive" as const, label: "Archive", icon: Archive },
];

export default function MailPage() {
  const { org } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<Email[]>(MOCK_EMAILS);
  const [selectedFolder, setSelectedFolder] = useState<string>("Inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({
    to: "",
    subject: "",
    body: "",
  });

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
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    if (!email.read) {
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, read: true } : e))
      );
    }
  };

  const toggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEmails((prev) =>
      prev.map((em) =>
        em.id === id ? { ...em, starred: !em.starred } : em
      )
    );
  };

  const handleComposeSend = () => {
    const newEmail: Email = {
      id: `em-${Date.now()}`,
      sender: "You",
      senderEmail: "demo@axia.crm",
      subject: composeForm.subject || "(no subject)",
      preview: composeForm.body.slice(0, 120),
      body: composeForm.body,
      date: new Date().toISOString().split("T")[0],
      folder: "Sent",
      read: true,
      starred: false,
    };
    setEmails((prev) => [newEmail, ...prev]);
    setShowCompose(false);
    setComposeForm({ to: "", subject: "", body: "" });
    toast("Email sent");
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
