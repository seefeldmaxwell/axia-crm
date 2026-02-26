"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toast";
import {
  Plus,
  Calendar,
  Send,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Clock,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";

// ── Platform definitions ──

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", connected: true },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "#1DA1F2", connected: true },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E1306C", connected: false },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", connected: true },
] as const;

// ── Mock scheduled posts ──

const mockQueuePosts = [
  {
    id: "q1",
    content: "Excited to announce our new CRM features that will help sales teams close deals 40% faster. Link in bio.",
    platforms: ["linkedin", "x"],
    scheduledAt: "2026-02-26T10:00:00",
    status: "Scheduled" as const,
  },
  {
    id: "q2",
    content: "Join our upcoming webinar on modern sales strategies. Register now for free! #SalesExcellence",
    platforms: ["linkedin", "facebook"],
    scheduledAt: "2026-02-27T14:30:00",
    status: "Scheduled" as const,
  },
  {
    id: "q3",
    content: "Customer spotlight: How Acme Corp increased their pipeline by 3x using our platform. Read the full story.",
    platforms: ["linkedin", "x", "facebook"],
    scheduledAt: "2026-02-28T09:00:00",
    status: "Scheduled" as const,
  },
];

const mockPublishedPosts = [
  {
    id: "p1",
    content: "We just crossed 10,000 active users! Thank you to our incredible community.",
    platforms: ["linkedin", "x"],
    publishedAt: "2026-02-24T11:00:00",
    likes: 142,
    comments: 28,
    shares: 15,
  },
  {
    id: "p2",
    content: "5 tips for building a high-performing sales pipeline in 2026. Thread below.",
    platforms: ["x"],
    publishedAt: "2026-02-23T09:30:00",
    likes: 89,
    comments: 12,
    shares: 31,
  },
  {
    id: "p3",
    content: "Our team at the SaaS Connect conference. Great conversations about the future of CRM.",
    platforms: ["linkedin", "facebook"],
    publishedAt: "2026-02-22T16:00:00",
    likes: 203,
    comments: 41,
    shares: 22,
  },
];

// ══════════════════════════════════════════════════════════════
// Main Marketing Page
// ══════════════════════════════════════════════════════════════

export default function MarketingPage() {
  const { org } = useAuth();
  const { toast } = useToast();

  const [composerText, setComposerText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(
    new Set(["linkedin", "x"])
  );
  const [activeTab, setActiveTab] = useState("queue");

  if (!org) return null;

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePostNow = () => {
    if (!composerText.trim()) return;
    toast("Post published successfully", "success");
    setComposerText("");
  };

  const handleSchedule = () => {
    if (!composerText.trim()) return;
    toast("Post scheduled", "success");
    setComposerText("");
  };

  const getPlatformById = (id: string) =>
    PLATFORMS.find((p) => p.id === id);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const contentTabs = [
    { id: "queue", label: "Queue" },
    { id: "published", label: "Published" },
    { id: "calendar", label: "Calendar" },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 h-[calc(100vh-56px)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="mb-4 shrink-0">
          <h1
            className="text-[20px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            Marketing
          </h1>
          <span className="data-label">SOCIAL COMMAND CENTER</span>
        </div>

        {/* Three-column layout */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* ── Left Column: Channels (200px) ── */}
          <div className="w-[200px] shrink-0 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardHeader>
                <span className="data-label">CHANNELS</span>
              </CardHeader>
              <div className="flex-1 overflow-y-auto py-1">
                {PLATFORMS.map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors"
                      style={{ color: "var(--text-primary)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <Icon size={15} style={{ color: p.color }} />
                      <span className="text-[13px] font-medium flex-1 truncate">
                        {p.name}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: p.connected
                            ? "var(--accent-green)"
                            : "var(--text-tertiary)",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                className="px-3 py-3"
                style={{ borderTop: "1px solid var(--border-primary)" }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() =>
                    toast("Connect a new channel", "info")
                  }
                >
                  <Plus size={14} />
                  Connect Channel
                </Button>
              </div>
            </Card>
          </div>

          {/* ── Center Column: Composer + Feed (flex-1) ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Post composer */}
            <Card className="mb-4 shrink-0">
              <CardContent className="py-3">
                <textarea
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  placeholder="What would you like to share?"
                  rows={4}
                  className="w-full text-[13px] bg-transparent border-none outline-none resize-none mb-3"
                  style={{
                    color: "var(--text-primary)",
                  }}
                />
                <div
                  className="flex items-center justify-between pt-3"
                  style={{
                    borderTop: "1px solid var(--border-primary)",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Platform toggles */}
                    {PLATFORMS.map((p) => {
                      const Icon = p.icon;
                      const selected = selectedPlatforms.has(p.id);
                      return (
                        <button
                          key={p.id}
                          onClick={() => togglePlatform(p.id)}
                          className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium transition-all"
                          style={{
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: selected
                              ? `${p.color}22`
                              : "transparent",
                            color: selected
                              ? p.color
                              : "var(--text-tertiary)",
                            border: selected
                              ? `1px solid ${p.color}44`
                              : "1px solid transparent",
                          }}
                        >
                          <Icon size={12} />
                          {p.name.split(" ")[0]}
                        </button>
                      );
                    })}
                    <span
                      className="text-[11px] ml-1 data-value"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {composerText.length} chars
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleSchedule}
                    >
                      <Calendar size={13} />
                      Schedule
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handlePostNow}
                      disabled={!composerText.trim()}
                    >
                      <Send size={13} />
                      Post Now
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs
              tabs={contentTabs}
              active={activeTab}
              onChange={setActiveTab}
              className="mb-3 shrink-0"
            />

            {/* Tab content */}
            <Card className="flex-1 overflow-y-auto">
              {activeTab === "queue" && (
                <div>
                  {mockQueuePosts.map((post, i) => (
                    <div
                      key={post.id}
                      className="px-4 py-3.5 transition-colors"
                      style={{
                        borderBottom:
                          i < mockQueuePosts.length - 1
                            ? "1px solid var(--border-secondary)"
                            : undefined,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <p
                        className="text-[13px] mb-2 line-clamp-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2">
                        {post.platforms.map((pid) => {
                          const plat = getPlatformById(pid);
                          if (!plat) return null;
                          const Icon = plat.icon;
                          return (
                            <Badge key={pid} variant="default">
                              <Icon
                                size={10}
                                style={{
                                  color: plat.color,
                                  marginRight: 4,
                                }}
                              />
                              {plat.name.split(" ")[0]}
                            </Badge>
                          );
                        })}
                        <span className="flex-1" />
                        <Clock
                          size={12}
                          style={{ color: "var(--text-tertiary)" }}
                        />
                        <span
                          className="text-[11px] data-value"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {formatDateTime(post.scheduledAt)}
                        </span>
                        <Badge variant="info">{post.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "published" && (
                <div>
                  {mockPublishedPosts.map((post, i) => (
                    <div
                      key={post.id}
                      className="px-4 py-3.5 transition-colors"
                      style={{
                        borderBottom:
                          i < mockPublishedPosts.length - 1
                            ? "1px solid var(--border-secondary)"
                            : undefined,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "var(--bg-tertiary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <p
                        className="text-[13px] mb-2 line-clamp-2"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {post.content}
                      </p>
                      <div className="flex items-center gap-2">
                        {post.platforms.map((pid) => {
                          const plat = getPlatformById(pid);
                          if (!plat) return null;
                          const Icon = plat.icon;
                          return (
                            <Badge key={pid} variant="default">
                              <Icon
                                size={10}
                                style={{
                                  color: plat.color,
                                  marginRight: 4,
                                }}
                              />
                              {plat.name.split(" ")[0]}
                            </Badge>
                          );
                        })}
                        <span className="flex-1" />
                        <div
                          className="flex items-center gap-3 text-[11px]"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          <span className="flex items-center gap-1">
                            <Heart size={11} /> {post.likes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle size={11} />{" "}
                            {post.comments}
                          </span>
                          <span className="flex items-center gap-1">
                            <Share2 size={11} /> {post.shares}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "calendar" && (
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                      (day) => (
                        <div key={day} className="text-center">
                          <p
                            className="text-[10px] font-medium mb-2 data-label"
                            style={{ letterSpacing: "0.05em" }}
                          >
                            {day}
                          </p>
                          <div
                            className="min-h-[80px] p-2 flex flex-col items-center gap-1"
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            {day === "Thu" && (
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: "#0A66C2" }}
                                title="LinkedIn post scheduled"
                              />
                            )}
                            {day === "Fri" && (
                              <>
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: "#0A66C2",
                                  }}
                                />
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: "#1877F2",
                                  }}
                                />
                              </>
                            )}
                            {day === "Sat" && (
                              <>
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: "#0A66C2",
                                  }}
                                />
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: "#1DA1F2",
                                  }}
                                />
                                <div
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{
                                    backgroundColor: "#1877F2",
                                  }}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* ── Right Column: Analytics (250px) ── */}
          <div className="w-[250px] shrink-0 flex flex-col gap-4">
            {/* Stats cards */}
            {[
              {
                label: "TOTAL POSTS",
                value: "47",
                color: "var(--accent-blue)",
              },
              {
                label: "ENGAGEMENT RATE",
                value: "4.2%",
                color: "var(--accent-green)",
              },
              {
                label: "TOP PLATFORM",
                value: "LinkedIn",
                color: "#0A66C2",
              },
              {
                label: "BEST TIME TO POST",
                value: "10:00 AM",
                color: "var(--accent-yellow)",
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="py-3">
                  <span className="data-label">{stat.label}</span>
                  <p
                    className="text-[22px] font-bold mt-1 data-value"
                    style={{ color: stat.color }}
                  >
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
