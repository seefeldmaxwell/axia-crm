"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Collapsible } from "@/components/ui/collapsible";
import { InlineEdit } from "@/components/ui/inline-edit";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useContact, useUpdateContact, useDeleteContact, useActivities } from "@/hooks/use-data";
import { Contact, Activity } from "@/lib/types";
import { NotesSection } from "@/components/ui/notes-section";
import { Phone, Mail, MapPin, Building2, Briefcase, Clock, Calendar, CheckSquare, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

export function ContactDetailClient() {
  const { id } = useParams<{ id: string }>();
  const { org } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const { data: contact, loading: contactLoading, refetch: refetchContact } = useContact(id);
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const { data: activities, loading: activitiesLoading } = useActivities(org?.id, { contactId: id });

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  }, [activities]);

  const updateField = async (field: keyof Contact, value: string) => {
    if (!org || !contact) return;
    try {
      await updateContact.mutate(id, { [field]: value });
      await refetchContact();
      toast("Field updated");
    } catch {
      toast("Failed to update field");
    }
  };

  if (contactLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zen-surface-hover rounded w-1/4"></div>
            <div className="h-64 bg-zen-surface-hover rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!contact || !org) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-zen-text-secondary">Contact not found</p>
          <Button variant="secondary" onClick={() => router.push("/contacts")} className="mt-4">
            <ArrowLeft size={16} className="mr-1" /> Back to Contacts
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const typeIcons: Record<string, React.ReactNode> = {
    call: <Phone size={14} className="text-zen-success" />,
    email: <Mail size={14} className="text-zen-primary" />,
    meeting: <Calendar size={14} className="text-purple-600" />,
    task: <CheckSquare size={14} className="text-orange-600" />,
  };

  const upcoming = sortedActivities.filter((a) => a.status !== "Done");
  const completed = sortedActivities.filter((a) => a.status === "Done");

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <Avatar name={`${contact.firstName} ${contact.lastName}`} size="lg" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-zen-text">
                {contact.firstName} {contact.lastName}
              </h1>
            </div>
            <p className="text-sm text-zen-text-secondary">{contact.title} at {contact.accountName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={async () => {
              if (!confirm("Delete this contact?")) return;
              try { await deleteContact.mutate(id); router.push("/contacts"); toast("Contact deleted"); } catch { toast("Failed to delete"); }
            }}>
              <Trash2 size={16} />
            </Button>
            <Button variant="secondary" onClick={() => router.push("/contacts")}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel - Details */}
          <div className="lg:col-span-1">
            <Card>
              <Collapsible title="About">
                <div className="space-y-3">
                  <InlineEdit label="Title" value={contact.title} onSave={(v) => updateField("title", v)} />
                  <InlineEdit label="Department" value={contact.department || ""} onSave={(v) => updateField("department", v)} />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-zen-text-secondary uppercase tracking-wide min-w-[100px]">Account</span>
                    <Link href={`/accounts/${contact.accountId}`} className="text-sm text-zen-primary hover:underline">
                      {contact.accountName}
                    </Link>
                  </div>
                  <InlineEdit label="Owner" value={contact.ownerName} onSave={(v) => updateField("ownerName", v)} />
                  <InlineEdit label="Description" value={contact.description || ""} onSave={(v) => updateField("description", v)} />
                </div>
              </Collapsible>

              <Collapsible title="Get in Touch">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-zen-text-secondary shrink-0" />
                    <InlineEdit label="Phone" value={contact.phone} onSave={(v) => updateField("phone", v)} type="tel" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-zen-text-secondary shrink-0" />
                    <InlineEdit label="Mobile" value={contact.mobile || ""} onSave={(v) => updateField("mobile", v)} type="tel" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-zen-text-secondary shrink-0" />
                    <InlineEdit label="Email" value={contact.email} onSave={(v) => updateField("email", v)} type="email" />
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-zen-text-secondary shrink-0" />
                    <InlineEdit label="Address" value={contact.mailingAddress} onSave={(v) => updateField("mailingAddress", v)} />
                  </div>
                </div>
              </Collapsible>
            </Card>
          </div>

          {/* Right panel - Notes & Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Notes */}
            <NotesSection recordType="contact" recordId={id} />

            {/* Upcoming & Overdue */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-zen-text">Upcoming & Overdue</h2>
              </CardHeader>
              <CardContent className="p-0">
                {upcoming.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-zen-text-secondary text-center">
                    No upcoming activities
                  </p>
                ) : (
                  upcoming.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 px-4 py-3 border-b border-zen-border last:border-0">
                      <div className="mt-0.5 p-1.5 rounded bg-zen-surface-hover">
                        {typeIcons[act.type]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zen-text">{act.subject}</p>
                        <p className="text-xs text-zen-text-secondary mt-0.5">
                          <Clock size={10} className="inline mr-1" />
                          {act.dueDate}
                        </p>
                      </div>
                      <Badge
                        variant={
                          act.status === "In Progress" ? "info" :
                          act.status === "Waiting" ? "warning" : "neutral"
                        }
                      >
                        {act.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-zen-text">Activity Timeline</h2>
              </CardHeader>
              <CardContent className="p-0">
                {sortedActivities.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-zen-text-secondary text-center">
                    No activities yet
                  </p>
                ) : (
                  sortedActivities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 px-4 py-3 border-b border-zen-border last:border-0">
                      <div className="mt-0.5 p-1.5 rounded bg-zen-surface-hover">
                        {typeIcons[act.type]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-zen-text">{act.subject}</p>
                        {act.description && (
                          <p className="text-xs text-zen-text-secondary mt-0.5">{act.description}</p>
                        )}
                        <p className="text-xs text-zen-text-secondary mt-1">
                          {act.dueDate} &middot; {act.ownerName}
                        </p>
                      </div>
                      <Badge
                        variant={
                          act.status === "Done" ? "success" :
                          act.status === "In Progress" ? "info" :
                          act.status === "Waiting" ? "warning" : "neutral"
                        }
                      >
                        {act.status}
                      </Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
