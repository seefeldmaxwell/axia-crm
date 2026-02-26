"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { getActivities, setActivities } from "@/lib/store";
import { Activity, ActivityStatus, ActivityType } from "@/lib/types";
import { generateId } from "@/lib/utils";
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from "@hello-pangea/dnd";
import {
  Plus, Filter, Settings2, Star, ChevronDown, ChevronLeft,
  LayoutGrid, BarChart3, List,
} from "lucide-react";

type BoardColumn = {
  id: string;
  label: string;
  color: string;
  subColumns?: { id: string; label: string }[];
  wipLimit: number;
};

const COLUMNS: BoardColumn[] = [
  { id: "new", label: "New", color: "#605E5C", wipLimit: 10 },
  {
    id: "active", label: "Active", color: "#0078D4", wipLimit: 10,
    subColumns: [
      { id: "active-inprogress", label: "In Progress" },
      { id: "active-waiting", label: "Waiting" },
    ],
  },
  { id: "resolved", label: "Resolved", color: "#107C10", wipLimit: 10 },
  { id: "closed", label: "Closed", color: "#605E5C", wipLimit: 10 },
];

const STATUS_TO_COL: Record<ActivityStatus, string> = {
  "To Do": "new",
  "In Progress": "active-inprogress",
  "Waiting": "active-waiting",
  "Done": "closed",
};

const COL_TO_STATUS: Record<string, ActivityStatus> = {
  "new": "To Do",
  "active-inprogress": "In Progress",
  "active-waiting": "Waiting",
  "resolved": "Waiting",
  "closed": "Done",
};

function pseudoWorkItemId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0x7fffff;
  }
  return String(100000 + (hash % 900000));
}

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  task: { bg: "rgba(0,120,212,0.15)", text: "#0078D4" },
  call: { bg: "rgba(164,38,44,0.15)", text: "#A4262C" },
  email: { bg: "rgba(255,185,0,0.15)", text: "#FFB900" },
  meeting: { bg: "rgba(135,100,184,0.15)", text: "#8764B8" },
};

export default function ActivitiesPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [activities, setActivitiesLocal] = useState<Activity[]>([]);
  const [activeTab, setActiveTab] = useState<"board" | "analytics" | "backlog">("board");
  const [showNew, setShowNew] = useState(false);
  const [newColId, setNewColId] = useState("new");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState({
    subject: "", type: "task" as ActivityType, dueDate: "",
  });

  useEffect(() => {
    if (org) setActivitiesLocal(getActivities(org.id));
  }, [org]);

  // Group items into drop zones
  const dropZoneItems = useMemo(() => {
    const groups: Record<string, Activity[]> = {
      "new": [],
      "active-inprogress": [],
      "active-waiting": [],
      "resolved": [],
      "closed": [],
    };
    activities.forEach((a) => {
      const colId = STATUS_TO_COL[a.status] || "new";
      if (groups[colId]) groups[colId].push(a);
    });
    return groups;
  }, [activities]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !org) return;
    const destColId = result.destination.droppableId;
    const newStatus = COL_TO_STATUS[destColId];
    if (!newStatus) return;
    const actId = result.draggableId;
    const allRaw = JSON.parse(localStorage.getItem("axia_activities") || "[]") as Activity[];
    const updated = allRaw.map((a) =>
      a.id === actId ? {
        ...a,
        status: newStatus,
        ...(newStatus === "Done" ? { completedAt: new Date().toISOString().split("T")[0] } : {}),
      } : a
    );
    setActivities(updated);
    setActivitiesLocal(updated.filter((a) => a.orgId === org.id));
    toast(`Activity moved to ${newStatus}`);
  };

  const handleCreate = () => {
    if (!org || !form.subject) return;
    const targetStatus = COL_TO_STATUS[newColId] || "To Do";
    const newAct: Activity = {
      id: generateId(),
      type: form.type,
      subject: form.subject,
      status: targetStatus,
      dueDate: form.dueDate || new Date().toISOString().split("T")[0],
      ownerId: user?.id || "1",
      ownerName: user?.name || "Demo User",
      orgId: org.id,
      createdAt: new Date().toISOString().split("T")[0],
    };
    const allRaw = JSON.parse(localStorage.getItem("axia_activities") || "[]") as Activity[];
    const updated = [...allRaw, newAct];
    setActivities(updated);
    setActivitiesLocal(updated.filter((a) => a.orgId === org.id));
    setShowNew(false);
    setForm({ subject: "", type: "task", dueDate: "" });
    toast("Activity created");
  };

  const toggleCollapse = (colId: string) => {
    setCollapsed((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const renderCard = (act: Activity, dragProvided: any, dragSnapshot: any, color: string) => (
    <div
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      {...dragProvided.dragHandleProps}
      className="ab-card cursor-grab active:cursor-grabbing mb-1.5"
      style={{
        ...dragProvided.draggableProps.style,
        background: "var(--ab-card)",
        border: "1px solid var(--ab-border)",
        borderLeft: `3px solid ${color}`,
        borderRadius: "2px",
        boxShadow: dragSnapshot.isDragging ? "0 6px 20px rgba(0,0,0,.3)" : "none",
      }}
    >
      <div className="p-3">
        {/* ID + Subject */}
        <div className="flex items-start gap-1.5 mb-2">
          <span className="text-[11px] mt-[1px]" style={{ color: "var(--ab-text-secondary)" }}>&#9675;</span>
          <span className="text-[11px] font-bold" style={{ color: "var(--ab-blue)", fontFamily: "var(--font-mono)" }}>
            #{pseudoWorkItemId(act.id)}
          </span>
          <span className="text-[13px] font-medium leading-tight" style={{ color: "var(--ab-text)" }}>
            {act.subject}
          </span>
        </div>

        {/* Assigned person */}
        <div className="flex items-center gap-1.5 mb-2">
          <Avatar name={act.ownerName} size="sm" />
          <span className="text-[12px]" style={{ color: "var(--ab-text-secondary)" }}>{act.ownerName}</span>
        </div>

        {/* Priority */}
        <div className="text-[11px] mb-1" style={{ color: "var(--ab-text-secondary)" }}>
          Priority: 2
        </div>

        {/* State */}
        <div className="flex items-center gap-1 text-[11px] mb-1" style={{ color: "var(--ab-text-secondary)" }}>
          State:
          <span className="status-dot" style={{
            background: act.status === "To Do" ? "#605E5C" : act.status === "In Progress" ? "#0078D4" : act.status === "Waiting" ? "#FFB900" : "#107C10",
          }} />
          <span>{act.status}</span>
        </div>

        {/* Area Path */}
        <div className="text-[11px] mb-2" style={{ color: "var(--ab-text-secondary)" }}>
          Area Path: {org?.name || "Axia"}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          <span className="text-[10px] px-1.5 py-[1px]" style={{
            background: TAG_COLORS[act.type]?.bg || TAG_COLORS.task.bg,
            color: TAG_COLORS[act.type]?.text || TAG_COLORS.task.text,
            borderRadius: "2px",
          }}>
            {act.type.charAt(0).toUpperCase() + act.type.slice(1)}
          </span>
          {act.dueDate && new Date(act.dueDate) < new Date() && act.status !== "Done" && (
            <span className="text-[10px] px-1.5 py-[1px]" style={{ background: "rgba(164,38,44,0.15)", color: "#A4262C", borderRadius: "2px" }}>
              Overdue
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const renderDroppable = (droppableId: string, items: Activity[], color: string) => (
    <Droppable droppableId={droppableId}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex-1 p-1 space-y-0 transition-colors overflow-y-auto"
          style={{
            minHeight: 80,
            background: snapshot.isDraggingOver ? "rgba(0,120,212,0.06)" : "transparent",
          }}
        >
          {items.map((act, index) => (
            <Draggable key={act.id} draggableId={act.id} index={index}>
              {(dragProvided, dragSnapshot) => renderCard(act, dragProvided, dragSnapshot, color)}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );

  if (!org) return null;

  return (
    <DashboardLayout>
      <div className="azure-board flex flex-col h-full" style={{ background: "var(--ab-bg)", color: "var(--ab-text)" }}>
        {/* Top bar */}
        <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--ab-border)" }}>
          <div className="flex items-center gap-2 text-[12px] mb-2" style={{ color: "var(--ab-text-secondary)" }}>
            <span>Axia</span><span>/</span>
            <span>{org.name}</span><span>/</span>
            <span>Boards</span><span>/</span>
            <span style={{ color: "var(--ab-text)", fontWeight: 600 }}>Activities</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold" style={{ color: "var(--ab-text)" }}>{org.name} Team</span>
                <ChevronDown size={14} style={{ color: "var(--ab-text-secondary)" }} />
                <Star size={14} style={{ color: "var(--ab-text-secondary)" }} />
              </div>

              <div className="flex items-center">
                {(["board", "analytics", "backlog"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className="px-3 py-1.5 text-[13px] font-medium relative"
                    style={{ color: activeTab === tab ? "var(--ab-blue)" : "var(--ab-text-secondary)" }}
                  >
                    {tab === "board" && <><LayoutGrid size={14} className="inline mr-1.5" />Board</>}
                    {tab === "analytics" && <><BarChart3 size={14} className="inline mr-1.5" />Analytics</>}
                    {tab === "backlog" && <><List size={14} className="inline mr-1.5" />View as Backlog</>}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--ab-blue)" }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-1.5" style={{ color: "var(--ab-text-secondary)" }}><Filter size={16} /></button>
              <button className="p-1.5" style={{ color: "var(--ab-text-secondary)" }}><Settings2 size={16} /></button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-2 min-h-[500px]">
              {COLUMNS.map((col) => {
                const isCollapsed = collapsed[col.id];

                if (isCollapsed) {
                  return (
                    <div key={col.id} className="flex-shrink-0 w-[40px] flex flex-col items-center py-2 cursor-pointer"
                      style={{ background: "var(--ab-header)", borderTop: `2px solid ${col.color}` }}
                      onClick={() => toggleCollapse(col.id)}
                    >
                      <span className="text-[11px] font-semibold writing-mode-vertical" style={{ color: "var(--ab-text)", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                        {col.label}
                      </span>
                    </div>
                  );
                }

                if (col.subColumns) {
                  // Active column with sub-columns
                  const allActiveItems = [...(dropZoneItems["active-inprogress"] || []), ...(dropZoneItems["active-waiting"] || [])];
                  const overWip = allActiveItems.length >= col.wipLimit;

                  return (
                    <div key={col.id} className="flex-shrink-0 flex flex-col" style={{ width: 480 }}>
                      <div style={{ borderTop: `2px solid ${col.color}` }}>
                        <div className="flex items-center justify-between px-2 py-2" style={{ background: "var(--ab-header)" }}>
                          <div className="flex items-center gap-2">
                            <button onClick={() => toggleCollapse(col.id)} className="p-0.5" style={{ color: "var(--ab-text-secondary)" }}>
                              <ChevronLeft size={14} />
                            </button>
                            <span className="text-[13px] font-semibold" style={{ color: "var(--ab-text)" }}>{col.label}</span>
                            <span className="text-[11px] px-1.5 py-0.5" style={{
                              background: "var(--ab-border)", borderRadius: "2px",
                              color: overWip ? "var(--ab-red)" : "var(--ab-text-secondary)",
                              fontFamily: "var(--font-mono)",
                            }}>
                              {allActiveItems.length}/{col.wipLimit}
                            </span>
                          </div>
                        </div>
                        {/* Sub-column headers */}
                        <div className="flex" style={{ borderTop: "1px solid var(--ab-border)" }}>
                          {col.subColumns.map((sub) => (
                            <div key={sub.id} className="flex-1 px-2 py-1.5 text-[11px] font-semibold" style={{
                              color: "var(--ab-text-secondary)", background: "var(--ab-header)",
                              borderRight: "1px solid var(--ab-border)",
                              textTransform: "uppercase", letterSpacing: "0.05em",
                            }}>
                              {sub.label}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-1">
                        {col.subColumns.map((sub) => (
                          <div key={sub.id} className="flex-1" style={{ borderRight: "1px solid var(--ab-border)" }}>
                            {renderDroppable(sub.id, dropZoneItems[sub.id] || [], col.color)}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                // Regular column
                const items = dropZoneItems[col.id] || [];
                const overWip = items.length >= col.wipLimit;

                return (
                  <div key={col.id} className="flex-shrink-0 w-[280px] flex flex-col">
                    <div style={{ borderTop: `2px solid ${col.color}` }}>
                      <div className="flex items-center justify-between px-2 py-2" style={{ background: "var(--ab-header)" }}>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleCollapse(col.id)} className="p-0.5" style={{ color: "var(--ab-text-secondary)" }}>
                            <ChevronLeft size={14} />
                          </button>
                          <span className="text-[13px] font-semibold" style={{ color: "var(--ab-text)" }}>{col.label}</span>
                          <span className="text-[11px] px-1.5 py-0.5" style={{
                            background: "var(--ab-border)", borderRadius: "2px",
                            color: overWip ? "var(--ab-red)" : "var(--ab-text-secondary)",
                            fontFamily: "var(--font-mono)",
                          }}>
                            {items.length}/{col.wipLimit}
                          </span>
                        </div>
                        {col.id === "new" && (
                          <button
                            onClick={() => { setNewColId("new"); setShowNew(true); }}
                            className="p-0.5"
                            style={{ color: "var(--ab-blue)" }}
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {renderDroppable(col.id, items, col.color)}
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* New Activity Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Activity" size="sm">
        <div className="space-y-4">
          <Input label="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Activity subject" />
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as ActivityType })}
            options={[
              { value: "task", label: "Task" },
              { value: "call", label: "Call" },
              { value: "email", label: "Email" },
              { value: "meeting", label: "Meeting" },
            ]}
          />
          <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
