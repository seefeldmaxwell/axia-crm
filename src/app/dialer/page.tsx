"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { api, mapLead, mapCallScript, mapCallRecord, toSnake } from "@/lib/api";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/input";
import { Search } from "@/components/ui/search";
import { useToast } from "@/components/ui/toast";
import {
  Lead,
  CallScript,
  Disposition,
  CallRecord,
} from "@/lib/types";
import {
  Phone,
  PhoneOff,
  SkipForward,
  Clock,
  CheckCircle,
  XCircle,
  Voicemail,
  PhoneMissed,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Users,
  Loader2,
} from "lucide-react";

type Temperature = "Hot" | "Warm" | "Cold";

const DISPOSITIONS: {
  label: Disposition;
  icon: React.ReactNode;
  color: string;
  bgVar: string;
}[] = [
  {
    label: "Connected",
    icon: <CheckCircle size={14} />,
    color: "var(--accent-green)",
    bgVar: "var(--accent-green-muted)",
  },
  {
    label: "No Answer",
    icon: <PhoneMissed size={14} />,
    color: "var(--text-secondary)",
    bgVar: "var(--bg-tertiary)",
  },
  {
    label: "Voicemail",
    icon: <Voicemail size={14} />,
    color: "var(--accent-blue)",
    bgVar: "var(--accent-blue-muted)",
  },
  {
    label: "Busy",
    icon: <PhoneOff size={14} />,
    color: "var(--accent-yellow)",
    bgVar: "var(--accent-yellow-muted)",
  },
  {
    label: "Wrong Number",
    icon: <XCircle size={14} />,
    color: "var(--accent-red)",
    bgVar: "var(--accent-red-muted)",
  },
  {
    label: "Callback",
    icon: <Clock size={14} />,
    color: "var(--accent-purple)",
    bgVar: "rgba(101,84,192,0.15)",
  },
  {
    label: "Not Interested",
    icon: <XCircle size={14} />,
    color: "var(--accent-yellow)",
    bgVar: "var(--accent-yellow-muted)",
  },
  {
    label: "Booked Meeting",
    icon: <CalendarPlus size={14} />,
    color: "var(--accent-green)",
    bgVar: "var(--accent-green-muted)",
  },
];

const tempDotColor = (t: string) => {
  if (t === "Hot") return "var(--accent-red)";
  if (t === "Warm") return "var(--accent-yellow)";
  return "var(--text-tertiary)";
};

const tempBadgeVariant = (t: string) => {
  if (t === "Hot") return "error" as const;
  if (t === "Warm") return "warning" as const;
  return "neutral" as const;
};

export default function DialerPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [scripts, setScripts] = useState<CallScript[]>([]);
  const [callRecords, setCallRecordsState] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch leads, scripts, and call records from the API
  useEffect(() => {
    if (!org) return;
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      try {
        const [rawLeads, rawScripts, rawRecords] = await Promise.all([
          api.getLeads(),
          api.getCallScripts(),
          api.getCallRecords(),
        ]);
        if (cancelled) return;
        setLeads(rawLeads.map(mapLead));
        setScripts(rawScripts.map(mapCallScript));
        setCallRecordsState(rawRecords.map(mapCallRecord));
      } catch (err) {
        console.error("Failed to load dialer data:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [org]);

  const [queue, setQueue] = useState<Lead[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [calling, setCalling] = useState(false);
  const [timer, setTimer] = useState(0);
  const [notes, setNotes] = useState("");
  const [activeScript, setActiveScript] = useState<CallScript | null>(
    null
  );
  const [openBlocks, setOpenBlocks] = useState<Set<string>>(new Set());
  const [showLoadLeads, setShowLoadLeads] = useState(false);
  const [loadSearch, setLoadSearch] = useState("");
  const [loadTempFilter, setLoadTempFilter] = useState<
    Temperature | "All"
  >("All");
  const [loadSelected, setLoadSelected] = useState<Set<string>>(
    new Set()
  );
  const [calledIds, setCalledIds] = useState<Set<string>>(new Set());
  const [dispositionsMap, setDispositionsMap] = useState<
    Record<string, Disposition>
  >({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (scripts.length > 0 && !activeScript) {
      setActiveScript(scripts[0]);
      setOpenBlocks(new Set(scripts[0].blocks.map((b) => b.id)));
    }
  }, [scripts, activeScript]);

  // Stats
  const stats = useMemo(() => {
    const made = callRecords.length;
    const connected = callRecords.filter(
      (r) =>
        r.disposition === "Connected" ||
        r.disposition === "Booked Meeting"
    ).length;
    const avgDuration =
      made > 0
        ? Math.round(
            callRecords.reduce((s, r) => s + r.duration, 0) / made
          )
        : 0;
    const meetings = callRecords.filter(
      (r) => r.disposition === "Booked Meeting"
    ).length;
    return { made, connected, avgDuration, meetings };
  }, [callRecords]);

  // Leads for load modal
  const loadFilteredLeads = useMemo(() => {
    let result = leads;
    if (loadTempFilter !== "All") {
      result = result.filter((l) => l.rating === loadTempFilter);
    }
    if (loadSearch) {
      const q = loadSearch.toLowerCase();
      result = result.filter(
        (l) =>
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q)
      );
    }
    return result;
  }, [leads, loadTempFilter, loadSearch]);

  const addSelectedLeads = () => {
    const toAdd = leads.filter(
      (l) =>
        loadSelected.has(l.id) && !queue.some((q) => q.id === l.id)
    );
    setQueue((prev) => [...prev, ...toAdd]);
    setLoadSelected(new Set());
    setShowLoadLeads(false);
    toast(`Added ${toAdd.length} leads to queue`);
  };

  const addLeadsByTemp = (temp: Temperature) => {
    const toAdd = leads.filter(
      (l) => l.rating === temp && !queue.some((q) => q.id === l.id)
    );
    setQueue((prev) => [...prev, ...toAdd]);
    setShowLoadLeads(false);
    toast(
      `Added ${toAdd.length} ${temp.toLowerCase()} leads to queue`
    );
  };

  const startCall = useCallback(() => {
    setCalling(true);
    setTimer(0);
    timerRef.current = setInterval(
      () => setTimer((t) => t + 1),
      1000
    );
  }, []);

  const endCall = useCallback(
    async (disposition: Disposition) => {
      if (!org || !user || !queue[currentIdx]) return;
      setCalling(false);
      if (timerRef.current) clearInterval(timerRef.current);

      const lead = queue[currentIdx];

      try {
        await api.createCallRecord(
          toSnake({
            contactId: lead.id,
            contactName: `${lead.firstName} ${lead.lastName}`,
            disposition,
            duration: timer,
            notes: notes || undefined,
            scriptId: activeScript?.id,
            orgId: org.id,
          })
        );

        // Refetch call records from the API
        const rawRecords = await api.getCallRecords();
        setCallRecordsState(rawRecords.map(mapCallRecord));
      } catch (err) {
        console.error("Failed to save call record:", err);
      }

      setCalledIds((prev) => new Set(prev).add(lead.id));
      setDispositionsMap((prev) => ({
        ...prev,
        [lead.id]: disposition,
      }));
      setNotes("");
      setTimer(0);
      toast(`Call logged: ${disposition}`);

      if (currentIdx < queue.length - 1) {
        setCurrentIdx((i) => i + 1);
      }
    },
    [
      org,
      user,
      queue,
      currentIdx,
      timer,
      notes,
      activeScript,
      toast,
    ]
  );

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  const toggleBlock = (blockId: string) => {
    setOpenBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  };

  const currentLead = queue[currentIdx];

  if (!org) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div
          className="flex items-center justify-center"
          style={{
            background: "var(--bg-primary)",
            height: "calc(100vh - 0px)",
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <Loader2
              size={32}
              className="animate-spin"
              style={{ color: "var(--accent-blue)" }}
            />
            <p
              className="text-[13px]"
              style={{ color: "var(--text-tertiary)" }}
            >
              Loading dialer...
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="p-4 flex flex-col"
        style={{
          background: "var(--bg-primary)",
          height: "calc(100vh - 0px)",
        }}
      >
        {/* ── Active Number Display ── */}
        <Card className="mb-4 shrink-0">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{
                    background: "var(--accent-blue-muted)",
                    borderRadius: "var(--radius-sm)",
                  }}
                >
                  <Phone
                    size={18}
                    style={{ color: "var(--accent-blue)" }}
                  />
                </div>
                <div>
                  <p
                    className="text-[10px] font-medium tracking-[0.08em] uppercase"
                    style={{
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    ACTIVE NUMBER
                  </p>
                  <p
                    className="text-[18px] font-semibold"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    (305) 555-0100
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-[6px] h-[6px] rounded-full"
                  style={{ background: "var(--accent-green)" }}
                />
                <span
                  className="text-[10px] font-medium tracking-[0.08em] uppercase"
                  style={{
                    color: "var(--accent-green)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  ACTIVE
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-4 gap-3 mb-4 shrink-0">
          {[
            {
              label: "CALLS MADE",
              value: String(stats.made),
              accent: "var(--accent-blue)",
            },
            {
              label: "CONNECTED",
              value: String(stats.connected),
              accent: "var(--accent-green)",
            },
            {
              label: "AVG DURATION",
              value: formatTime(stats.avgDuration),
              accent: "var(--accent-yellow)",
            },
            {
              label: "MEETINGS BOOKED",
              value: String(stats.meetings),
              accent: "var(--accent-purple)",
            },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="py-4 text-center">
                <p
                  className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2"
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {s.label}
                </p>
                <p
                  className="text-[28px] font-bold"
                  style={{
                    color: s.accent,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {s.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main Area: Queue + Call Panel ── */}
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left: Lead Call Queue */}
          <Card className="w-[300px] shrink-0 overflow-hidden flex flex-col">
            <CardHeader className="shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    className="text-[10px] font-medium tracking-[0.08em] uppercase"
                    style={{
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    CALL QUEUE
                  </p>
                  <p
                    className="text-[13px] font-semibold mt-0.5"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {queue.length} leads
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-full mt-2"
                onClick={() => setShowLoadLeads(true)}
              >
                <Users size={14} />
                Load from Leads
              </Button>
            </CardHeader>
            <div className="flex-1 overflow-y-auto">
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Phone
                    size={28}
                    style={{
                      color: "var(--text-tertiary)",
                      opacity: 0.2,
                    }}
                  />
                  <p
                    className="mt-2 text-[12px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    No leads in queue. Click &ldquo;Load from
                    Leads&rdquo; to add.
                  </p>
                </div>
              ) : (
                queue.map((lead, i) => {
                  const isCalled = calledIds.has(lead.id);
                  const disp = dispositionsMap[lead.id];
                  const isActive = i === currentIdx;
                  return (
                    <button
                      key={lead.id}
                      onClick={() => {
                        if (!calling) setCurrentIdx(i);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-left transition-colors"
                      style={{
                        borderBottom:
                          "1px solid var(--border-secondary)",
                        background: isActive
                          ? "var(--accent-blue-muted)"
                          : "transparent",
                        borderLeft: isActive
                          ? "2px solid var(--accent-blue)"
                          : "2px solid transparent",
                        opacity: isCalled ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            "var(--bg-tertiary)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background =
                            "transparent";
                        }
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[13px] font-medium truncate"
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          {lead.firstName} {lead.lastName}
                        </p>
                        <p
                          className="text-[11px] truncate"
                          style={{
                            color: "var(--text-secondary)",
                          }}
                        >
                          {lead.company}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{
                            color: "var(--text-tertiary)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {lead.phone}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div
                          className="w-[8px] h-[8px] rounded-full"
                          style={{
                            background: tempDotColor(lead.rating),
                          }}
                          title={lead.rating}
                        />
                        {disp && (
                          <Badge variant="neutral">{disp}</Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Right: Call Panel */}
          <div className="flex-1 flex flex-col min-w-0 gap-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
              {currentLead ? (
                <>
                  {/* Lead info header */}
                  <div
                    className="px-5 py-4 shrink-0"
                    style={{
                      borderBottom:
                        "1px solid var(--border-primary)",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className="text-[18px] font-semibold"
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          {currentLead.firstName}{" "}
                          {currentLead.lastName}
                        </p>
                        <p
                          className="text-[13px] mt-0.5"
                          style={{
                            color: "var(--text-secondary)",
                          }}
                        >
                          {currentLead.title} at{" "}
                          {currentLead.company}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Timer */}
                        <div
                          className="text-[28px] font-bold"
                          style={{
                            color: calling
                              ? "var(--accent-green)"
                              : "var(--text-primary)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {formatTime(timer)}
                        </div>
                      </div>
                    </div>

                    {/* Call controls */}
                    <div className="flex items-center gap-3 mt-4">
                      {!calling ? (
                        <Button size="lg" onClick={startCall}>
                          <Phone size={16} />
                          Start Call
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="lg"
                          onClick={() => endCall("No Answer")}
                        >
                          <PhoneOff size={16} />
                          End Call
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        onClick={() => {
                          if (currentIdx < queue.length - 1)
                            setCurrentIdx((i) => i + 1);
                        }}
                      >
                        <SkipForward size={16} />
                      </Button>
                    </div>
                  </div>

                  {/* Scrollable content area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex gap-4 p-4">
                      {/* Script panel */}
                      <div
                        className="flex-1 min-w-0"
                        style={{
                          border:
                            "1px solid var(--border-primary)",
                          borderRadius: "var(--radius-sm)",
                        }}
                      >
                        <div
                          className="px-3 py-2 flex items-center justify-between"
                          style={{
                            borderBottom:
                              "1px solid var(--border-primary)",
                            background: "var(--bg-tertiary)",
                          }}
                        >
                          <span
                            className="text-[10px] font-medium tracking-[0.08em] uppercase"
                            style={{
                              color: "var(--text-tertiary)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            CALL SCRIPT
                          </span>
                          {scripts.length > 1 && (
                            <select
                              value={activeScript?.id || ""}
                              onChange={(e) =>
                                setActiveScript(
                                  scripts.find(
                                    (s) =>
                                      s.id === e.target.value
                                  ) || null
                                )
                              }
                              className="text-[11px] px-2 py-1"
                              style={{
                                background:
                                  "var(--bg-quaternary)",
                                border:
                                  "1px solid var(--border-primary)",
                                borderRadius:
                                  "var(--radius-sm)",
                                color: "var(--text-primary)",
                              }}
                            >
                              {scripts.map((s) => (
                                <option
                                  key={s.id}
                                  value={s.id}
                                >
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                        <div>
                          {activeScript?.blocks.map((block) => {
                            const isOpen = openBlocks.has(
                              block.id
                            );
                            return (
                              <div
                                key={block.id}
                                style={{
                                  borderBottom:
                                    "1px solid var(--border-secondary)",
                                }}
                              >
                                <button
                                  onClick={() =>
                                    toggleBlock(block.id)
                                  }
                                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors"
                                  style={{
                                    color:
                                      "var(--text-primary)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background =
                                      "var(--bg-tertiary)";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background =
                                      "transparent";
                                  }}
                                >
                                  {isOpen ? (
                                    <ChevronDown
                                      size={14}
                                      style={{
                                        color:
                                          "var(--text-tertiary)",
                                      }}
                                    />
                                  ) : (
                                    <ChevronRight
                                      size={14}
                                      style={{
                                        color:
                                          "var(--text-tertiary)",
                                      }}
                                    />
                                  )}
                                  <span
                                    className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                                    style={{
                                      color:
                                        "var(--text-secondary)",
                                      fontFamily:
                                        "var(--font-mono)",
                                    }}
                                  >
                                    {block.title}
                                  </span>
                                </button>
                                {isOpen && (
                                  <div className="px-3 pb-3 pl-8">
                                    <p
                                      className="text-[12px] leading-relaxed"
                                      style={{
                                        color:
                                          "var(--text-primary)",
                                      }}
                                    >
                                      {block.content}
                                    </p>
                                    {block.notes && (
                                      <p
                                        className="text-[11px] italic mt-1.5"
                                        style={{
                                          color:
                                            "var(--text-tertiary)",
                                        }}
                                      >
                                        {block.notes}
                                      </p>
                                    )}
                                    {block.branchingHint && (
                                      <p
                                        className="text-[11px] mt-1"
                                        style={{
                                          color:
                                            "var(--accent-blue)",
                                        }}
                                      >
                                        &rarr;{" "}
                                        {block.branchingHint}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          {(!activeScript ||
                            activeScript.blocks.length ===
                              0) && (
                            <div
                              className="px-4 py-8 text-center text-[12px]"
                              style={{
                                color: "var(--text-tertiary)",
                              }}
                            >
                              No scripts available.
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Disposition + Notes */}
                      <div className="w-[280px] shrink-0 space-y-4">
                        {/* Disposition grid */}
                        <div>
                          <p
                            className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2"
                            style={{
                              color: "var(--text-tertiary)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            DISPOSITION
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {DISPOSITIONS.map((d) => (
                              <button
                                key={d.label}
                                onClick={() =>
                                  calling
                                    ? endCall(d.label)
                                    : undefined
                                }
                                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors"
                                style={{
                                  background: d.bgVar,
                                  color: d.color,
                                  borderRadius:
                                    "var(--radius-sm)",
                                  opacity: calling ? 1 : 0.4,
                                  cursor: calling
                                    ? "pointer"
                                    : "not-allowed",
                                }}
                              >
                                {d.icon}
                                {d.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Notes */}
                        <Textarea
                          label="Notes"
                          value={notes}
                          onChange={(e) =>
                            setNotes(e.target.value)
                          }
                          placeholder="Add notes about this call..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1">
                  <Phone
                    size={40}
                    style={{
                      color: "var(--text-tertiary)",
                      opacity: 0.15,
                    }}
                  />
                  <p
                    className="mt-3 text-[13px]"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    No leads in queue
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowLoadLeads(true)}
                  >
                    Load Leads
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* ── Call History Table ── */}
        <Card className="mt-4 shrink-0">
          <CardHeader>
            <p
              className="text-[10px] font-medium tracking-[0.08em] uppercase"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              CALL HISTORY
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  style={{
                    borderBottom:
                      "1px solid var(--border-primary)",
                  }}
                >
                  <th className="px-4 py-2 text-left">
                    CONTACT
                  </th>
                  <th className="px-4 py-2 text-left">
                    DISPOSITION
                  </th>
                  <th className="px-4 py-2 text-left">
                    DURATION
                  </th>
                  <th className="px-4 py-2 text-left">DATE</th>
                  <th className="px-4 py-2 text-left">NOTES</th>
                </tr>
              </thead>
              <tbody>
                {callRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-[12px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      No call records yet
                    </td>
                  </tr>
                ) : (
                  [...callRecords]
                    .reverse()
                    .slice(0, 10)
                    .map((record) => (
                      <tr
                        key={record.id}
                        style={{
                          borderBottom:
                            "1px solid var(--border-secondary)",
                        }}
                      >
                        <td
                          className="px-4 py-2 text-[13px]"
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          {record.contactName}
                        </td>
                        <td className="px-4 py-2">
                          <Badge
                            variant={
                              record.disposition ===
                                "Connected" ||
                              record.disposition ===
                                "Booked Meeting"
                                ? "success"
                                : record.disposition ===
                                  "No Answer" ||
                                  record.disposition ===
                                    "Busy"
                                ? "neutral"
                                : record.disposition ===
                                    "Wrong Number" ||
                                  record.disposition ===
                                    "Not Interested"
                                ? "error"
                                : "warning"
                            }
                          >
                            {record.disposition}
                          </Badge>
                        </td>
                        <td
                          className="px-4 py-2 text-[13px]"
                          style={{
                            color: "var(--text-primary)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {formatTime(record.duration)}
                        </td>
                        <td
                          className="px-4 py-2 text-[12px]"
                          style={{
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {record.createdAt
                            ? new Date(
                                record.createdAt
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "-"}
                        </td>
                        <td
                          className="px-4 py-2 text-[12px] max-w-[200px] truncate"
                          style={{
                            color: "var(--text-tertiary)",
                          }}
                        >
                          {record.notes || "-"}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Load from Leads Modal ── */}
      <Modal
        open={showLoadLeads}
        onClose={() => setShowLoadLeads(false)}
        title="Load from Leads"
        size="lg"
      >
        <div className="space-y-4">
          {/* Temperature quick-add */}
          <div>
            <p
              className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              QUICK ADD BY TEMPERATURE
            </p>
            <div className="grid grid-cols-3 gap-3">
              {(["Hot", "Warm", "Cold"] as Temperature[]).map(
                (temp) => {
                  const count = leads.filter(
                    (l) => l.rating === temp
                  ).length;
                  return (
                    <button
                      key={temp}
                      onClick={() => addLeadsByTemp(temp)}
                      className="p-3 text-left transition-colors"
                      style={{
                        background: "var(--bg-tertiary)",
                        border:
                          "1px solid var(--border-primary)",
                        borderRadius: "var(--radius-sm)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "var(--bg-quaternary)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "var(--bg-tertiary)";
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-[8px] h-[8px] rounded-full"
                          style={{
                            background: tempDotColor(temp),
                          }}
                        />
                        <span
                          className="text-[13px] font-medium"
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          Add All {temp}
                        </span>
                      </div>
                      <p
                        className="text-[11px]"
                        style={{
                          color: "var(--text-tertiary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {count} leads
                      </p>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Individual selection */}
          <div
            style={{
              borderTop: "1px solid var(--border-primary)",
              paddingTop: "16px",
            }}
          >
            <p
              className="text-[10px] font-medium tracking-[0.08em] uppercase mb-2"
              style={{
                color: "var(--text-tertiary)",
                fontFamily: "var(--font-mono)",
              }}
            >
              SELECT INDIVIDUAL LEADS
            </p>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex-1">
                <Search
                  value={loadSearch}
                  onChange={setLoadSearch}
                  placeholder="Search leads..."
                />
              </div>
              <div className="flex gap-1">
                {(
                  ["All", "Hot", "Warm", "Cold"] as (
                    | Temperature
                    | "All"
                  )[]
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setLoadTempFilter(t)}
                    className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.05em]"
                    style={{
                      color:
                        loadTempFilter === t
                          ? "var(--accent-blue)"
                          : "var(--text-tertiary)",
                      background:
                        loadTempFilter === t
                          ? "var(--accent-blue-muted)"
                          : "transparent",
                      borderRadius: "var(--radius-sm)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div
              className="max-h-[240px] overflow-y-auto"
              style={{
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {loadFilteredLeads.map((lead) => (
                <label
                  key={lead.id}
                  className="flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors"
                  style={{
                    borderBottom:
                      "1px solid var(--border-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background =
                      "transparent";
                  }}
                >
                  <input
                    type="checkbox"
                    checked={loadSelected.has(lead.id)}
                    onChange={() => {
                      setLoadSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(lead.id))
                          next.delete(lead.id);
                        else next.add(lead.id);
                        return next;
                      });
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-medium truncate"
                      style={{
                        color: "var(--text-primary)",
                      }}
                    >
                      {lead.firstName} {lead.lastName}
                    </p>
                    <p
                      className="text-[11px]"
                      style={{
                        color: "var(--text-tertiary)",
                      }}
                    >
                      {lead.company} &middot; {lead.phone}
                    </p>
                  </div>
                  <Badge
                    variant={tempBadgeVariant(lead.rating)}
                  >
                    {lead.rating}
                  </Badge>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowLoadLeads(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={addSelectedLeads}
            disabled={loadSelected.size === 0}
          >
            Add {loadSelected.size} Lead
            {loadSelected.size !== 1 ? "s" : ""}
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
