"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Select } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/toast";
import { api, mapDeal, mapDealItem, toSnake } from "@/lib/api";
import { Deal, DealStage, DealItem } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import {
  DragDropContext, Droppable, Draggable, DropResult,
} from "@hello-pangea/dnd";
import {
  Plus, Filter, Settings2, Star, ChevronDown, ChevronRight,
  LayoutGrid, BarChart3, List, Loader2, Check, X, Trash2,
} from "lucide-react";

const STAGES: { id: DealStage; label: string; color: string; wipLimit: number }[] = [
  { id: "Prospecting", label: "Prospecting", color: "#605E5C", wipLimit: 10 },
  { id: "Qualification", label: "Qualification", color: "#0078D4", wipLimit: 10 },
  { id: "Proposal", label: "Proposal", color: "#FFB900", wipLimit: 10 },
  { id: "Negotiation", label: "Negotiation", color: "#8764B8", wipLimit: 10 },
  { id: "Closed Won", label: "Closed Won", color: "#107C10", wipLimit: 10 },
  { id: "Closed Lost", label: "Closed Lost", color: "#A4262C", wipLimit: 10 },
];

function pseudoId(dealId: string): string {
  let hash = 0;
  for (let i = 0; i < dealId.length; i++) {
    hash = (hash * 31 + dealId.charCodeAt(i)) & 0x7fffff;
  }
  return String(100000 + (hash % 900000));
}

/* ── Sub-Items component for each deal card ── */

function DealSubItems({ dealId }: { dealId: string }) {
  const [items, setItems] = useState<DealItem[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      const raw = await api.getDealItems(dealId);
      setItems(raw.map(mapDealItem));
    } catch {
      // silent
    }
  }, [dealId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  useEffect(() => {
    if (adding && inputRef.current) inputRef.current.focus();
  }, [adding]);

  const handleAdd = async () => {
    if (!newTitle.trim()) { setAdding(false); return; }
    try {
      await api.createDealItem(dealId, { title: newTitle.trim(), sort_order: items.length });
      setNewTitle("");
      setAdding(false);
      await fetchItems();
    } catch { /* silent */ }
  };

  const handleToggle = async (item: DealItem) => {
    const updated = !item.completed;
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: updated } : i));
    try {
      await api.updateDealItem(dealId, item.id, { completed: updated });
    } catch {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, completed: !updated } : i));
    }
  };

  const handleDelete = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await api.deleteDealItem(dealId, itemId);
    } catch { await fetchItems(); }
  };

  const completedCount = items.filter((i) => i.completed).length;

  return (
    <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--ab-border)" }}>
      {/* Header row: expand toggle + add button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px]"
          style={{ color: "var(--ab-text-secondary)" }}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>Sub-items</span>
          {items.length > 0 && (
            <span style={{ fontFamily: "var(--font-mono)" }}>
              {completedCount}/{items.length}
            </span>
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

      {/* Progress bar */}
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

      {/* Expanded items list */}
      {expanded && (
        <div className="mt-1.5 space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1.5 group"
            >
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

          {/* Inline add form */}
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

/* ── Main Deals Page ── */

export default function DealsPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [deals, setDealsLocal] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"board" | "analytics" | "backlog">("board");
  const [showNew, setShowNew] = useState(false);
  const [newStage, setNewStage] = useState<DealStage>("Prospecting");

  const [form, setForm] = useState({
    name: "", amount: "", stage: "Prospecting" as DealStage,
    closeDate: "", accountName: "",
  });

  const fetchDeals = useCallback(async () => {
    try {
      const raw = await api.getDeals();
      setDealsLocal(raw.map(mapDeal));
    } catch (err) {
      console.error("Failed to fetch deals", err);
      toast("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (org) fetchDeals();
  }, [org, fetchDeals]);

  const columnItems = useMemo(() => {
    const groups: Record<string, Deal[]> = {};
    STAGES.forEach((s) => { groups[s.id] = []; });
    deals.forEach((d) => {
      if (groups[d.stage]) groups[d.stage].push(d);
    });
    return groups;
  }, [deals]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !org) return;
    const destStage = result.destination.droppableId as DealStage;
    const dealId = result.draggableId;

    setDealsLocal((prev) =>
      prev.map((d) =>
        d.id === dealId
          ? {
              ...d,
              stage: destStage,
              probability: destStage === "Closed Won" ? 100 : destStage === "Closed Lost" ? 0 : d.probability,
              updatedAt: new Date().toISOString().split("T")[0],
            }
          : d
      )
    );

    try {
      const deal = deals.find((d) => d.id === dealId);
      await api.updateDeal(
        dealId,
        toSnake({
          stage: destStage,
          probability: destStage === "Closed Won" ? 100 : destStage === "Closed Lost" ? 0 : (deal?.probability ?? 50),
          updatedAt: new Date().toISOString().split("T")[0],
        })
      );
      await fetchDeals();
      toast(`Deal moved to ${destStage}`);
    } catch (err) {
      console.error("Failed to update deal", err);
      toast("Failed to move deal");
      await fetchDeals();
    }
  };

  const handleCreate = async () => {
    if (!org || !form.name) return;
    try {
      await api.createDeal(
        toSnake({
          name: form.name,
          amount: Number(form.amount) || 0,
          stage: form.stage,
          closeDate: form.closeDate || new Date().toISOString().split("T")[0],
          accountId: "",
          accountName: form.accountName,
          probability: 50,
          ownerId: user?.id || "",
          ownerName: user?.name || "",
          orgId: org.id,
          createdAt: new Date().toISOString().split("T")[0],
          updatedAt: new Date().toISOString().split("T")[0],
        })
      );
      await fetchDeals();
      setShowNew(false);
      setForm({ name: "", amount: "", stage: "Prospecting", closeDate: "", accountName: "" });
      toast("Deal created");
    } catch (err) {
      console.error("Failed to create deal", err);
      toast("Failed to create deal");
    }
  };

  const openNewDealForStage = (stage: DealStage) => {
    setNewStage(stage);
    setForm({ ...form, stage });
    setShowNew(true);
  };

  if (!org) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="animate-spin" size={32} style={{ color: "var(--ab-blue)" }} />
        </div>
      </DashboardLayout>
    );
  }

  /* pipeline total */
  const pipelineTotal = deals
    .filter((d) => d.stage !== "Closed Won" && d.stage !== "Closed Lost")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <DashboardLayout>
      <div className="azure-board flex flex-col h-full" style={{ background: "var(--ab-bg)", color: "var(--ab-text)" }}>
        {/* Top bar */}
        <div className="px-4 py-2" style={{ borderBottom: "1px solid var(--ab-border)" }}>
          <div className="flex items-center gap-2 text-[12px] mb-2" style={{ color: "var(--ab-text-secondary)" }}>
            <span>Axia</span>
            <span>/</span>
            <span>{org.name}</span>
            <span>/</span>
            <span>Boards</span>
            <span>/</span>
            <span style={{ color: "var(--ab-text)", fontWeight: 600 }}>Deal Registration</span>
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
                Pipeline: {formatCurrency(pipelineTotal)}
              </span>
              <button className="p-1.5" style={{ color: "var(--ab-text-secondary)" }}><Filter size={16} /></button>
              <button className="p-1.5" style={{ color: "var(--ab-text-secondary)" }}><Settings2 size={16} /></button>
            </div>
          </div>
        </div>

        {/* Board content */}
        <div className="flex-1 overflow-x-auto p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-2 min-h-[500px]">
              {STAGES.map((stage) => {
                const items = columnItems[stage.id] || [];
                const overWip = items.length >= stage.wipLimit;
                const colTotal = items.reduce((s, d) => s + d.amount, 0);
                return (
                  <div key={stage.id} className="flex-shrink-0 w-[280px] flex flex-col">
                    {/* Column header */}
                    <div className="mb-1" style={{ borderTop: `3px solid ${stage.color}` }}>
                      <div className="flex items-center justify-between px-2 py-2" style={{ background: "var(--ab-header)" }}>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold" style={{ color: "var(--ab-text)" }}>{stage.label}</span>
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
                        <div className="flex items-center gap-1">
                          <span className="text-[10px]" style={{ fontFamily: "var(--font-mono)", color: "var(--ab-text-secondary)" }}>
                            {formatCurrency(colTotal)}
                          </span>
                          <button
                            onClick={() => openNewDealForStage(stage.id)}
                            className="p-0.5"
                            style={{ color: "var(--ab-blue)" }}
                            title={`Add deal to ${stage.label}`}
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cards */}
                    <Droppable droppableId={stage.id}>
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
                          {items.map((deal, index) => (
                            <Draggable key={deal.id} draggableId={deal.id} index={index}>
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
                                    borderTop: `3px solid ${stage.color}`,
                                    borderRadius: "2px",
                                    boxShadow: dragSnapshot.isDragging ? "0 6px 20px rgba(0,0,0,.3)" : "none",
                                  }}
                                >
                                  <div className="p-3">
                                    {/* ID + Title */}
                                    <div className="flex items-start gap-1.5 mb-2">
                                      <span className="text-[11px] font-bold flex-shrink-0" style={{ color: "var(--ab-blue)", fontFamily: "var(--font-mono)" }}>
                                        #{pseudoId(deal.id)}
                                      </span>
                                      <a
                                        href={`/deals/${deal.id}`}
                                        className="text-[13px] font-medium leading-tight hover:underline"
                                        style={{ color: "var(--ab-text)" }}
                                      >
                                        {deal.name}
                                      </a>
                                    </div>

                                    {/* Customer */}
                                    <div className="flex items-center gap-1.5 mb-2">
                                      <Avatar name={deal.accountName || "?"} size="sm" />
                                      <span className="text-[12px]" style={{ color: "var(--ab-text-secondary)" }}>{deal.accountName || "No account"}</span>
                                    </div>

                                    {/* Value + Close Date row */}
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[12px] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--ab-text)" }}>
                                        {formatCurrency(deal.amount)}
                                      </span>
                                      <span className="text-[10px]" style={{ color: "var(--ab-text-secondary)" }}>
                                        {deal.closeDate}
                                      </span>
                                    </div>

                                    {/* Priority */}
                                    <div className="flex items-center gap-1 text-[11px] mb-1" style={{ color: "var(--ab-text-secondary)" }}>
                                      <span
                                        className="status-dot"
                                        style={{
                                          background: deal.probability >= 70 ? "var(--ab-green)" : deal.probability >= 40 ? "var(--ab-yellow)" : "var(--ab-red)",
                                        }}
                                      />
                                      <span>{deal.probability >= 70 ? "High" : deal.probability >= 40 ? "Medium" : "Low"}</span>
                                      <span style={{ fontFamily: "var(--font-mono)" }}>({deal.probability}%)</span>
                                    </div>

                                    {/* Tags row */}
                                    <div className="flex flex-wrap gap-1 mb-0">
                                      {deal.accountName && (
                                        <span className="text-[10px] px-1.5 py-[1px]" style={{ background: "rgba(0,120,212,0.15)", color: "var(--ab-blue)", borderRadius: "2px" }}>
                                          {deal.accountName.split(" ")[0]}
                                        </span>
                                      )}
                                      {deal.probability >= 80 && (
                                        <span className="text-[10px] px-1.5 py-[1px]" style={{ background: "rgba(16,124,16,0.15)", color: "var(--ab-green)", borderRadius: "2px" }}>
                                          High Value
                                        </span>
                                      )}
                                    </div>

                                    {/* Sub-items */}
                                    <DealSubItems dealId={deal.id} />
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
        </div>
      </div>

      {/* New Deal Modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Deal" size="sm">
        <div className="space-y-4">
          <Input label="Deal Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter deal name" />
          <Input label="Customer" value={form.accountName} onChange={(e) => setForm({ ...form, accountName: e.target.value })} placeholder="Account name" />
          <Input label="Value" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
          <Select
            label="Stage"
            value={form.stage}
            onChange={(e) => setForm({ ...form, stage: e.target.value as DealStage })}
            options={STAGES.map((s) => ({ value: s.id, label: s.label }))}
          />
          <Input label="Close Date" type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" onClick={() => setShowNew(false)}>Cancel</Button>
          <Button onClick={handleCreate}>Create Deal</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
