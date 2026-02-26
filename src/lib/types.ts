export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "rep" | "viewer";
  orgId: string;
  orgName: string;
  avatar?: string;
}

export interface Org {
  id: string;
  name: string;
  logo?: string;
  timezone: string;
  fiscalYear: string;
}

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  accountId: string;
  accountName: string;
  phone: string;
  mobile?: string;
  email: string;
  mailingAddress: string;
  department?: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  industry: string;
  type: string;
  phone: string;
  website: string;
  billingAddress: string;
  description: string;
  employees?: number;
  annualRevenue?: number;
  ownerId: string;
  ownerName: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage =
  | "Prospecting"
  | "Qualification"
  | "Proposal"
  | "Negotiation"
  | "Closed Won"
  | "Closed Lost";

export interface Deal {
  id: string;
  name: string;
  amount: number;
  stage: DealStage;
  closeDate: string;
  accountId: string;
  accountName: string;
  contactId?: string;
  contactName?: string;
  probability: number;
  ownerId: string;
  ownerName: string;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export type ActivityType = "call" | "email" | "meeting" | "task";
export type ActivityStatus = "To Do" | "In Progress" | "Waiting" | "Done";

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  status: ActivityStatus;
  dueDate: string;
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  dealId?: string;
  ownerId: string;
  ownerName: string;
  orgId: string;
  createdAt: string;
  completedAt?: string;
}

export type LeadStatus = "New" | "Contacted" | "Qualified" | "Unqualified";

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  title: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  rating: "Hot" | "Warm" | "Cold";
  industry: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  orgId: string;
  createdAt: string;
}

export type CasePriority = "High" | "Medium" | "Low";
export type CaseStatus = "New" | "Working" | "Escalated" | "Closed";

export interface Case {
  id: string;
  subject: string;
  status: CaseStatus;
  priority: CasePriority;
  description: string;
  resolution?: string;
  contactId?: string;
  contactName?: string;
  accountId?: string;
  accountName?: string;
  ownerId: string;
  ownerName: string;
  orgId: string;
  createdAt: string;
  closedAt?: string;
}

export interface ScriptBlock {
  id: string;
  title: string;
  content: string;
  notes?: string;
  branchingHint?: string;
}

export interface CallScript {
  id: string;
  name: string;
  description: string;
  blocks: ScriptBlock[];
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export type Disposition =
  | "Connected"
  | "No Answer"
  | "Voicemail"
  | "Busy"
  | "Wrong Number"
  | "Callback"
  | "Not Interested"
  | "Booked Meeting";

export interface CallRecord {
  id: string;
  contactId: string;
  contactName: string;
  disposition: Disposition;
  duration: number;
  notes?: string;
  scriptId?: string;
  orgId: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: "Planned" | "Active" | "Completed" | "Aborted";
  type: string;
  startDate: string;
  endDate: string;
  budget: number;
  actualCost?: number;
  responses: number;
  description?: string;
  orgId: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  family: string;
  isActive: boolean;
  pricingTiers?: { minQty: number; price: number }[];
  orgId: string;
  createdAt: string;
}

export interface Integration {
  id: string;
  name: string;
  type: "google" | "microsoft" | "slack";
  enabled: boolean;
  orgId: string;
}

// ── Multi-tenant ──

export interface TeamMember {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: "admin" | "member" | "viewer";
  orgId: string;
  invitedAt: string;
  joinedAt: string;
}

// ── Tagging ──

export interface Tag {
  id: string;
  name: string;
  color: string;
  orgId: string;
}

export interface RecordTag {
  tagId: string;
  recordType: "lead" | "contact" | "deal" | "account" | "activity" | "case";
  recordId: string;
}

// ── Sharing ──

export interface SharedRecord {
  id: string;
  recordType: string;
  recordId: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  permission: "view" | "edit";
  sharedAt: string;
}

// ── Web Forms ──

export interface WebForm {
  id: string;
  name: string;
  fields: WebFormField[];
  status: "active" | "draft";
  submissions: number;
  conversionRate: number;
  orgId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebFormField {
  id: string;
  label: string;
  type: "text" | "email" | "phone" | "textarea" | "select";
  required: boolean;
  options?: string[];
}

// ── Vendor ──

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  status: "Active" | "Inactive" | "Pending";
  ownerId?: string;
  ownerName?: string;
  orgId: string;
}

// ── Client ──

export interface Client {
  id: string;
  name: string;
  industry: string;
  contact: string;
  contractValue: number;
  startDate: string;
  status: "Active" | "At Risk" | "Churned";
  ownerId?: string;
  ownerName?: string;
  orgId: string;
}

// ── CatalogProduct (separate from existing Product) ──

export interface CatalogProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  status: "Active" | "Inactive";
  orgId: string;
}

// ── Phone Number (white-labeled) ──

export interface PhoneNumber {
  id: string;
  number: string;
  label: string;
  type: "local" | "toll-free";
  monthlyCost: number;
  callsThisMonth: number;
  active: boolean;
  orgId: string;
}
