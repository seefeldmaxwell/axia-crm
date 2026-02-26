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

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

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

  const activityMap = useMemo(() => {
    const map: Record<string, Activity[]> = {};
    activities.forEach((act) => {
      if (act.dueDate) {
        const key = act.dueDate;
        if (!map[key]) map[key] = [];
        map[key].push(act);
      }
    });
    return map;
  }, [activities]);

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
                    {dayActivities.slice(0, 4).map((act) => (
                      <div
                        key={act.id}
                        className="h-[3px] rounded-full"
                        style={{ background: TYPE_COLORS[act.type] }}
                        title={`${act.type}: ${act.subject}`}
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

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
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
                    {selectedActivities.map((act) => {
                      const Icon = TYPE_ICONS[act.type];
                      return (
                        <div
                          key={act.id}
                          className="p-3"
                          style={{
                            background: "var(--bg-tertiary)",
                            borderRadius: "var(--radius-sm)",
                            borderLeft: `3px solid ${
                              act.type === "call"
                                ? "#2D7FF9"
                                : act.type === "email"
                                ? "#00B8D9"
                                : act.type === "meeting"
                                ? "#6554C0"
                                : "#FFAB00"
                            }`,
                          }}
                        >
                          <div className="flex items-start gap-2">
                            <Icon
                              size={14}
                              className="mt-0.5 shrink-0"
                              style={{
                                color:
                                  act.type === "call"
                                    ? "#2D7FF9"
                                    : act.type === "email"
                                    ? "#00B8D9"
                                    : act.type === "meeting"
                                    ? "#6554C0"
                                    : "#FFAB00",
                              }}
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
                              <div className="flex items-center gap-2 mt-2">
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
                                  {TYPE_LABELS[act.type]}
                                </span>
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
