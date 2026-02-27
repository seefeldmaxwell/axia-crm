"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  TrendingUp,
  Briefcase,
  ListTodo,
  UserPlus,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDeals, useActivities, useLeads } from "@/hooks/use-data";
import { formatCurrency } from "@/lib/utils";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const statusDotColor: Record<string, string> = {
  "To Do": "var(--text-tertiary)",
  "In Progress": "var(--accent-blue)",
  Waiting: "var(--accent-yellow)",
  Done: "var(--accent-green)",
};

const stageBadgeVariant: Record<string, "default" | "success" | "warning" | "error" | "info" | "neutral"> = {
  Prospecting: "neutral",
  Qualification: "info",
  Proposal: "warning",
  Negotiation: "error",
  "Closed Won": "success",
  "Closed Lost": "default",
};

const ratingDotColor: Record<string, string> = {
  Hot: "var(--accent-red)",
  Warm: "var(--accent-yellow)",
  Cold: "var(--accent-blue)",
};

export default function HomePage() {
  const { user, org } = useAuth();

  const { data: deals, loading: dealsLoading, error: dealsError } = useDeals(org?.id);
  const { data: activities, loading: activitiesLoading, error: activitiesError } = useActivities(org?.id);
  const { data: leads, loading: leadsLoading, error: leadsError } = useLeads(org?.id);

  const loading = dealsLoading || activitiesLoading || leadsLoading;
  const error = dealsError || activitiesError || leadsError;

  const data = useMemo(() => {
    if (!deals || !activities || !leads) return null;

    const activeDeals = deals.filter((d) => !d.stage.startsWith("Closed"));
    const pipelineValue = activeDeals.reduce((sum, d) => sum + d.amount, 0);
    const openTasks = activities.filter((a) => a.status !== "Done");
    const newLeads = leads.filter((l) => l.status === "New");

    const priorityTasks = activities
      .filter((a) => a.status !== "Done")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    const topDeals = deals
      .filter((d) => !d.stage.startsWith("Closed"))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    const recentLeads = [...leads]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);

    return {
      pipelineValue,
      activeDealCount: activeDeals.length,
      openTaskCount: openTasks.length,
      newLeadCount: newLeads.length,
      priorityTasks,
      topDeals,
      recentLeads,
    };
  }, [deals, activities, leads]);

  if (!user || !org) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-[13px] mb-2" style={{ color: "var(--accent-red)" }}>Failed to load dashboard data</p>
            <button onClick={() => window.location.reload()} className="text-[12px] px-3 py-1.5" style={{ color: "var(--accent-blue)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-sm)" }}>Retry</button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!data) return null;

  const today = format(new Date(), "MMM dd, yyyy").toUpperCase();
  const firstName = user.name.split(" ")[0];

  const stats = [
    {
      label: "PIPELINE VALUE",
      value: formatCurrency(data.pipelineValue),
      icon: TrendingUp,
    },
    {
      label: "ACTIVE DEALS",
      value: data.activeDealCount.toString(),
      icon: Briefcase,
    },
    {
      label: "OPEN TASKS",
      value: data.openTaskCount.toString(),
      icon: ListTodo,
    },
    {
      label: "NEW LEADS",
      value: data.newLeadCount.toString(),
      icon: UserPlus,
    },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-[1100px] mx-auto px-6 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1
            className="text-[20px] font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {getGreeting()}, {firstName}
          </h1>
          <p
            className="mt-1 text-[11px] uppercase tracking-[0.1em]"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-tertiary)",
            }}
          >
            COMMAND CENTER &bull; {today}
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="data-label"
                    style={{ fontSize: "10px" }}
                  >
                    {s.label}
                  </span>
                  <s.icon
                    size={14}
                    style={{ color: "var(--text-tertiary)" }}
                    strokeWidth={1.5}
                  />
                </div>
                <p
                  className="text-[26px] font-bold leading-none metric-glow data-value num"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-primary)",
                  }}
                >
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Priority Tasks — 2 cols */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="data-label" style={{ fontSize: "10px" }}>
                    PRIORITY TASKS
                  </span>
                  <Link
                    href="/activities"
                    className="flex items-center gap-0.5 text-[11px] transition-colors"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: "var(--accent-blue)",
                    }}
                  >
                    View All
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {data.priorityTasks.length === 0 ? (
                  <div
                    className="py-10 text-center text-[13px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    All tasks complete.
                  </div>
                ) : (
                  <div>
                    {data.priorityTasks.map((task, i) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer"
                        style={{
                          borderBottom:
                            i < data.priorityTasks.length - 1
                              ? "1px solid var(--border-secondary)"
                              : "none",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "var(--bg-tertiary)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        {/* Status dot */}
                        <div
                          className="status-dot shrink-0"
                          style={{
                            background:
                              statusDotColor[task.status] ||
                              "var(--text-tertiary)",
                          }}
                        />
                        {/* Subject */}
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] truncate"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {task.subject}
                          </p>
                        </div>
                        {/* Due date */}
                        <span
                          className="text-[11px] shrink-0"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color:
                              task.dueDate < format(new Date(), "yyyy-MM-dd")
                                ? "var(--accent-red)"
                                : task.dueDate ===
                                  format(new Date(), "yyyy-MM-dd")
                                ? "var(--accent-yellow)"
                                : "var(--text-tertiary)",
                          }}
                        >
                          {task.dueDate < format(new Date(), "yyyy-MM-dd")
                            ? "OVERDUE"
                            : task.dueDate === format(new Date(), "yyyy-MM-dd")
                            ? "TODAY"
                            : format(
                                new Date(task.dueDate + "T12:00:00"),
                                "MMM d"
                              )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Deals — 1 col */}
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="data-label" style={{ fontSize: "10px" }}>
                ACTIVE DEALS
              </span>
              <Link
                href="/deals"
                className="flex items-center gap-0.5 text-[11px] transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-blue)",
                }}
              >
                All
                <ChevronRight size={12} />
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {data.topDeals.length === 0 ? (
                <Card>
                  <CardContent>
                    <div
                      className="py-8 text-center text-[13px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      No active deals.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                data.topDeals.map((deal) => (
                  <Link key={deal.id} href="/deals" className="block">
                    <Card
                      className="transition-colors cursor-pointer"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor =
                          "var(--border-focus)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor =
                          "var(--border-primary)")
                      }
                    >
                      <CardContent className="py-3">
                        <div className="flex items-start justify-between mb-2">
                          <p
                            className="text-[13px] font-medium truncate pr-2"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {deal.name}
                          </p>
                          <span
                            className="text-[13px] font-bold num shrink-0"
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-primary)",
                            }}
                          >
                            {formatCurrency(deal.amount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              stageBadgeVariant[deal.stage] || "default"
                            }
                          >
                            {deal.stage}
                          </Badge>
                          <span
                            className="text-[11px] truncate"
                            style={{ color: "var(--text-tertiary)" }}
                          >
                            {deal.accountName}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="data-label" style={{ fontSize: "10px" }}>
                RECENT LEADS
              </span>
              <Link
                href="/leads"
                className="flex items-center gap-0.5 text-[11px] transition-colors"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent-blue)",
                }}
              >
                View All
                <ChevronRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.recentLeads.length === 0 ? (
              <div
                className="py-10 text-center text-[13px]"
                style={{ color: "var(--text-tertiary)" }}
              >
                No leads yet.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid var(--border-primary)",
                    }}
                  >
                    <th className="px-4 py-2.5 text-left">Name</th>
                    <th className="px-4 py-2.5 text-left">Company</th>
                    <th className="px-4 py-2.5 text-left">Rating</th>
                    <th className="px-4 py-2.5 text-left">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      className="cursor-pointer"
                      style={{
                        borderBottom: "1px solid var(--border-secondary)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--bg-tertiary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[13px] font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {lead.firstName} {lead.lastName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[13px]"
                          style={{ color: "var(--text-secondary)" }}
                        >
                          {lead.company}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="status-dot"
                            style={{
                              background:
                                ratingDotColor[lead.rating] ||
                                "var(--text-tertiary)",
                            }}
                          />
                          <span
                            className="text-[12px]"
                            style={{
                              fontFamily: "var(--font-mono)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {lead.rating}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className="text-[12px]"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {lead.source}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
