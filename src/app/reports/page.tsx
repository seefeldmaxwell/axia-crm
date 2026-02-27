"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { useDeals, useLeads, useActivities } from "@/hooks/use-data";
import { formatCurrency } from "@/lib/utils";
import type { DealStage } from "@/lib/types";
import { Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Hex values for recharts SVG (CSS vars don't work in SVG)
const C = {
  textTertiary: "#5C6378",
  borderPrimary: "#2A2D3A",
  accentBlue: "#2D7FF9",
  accentGreen: "#36B37E",
  accentRed: "#FF5630",
  accentYellow: "#FFAB00",
  accentPurple: "#6554C0",
  accentTeal: "#00B8D9",
  bgSecondary: "#151720",
};

const PIE_COLORS = [
  C.accentBlue,
  C.accentGreen,
  C.accentPurple,
  C.accentYellow,
  C.accentTeal,
];

const STAGE_COLORS: Record<string, string> = {
  Prospecting: C.accentTeal,
  Qualification: C.accentBlue,
  Proposal: C.accentPurple,
  Negotiation: C.accentYellow,
  "Closed Won": C.accentGreen,
  "Closed Lost": C.accentRed,
};

const tooltipStyle = {
  backgroundColor: C.bgSecondary,
  border: `1px solid ${C.borderPrimary}`,
  borderRadius: "4px",
  color: "#E8EAED",
  fontSize: "12px",
};

export default function ReportsPage() {
  const { org } = useAuth();
  const [ownerFilter, setOwnerFilter] = useState("all");

  const { data: deals, loading: dealsLoading, error: dealsError } = useDeals(org?.id);
  const { data: leads, loading: leadsLoading, error: leadsError } = useLeads(org?.id);
  const { data: activities, loading: activitiesLoading, error: activitiesError } = useActivities(
    org?.id
  );

  const loading = dealsLoading || leadsLoading || activitiesLoading;
  const error = dealsError || leadsError || activitiesError;

  const data = useMemo(() => {
    if (!deals || !leads || !activities) return null;

    let filteredDeals = deals;
    if (ownerFilter !== "all") {
      filteredDeals = deals.filter((d) => d.ownerName === ownerFilter);
    }

    // Pipeline by Stage
    const stages: DealStage[] = [
      "Prospecting",
      "Qualification",
      "Proposal",
      "Negotiation",
      "Closed Won",
      "Closed Lost",
    ];
    const pipelineByStage = stages.map((stage) => ({
      stage: stage.replace("Closed ", "C/"),
      fullStage: stage,
      value: filteredDeals
        .filter((d) => d.stage === stage)
        .reduce((sum, d) => sum + d.amount, 0),
      count: filteredDeals.filter((d) => d.stage === stage).length,
    }));

    // Revenue over time (last 6 months)
    const now = new Date();
    const revenueOverTime = Array.from({ length: 6 }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthStr = date.toLocaleDateString("en-US", { month: "short" });
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      const won = filteredDeals.filter((d) => {
        if (d.stage !== "Closed Won") return false;
        const cd = new Date(d.closeDate);
        return cd.getMonth() === monthIndex && cd.getFullYear() === year;
      });
      return {
        month: monthStr,
        revenue: won.reduce((sum, d) => sum + d.amount, 0),
      };
    });

    // Lead sources
    const sourceMap: Record<string, number> = {};
    leads.forEach((l) => {
      sourceMap[l.source] = (sourceMap[l.source] || 0) + 1;
    });
    const leadSources = Object.entries(sourceMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Activity trends (grouped by type)
    const activityTypes = ["call", "email", "meeting", "task"];
    const activityByType = activityTypes.map((type) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count: activities.filter((a) => a.type === type).length,
    }));

    // Win rate
    const closedDeals = filteredDeals.filter(
      (d) => d.stage === "Closed Won" || d.stage === "Closed Lost"
    );
    const wonDeals = closedDeals.filter((d) => d.stage === "Closed Won");
    const winRate =
      closedDeals.length > 0
        ? Math.round((wonDeals.length / closedDeals.length) * 100)
        : 0;

    // Pipeline value (open deals only)
    const pipelineValue = filteredDeals
      .filter((d) => !d.stage.startsWith("Closed"))
      .reduce((s, d) => s + d.amount, 0);

    // Total deals
    const totalDeals = filteredDeals.length;

    // Avg deal size
    const avgDealSize =
      filteredDeals.length > 0
        ? filteredDeals.reduce((s, d) => s + d.amount, 0) /
          filteredDeals.length
        : 0;

    // Owners for filter
    const owners = [...new Set(deals.map((d) => d.ownerName))];

    return {
      pipelineByStage,
      revenueOverTime,
      leadSources,
      activityByType,
      winRate,
      pipelineValue,
      totalDeals,
      avgDealSize,
      owners,
    };
  }, [deals, leads, activities, ownerFilter]);

  if (!org) return null;

  if (loading)
    return (
      <DashboardLayout>
        <div className="p-6 flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
        </div>
      </DashboardLayout>
    );

  if (error) return (
    <DashboardLayout>
      <div className="p-6 text-center py-20">
        <p className="text-[13px] mb-2" style={{ color: "var(--accent-red)" }}>Failed to load report data</p>
        <button onClick={() => window.location.reload()} className="text-[12px] px-3 py-1.5" style={{ color: "var(--accent-blue)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-sm)" }}>Retry</button>
      </div>
    </DashboardLayout>
  );

  if (!data) return null;

  const summaryCards = [
    {
      label: "WIN RATE",
      value: `${data.winRate}%`,
      color: C.accentGreen,
    },
    {
      label: "PIPELINE VALUE",
      value: formatCurrency(data.pipelineValue),
      color: C.accentBlue,
    },
    {
      label: "TOTAL DEALS",
      value: `${data.totalDeals}`,
      color: C.accentPurple,
    },
    {
      label: "AVG DEAL SIZE",
      value: formatCurrency(data.avgDealSize),
      color: C.accentTeal,
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-[20px] font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Reports
            </h1>
            <span className="data-label">ANALYTICS & INTELLIGENCE</span>
          </div>
          <div className="flex items-center gap-3">
            <Select
              label=""
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              options={[
                { value: "all", label: "All Owners" },
                ...data.owners.map((o) => ({ value: o, label: o })),
              ]}
            />
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {summaryCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="py-4">
                <span className="data-label">{card.label}</span>
                <p
                  className="text-[26px] font-bold mt-1 data-value num"
                  style={{ color: card.color }}
                >
                  {card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pipeline by Stage */}
          <Card>
            <CardHeader>
              <span className="data-label">PIPELINE BY STAGE</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.pipelineByStage}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={C.borderPrimary}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="stage"
                    tick={{ fontSize: 10, fill: C.textTertiary }}
                    axisLine={{ stroke: C.borderPrimary }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: C.textTertiary }}
                    axisLine={{ stroke: C.borderPrimary }}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Amount",
                    ]}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(45,127,249,0.08)" }}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]}>
                    {data.pipelineByStage.map((entry) => (
                      <Cell
                        key={entry.fullStage}
                        fill={STAGE_COLORS[entry.fullStage] || C.accentBlue}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Over Time */}
          <Card>
            <CardHeader>
              <span className="data-label">REVENUE OVER TIME</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.revenueOverTime}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={C.borderPrimary}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: C.textTertiary }}
                    axisLine={{ stroke: C.borderPrimary }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: C.textTertiary }}
                    axisLine={{ stroke: C.borderPrimary }}
                    tickLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      formatCurrency(value),
                      "Revenue",
                    ]}
                    contentStyle={tooltipStyle}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke={C.accentBlue}
                    strokeWidth={2}
                    dot={{
                      fill: C.accentBlue,
                      stroke: C.bgSecondary,
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{
                      fill: C.accentBlue,
                      stroke: "#fff",
                      strokeWidth: 2,
                      r: 5,
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Lead Sources */}
          <Card>
            <CardHeader>
              <span className="data-label">LEAD SOURCES</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {data.leadSources.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Activity Trends */}
          <Card>
            <CardHeader>
              <span className="data-label">ACTIVITY TRENDS</span>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.activityByType}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={C.borderPrimary}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="type"
                    tick={{ fontSize: 10, fill: C.textTertiary }}
                    axisLine={{ stroke: C.borderPrimary }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: C.textTertiary }}
                    axisLine={{ stroke: C.borderPrimary }}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, "Activities"]}
                    contentStyle={tooltipStyle}
                    cursor={{ fill: "rgba(45,127,249,0.08)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill={C.accentBlue}
                    radius={[3, 3, 0, 0]}
                  >
                    {data.activityByType.map((entry, i) => {
                      const colors = [
                        C.accentGreen,
                        C.accentBlue,
                        C.accentPurple,
                        C.accentYellow,
                      ];
                      return <Cell key={entry.type} fill={colors[i]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
