"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { api, mapActivity, mapActivityItem, toSnake } from "@/lib/api";
import { Activity, ActivityStatus, ActivityType, ActivityItem } from "@/lib/types";
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from "@hello-pangea/dnd";
import {
  Plus, Filter, Settings2, Star, ChevronDown, ChevronRight,
  LayoutGrid, BarChart3, List, Loader2, Check, X, Trash2,
} from "lucide-react";

const COLUMNS: { id: ActivityStatus; label: string; color: string; wipLimit: number }[] = [
  { id: "To Do", label: "To Do", color: "#605E5C", wipLimit: 10 },
  { id: "In Progress", label: "In Progress", color: "#0078D4", wipLimit: 10 },
  { id: "Waiting", label: "Waiting", color: "#FFB900", wipLimit: 10 },
  { id: "Done", label: "Done", color: "#107C10", wipLimit: 10 },
];

function pseudoId(id: string): string {
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

/* ── Sub-Items component for each activity card ── */

function ActivitySubItems({ activityId }: { activityId: string }) {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const raw = await api.getActivityItems(activityId);
      setItems(raw.map(mapActivityItem));
    } catch { /* silent */ }
  }, [activityId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);
  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus(); }, [adding]);

  const handleAdd = async () => {
    if (!newTitle.trim()) { setAdding(false); return; }
    try {
      await api.createActivityItem(activityId, { title: newTitle.trim(), sort_order: items.length });
      setNewTitle("");
      setAdding(false);
      await fetchItems();
    } catch { /* silent */ }
  };

  const handleToggle = async (item: ActivityItem) => {
    const updated = !item.completed;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: updated } : i));
    try {
      await api.updateActivityItem(activityId, item.id, { completed: updated });
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: !updated } : i));
    }
  };

  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try { await api.deleteActivityItem(activityId, itemId); } catch { await fetchItems(); }
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--ab-border)" }}>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px]"
          style={{ color: "var(--ab-text-secondary)" }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>Sub-items</span>
          {items.length > 0 && (
            <span style={{ fontFamily: "var(--font-mono)" }}>{completedCount}/{items.length}</span>
          )}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(true); setAdding(true); }}
          className="p-0.5 rounded"
          style={{ color: "var(--ab-blue)" }}
          title="Add sub-item"
        >
          <Plus size={14} />
        </button>
      </div>

      {items.length > 0 && (
        <div className="mt-1 h-[3px] rounded-full overflow-hidden" style={{ background: "var(--ab-border)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(completedCount / items.length) * 100}%`,
              background: completedCount === items.length ? "var(--ab-green)" : "var(--ab-blue)",
            }}
          />
        </div>
      )}

      {expanded && (
        <div className="mt-1.5 space-y-1">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-1.5 group">
              <button
                onClick={() => handleToggle(item)}
                className="flex-shrink-0 w-[14px] h-[14px] rounded-sm flex items-center justify-center"
                style={{
                  border: item.completed ? "none" : "1.5px solid var(--ab-text-secondary)",
                  background: item.completed ? "var(--ab-green)" : "transparent",
                }}
              >
                {item.completed && <Check size={10} color="#fff" strokeWidth={3} />}
              </button>
              <span
                className="text-[11px] flex-1 leading-tight"
                style={{
                  color: item.completed ? "var(--ab-text-secondary)" : "var(--ab-text)",
                  textDecoration: item.completed ? "line-through" : "none",
                }}
              >
                {item.title}
              </span>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-0.5 transition-opacity"
                style={{ color: "var(--ab-red)" }}
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          {adding && (
            <div className="flex items-center gap-1">
              <input
                ref={inputRef}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") { setAdding(false); setNewTitle(""); }
                }}
                placeholder="Add sub-item..."
                className="flex-1 text-[11px] px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--ab-header)",
                  border: "1px solid var(--ab-border)",
                  color: "var(--ab-text)",
                  outline: "none",
                }}
              />
              <button onClick={handleAdd} className="p-0.5" style={{ color: "var(--ab-green)" }}><Check size={12} /></button>
              <button onClick={() => { setAdding(false); setNewTitle(""); }} className="p-0.5" style={{ color: "var(--ab-text-secondary)" }}><X size={12} /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Activities Page ── */

export default function ActivitiesPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [activities, setActivitiesLocal] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "analytics" | "backlog">("board");
  const [showNew, setShowNew] = useState(false);
  const [newStatus, setNewStatus] = useState<ActivityStatus>("To Do");

  const [form, setForm] = useState({
    subject: "", type: "task" as ActivityType, dueDate: "",
  });

  const fetchActivities = useCallback(async () => {
    if (!org) return;
    try {
      setLoading(true);
      const raw = await api.getActivities();
      setActivitiesLocal(raw.map(mapActivity) as Activity[]);
    } catch (err) {
      console.error("Failed to fetch activities", err);
      toast("Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [org, toast]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const columnItems = useMemo(() => {
    const groups: Record<string, Activity[]> = {};
    COLUMNS.forEach((c) => { groups[c.id] = []; });
    activities.forEach((a) => {
      if (groups[a.status]) groups[a.status].push(a);
    });
    return groups;
  }, [activities]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !org) return;
    const destStatus = result.destination.droppableId as ActivityStatus;
    const actId = result.draggableId;

    setActivitiesLocal((prev) =>
      prev.map((a) =>
        a.id === actId
          ? {
              ...a,
              status: destStatus,
              ...(destStatus === "Done" ? { completedAt: new Date().toISOString().split("T")[0] } : {}),
            }
          : a
      )
    );
    toast(`Activity moved to ${destStatus}`);

    try {
      await api.updateActivity(
        actId,
        toSnake({
          status: destStatus,
          ...(destStatus === "Done" ? { completedAt: new Date().toISOString().split("T")[0] } : {}),
        })
      );
      await fetchActivities();
    } catch (err) {
      console.error("Failed to update activity", err);
      toast("Failed to update activity");
      await fetchActivities();
    }
  };

  const handleCreate = async () => {
    if (!org || !form.subject) return;
    try {
      await api.createActivity(
        toSnake({
          type: form.type,
          subject: form.subject,
          status: newStatus,
          dueDate: form.dueDate || new Date().toISOString().split("T")[0],
          ownerId: user?.id || "",
          ownerName: user?.name || "",
          orgId: org.id,
          createdAt: new Date().toISOString().split("T")[0],
        })
      );
      await fetchActivities();
      setShowNew(false);
      setForm({ subject: "", type: "task", dueDate: "" });
      toast("Activity created");
    } catch (err) {
      console.error("Failed to create activity", err);
      toast("Failed to create activity");
    }
  };

  const openNewForStatus = (status: ActivityStatus) => {
    setNewStatus(status);
    setShowNew(true);
  };

  if (!org) return null;

  return (
    <DashboardLayout>
      <div className="azure-board flex flex-col h-full" style={{ background: "var(--ab-bg)", color: "var(--ab-text)" }}>
        {/* Top bar */}
        <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--ab-border)" }}>
          <div className="flex items-center gap-2 text-[12px] mb-2" style={{ color: "var(--ab-text-secondary)" }}>
            <span>Axia</span><span>/</span>
            <span>{user?.name || "Axia"}</span><span>/</span>
            <span>Boards</span><span>/</span>
            <span style={{ color: "var(--ab-text)", fontWeight: 600 }}>Activities</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold" style={{ color: "var(--ab-text)" }}>{user?.name || "My"} Board</span>
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
                    {tab === "board" && <LayoutGrid size={14} className="inline mr-1.5" />}
                    {tab === "analytics" && <BarChart3 size={14} className="inline mr-1.5" />}
                    {tab === "backlog" && <List size={14} className="inline mr-1.5" />}
                    {tab === "board" ? "Board" : tab === "analytics" ? "Analytics" : "View as Backlog"}
                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--ab-blue)" }} />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px]" style={{ fontFamily: "var(--font-mono)", color: "var(--ab-text-secondary)" }}>
                Total: {activities.length}
              </span>
              <button className="p-1.5" style={{ color: "var(--ab-text-secondary)" }}><Filter size={16} /></button>
              <button className="p-1.5" style={{ color: "var(--ab-text-secondary)" }}><Settings2 size={16} /></button>
            </div>
          </div>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-x-auto p-4">
          {loading && activities.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin" size={32} style={{ color: "var(--ab-text-secondary)" }} />
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-2 min-h-[500px]">
                {COLUMNS.map((col) => {
                  const items = columnItems[col.id] || [];
                  const overWip = items.length >= col.wipLimit;
                  return (
                    <div key={col.id} className="flex-shrink-0 w-[280px] flex flex-col">
                      {/* Column header */}
                      <div className="mb-1" style={{ borderTop: `3px solid ${col.color}` }}>
                        <div className="flex items-center justify-between px-2 py-2" style={{ background: "var(--ab-header)" }}>
                          <div className="flex items-center gap-2">
                            <span className="text-[13px] font-semibold" style={{ color: "var(--ab-text)" }}>{col.label}</span>
                            <span
                              className="text-[11px] px-1.5 py-0.5"
                              style={{
                                background: "var(--ab-border)",
                                borderRadius: "2px",
                                color: overWip ? "var(--ab-red)" : "var(--ab-text-secondary)",
                                fontWeight: overWip ? 700 : 400,
                                fontFamily: "var(--font-mono)",
                              }}
                            >
                              {items.length}
                            </span>
                          </div>
                          <button
                            onClick={() => openNewForStatus(col.id)}
                            className="p-0.5"
                            style={{ color: "var(--ab-blue)" }}
                            title={`Add activity to ${col.label}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Cards */}
                      <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="flex-1 p-1 space-y-1.5 transition-colors"
                            style={{
                              minHeight: 100,
                              background: snapshot.isDraggingOver ? "rgba(0,120,212,0.06)" : "transparent",
                            }}
                          >
                            {items.map((act, index) => (
                              <Draggable key={act.id} draggableId={act.id} index={index}>
                                {(dragProvided, dragSnapshot) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className="ab-card cursor-grab active:cursor-grabbing"
                                    style={{
                                      ...dragProvided.draggableProps.style,
                                      background: "var(--ab-card)",
                                      border: "1px solid var(--ab-border)",
                                      borderTop: `3px solid ${col.color}`,
                                      borderRadius: "2px",
                                      boxShadow: dragSnapshot.isDragging ? "0 6px 20px rgba(0,0,0,.3)" : "none",
                                    }}
                                  >
                                    <div className="p-3">
                                      {/* ID + Subject */}
                                      <div className="flex items-start gap-1.5 mb-2">
                                        <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "var(--ab-blue)", fontFamily: "var(--font-mono)" }}>
                                          #{pseudoId(act.id)}
                                        </span>
                                        <span className="text-[13px] font-medium leading-tight" style={{ color: "var(--ab-text)" }}>
                                          {act.subject}
                                        </span>
                                      </div>

                                      {/* Assigned */}
                                      <div className="flex items-center gap-1.5 mb-2">
                                        <Avatar name={act.ownerName || "?"} size="sm" />
                                        <span className="text-[12px]" style={{ color: "var(--ab-text-secondary)" }}>{act.ownerName || "Unassigned"}</span>
                                      </div>

                                      {/* Due Date + Status row */}
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="text-[11px]" style={{ color: "var(--ab-text-secondary)" }}>
                                          {act.dueDate ? `Due: ${act.dueDate}` : "No due date"}
                                        </span>
                                        <span
                                          className="status-dot"
                                          style={{
                                            background: col.color,
                                          }}
                                        />
                                      </div>

                                      {/* Priority */}
                                      <div className="flex items-center gap-1 text-[11px] mb-1" style={{ color: "var(--ab-text-secondary)" }}>
                                        <span
                                          className="status-dot"
                                          style={{
                                            background: act.dueDate && new Date(act.dueDate) < new Date() && act.status !== "Done"
                                              ? "var(--ab-red)"
                                              : "var(--ab-green)",
                                          }}
                                        />
                                        <span>
                                          {act.dueDate && new Date(act.dueDate) < new Date() && act.status !== "Done"
                                            ? "Overdue"
                                            : "On Track"}
                                        </span>
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

                                      {/* Sub-items */}
                                      <ActivitySubItems activityId={act.id} />
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          )}
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
