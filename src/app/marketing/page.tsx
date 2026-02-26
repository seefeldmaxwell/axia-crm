"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { api, mapMarketingPost, toSnake } from "@/lib/api";
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
  Loader2,
} from "lucide-react";

// ── Platform definitions ──

const PLATFORMS = [
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "#0A66C2", connected: true },
  { id: "x", name: "X (Twitter)", icon: Twitter, color: "#1DA1F2", connected: true },
  { id: "instagram", name: "Instagram", icon: Instagram, color: "#E1306C", connected: false },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "#1877F2", connected: true },
] as const;

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

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const raw = await api.getMarketingPosts();
      setPosts(raw.map(mapMarketingPost));
    } catch (err) {
      console.error("Failed to fetch marketing posts:", err);
      toast("Failed to load posts", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  if (!org) return null;

  const queuePosts = posts.filter(
    (p) => p.status === "Scheduled" || p.status === "Draft"
  );
  const publishedPosts = posts.filter((p) => p.status === "Published");

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

  const handlePostNow = async () => {
    if (!composerText.trim()) return;
    try {
      await api.createMarketingPost(
        toSnake({
          platform: Array.from(selectedPlatforms).join(","),
          text: composerText,
          status: "Published",
          orgId: org.id,
        })
      );
      toast("Post published successfully", "success");
      setComposerText("");
      await fetchPosts();
    } catch (err) {
      console.error("Failed to publish post:", err);
      toast("Failed to publish post", "error");
    }
  };

  const handleSchedule = async () => {
    if (!composerText.trim()) return;
    try {
      await api.createMarketingPost(
        toSnake({
          platform: Array.from(selectedPlatforms).join(","),
          text: composerText,
          status: "Scheduled",
          scheduledAt: new Date().toISOString(),
          orgId: org.id,
        })
      );
      toast("Post scheduled", "success");
      setComposerText("");
      await fetchPosts();
    } catch (err) {
      console.error("Failed to schedule post:", err);
      toast("Failed to schedule post", "error");
    }
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
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2
                    size={24}
                    className="animate-spin"
                    style={{ color: "var(--text-tertiary)" }}
                  />
                  <span
                    className="ml-2 text-[13px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    Loading posts...
                  </span>
                </div>
              )}

              {!loading && activeTab === "queue" && (
                <div>
                  {queuePosts.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <span
                        className="text-[13px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        No scheduled posts yet. Use the composer above to schedule one.
                      </span>
                    </div>
                  )}
                  {queuePosts.map((post, i) => (
                    <div
                      key={post.id}
                      className="px-4 py-3.5 transition-colors"
                      style={{
                        borderBottom:
                          i < queuePosts.length - 1
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
                        {post.text}
                      </p>
                      <div className="flex items-center gap-2">
                        {post.platform.split(",").map((pid: string) => {
                          const plat = getPlatformById(pid.trim());
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
                        {post.scheduledAt && (
                          <>
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
                          </>
                        )}
                        <Badge variant="info">{post.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && activeTab === "published" && (
                <div>
                  {publishedPosts.length === 0 && (
                    <div className="flex items-center justify-center py-12">
                      <span
                        className="text-[13px]"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        No published posts yet. Use the composer above to publish one.
                      </span>
                    </div>
                  )}
                  {publishedPosts.map((post, i) => (
                    <div
                      key={post.id}
                      className="px-4 py-3.5 transition-colors"
                      style={{
                        borderBottom:
                          i < publishedPosts.length - 1
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
                        {post.text}
                      </p>
                      <div className="flex items-center gap-2">
                        {post.platform.split(",").map((pid: string) => {
                          const plat = getPlatformById(pid.trim());
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
                        <span
                          className="text-[11px] data-value"
                          style={{ color: "var(--text-tertiary)" }}
                        >
                          {formatDateTime(post.createdAt)}
                        </span>
                        <Badge variant="success">Published</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && activeTab === "calendar" && (
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
