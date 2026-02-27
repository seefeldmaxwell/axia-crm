"use client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://axia-crm-api.seefeldmaxwell1.workers.dev";

function getHeaders(): Record<string, string> {
  if (typeof window === "undefined") return { "Content-Type": "application/json" };
  try {
    const user = JSON.parse(localStorage.getItem("axia_user") || "{}");
    const org = JSON.parse(localStorage.getItem("axia_org") || "{}");
    return {
      "Content-Type": "application/json",
      "X-User-Id": user.id || "",
      "X-Org-Id": org.id || user.orgId || "",
    };
  } catch {
    return { "Content-Type": "application/json" };
  }
}

function handleAuthError(res: Response): void {
  if ((res.status === 401 || res.status === 403) && typeof window !== "undefined") {
    localStorage.removeItem("axia_user");
    localStorage.removeItem("axia_org");
    window.location.href = "/";
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getHeaders() });
  if (!res.ok) { handleAuthError(res); throw new Error(`API error: ${res.status}`); }
  return res.json();
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) { handleAuthError(res); throw new Error(`API error: ${res.status}`); }
  return res.json();
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) { handleAuthError(res); throw new Error(`API error: ${res.status}`); }
  return res.json();
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) { handleAuthError(res); throw new Error(`API error: ${res.status}`); }
}

// ─── Convenience API object ───

export const api = {
  // Auth
  login: (data: { email: string; name: string; orgId: string }) =>
    apiPost<any>("/api/auth/login", data),
  me: () => apiGet<any>("/api/auth/me"),

  // Leads
  getLeads: () => apiGet<any[]>("/api/leads"),
  getLead: (id: string) => apiGet<any>(`/api/leads/${id}`),
  createLead: (data: any) => apiPost<any>("/api/leads", data),
  updateLead: (id: string, data: any) => apiPut<any>(`/api/leads/${id}`, data),
  deleteLead: (id: string) => apiDelete(`/api/leads/${id}`),
  convertLead: (id: string) => apiPost<any>(`/api/leads/${id}/convert`, {}),

  // Contacts
  getContacts: () => apiGet<any[]>("/api/contacts"),
  getContact: (id: string) => apiGet<any>(`/api/contacts/${id}`),
  createContact: (data: any) => apiPost<any>("/api/contacts", data),
  updateContact: (id: string, data: any) => apiPut<any>(`/api/contacts/${id}`, data),
  deleteContact: (id: string) => apiDelete(`/api/contacts/${id}`),

  // Accounts
  getAccounts: () => apiGet<any[]>("/api/accounts"),
  getAccount: (id: string) => apiGet<any>(`/api/accounts/${id}`),
  createAccount: (data: any) => apiPost<any>("/api/accounts", data),
  updateAccount: (id: string, data: any) => apiPut<any>(`/api/accounts/${id}`, data),
  deleteAccount: (id: string) => apiDelete(`/api/accounts/${id}`),

  // Deals
  getDeals: () => apiGet<any[]>("/api/deals"),
  getDeal: (id: string) => apiGet<any>(`/api/deals/${id}`),
  createDeal: (data: any) => apiPost<any>("/api/deals", data),
  updateDeal: (id: string, data: any) => apiPut<any>(`/api/deals/${id}`, data),
  deleteDeal: (id: string) => apiDelete(`/api/deals/${id}`),

  // Deal Items (sub-items)
  getDealItems: (dealId: string) => apiGet<any[]>(`/api/deals/${dealId}/items`),
  createDealItem: (dealId: string, data: any) => apiPost<any>(`/api/deals/${dealId}/items`, data),
  updateDealItem: (dealId: string, itemId: string, data: any) => apiPut<any>(`/api/deals/${dealId}/items/${itemId}`, data),
  deleteDealItem: (dealId: string, itemId: string) => apiDelete(`/api/deals/${dealId}/items/${itemId}`),

  // Activities
  getActivities: (params?: { contact_id?: string; account_id?: string; deal_id?: string }) => {
    const query = params ? "?" + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : "";
    return apiGet<any[]>(`/api/activities${query}`);
  },
  getActivity: (id: string) => apiGet<any>(`/api/activities/${id}`),
  createActivity: (data: any) => apiPost<any>("/api/activities", data),
  updateActivity: (id: string, data: any) => apiPut<any>(`/api/activities/${id}`, data),
  deleteActivity: (id: string) => apiDelete(`/api/activities/${id}`),

  // Notes
  getNotes: (recordType: string, recordId: string) =>
    apiGet<any[]>(`/api/notes?record_type=${recordType}&record_id=${recordId}`),
  createNote: (data: any) => apiPost<any>("/api/notes", data),
  updateNote: (id: string, data: any) => apiPut<any>(`/api/notes/${id}`, data),
  deleteNote: (id: string) => apiDelete(`/api/notes/${id}`),

  // Blog
  getBlogPosts: (status?: string) => apiGet<any[]>(status ? `/api/blog?status=${status}` : "/api/blog"),
  getBlogPost: (slug: string) => apiGet<any>(`/api/blog/${slug}`),
  createBlogPost: (data: any) => apiPost<any>("/api/blog", data),
  updateBlogPost: (id: string, data: any) => apiPut<any>(`/api/blog/${id}`, data),
  deleteBlogPost: (id: string) => apiDelete(`/api/blog/${id}`),

  // Activity Items (sub-items)
  getActivityItems: (activityId: string) => apiGet<any[]>(`/api/activities/${activityId}/items`),
  createActivityItem: (activityId: string, data: any) => apiPost<any>(`/api/activities/${activityId}/items`, data),
  updateActivityItem: (activityId: string, itemId: string, data: any) => apiPut<any>(`/api/activities/${activityId}/items/${itemId}`, data),
  deleteActivityItem: (activityId: string, itemId: string) => apiDelete(`/api/activities/${activityId}/items/${itemId}`),

  // Cases
  getCases: () => apiGet<any[]>("/api/cases"),
  getCase: (id: string) => apiGet<any>(`/api/cases/${id}`),
  createCase: (data: any) => apiPost<any>("/api/cases", data),
  updateCase: (id: string, data: any) => apiPut<any>(`/api/cases/${id}`, data),
  deleteCase: (id: string) => apiDelete(`/api/cases/${id}`),

  // Vendors
  getVendors: () => apiGet<any[]>("/api/vendors"),
  getVendor: (id: string) => apiGet<any>(`/api/vendors/${id}`),
  createVendor: (data: any) => apiPost<any>("/api/vendors", data),
  updateVendor: (id: string, data: any) => apiPut<any>(`/api/vendors/${id}`, data),
  deleteVendor: (id: string) => apiDelete(`/api/vendors/${id}`),

  // Clients
  getClients: () => apiGet<any[]>("/api/clients"),
  getClient: (id: string) => apiGet<any>(`/api/clients/${id}`),
  createClient: (data: any) => apiPost<any>("/api/clients", data),
  updateClient: (id: string, data: any) => apiPut<any>(`/api/clients/${id}`, data),
  deleteClient: (id: string) => apiDelete(`/api/clients/${id}`),

  // Products
  getProducts: () => apiGet<any[]>("/api/products"),
  getProduct: (id: string) => apiGet<any>(`/api/products/${id}`),
  createProduct: (data: any) => apiPost<any>("/api/products", data),
  updateProduct: (id: string, data: any) => apiPut<any>(`/api/products/${id}`, data),
  deleteProduct: (id: string) => apiDelete(`/api/products/${id}`),

  // Marketing Posts
  getMarketingPosts: () => apiGet<any[]>("/api/marketing/posts"),
  getMarketingPost: (id: string) => apiGet<any>(`/api/marketing/posts/${id}`),
  createMarketingPost: (data: any) => apiPost<any>("/api/marketing/posts", data),
  updateMarketingPost: (id: string, data: any) => apiPut<any>(`/api/marketing/posts/${id}`, data),
  deleteMarketingPost: (id: string) => apiDelete(`/api/marketing/posts/${id}`),

  // Marketing Campaigns
  getCampaigns: () => apiGet<any[]>("/api/marketing/campaigns"),
  getCampaign: (id: string) => apiGet<any>(`/api/marketing/campaigns/${id}`),
  createCampaign: (data: any) => apiPost<any>("/api/marketing/campaigns", data),
  updateCampaign: (id: string, data: any) => apiPut<any>(`/api/marketing/campaigns/${id}`, data),
  deleteCampaign: (id: string) => apiDelete(`/api/marketing/campaigns/${id}`),

  // Tags
  getTags: () => apiGet<any[]>("/api/tags"),
  getTag: (id: string) => apiGet<any>(`/api/tags/${id}`),
  createTag: (data: any) => apiPost<any>("/api/tags", data),
  updateTag: (id: string, data: any) => apiPut<any>(`/api/tags/${id}`, data),
  deleteTag: (id: string) => apiDelete(`/api/tags/${id}`),
  getRecordTags: (recordType: string, recordId: string) =>
    apiGet<any[]>(`/api/tags/records/${recordType}/${recordId}`),
  addRecordTag: (recordType: string, recordId: string, tagId: string) =>
    apiPost<any>(`/api/tags/records/${recordType}/${recordId}/${tagId}`, {}),
  removeRecordTag: (recordType: string, recordId: string, tagId: string) =>
    apiDelete(`/api/tags/records/${recordType}/${recordId}/${tagId}`),

  // Dialer
  getCallScripts: () => apiGet<any[]>("/api/dialer/scripts"),
  getCallScript: (id: string) => apiGet<any>(`/api/dialer/scripts/${id}`),
  createCallScript: (data: any) => apiPost<any>("/api/dialer/scripts", data),
  updateCallScript: (id: string, data: any) => apiPut<any>(`/api/dialer/scripts/${id}`, data),
  deleteCallScript: (id: string) => apiDelete(`/api/dialer/scripts/${id}`),
  getCallRecords: () => apiGet<any[]>("/api/dialer/records"),
  createCallRecord: (data: any) => apiPost<any>("/api/dialer/records", data),

  // Reports
  getDashboard: () => apiGet<any>("/api/reports/dashboard"),

  // Settings
  getIntegrations: () => apiGet<any[]>("/api/settings/integrations"),
  updateIntegration: (id: string, data: any) => apiPut<any>(`/api/settings/integrations/${id}`, data),
  getOrg: () => apiGet<any>("/api/settings/org"),
  updateOrg: (data: any) => apiPut<any>("/api/settings/org", data),
  getUsers: () => apiGet<any[]>("/api/settings/users"),

  // Calendar
  getCalendarEvents: (start?: string, end?: string) => {
    const params = new URLSearchParams();
    if (start) params.set("start", start);
    if (end) params.set("end", end);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiGet<any[]>(`/api/calendar/events${query}`);
  },
  getGoogleCalendarEvents: (timeMin?: string, timeMax?: string) => {
    const params = new URLSearchParams();
    if (timeMin) params.set("timeMin", timeMin);
    if (timeMax) params.set("timeMax", timeMax);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiGet<any[]>(`/api/calendar/google${query}`);
  },
  getMicrosoftCalendarEvents: (timeMin?: string, timeMax?: string) => {
    const params = new URLSearchParams();
    if (timeMin) params.set("timeMin", timeMin);
    if (timeMax) params.set("timeMax", timeMax);
    const query = params.toString() ? `?${params.toString()}` : "";
    return apiGet<any[]>(`/api/calendar/microsoft${query}`);
  },

  // Seed
  seed: () => apiPost<any>("/api/seed", {}),

  // Users (dedicated endpoint)
  getOrgUsers: () => apiGet<any[]>("/api/users"),
  inviteUser: (email: string) => apiPost<any>("/api/users/invite", { email }),

  // Team hierarchy
  getTeamHierarchy: () => apiGet<any[]>("/api/team/hierarchy"),

  // Transfer & Share
  transferRecord: (recordType: string, recordId: string, toUserId: string, reason?: string) =>
    apiPut<any>("/api/records/transfer", { record_type: recordType, record_id: recordId, to_user_id: toUserId, reason }),
  shareRecord: (recordType: string, recordId: string, userId: string, permission: string) =>
    apiPost<any>("/api/records/share", { record_type: recordType, record_id: recordId, user_id: userId, permission }),
  revokeShare: (shareId: string) => apiDelete(`/api/records/share/${shareId}`),
  getRecordShares: (recordType: string, recordId: string) =>
    apiGet<any[]>(`/api/records/shares/${recordType}/${recordId}`),
  getSharedWithMe: () => apiGet<any[]>("/api/records/shared-with-me"),

  // Emails
  getEmails: () => apiGet<any[]>("/api/emails"),
  createEmail: (data: any) => apiPost<any>("/api/emails", data),
  updateEmail: (id: string, data: any) => apiPut<any>(`/api/emails/${id}`, data),
  deleteEmail: (id: string) => apiDelete(`/api/emails/${id}`),

  // User role update
  updateUserRole: (userId: string, role: string) =>
    apiPut<any>(`/api/users/${userId}/role`, { role }),

  // Auth (OAuth login)
  loginWithOAuth: (provider: string, email: string, name: string, avatar?: string) =>
    apiPost<any>("/api/auth/login", { provider, email, name, avatar }),

  // Gmail Mail
  getGmailInbox: (folder?: string, maxResults?: number, pageToken?: string) => {
    const params = new URLSearchParams();
    if (folder) params.set("folder", folder);
    if (maxResults) params.set("maxResults", String(maxResults));
    if (pageToken) params.set("pageToken", pageToken);
    const q = params.toString() ? `?${params.toString()}` : "";
    return apiGet<any>(`/api/mail/inbox${q}`);
  },
  getGmailMessage: (id: string) => apiGet<any>(`/api/mail/message/${id}`),
  sendGmail: (data: { to: string; subject: string; body: string; cc?: string; bcc?: string }) =>
    apiPost<any>("/api/mail/send", data),
  getGmailFolders: () => apiGet<any[]>("/api/mail/folders"),
  starGmail: (id: string, starred: boolean) => apiPost<any>(`/api/mail/star/${id}`, { starred }),
  markGmailRead: (id: string, read: boolean) => apiPost<any>(`/api/mail/read/${id}`, { read }),
  trashGmail: (id: string) => apiDelete(`/api/mail/message/${id}`),

  // AI Chat
  chat: (message: string, history?: { role: string; content: string }[]) =>
    apiPost<{ reply: string }>("/api/chat", { message, history }),
};

// ─── D1 snake_case → Frontend camelCase mappers ───

export function mapContact(r: any) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    title: r.title || "",
    accountId: r.account_id || "",
    accountName: r.account_name || "",
    phone: r.phone || "",
    mobile: r.mobile || "",
    email: r.email || "",
    mailingAddress: r.mailing_address || "",
    department: r.department || "",
    description: r.description || "",
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

export function mapAccount(r: any) {
  return {
    id: r.id,
    name: r.name,
    industry: r.industry || "",
    type: r.type || "",
    phone: r.phone || "",
    website: r.website || "",
    billingAddress: r.billing_address || "",
    description: r.description || "",
    employees: r.employees || undefined,
    annualRevenue: r.annual_revenue || undefined,
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

export function mapDeal(r: any) {
  return {
    id: r.id,
    name: r.name,
    amount: r.amount || 0,
    stage: r.stage || "Prospecting",
    closeDate: r.close_date || "",
    accountId: r.account_id || "",
    accountName: r.account_name || "",
    contactId: r.contact_id || "",
    contactName: r.contact_name || "",
    probability: r.probability || 0,
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    description: r.description || "",
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

export function mapDealItem(r: any) {
  return {
    id: r.id,
    dealId: r.deal_id,
    title: r.title,
    completed: r.completed === 1 || r.completed === true,
    sortOrder: r.sort_order || 0,
    createdAt: r.created_at || "",
  };
}

export function mapNote(r: any) {
  return {
    id: r.id,
    recordType: r.record_type,
    recordId: r.record_id,
    content: r.content,
    authorId: r.author_id || "",
    authorName: r.author_name || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

export function mapActivityItem(r: any) {
  return {
    id: r.id,
    activityId: r.activity_id,
    title: r.title,
    completed: r.completed === 1 || r.completed === true,
    sortOrder: r.sort_order || 0,
    createdAt: r.created_at || "",
  };
}

export function mapActivity(r: any) {
  return {
    id: r.id,
    type: r.type,
    subject: r.subject,
    description: r.description || "",
    status: r.status || "To Do",
    dueDate: r.due_date || "",
    contactId: r.contact_id || "",
    contactName: r.contact_name || "",
    accountId: r.account_id || "",
    accountName: r.account_name || "",
    dealId: r.deal_id || "",
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    completedAt: r.completed_at || undefined,
    createdAt: r.created_at || "",
  };
}

export function mapLead(r: any) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    company: r.company || "",
    title: r.title || "",
    email: r.email || "",
    phone: r.phone || "",
    status: r.status || "New",
    source: r.source || "",
    rating: r.rating || "Warm",
    industry: r.industry || "",
    description: r.description || "",
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
  };
}

export function mapCase(r: any) {
  return {
    id: r.id,
    subject: r.subject,
    status: r.status || "New",
    priority: r.priority || "Medium",
    description: r.description || "",
    resolution: r.resolution || undefined,
    contactId: r.contact_id || "",
    contactName: r.contact_name || "",
    accountId: r.account_id || "",
    accountName: r.account_name || "",
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
    closedAt: r.closed_at || undefined,
  };
}

export function mapCallScript(r: any) {
  return {
    id: r.id,
    name: r.name,
    description: r.description || "",
    blocks: Array.isArray(r.blocks) ? r.blocks : JSON.parse(r.blocks || "[]"),
    orgId: r.org_id,
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

export function mapCallRecord(r: any) {
  return {
    id: r.id,
    contactId: r.contact_id || "",
    contactName: r.contact_name || "",
    disposition: r.disposition || "",
    duration: r.duration || 0,
    notes: r.notes || "",
    scriptId: r.script_id || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
  };
}

export function mapCampaign(r: any) {
  return {
    id: r.id,
    name: r.name,
    status: r.status || "Planned",
    type: r.type || "",
    startDate: r.start_date || "",
    endDate: r.end_date || "",
    budget: r.budget || 0,
    actualCost: r.actual_cost || undefined,
    responses: r.responses || 0,
    description: r.description || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
  };
}

export function mapProduct(r: any) {
  return {
    id: r.id,
    name: r.name,
    code: r.code || "",
    description: r.description || "",
    price: r.price || 0,
    family: r.family || "",
    isActive: r.is_active === true || r.is_active === 1,
    pricingTiers: r.pricing_tiers || undefined,
    orgId: r.org_id,
    createdAt: r.created_at || "",
  };
}

export function mapIntegration(r: any) {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    enabled: r.enabled === true || r.enabled === 1,
    orgId: r.org_id,
  };
}

export function mapMarketingPost(r: any) {
  return {
    id: r.id,
    platform: r.platform,
    text: r.text,
    scheduledAt: r.scheduled_at || "",
    status: r.status || "Draft",
    orgId: r.org_id,
    createdAt: r.created_at || "",
  };
}

export function mapVendor(r: any) {
  return {
    id: r.id,
    name: r.name,
    contact: r.contact || "",
    email: r.email || "",
    phone: r.phone || "",
    category: r.category || "",
    status: r.status || "Pending",
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
  };
}

export function mapClient(r: any) {
  return {
    id: r.id,
    name: r.name,
    industry: r.industry || "",
    contact: r.contact || "",
    contractValue: r.contract_value || 0,
    startDate: r.start_date || "",
    status: r.status || "Active",
    ownerId: r.owner_id || "",
    ownerName: r.owner_name || "",
    orgId: r.org_id,
    createdAt: r.created_at || "",
  };
}

export function mapTag(r: any) {
  return {
    id: r.id,
    name: r.name,
    color: r.color || "#2D7FF9",
    orgId: r.org_id,
  };
}

export function mapBlogPost(r: any) {
  return {
    id: r.id,
    title: r.title || "",
    slug: r.slug || "",
    excerpt: r.excerpt || "",
    content: r.content || "",
    coverImage: r.cover_image || "",
    authorId: r.author_id || "",
    authorName: r.author_name || "",
    status: r.status || "draft",
    publishedAt: r.published_at || null,
    orgId: r.org_id || "",
    createdAt: r.created_at || "",
    updatedAt: r.updated_at || "",
  };
}

// ─── camelCase → D1 snake_case for writes ───

export function toSnake(obj: Record<string, any>): Record<string, any> {
  const map: Record<string, string> = {
    firstName: "first_name", lastName: "last_name", accountId: "account_id",
    accountName: "account_name", ownerId: "owner_id", ownerName: "owner_name",
    orgId: "org_id", createdAt: "created_at", updatedAt: "updated_at",
    mailingAddress: "mailing_address", billingAddress: "billing_address",
    annualRevenue: "annual_revenue", closeDate: "close_date", contactId: "contact_id",
    contactName: "contact_name", dueDate: "due_date", dealId: "deal_id",
    completedAt: "completed_at", durationMinutes: "duration_minutes",
    closedAt: "closed_at", isActive: "is_active", pricingTiers: "pricing_tiers",
    scriptId: "script_id", scheduledAt: "scheduled_at", startDate: "start_date",
    endDate: "end_date", actualCost: "actual_cost", contractValue: "contract_value",
    coverImage: "cover_image", authorId: "author_id", authorName: "author_name",
    publishedAt: "published_at",
  };
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    result[map[key] || key] = val;
  }
  return result;
}
