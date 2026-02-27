"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { api, mapActivity, toSnake } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { Activity, ActivityType } from "@/lib/types";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Phone,
  Mail,
  Users,
  CheckSquare,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";

const TYPE_COLORS: Record<ActivityType, string> = {
  call: "var(--accent-blue)",
  email: "var(--accent-teal)",
  meeting: "var(--accent-purple)",
  task: "var(--accent-yellow)",
};

const TYPE_LABELS: Record<ActivityType, string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  task: "Task",
};

const TYPE_ICONS: Record<ActivityType, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  task: CheckSquare,
};

const DAY_HEADERS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function CalendarPage() {
  const { user, org } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1, 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [activities, setActivitiesState] = useState<Activity[]>([]);
  const [externalEvents, setExternalEvents] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookForm, setBookForm] = useState({
    subject: "",
    type: "meeting" as ActivityType,
    description: "",
    dueDate: "",
  });

  const fetchActivities = useCallback(async () => {
    if (!org) return;
    try {
      setLoading(true);
      const raw = await api.getActivities();
      setActivitiesState(raw.map(mapActivity) as Activity[]);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
      toast("Failed to load activities");
    } finally {
      setLoading(false);
    }
  }, [org]);

  const fetchPermissions = useCallback(async () => {
    if (!org) return;
    try {
      const perms = await api.getPermissions();
      setPermissions(perms || {});
    } catch { /* silent */ }
    setPermissionsLoaded(true);
  }, [org]);

  const fetchExternalEvents = useCallback(async () => {
    if (!org || !permissionsLoaded) return;
    const timeMin = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1).toISOString();
    const timeMax = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0).toISOString();
    const results: any[] = [];
    if (permissions["google_calendar"]) {
      try {
        const google = await api.getGoogleCalendarEvents(timeMin, timeMax);
        if (Array.isArray(google)) results.push(...google);
      } catch { /* no google token */ }
    }
    if (permissions["microsoft_calendar"]) {
      try {
        const ms = await api.getMicrosoftCalendarEvents(timeMin, timeMax);
        if (Array.isArray(ms)) results.push(...ms);
      } catch { /* no ms token */ }
    }
    setExternalEvents(results);
  }, [org, currentMonth, permissions, permissionsLoaded]);

  const togglePermission = async (key: string) => {
    const newVal = !permissions[key];
    setPermissions((prev) => ({ ...prev, [key]: newVal }));
    try {
      await api.setPermission(key, newVal);
    } catch {
      setPermissions((prev) => ({ ...prev, [key]: !newVal }));
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    fetchExternalEvents();
  }, [fetchExternalEvents]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const calendarDays = useMemo(() => {
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = monthStart.getDay();
    const prefixDays: (Date | null)[] = Array(startDay).fill(null);
    const allDays: (Date | null)[] = [...prefixDays, ...days];
    const remainder = allDays.length % 7;
    if (remainder > 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        allDays.push(null);
      }
    }
    return allDays;
  }, [monthStart, monthEnd]);

  // Merge CRM activities + external calendar events into a unified map
  const allEvents = useMemo(() => {
    const merged: any[] = [];
    // CRM activities
    activities.forEach((act) => {
      if (act.dueDate) {
        merged.push({ ...act, _source: "crm", _date: act.dueDate });
      }
    });
    // External events (Google / Microsoft)
    externalEvents.forEach((evt) => {
      const dateStr = evt.start ? evt.start.substring(0, 10) : "";
      if (dateStr) {
        merged.push({
          id: evt.id,
          subject: evt.title,
          type: evt.source === "google" ? "meeting" : "meeting",
          status: "To Do",
          dueDate: dateStr,
          description: evt.description,
          _source: evt.source, // "google" | "microsoft"
          _date: dateStr,
          _allDay: evt.allDay,
          _start: evt.start,
          _end: evt.end,
          _location: evt.location,
          _htmlLink: evt.htmlLink,
          _attendees: evt.attendees,
        });
      }
    });
    return merged;
  }, [activities, externalEvents]);

  const activityMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    allEvents.forEach((evt) => {
      const key = evt._date;
      if (!map[key]) map[key] = [];
      map[key].push(evt);
    });
    return map;
  }, [allEvents]);

  const selectedActivities = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return activityMap[key] || [];
  }, [selectedDate, activityMap]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const handleBookAppointment = async () => {
    if (!org || !user || !bookForm.subject) return;

    try {
      await api.createActivity(
        toSnake({
          type: bookForm.type,
          subject: bookForm.subject,
          description: bookForm.description || undefined,
          status: "To Do",
          dueDate:
            bookForm.dueDate ||
            format(selectedDate || new Date(), "yyyy-MM-dd"),
          ownerId: user.id,
          ownerName: user.name,
          orgId: org.id,
        })
      );
      setShowBookModal(false);
      setBookForm({ subject: "", type: "meeting", description: "", dueDate: "" });
      await fetchActivities();
      toast("Appointment booked");
    } catch (err) {
      console.error("Failed to book appointment:", err);
      toast("Failed to book appointment");
    }
  };

  const handleDeleteActivity = async (actId: string) => {
    try {
      await api.deleteActivity(actId);
      await fetchActivities();
      toast("Activity deleted");
    } catch {
      toast("Failed to delete activity");
    }
  };

  const handleToggleStatus = async (act: Activity) => {
    const next = act.status === "Done" ? "To Do" : "Done";
    try {
      await api.updateActivity(act.id, toSnake({ status: next }));
      await fetchActivities();
      toast(next === "Done" ? "Marked as done" : "Reopened");
    } catch {
      toast("Failed to update status");
    }
  };

  if (!org) return null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 size={24} className="animate-spin" style={{ color: "var(--accent-blue)" }} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div
        className="flex h-full"
        style={{ background: "var(--bg-primary)" }}
      >
        {/* Main calendar area */}
        <div className="flex-1 flex flex-col min-w-0 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="w-8 h-8 flex items-center justify-center"
                  style={{
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-secondary)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <span
                  className="px-4 text-[14px] font-semibold tracking-[0.1em] uppercase min-w-[200px] text-center"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={handleNextMonth}
                  className="w-8 h-8 flex items-center justify-center"
                  style={{
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border-primary)",
                    background: "var(--bg-secondary)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-tertiary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-secondary)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-[11px] font-medium tracking-[0.05em] uppercase"
                style={{
                  color: "var(--accent-blue)",
                  border: "1px solid var(--accent-blue)",
                  borderRadius: "var(--radius-sm)",
                  background: "transparent",
                  fontFamily: "var(--font-mono)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "var(--accent-blue-muted)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Today
              </button>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setBookForm({
                  ...bookForm,
                  dueDate: selectedDate
                    ? format(selectedDate, "yyyy-MM-dd")
                    : format(new Date(), "yyyy-MM-dd"),
                });
                setShowBookModal(true);
              }}
            >
              <Plus size={14} />
              Book Appointment
            </Button>
          </div>

          {/* Day headers */}
          <div
            className="grid grid-cols-7"
            style={{ borderBottom: "1px solid var(--border-secondary)" }}
          >
            {DAY_HEADERS.map((day) => (
              <div
                key={day}
                className="py-2 text-center text-[10px] font-medium tracking-[0.08em]"
                style={{
                  color: "var(--text-tertiary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div
            className="grid grid-cols-7 flex-1"
            style={{ border: "1px solid var(--border-secondary)" }}
          >
            {calendarDays.map((day, i) => {
              if (!day) {
                return (
                  <div
                    key={`empty-${i}`}
                    style={{
                      background: "var(--bg-primary)",
                      borderRight:
                        (i + 1) % 7 !== 0
                          ? "1px solid var(--border-secondary)"
                          : undefined,
                      borderBottom: "1px solid var(--border-secondary)",
                    }}
                  />
                );
              }

              const dateKey = format(day, "yyyy-MM-dd");
              const dayActivities = activityMap[dateKey] || [];
              const isSelected =
                selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);
              const inMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={dateKey}
                  onClick={() => setSelectedDate(day)}
                  className="min-h-[90px] p-1.5 cursor-pointer transition-colors relative"
                  style={{
                    background: isSelected
                      ? "var(--accent-blue-muted)"
                      : "var(--bg-secondary)",
                    borderRight:
                      (i + 1) % 7 !== 0
                        ? "1px solid var(--border-secondary)"
                        : undefined,
                    borderBottom: "1px solid var(--border-secondary)",
                    opacity: inMonth ? 1 : 0.4,
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
                  {/* Day number */}
                  <div className="flex justify-end">
                    <span
                      className="w-7 h-7 flex items-center justify-center text-[12px] font-medium"
                      style={{
                        color: today
                          ? "white"
                          : isSelected
                          ? "var(--accent-blue)"
                          : "var(--text-primary)",
                        background: today
                          ? "var(--accent-blue)"
                          : "transparent",
                        borderRadius: "50%",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Activity pills */}
                  <div className="mt-1 flex flex-col gap-[3px]">
                    {dayActivities.slice(0, 4).map((act: any) => (
                      <div
                        key={act.id}
                        className="h-[3px] rounded-full"
                        style={{
                          background: act._source === "google" ? "#4285F4"
                            : act._source === "microsoft" ? "#00A4EF"
                            : TYPE_COLORS[act.type as ActivityType] || "var(--accent-blue)",
                        }}
                        title={`${act._source === "google" ? "📅 Google" : act._source === "microsoft" ? "📅 Microsoft" : act.type}: ${act.subject}`}
                      />
                    ))}
                    {dayActivities.length > 4 && (
                      <span
                        className="text-[9px] mt-0.5"
                        style={{
                          color: "var(--text-tertiary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        +{dayActivities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Calendar Connections */}
          <div className="flex items-center gap-3 mt-3 mb-2">
            <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              Sync:
            </span>
            <button
              onClick={() => togglePermission("google_calendar")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: permissions["google_calendar"] ? "rgba(66,133,244,0.15)" : "var(--bg-tertiary)",
                color: permissions["google_calendar"] ? "#4285F4" : "var(--text-tertiary)",
                border: `1px solid ${permissions["google_calendar"] ? "rgba(66,133,244,0.3)" : "var(--border-secondary)"}`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {permissions["google_calendar"] ? "Google Connected" : "Connect Google"}
            </button>
            <button
              onClick={() => togglePermission("microsoft_calendar")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all"
              style={{
                background: permissions["microsoft_calendar"] ? "rgba(0,164,239,0.15)" : "var(--bg-tertiary)",
                color: permissions["microsoft_calendar"] ? "#00A4EF" : "var(--text-tertiary)",
                border: `1px solid ${permissions["microsoft_calendar"] ? "rgba(0,164,239,0.3)" : "var(--border-secondary)"}`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 23 23"><path fill="currentColor" d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z"/></svg>
              {permissions["microsoft_calendar"] ? "Microsoft Connected" : "Connect Microsoft"}
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-1">
            {(Object.keys(TYPE_COLORS) as ActivityType[]).map((type) => (
              <div key={type} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-[3px] rounded-full"
                  style={{ background: TYPE_COLORS[type] }}
                />
                <span
                  className="text-[10px] uppercase tracking-[0.06em]"
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {TYPE_LABELS[type]}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[3px] rounded-full" style={{ background: "#4285F4" }} />
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>Google</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-[3px] rounded-full" style={{ background: "#00A4EF" }} />
              <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>Microsoft</span>
            </div>
          </div>
        </div>

        {/* Right sidebar panel */}
        <div
          className="w-[320px] shrink-0 flex flex-col overflow-hidden"
          style={{
            background: "var(--bg-secondary)",
            borderLeft: "1px solid var(--border-primary)",
          }}
        >
          {selectedDate ? (
            <>
              {/* Sidebar header */}
              <div
                className="flex items-center justify-between px-4 py-3 shrink-0"
                style={{
                  borderBottom: "1px solid var(--border-primary)",
                }}
              >
                <div>
                  <p
                    className="text-[10px] font-medium tracking-[0.08em] uppercase"
                    style={{
                      color: "var(--text-tertiary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {format(selectedDate, "EEEE")}
                  </p>
                  <p
                    className="text-[18px] font-semibold"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {format(selectedDate, "MMM d, yyyy")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="w-7 h-7 flex items-center justify-center"
                  style={{
                    color: "var(--text-secondary)",
                    borderRadius: "var(--radius-sm)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--bg-tertiary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Activity count */}
              <div className="px-4 py-2 shrink-0">
                <span
                  className="text-[10px] font-medium tracking-[0.08em] uppercase"
                  style={{
                    color: "var(--text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {selectedActivities.length}{" "}
                  {selectedActivities.length === 1
                    ? "activity"
                    : "activities"}
                </span>
              </div>

              {/* Activity list */}
              <div className="flex-1 overflow-y-auto px-3 pb-3">
                {selectedActivities.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Clock
                      size={32}
                      style={{
                        color: "var(--text-tertiary)",
                        opacity: 0.3,
                      }}
                    />
                    <p
                      className="mt-3 text-[13px]"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      No activities scheduled
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setBookForm({
                          ...bookForm,
                          dueDate: format(selectedDate, "yyyy-MM-dd"),
                        });
                        setShowBookModal(true);
                      }}
                    >
                      <Plus size={12} />
                      Book Appointment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedActivities.map((act: any) => {
                      const isExternal = act._source === "google" || act._source === "microsoft";
                      const borderColor = isExternal
                        ? (act._source === "google" ? "#4285F4" : "#00A4EF")
                        : act.type === "call" ? "#2D7FF9"
                        : act.type === "email" ? "#00B8D9"
                        : act.type === "meeting" ? "#6554C0"
                        : "#FFAB00";
                      const Icon = isExternal ? Users : TYPE_ICONS[act.type as ActivityType] || CheckSquare;
                      return (
                        <div
                          key={act.id}
                          className="p-3"
                          style={{
                            background: "var(--bg-tertiary)",
                            borderRadius: "var(--radius-sm)",
                            borderLeft: `3px solid ${borderColor}`,
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Icon
                              size={14}
                              className="mt-0.5 shrink-0"
                              style={{ color: borderColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className="text-[13px] font-medium leading-snug"
                                style={{
                                  color: "var(--text-primary)",
                                }}
                              >
                                {act.subject}
                              </p>
                              {act.contactName && (
                                <p
                                  className="text-[11px] mt-1"
                                  style={{
                                    color: "var(--text-secondary)",
                                  }}
                                >
                                  {act.contactName}
                                  {act.accountName
                                    ? ` - ${act.accountName}`
                                    : ""}
                                </p>
                              )}
                              {act.description && (
                                <p
                                  className="text-[11px] mt-1 line-clamp-2"
                                  style={{
                                    color: "var(--text-tertiary)",
                                  }}
                                >
                                  {act.description}
                                </p>
                              )}
                              {/* External event metadata */}
                              {isExternal && act._start && (
                                <p className="text-[11px] mt-1" style={{ color: "var(--text-secondary)" }}>
                                  {act._allDay ? "All day" : `${new Date(act._start).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}${act._end ? ` – ${new Date(act._end).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}`}
                                </p>
                              )}
                              {isExternal && act._location && (
                                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>📍 {act._location}</p>
                              )}
                              {isExternal && act._attendees?.length > 0 && (
                                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                                  👥 {act._attendees.map((a: any) => a.name || a.email).join(", ")}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {isExternal ? (
                                  <>
                                    <Badge variant={act._source === "google" ? "info" : "info"}>
                                      {act._source === "google" ? "Google" : "Microsoft"}
                                    </Badge>
                                    {act._htmlLink && (
                                      <a href={act._htmlLink} target="_blank" rel="noopener noreferrer" className="text-[10px]" style={{ color: "var(--accent-blue)" }}>
                                        Open ↗
                                      </a>
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <Badge
                                      variant={
                                        act.status === "Done"
                                          ? "success"
                                          : act.status === "In Progress"
                                          ? "info"
                                          : act.status === "Waiting"
                                          ? "warning"
                                          : "neutral"
                                      }
                                    >
                                      {act.status}
                                    </Badge>
                                    <span
                                      className="text-[10px] uppercase tracking-[0.06em]"
                                      style={{
                                        color:
                                          act.type === "call"
                                            ? "#2D7FF9"
                                            : act.type === "email"
                                            ? "#00B8D9"
                                            : act.type === "meeting"
                                            ? "#6554C0"
                                            : "#FFAB00",
                                        fontFamily: "var(--font-mono)",
                                      }}
                                    >
                                      {TYPE_LABELS[act.type as ActivityType]}
                                    </span>
                                  </>
                                )}
                                <div className="ml-auto flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleStatus(act)}
                                    className="p-1 transition-colors"
                                    style={{ color: "var(--text-tertiary)", borderRadius: "var(--radius-sm)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-green)"; e.currentTarget.style.background = "var(--bg-quaternary)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                                    title={act.status === "Done" ? "Reopen" : "Mark done"}
                                  >
                                    <CheckSquare size={12} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteActivity(act.id)}
                                    className="p-1 transition-colors"
                                    style={{ color: "var(--text-tertiary)", borderRadius: "var(--radius-sm)" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.color = "var(--accent-red)"; e.currentTarget.style.background = "var(--accent-red-muted)"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; e.currentTarget.style.background = "transparent"; }}
                                    title="Delete"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Add button at bottom */}
              {selectedActivities.length > 0 && (
                <div
                  className="px-3 py-3 shrink-0"
                  style={{
                    borderTop: "1px solid var(--border-primary)",
                  }}
                >
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setBookForm({
                        ...bookForm,
                        dueDate: format(selectedDate, "yyyy-MM-dd"),
                      });
                      setShowBookModal(true);
                    }}
                  >
                    <Plus size={12} />
                    Book Appointment
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
              <Clock
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
                Select a day to view activities
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Book Appointment Modal */}
      <Modal
        open={showBookModal}
        onClose={() => setShowBookModal(false)}
        title="Book Appointment"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Subject"
            value={bookForm.subject}
            onChange={(e) =>
              setBookForm({ ...bookForm, subject: e.target.value })
            }
            placeholder="Meeting with client..."
          />
          <Select
            label="Type"
            value={bookForm.type}
            onChange={(e) =>
              setBookForm({
                ...bookForm,
                type: e.target.value as ActivityType,
              })
            }
            options={[
              { value: "meeting", label: "Meeting" },
              { value: "call", label: "Call" },
              { value: "email", label: "Email" },
              { value: "task", label: "Task" },
            ]}
          />
          <Input
            label="Date"
            type="date"
            value={bookForm.dueDate}
            onChange={(e) =>
              setBookForm({ ...bookForm, dueDate: e.target.value })
            }
          />
          <Textarea
            label="Description"
            value={bookForm.description}
            onChange={(e) =>
              setBookForm({ ...bookForm, description: e.target.value })
            }
            placeholder="Details about this appointment..."
            rows={3}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button
            variant="secondary"
            onClick={() => setShowBookModal(false)}
          >
            Cancel
          </Button>
          <Button onClick={handleBookAppointment}>Book</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
