import { Hono } from 'hono';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.post('/', async (c) => {
  const db = c.env.DB;

  // Create tables
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS organizations (id TEXT PRIMARY KEY, name TEXT NOT NULL, logo_url TEXT, timezone TEXT DEFAULT 'America/New_York', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT DEFAULT 'rep', avatar_url TEXT, provider TEXT, provider_id TEXT, is_admin INTEGER DEFAULT 0, manager_id TEXT, title TEXT, department TEXT, is_active INTEGER DEFAULT 1, last_login TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT, phone TEXT, mobile TEXT, title TEXT, department TEXT, account_id TEXT, account_name TEXT, owner_id TEXT, owner_name TEXT, description TEXT, mailing_address TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS accounts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, industry TEXT, type TEXT, phone TEXT, website TEXT, billing_address TEXT, description TEXT, employees INTEGER, annual_revenue REAL, owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS deals (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, amount REAL DEFAULT 0, stage TEXT DEFAULT 'Prospecting', close_date TEXT, account_id TEXT, account_name TEXT, contact_id TEXT, contact_name TEXT, owner_id TEXT, owner_name TEXT, probability INTEGER DEFAULT 0, description TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, type TEXT NOT NULL, subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'To Do', due_date TEXT, contact_id TEXT, contact_name TEXT, account_id TEXT, account_name TEXT, deal_id TEXT, owner_id TEXT, owner_name TEXT, duration_minutes INTEGER, completed_at TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT, phone TEXT, company TEXT, title TEXT, status TEXT DEFAULT 'New', source TEXT, rating TEXT, industry TEXT, description TEXT, owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS cases (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, subject TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'New', priority TEXT DEFAULT 'Medium', contact_id TEXT, contact_name TEXT, account_id TEXT, account_name TEXT, owner_id TEXT, owner_name TEXT, resolution TEXT, closed_at TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS call_scripts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, blocks TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS call_records (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, contact_id TEXT, contact_name TEXT, disposition TEXT, duration INTEGER DEFAULT 0, notes TEXT, script_id TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS campaigns (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, status TEXT DEFAULT 'Planned', type TEXT, start_date TEXT, end_date TEXT, budget REAL DEFAULT 0, actual_cost REAL, responses INTEGER DEFAULT 0, description TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, code TEXT, description TEXT, price REAL DEFAULT 0, family TEXT, is_active INTEGER DEFAULT 1, pricing_tiers TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS integrations (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, type TEXT, enabled INTEGER DEFAULT 0)`,
    `CREATE TABLE IF NOT EXISTS marketing_posts (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, platform TEXT NOT NULL, text TEXT NOT NULL, scheduled_at TEXT, status TEXT DEFAULT 'Draft', created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS vendors (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, contact TEXT, email TEXT, phone TEXT, category TEXT, status TEXT DEFAULT 'Pending', owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, name TEXT NOT NULL, industry TEXT, contact TEXT, contract_value REAL DEFAULT 0, start_date TEXT, status TEXT DEFAULT 'Active', owner_id TEXT, owner_name TEXT, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT DEFAULT '#2D7FF9', org_id TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS record_tags (tag_id TEXT NOT NULL, record_type TEXT NOT NULL, record_id TEXT NOT NULL, PRIMARY KEY (tag_id, record_type, record_id))`,
    // V2 tables
    `CREATE TABLE IF NOT EXISTS org_domains (domain TEXT PRIMARY KEY, org_id TEXT NOT NULL, verified INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS record_transfers (id TEXT PRIMARY KEY, record_type TEXT NOT NULL, record_id TEXT NOT NULL, from_user_id TEXT, to_user_id TEXT NOT NULL, transferred_by TEXT NOT NULL, reason TEXT, org_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS record_shares (id TEXT PRIMARY KEY, record_type TEXT NOT NULL, record_id TEXT NOT NULL, shared_with_user_id TEXT NOT NULL, permission TEXT DEFAULT 'view', shared_by TEXT NOT NULL, org_id TEXT NOT NULL, created_at TEXT DEFAULT (datetime('now')), UNIQUE(record_type, record_id, shared_with_user_id))`,
    `CREATE TABLE IF NOT EXISTS emails (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, sender TEXT NOT NULL, sender_email TEXT NOT NULL, subject TEXT NOT NULL, preview TEXT, body TEXT, date TEXT, folder TEXT DEFAULT 'Inbox', read INTEGER DEFAULT 0, starred INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS deal_items (id TEXT PRIMARY KEY, deal_id TEXT NOT NULL, title TEXT NOT NULL, completed INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS activity_items (id TEXT PRIMARY KEY, activity_id TEXT NOT NULL, title TEXT NOT NULL, completed INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))`,
    `CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, org_id TEXT NOT NULL, record_type TEXT NOT NULL, record_id TEXT NOT NULL, content TEXT NOT NULL, author_id TEXT, author_name TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))`,
  ];

  for (const sql of schemaStatements) {
    await db.prepare(sql).run();
  }

  // Organizations
  const orgs = [
    { id: "org-1", name: "Acme Corp", timezone: "America/New_York" },
    { id: "org-2", name: "TechStart Inc", timezone: "America/Los_Angeles" },
    { id: "org-3", name: "Global Finance", timezone: "Europe/London" },
  ];
  for (const o of orgs) {
    await db.prepare("INSERT OR IGNORE INTO organizations (id, name, timezone) VALUES (?, ?, ?)").bind(o.id, o.name, o.timezone).run();
  }

  // Users (with hierarchy)
  const users = [
    { id: "1", name: "Maxwell Seefeld", email: "seefeldmaxwell1@gmail.com", role: "admin", orgId: "org-1", title: "CEO", department: "Executive", managerId: null },
    { id: "2", name: "Sarah Chen", email: "sarah@y12.ai", role: "admin", orgId: "org-1", title: "VP Sales", department: "Sales", managerId: "1" },
    { id: "3", name: "Mike Johnson", email: "mike@y12.ai", role: "member", orgId: "org-1", title: "Sales Rep", department: "Sales", managerId: "2" },
    { id: "4", name: "Emily Davis", email: "emily@y12.ai", role: "member", orgId: "org-1", title: "Marketing Lead", department: "Marketing", managerId: "1" },
    { id: "5", name: "Alex Kim", email: "alex@axia.crm", role: "admin", orgId: "org-2", title: "CEO", department: "Executive", managerId: null },
    { id: "6", name: "Lisa Park", email: "lisa@axia.crm", role: "member", orgId: "org-2", title: "Sales Rep", department: "Sales", managerId: "5" },
    { id: "7", name: "James Wilson", email: "james@axia.crm", role: "admin", orgId: "org-3", title: "Managing Director", department: "Executive", managerId: null },
    { id: "8", name: "Rachel Brown", email: "rachel@axia.crm", role: "member", orgId: "org-3", title: "Analyst", department: "Investments", managerId: "7" },
  ];
  for (const u of users) {
    await db.prepare("INSERT OR IGNORE INTO users (id, org_id, email, name, role, is_admin, title, department, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(u.id, u.orgId, u.email, u.name, u.role, u.role === "admin" ? 1 : 0, u.title, u.department, u.managerId).run();
  }

  // Org domains
  const domains = [
    { domain: "axia.crm", orgId: "org-1", verified: 1 },
    { domain: "y12.ai", orgId: "org-1", verified: 1 },
    { domain: "gmail.com", orgId: "org-1", verified: 1 },
  ];
  for (const d of domains) {
    await db.prepare("INSERT OR IGNORE INTO org_domains (domain, org_id, verified) VALUES (?, ?, ?)").bind(d.domain, d.orgId, d.verified).run();
  }

  // Accounts
  const accounts = [
    { id: "a1", name: "Globex Corporation", industry: "Technology", type: "Customer", phone: "(555) 100-1000", website: "globex.com", billingAddress: "123 Main St, Springfield, IL 62701", description: "Major tech enterprise, 5000+ employees", employees: 5200, annualRevenue: 850000000, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "a2", name: "Initech", industry: "Software", type: "Customer", phone: "(555) 200-2000", website: "initech.com", billingAddress: "456 Oak Ave, Austin, TX 73301", description: "Mid-market software company", employees: 1200, annualRevenue: 280000000, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "a3", name: "Umbrella Corp", industry: "Pharmaceutical", type: "Prospect", phone: "(555) 300-3000", website: "umbrella.com", billingAddress: "789 Pine Rd, Raccoon City, OH 44101", description: "Large pharmaceutical conglomerate", employees: 12000, annualRevenue: 3200000000, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "a4", name: "Stark Industries", industry: "Manufacturing", type: "Customer", phone: "(555) 400-4000", website: "starkindustries.com", billingAddress: "1 Stark Tower, New York, NY 10001", description: "Leading manufacturer", employees: 45000, annualRevenue: 12000000000, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "a5", name: "Wayne Enterprises", industry: "Conglomerate", type: "Customer", phone: "(555) 500-5000", website: "wayneenterprises.com", billingAddress: "1007 Mountain Dr, Gotham, NJ 07001", description: "Multi-industry conglomerate", employees: 32000, annualRevenue: 7500000000, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "a6", name: "Acme Solutions", industry: "Consulting", type: "Partner", phone: "(555) 600-6000", website: "acmesolutions.com", billingAddress: "321 Elm St, San Francisco, CA 94102", description: "Boutique consulting firm", employees: 450, annualRevenue: 85000000, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "a7", name: "Cyberdyne Systems", industry: "Technology", type: "Prospect", phone: "(555) 700-7000", website: "cyberdyne.com", billingAddress: "18144 El Camino Real, Sunnyvale, CA 94087", description: "AI and robotics research", employees: 800, annualRevenue: 120000000, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1" },
    { id: "a8", name: "Soylent Corp", industry: "Food & Beverage", type: "Customer", phone: "(555) 800-8000", website: "soylentcorp.com", billingAddress: "500 Broadway, New York, NY 10012", description: "Innovative food technology", employees: 2100, annualRevenue: 450000000, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "a9", name: "Weyland-Yutani", industry: "Aerospace", type: "Prospect", phone: "(555) 900-9000", website: "weyland-yutani.com", billingAddress: "900 Industrial Pkwy, Houston, TX 77001", description: "Aerospace corporation", employees: 18000, annualRevenue: 5600000000, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "a10", name: "Oscorp Industries", industry: "Biotech", type: "Customer", phone: "(555) 000-1000", website: "oscorp.com", billingAddress: "200 Park Ave, New York, NY 10166", description: "Biotech leader", employees: 6500, annualRevenue: 1800000000, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "a11", name: "CloudFirst", industry: "Cloud Computing", type: "Customer", phone: "(555) 100-2001", website: "cloudfirst.io", billingAddress: "100 Cloud Way, Seattle, WA 98101", description: "Cloud infrastructure provider", employees: 300, annualRevenue: 45000000, ownerId: "5", ownerName: "Alex Kim", orgId: "org-2" },
    { id: "a12", name: "DataDriven Co", industry: "Analytics", type: "Prospect", phone: "(555) 200-3001", website: "datadriven.co", billingAddress: "200 Data Blvd, San Jose, CA 95101", description: "Data analytics platform", employees: 150, annualRevenue: 22000000, ownerId: "6", ownerName: "Lisa Park", orgId: "org-2" },
    { id: "a13", name: "FinServ Partners", industry: "Financial Services", type: "Customer", phone: "+44 20 7100 1000", website: "finservpartners.co.uk", billingAddress: "10 Downing St, London, UK", description: "UK financial services advisory", employees: 800, annualRevenue: 120000000, ownerId: "7", ownerName: "James Wilson", orgId: "org-3" },
    { id: "a14", name: "Capital Group", industry: "Investment", type: "Customer", phone: "+44 20 7200 2000", website: "capitalgroup.co.uk", billingAddress: "1 Canary Wharf, London, UK", description: "Investment management firm", employees: 2500, annualRevenue: 3500000000, ownerId: "8", ownerName: "Rachel Brown", orgId: "org-3" },
  ];
  for (const a of accounts) {
    await db.prepare("INSERT OR IGNORE INTO accounts (id, org_id, name, industry, type, phone, website, billing_address, description, employees, annual_revenue, owner_id, owner_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(a.id, a.orgId, a.name, a.industry, a.type, a.phone, a.website, a.billingAddress, a.description, a.employees, a.annualRevenue, a.ownerId, a.ownerName).run();
  }

  // Contacts
  const contacts = [
    { id: "c1", firstName: "John", lastName: "Smith", title: "VP of Sales", accountId: "a1", accountName: "Globex Corporation", phone: "(555) 123-4567", mobile: "(555) 987-6543", email: "john.smith@globex.com", mailingAddress: "123 Main St, Springfield, IL 62701", department: "Sales", description: "Key decision maker", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-15", updatedAt: "2025-12-01" },
    { id: "c2", firstName: "Jane", lastName: "Doe", title: "CTO", accountId: "a2", accountName: "Initech", phone: "(555) 234-5678", email: "jane.doe@initech.com", mailingAddress: "456 Oak Ave, Austin, TX 73301", department: "Engineering", description: "Technical buyer", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-08-20", updatedAt: "2025-11-15" },
    { id: "c3", firstName: "Robert", lastName: "Brown", title: "Director of Marketing", accountId: "a3", accountName: "Umbrella Corp", phone: "(555) 345-6789", email: "rbrown@umbrella.com", mailingAddress: "789 Pine Rd, Raccoon City, OH 44101", department: "Marketing", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-07-10", updatedAt: "2025-10-22" },
    { id: "c4", firstName: "Maria", lastName: "Garcia", title: "CEO", accountId: "a4", accountName: "Stark Industries", phone: "(555) 456-7890", mobile: "(555) 111-2222", email: "mgarcia@stark.com", mailingAddress: "1 Stark Tower, New York, NY 10001", department: "Executive", description: "Final approver for deals over $100K", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-06-05", updatedAt: "2025-12-10" },
    { id: "c5", firstName: "David", lastName: "Lee", title: "Head of Procurement", accountId: "a5", accountName: "Wayne Enterprises", phone: "(555) 567-8901", email: "dlee@wayne.com", mailingAddress: "1007 Mountain Dr, Gotham, NJ 07001", department: "Procurement", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-05-18", updatedAt: "2025-11-30" },
    { id: "c6", firstName: "Lisa", lastName: "Wang", title: "VP Engineering", accountId: "a1", accountName: "Globex Corporation", phone: "(555) 678-9012", email: "lwang@globex.com", mailingAddress: "123 Main St, Springfield, IL 62701", department: "Engineering", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-10-01", updatedAt: "2025-12-05" },
    { id: "c7", firstName: "James", lastName: "Taylor", title: "Sales Manager", accountId: "a2", accountName: "Initech", phone: "(555) 789-0123", email: "jtaylor@initech.com", mailingAddress: "456 Oak Ave, Austin, TX 73301", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-09-22", updatedAt: "2025-11-28" },
    { id: "c8", firstName: "Emma", lastName: "Wilson", title: "CFO", accountId: "a3", accountName: "Umbrella Corp", phone: "(555) 890-1234", email: "ewilson@umbrella.com", mailingAddress: "789 Pine Rd, Raccoon City, OH 44101", department: "Finance", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-08-11", updatedAt: "2025-12-02" },
    { id: "c9", firstName: "Michael", lastName: "Chen", title: "Product Manager", accountId: "a6", accountName: "Acme Solutions", phone: "(555) 901-2345", email: "mchen@acmesol.com", mailingAddress: "321 Elm St, San Francisco, CA 94102", department: "Product", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-07-15", updatedAt: "2025-11-20" },
    { id: "c10", firstName: "Sarah", lastName: "Johnson", title: "Director of IT", accountId: "a7", accountName: "Cyberdyne Systems", phone: "(555) 012-3456", email: "sjohnson@cyberdyne.com", mailingAddress: "18144 El Camino Real, Sunnyvale, CA 94087", department: "IT", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-06-28", updatedAt: "2025-10-15" },
    { id: "c11", firstName: "Tom", lastName: "Anderson", title: "VP Sales", accountId: "a8", accountName: "Soylent Corp", phone: "(555) 111-3333", email: "tanderson@soylent.com", mailingAddress: "500 Broadway, New York, NY 10012", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-10-05", updatedAt: "2025-12-08" },
    { id: "c12", firstName: "Amy", lastName: "Rodriguez", title: "Marketing Director", accountId: "a4", accountName: "Stark Industries", phone: "(555) 222-4444", email: "arodriguez@stark.com", mailingAddress: "1 Stark Tower, New York, NY 10001", department: "Marketing", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-12", updatedAt: "2025-11-25" },
    { id: "c13", firstName: "Kevin", lastName: "Patel", title: "CIO", accountId: "a5", accountName: "Wayne Enterprises", phone: "(555) 333-5555", email: "kpatel@wayne.com", mailingAddress: "1007 Mountain Dr, Gotham, NJ 07001", department: "IT", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-08-30", updatedAt: "2025-12-12" },
    { id: "c14", firstName: "Nicole", lastName: "Kim", title: "Account Executive", accountId: "a6", accountName: "Acme Solutions", phone: "(555) 444-6666", email: "nkim@acmesol.com", mailingAddress: "321 Elm St, San Francisco, CA 94102", department: "Sales", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-07-22", updatedAt: "2025-10-30" },
    { id: "c15", firstName: "Brian", lastName: "Murphy", title: "Head of Sales", accountId: "a7", accountName: "Cyberdyne Systems", phone: "(555) 555-7777", email: "bmurphy@cyberdyne.com", mailingAddress: "18144 El Camino Real, Sunnyvale, CA 94087", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-06-15", updatedAt: "2025-11-10" },
    { id: "c16", firstName: "Rachel", lastName: "Foster", title: "Operations Manager", accountId: "a8", accountName: "Soylent Corp", phone: "(555) 666-8888", email: "rfoster@soylent.com", mailingAddress: "500 Broadway, New York, NY 10012", department: "Operations", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-10-18", updatedAt: "2025-12-15" },
    { id: "c17", firstName: "Daniel", lastName: "Wright", title: "VP Product", accountId: "a9", accountName: "Weyland-Yutani", phone: "(555) 777-9999", email: "dwright@weyland.com", mailingAddress: "900 Industrial Pkwy, Houston, TX 77001", department: "Product", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-09-05", updatedAt: "2025-11-22" },
    { id: "c18", firstName: "Laura", lastName: "Martinez", title: "Director of HR", accountId: "a10", accountName: "Oscorp Industries", phone: "(555) 888-0000", email: "lmartinez@oscorp.com", mailingAddress: "200 Park Ave, New York, NY 10166", department: "HR", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-08-02", updatedAt: "2025-10-28" },
    { id: "c19", firstName: "Chris", lastName: "Evans", title: "Sales Director", accountId: "a9", accountName: "Weyland-Yutani", phone: "(555) 999-1111", email: "cevans@weyland.com", mailingAddress: "900 Industrial Pkwy, Houston, TX 77001", department: "Sales", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-07-28", updatedAt: "2025-12-01" },
    { id: "c20", firstName: "Sophie", lastName: "Turner", title: "Chief Revenue Officer", accountId: "a10", accountName: "Oscorp Industries", phone: "(555) 000-2222", email: "sturner@oscorp.com", mailingAddress: "200 Park Ave, New York, NY 10166", department: "Revenue", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-06-20", updatedAt: "2025-11-18" },
    { id: "c21", firstName: "Alex", lastName: "Kim", title: "Sales Rep", accountId: "a11", accountName: "CloudFirst", phone: "(555) 100-2000", email: "akim@cloudfirst.com", mailingAddress: "100 Cloud Way, Seattle, WA 98101", department: "Sales", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-09-01", updatedAt: "2025-12-01" },
    { id: "c22", firstName: "Priya", lastName: "Sharma", title: "CTO", accountId: "a12", accountName: "DataDriven Co", phone: "(555) 200-3000", email: "psharma@datadriven.com", mailingAddress: "200 Data Blvd, San Jose, CA 95101", department: "Engineering", ownerId: "6", ownerName: "Lisa Park", orgId: "org-2", createdAt: "2025-08-15", updatedAt: "2025-11-15" },
    { id: "c23", firstName: "William", lastName: "Clarke", title: "Managing Director", accountId: "a13", accountName: "FinServ Partners", phone: "+44 20 7123 4567", email: "wclarke@finserv.co.uk", mailingAddress: "10 Downing St, London, UK", department: "Management", ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-07-01", updatedAt: "2025-12-01" },
    { id: "c24", firstName: "Charlotte", lastName: "Reed", title: "Investment Analyst", accountId: "a14", accountName: "Capital Group", phone: "+44 20 7234 5678", email: "creed@capitalgroup.co.uk", mailingAddress: "1 Canary Wharf, London, UK", department: "Investments", ownerId: "8", ownerName: "Rachel Brown", orgId: "org-3", createdAt: "2025-06-15", updatedAt: "2025-11-15" },
  ];
  for (const ct of contacts) {
    await db.prepare("INSERT OR IGNORE INTO contacts (id, org_id, first_name, last_name, email, phone, mobile, title, department, account_id, account_name, owner_id, owner_name, description, mailing_address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(ct.id, ct.orgId, ct.firstName, ct.lastName, ct.email || null, ct.phone || null, (ct as any).mobile || null, ct.title || null, (ct as any).department || null, ct.accountId || null, ct.accountName || null, ct.ownerId || null, ct.ownerName || null, (ct as any).description || null, ct.mailingAddress || null, ct.createdAt, ct.updatedAt).run();
  }

  // Deals
  const deals = [
    { id: "d1", name: "Globex Enterprise License", amount: 450000, stage: "Negotiation", closeDate: "2026-03-15", accountId: "a1", accountName: "Globex Corporation", contactId: "c1", contactName: "John Smith", probability: 75, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-01", updatedAt: "2025-12-10" },
    { id: "d2", name: "Initech ERP Integration", amount: 280000, stage: "Proposal", closeDate: "2026-04-01", accountId: "a2", accountName: "Initech", contactId: "c2", contactName: "Jane Doe", probability: 50, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-08-15", updatedAt: "2025-11-28" },
    { id: "d3", name: "Umbrella Security Suite", amount: 180000, stage: "Qualification", closeDate: "2026-05-15", accountId: "a3", accountName: "Umbrella Corp", contactId: "c3", contactName: "Robert Brown", probability: 30, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-10-01", updatedAt: "2025-12-05" },
    { id: "d4", name: "Stark Analytics Platform", amount: 520000, stage: "Closed Won", closeDate: "2025-11-30", accountId: "a4", accountName: "Stark Industries", contactId: "c4", contactName: "Maria Garcia", probability: 100, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-06-01", updatedAt: "2025-11-30" },
    { id: "d5", name: "Wayne Digital Transformation", amount: 380000, stage: "Negotiation", closeDate: "2026-02-28", accountId: "a5", accountName: "Wayne Enterprises", contactId: "c5", contactName: "David Lee", probability: 80, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-07-20", updatedAt: "2025-12-12" },
    { id: "d6", name: "Acme Consulting Package", amount: 95000, stage: "Prospecting", closeDate: "2026-06-01", accountId: "a6", accountName: "Acme Solutions", contactId: "c9", contactName: "Michael Chen", probability: 15, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-11-01", updatedAt: "2025-12-01" },
    { id: "d7", name: "Cyberdyne AI Module", amount: 210000, stage: "Qualification", closeDate: "2026-04-15", accountId: "a7", accountName: "Cyberdyne Systems", contactId: "c10", contactName: "Sarah Johnson", probability: 25, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-10-15", updatedAt: "2025-11-20" },
    { id: "d8", name: "Soylent Supply Chain", amount: 155000, stage: "Proposal", closeDate: "2026-03-30", accountId: "a8", accountName: "Soylent Corp", contactId: "c11", contactName: "Tom Anderson", probability: 45, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-09-20", updatedAt: "2025-12-08" },
    { id: "d9", name: "Weyland Space Systems", amount: 490000, stage: "Prospecting", closeDate: "2026-07-01", accountId: "a9", accountName: "Weyland-Yutani", contactId: "c17", contactName: "Daniel Wright", probability: 10, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-11-10", updatedAt: "2025-12-01" },
    { id: "d10", name: "Oscorp Lab Management", amount: 320000, stage: "Closed Won", closeDate: "2025-10-15", accountId: "a10", accountName: "Oscorp Industries", contactId: "c20", contactName: "Sophie Turner", probability: 100, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-05-01", updatedAt: "2025-10-15" },
    { id: "d11", name: "Globex Cloud Migration", amount: 175000, stage: "Closed Lost", closeDate: "2025-09-30", accountId: "a1", accountName: "Globex Corporation", contactId: "c6", contactName: "Lisa Wang", probability: 0, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-04-15", updatedAt: "2025-09-30" },
    { id: "d12", name: "Initech Mobile App", amount: 120000, stage: "Prospecting", closeDate: "2026-05-30", accountId: "a2", accountName: "Initech", contactId: "c7", contactName: "James Taylor", probability: 10, ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-01", updatedAt: "2025-12-10" },
    { id: "d13", name: "Stark Security Audit", amount: 85000, stage: "Closed Won", closeDate: "2025-08-20", accountId: "a4", accountName: "Stark Industries", contactId: "c12", contactName: "Amy Rodriguez", probability: 100, ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-03-10", updatedAt: "2025-08-20" },
    { id: "d14", name: "Wayne CRM Implementation", amount: 260000, stage: "Proposal", closeDate: "2026-03-01", accountId: "a5", accountName: "Wayne Enterprises", contactId: "c13", contactName: "Kevin Patel", probability: 55, ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-10-20", updatedAt: "2025-12-01" },
    { id: "d15", name: "Cyberdyne Robotics Platform", amount: 340000, stage: "Closed Lost", closeDate: "2025-11-15", accountId: "a7", accountName: "Cyberdyne Systems", contactId: "c15", contactName: "Brian Murphy", probability: 0, ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-06-15", updatedAt: "2025-11-15" },
    { id: "d16", name: "CloudFirst Infrastructure Deal", amount: 125000, stage: "Negotiation", closeDate: "2026-03-01", accountId: "a11", accountName: "CloudFirst", contactId: "c21", contactName: "Alex Kim", probability: 70, ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-09-15", updatedAt: "2025-12-01" },
    { id: "d17", name: "DataDriven Analytics Suite", amount: 88000, stage: "Qualification", closeDate: "2026-04-15", accountId: "a12", accountName: "DataDriven Co", contactId: "c22", contactName: "Priya Sharma", probability: 35, ownerId: "6", ownerName: "Lisa Park", orgId: "org-2", createdAt: "2025-10-01", updatedAt: "2025-11-20" },
    { id: "d18", name: "FinServ Compliance Platform", amount: 310000, stage: "Proposal", closeDate: "2026-02-15", accountId: "a13", accountName: "FinServ Partners", contactId: "c23", contactName: "William Clarke", probability: 60, ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-08-01", updatedAt: "2025-12-01" },
  ];
  for (const d of deals) {
    await db.prepare("INSERT OR IGNORE INTO deals (id, org_id, name, amount, stage, close_date, account_id, account_name, contact_id, contact_name, owner_id, owner_name, probability, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(d.id, d.orgId, d.name, d.amount, d.stage, d.closeDate, d.accountId, d.accountName, d.contactId, d.contactName, d.ownerId, d.ownerName, d.probability, d.createdAt, d.updatedAt).run();
  }

  // Activities
  const acts = [
    { id: "act1", type: "call", subject: "Discovery call with John Smith", description: "Discuss enterprise needs", status: "Done", dueDate: "2025-12-10", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", completedAt: "2025-12-10", createdAt: "2025-12-08" },
    { id: "act2", type: "email", subject: "Send proposal to Jane Doe", status: "Done", dueDate: "2025-12-09", contactId: "c2", contactName: "Jane Doe", accountId: "a2", accountName: "Initech", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", completedAt: "2025-12-09", createdAt: "2025-12-07" },
    { id: "act3", type: "meeting", subject: "Quarterly review with Stark Industries", status: "To Do", dueDate: "2026-02-25", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "act4", type: "task", subject: "Update Globex contract terms", status: "In Progress", dueDate: "2026-02-26", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-05" },
    { id: "act5", type: "call", subject: "Follow up with Robert Brown", status: "To Do", dueDate: "2026-02-25", contactId: "c3", contactName: "Robert Brown", accountId: "a3", accountName: "Umbrella Corp", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act6", type: "email", subject: "Send pricing update to Wayne", status: "Waiting", dueDate: "2026-02-24", contactId: "c5", contactName: "David Lee", accountId: "a5", accountName: "Wayne Enterprises", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "act7", type: "meeting", subject: "Product demo for Cyberdyne", status: "To Do", dueDate: "2026-02-27", contactId: "c10", contactName: "Sarah Johnson", accountId: "a7", accountName: "Cyberdyne Systems", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act8", type: "task", subject: "Prepare Soylent presentation", status: "In Progress", dueDate: "2026-02-25", contactId: "c11", contactName: "Tom Anderson", accountId: "a8", accountName: "Soylent Corp", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-09" },
    { id: "act9", type: "call", subject: "Cold call to Weyland-Yutani", status: "To Do", dueDate: "2026-02-26", contactId: "c17", contactName: "Daniel Wright", accountId: "a9", accountName: "Weyland-Yutani", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act10", type: "email", subject: "Contract renewal notice - Oscorp", status: "Done", dueDate: "2025-12-08", contactId: "c20", contactName: "Sophie Turner", accountId: "a10", accountName: "Oscorp Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", completedAt: "2025-12-08", createdAt: "2025-12-06" },
    { id: "act11", type: "meeting", subject: "Team sync - Pipeline review", status: "Done", dueDate: "2025-12-12", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", completedAt: "2025-12-12", createdAt: "2025-12-10" },
    { id: "act12", type: "task", subject: "Create case study for Stark deal", status: "To Do", dueDate: "2026-02-28", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "act13", type: "call", subject: "Check in with Lisa Wang", status: "Waiting", dueDate: "2026-02-27", contactId: "c6", contactName: "Lisa Wang", accountId: "a1", accountName: "Globex Corporation", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-05" },
    { id: "act14", type: "email", subject: "Send onboarding docs to Acme", status: "To Do", dueDate: "2026-02-25", contactId: "c9", contactName: "Michael Chen", accountId: "a6", accountName: "Acme Solutions", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act15", type: "meeting", subject: "Negotiation call with Globex", status: "To Do", dueDate: "2026-02-26", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", dealId: "d1", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act16", type: "task", subject: "Update CRM records for Q4", status: "In Progress", dueDate: "2026-02-25", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "act17", type: "call", subject: "Reference check - Kevin Patel", status: "Done", dueDate: "2025-12-11", contactId: "c13", contactName: "Kevin Patel", accountId: "a5", accountName: "Wayne Enterprises", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", completedAt: "2025-12-11", createdAt: "2025-12-09" },
    { id: "act18", type: "email", subject: "Follow up on demo feedback", status: "Done", dueDate: "2025-12-07", contactId: "c15", contactName: "Brian Murphy", accountId: "a7", accountName: "Cyberdyne Systems", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", completedAt: "2025-12-07", createdAt: "2025-12-05" },
    { id: "act19", type: "meeting", subject: "Strategy session with marketing", status: "To Do", dueDate: "2026-02-28", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act20", type: "task", subject: "Competitive analysis report", status: "Waiting", dueDate: "2026-02-27", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "act21", type: "call", subject: "Intro call with Nicole Kim", status: "To Do", dueDate: "2026-02-25", contactId: "c14", contactName: "Nicole Kim", accountId: "a6", accountName: "Acme Solutions", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act22", type: "email", subject: "Thank you note to Maria Garcia", status: "Done", dueDate: "2025-12-01", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", completedAt: "2025-12-01", createdAt: "2025-11-30" },
    { id: "act23", type: "meeting", subject: "Budget planning for Q1", status: "In Progress", dueDate: "2026-02-26", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act24", type: "task", subject: "Prepare Weyland proposal", status: "To Do", dueDate: "2026-03-01", contactId: "c17", contactName: "Daniel Wright", accountId: "a9", accountName: "Weyland-Yutani", dealId: "d9", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act25", type: "call", subject: "Check in with Rachel Foster", status: "To Do", dueDate: "2026-02-26", contactId: "c16", contactName: "Rachel Foster", accountId: "a8", accountName: "Soylent Corp", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act26", type: "email", subject: "Send meeting recap to Laura", status: "Waiting", dueDate: "2026-02-25", contactId: "c18", contactName: "Laura Martinez", accountId: "a10", accountName: "Oscorp Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-09" },
    { id: "act27", type: "meeting", subject: "Contract review with legal", status: "To Do", dueDate: "2026-02-27", dealId: "d1", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act28", type: "task", subject: "Submit expense report", status: "To Do", dueDate: "2026-02-28", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "act29", type: "call", subject: "Close negotiation with David Lee", status: "In Progress", dueDate: "2026-02-25", contactId: "c5", contactName: "David Lee", accountId: "a5", accountName: "Wayne Enterprises", dealId: "d5", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "act30", type: "email", subject: "Invoice follow-up - Stark", status: "To Do", dueDate: "2026-02-25", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "act31", type: "call", subject: "CloudFirst infrastructure review", status: "To Do", dueDate: "2026-02-25", contactId: "c21", contactName: "Alex Kim", accountId: "a11", accountName: "CloudFirst", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-12-10" },
    { id: "act32", type: "email", subject: "DataDriven proposal follow-up", status: "In Progress", dueDate: "2026-02-26", contactId: "c22", contactName: "Priya Sharma", accountId: "a12", accountName: "DataDriven Co", ownerId: "6", ownerName: "Lisa Park", orgId: "org-2", createdAt: "2025-12-08" },
    { id: "act33", type: "meeting", subject: "FinServ compliance review", status: "To Do", dueDate: "2026-02-27", contactId: "c23", contactName: "William Clarke", accountId: "a13", accountName: "FinServ Partners", ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-12-05" },
    { id: "act34", type: "task", subject: "Capital Group investment report", status: "In Progress", dueDate: "2026-02-28", contactId: "c24", contactName: "Charlotte Reed", accountId: "a14", accountName: "Capital Group", ownerId: "8", ownerName: "Rachel Brown", orgId: "org-3", createdAt: "2025-12-01" },
  ];
  for (const a of acts) {
    await db.prepare("INSERT OR IGNORE INTO activities (id, org_id, type, subject, description, status, due_date, contact_id, contact_name, account_id, account_name, deal_id, owner_id, owner_name, completed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(a.id, a.orgId, a.type, a.subject, (a as any).description || null, a.status, a.dueDate, a.contactId || null, a.contactName || null, a.accountId || null, a.accountName || null, (a as any).dealId || null, a.ownerId, a.ownerName, (a as any).completedAt || null, a.createdAt).run();
  }

  // Leads
  const seedLeads = [
    { id: "l1", firstName: "Tyler", lastName: "Brooks", company: "NextGen Software", title: "VP Sales", email: "tbrooks@nextgen.com", phone: "(555) 111-0001", status: "New", source: "Website", rating: "Hot", industry: "Technology", description: "Demo request", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "l2", firstName: "Amanda", lastName: "Stone", company: "PeakView Analytics", title: "Director of Ops", email: "astone@peakview.com", phone: "(555) 111-0002", status: "Contacted", source: "Trade Show", rating: "Warm", industry: "Analytics", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "l3", firstName: "Ryan", lastName: "Cooper", company: "Zenith Media", title: "CMO", email: "rcooper@zenith.com", phone: "(555) 111-0003", status: "Qualified", source: "Referral", rating: "Hot", industry: "Media", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-05" },
    { id: "l4", firstName: "Jessica", lastName: "Hall", company: "Vertex Engineering", title: "CTO", email: "jhall@vertex.com", phone: "(555) 111-0004", status: "New", source: "LinkedIn", rating: "Cold", industry: "Engineering", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "l5", firstName: "Marcus", lastName: "Williams", company: "Horizon Health", title: "COO", email: "mwilliams@horizon.com", phone: "(555) 111-0005", status: "Contacted", source: "Cold Call", rating: "Warm", industry: "Healthcare", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-01" },
    { id: "l6", firstName: "Samantha", lastName: "Park", company: "Elite Logistics", title: "Supply Chain Director", email: "spark@elite.com", phone: "(555) 111-0006", status: "Unqualified", source: "Website", rating: "Cold", industry: "Logistics", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-11-28" },
    { id: "l7", firstName: "Derek", lastName: "Fox", company: "Apex Financial", title: "Head of IT", email: "dfox@apexfin.com", phone: "(555) 111-0007", status: "New", source: "Webinar", rating: "Warm", industry: "Finance", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "l8", firstName: "Victoria", lastName: "Chen", company: "BlueSky Ventures", title: "Partner", email: "vchen@bluesky.com", phone: "(555) 111-0008", status: "Qualified", source: "Referral", rating: "Hot", industry: "Venture Capital", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-03" },
    { id: "l9", firstName: "Patrick", lastName: "O'Brien", company: "Emerald Tech", title: "CEO", email: "pobrien@emerald.com", phone: "(555) 111-0009", status: "Contacted", source: "Email Campaign", rating: "Warm", industry: "Technology", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-07" },
    { id: "l10", firstName: "Natalie", lastName: "Ross", company: "Summit Group", title: "VP Business Dev", email: "nross@summit.com", phone: "(555) 111-0010", status: "New", source: "Partner Referral", rating: "Hot", industry: "Consulting", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "l11", firstName: "Jason", lastName: "Lee", company: "Nimbus Cloud", title: "CTO", email: "jlee@nimbus.io", phone: "(555) 222-0001", status: "New", source: "Website", rating: "Warm", industry: "Cloud Computing", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-12-10" },
    { id: "l12", firstName: "Oliver", lastName: "Thompson", company: "Sterling Bank", title: "MD", email: "othompson@sterling.co.uk", phone: "+44 20 7300 3000", status: "Qualified", source: "Referral", rating: "Hot", industry: "Banking", ownerId: "7", ownerName: "James Wilson", orgId: "org-3", createdAt: "2025-12-05" },
  ];
  for (const l of seedLeads) {
    await db.prepare("INSERT OR IGNORE INTO leads (id, org_id, first_name, last_name, email, phone, company, title, status, source, rating, industry, description, owner_id, owner_name, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(l.id, l.orgId, l.firstName, l.lastName, l.email, l.phone, l.company, l.title, l.status, l.source, l.rating, l.industry, (l as any).description || null, l.ownerId, l.ownerName, l.createdAt).run();
  }

  // Cases
  const seedCases = [
    { id: "cs1", subject: "Login issues with SSO integration", status: "Working", priority: "High", description: "Customer unable to log in via SSO after recent update.", contactId: "c1", contactName: "John Smith", accountId: "a1", accountName: "Globex Corporation", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-10" },
    { id: "cs2", subject: "Data export formatting error", status: "New", priority: "Medium", description: "CSV exports have incorrect date formatting.", contactId: "c2", contactName: "Jane Doe", accountId: "a2", accountName: "Initech", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-11" },
    { id: "cs3", subject: "API rate limiting too aggressive", status: "Escalated", priority: "High", description: "Customer hitting API rate limits during normal operations.", contactId: "c4", contactName: "Maria Garcia", accountId: "a4", accountName: "Stark Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-09" },
    { id: "cs4", subject: "Dashboard loading slowly", status: "Working", priority: "Low", description: "Analytics dashboard takes 15+ seconds to load.", contactId: "c5", contactName: "David Lee", accountId: "a5", accountName: "Wayne Enterprises", ownerId: "4", ownerName: "Emily Davis", orgId: "org-1", createdAt: "2025-12-08" },
    { id: "cs5", subject: "Missing email notifications", status: "Closed", priority: "Medium", description: "Customer not receiving automated email notifications.", resolution: "Fixed email service configuration.", contactId: "c11", contactName: "Tom Anderson", accountId: "a8", accountName: "Soylent Corp", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1", createdAt: "2025-12-05", closedAt: "2025-12-08" },
    { id: "cs6", subject: "Custom field validation broken", status: "New", priority: "Low", description: "Custom picklist fields not validating correctly.", contactId: "c9", contactName: "Michael Chen", accountId: "a6", accountName: "Acme Solutions", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1", createdAt: "2025-12-12" },
    { id: "cs7", subject: "Report generation timeout", status: "Working", priority: "High", description: "Large report generation times out after 60 seconds.", contactId: "c20", contactName: "Sophie Turner", accountId: "a10", accountName: "Oscorp Industries", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1", createdAt: "2025-12-07" },
    { id: "cs8", subject: "Integration sync failure", status: "New", priority: "Medium", description: "Google Calendar integration failing to sync events.", contactId: "c21", contactName: "Alex Kim", accountId: "a11", accountName: "CloudFirst", ownerId: "5", ownerName: "Alex Kim", orgId: "org-2", createdAt: "2025-12-10" },
  ];
  for (const cs of seedCases) {
    await db.prepare("INSERT OR IGNORE INTO cases (id, org_id, subject, description, status, priority, contact_id, contact_name, account_id, account_name, owner_id, owner_name, resolution, closed_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(cs.id, cs.orgId, cs.subject, cs.description, cs.status, cs.priority, cs.contactId || null, cs.contactName || null, cs.accountId || null, cs.accountName || null, cs.ownerId, cs.ownerName, (cs as any).resolution || null, (cs as any).closedAt || null, cs.createdAt).run();
  }

  // Call Scripts
  const scripts = [
    { id: "scr1", name: "Cold Call - Enterprise", description: "Standard cold call script for enterprise prospects", blocks: JSON.stringify([
      { id: "sb1", title: "Intro", content: "Hi [Name], this is [Your Name] from Axia. I'm reaching out because we help companies like [Company] streamline their sales operations. Do you have 2 minutes?" },
      { id: "sb2", title: "Discovery", content: "What CRM are you currently using? What are the biggest challenges your sales team faces?" },
      { id: "sb3", title: "Pitch", content: "Axia helps teams like yours increase win rates by 35% with AI-powered insights and automated follow-ups." },
      { id: "sb4", title: "Objection Handling", content: "I understand the concern about switching costs. Our migration team handles everything, and most customers are onboarded within 2 weeks." },
      { id: "sb5", title: "Close", content: "Would you be open to a 15-minute demo this week? I have availability on [Day] at [Time]." },
    ]), orgId: "org-1" },
    { id: "scr2", name: "Follow-Up - Demo Attended", description: "Follow-up for prospects who attended a demo", blocks: JSON.stringify([
      { id: "sb6", title: "Intro", content: "Hi [Name], thanks again for attending the demo. I wanted to follow up and see if you had any questions." },
      { id: "sb7", title: "Discovery", content: "Which features resonated most with your team?" },
      { id: "sb8", title: "Pitch", content: "I've put together a custom proposal that focuses on [their priorities]." },
      { id: "sb9", title: "Close", content: "Can we schedule a call with your team to review the proposal?" },
    ]), orgId: "org-1" },
    { id: "scr3", name: "Renewal Call", description: "Script for customer renewal conversations", blocks: JSON.stringify([
      { id: "sb10", title: "Intro", content: "Hi [Name], I'm calling about your upcoming renewal. How has your experience been?" },
      { id: "sb11", title: "Discovery", content: "What features has your team found most valuable?" },
      { id: "sb12", title: "Pitch", content: "We've added several new features since your last renewal." },
      { id: "sb13", title: "Close", content: "I'll send over the renewal proposal. Can I count on getting this wrapped up by [date]?" },
    ]), orgId: "org-1" },
  ];
  for (const s of scripts) {
    await db.prepare("INSERT OR IGNORE INTO call_scripts (id, org_id, name, description, blocks) VALUES (?, ?, ?, ?, ?)").bind(s.id, s.orgId, s.name, s.description, s.blocks).run();
  }

  // Campaigns
  const seedCampaigns = [
    { id: "camp1", name: "Q1 Product Launch", status: "Planned", type: "Email", startDate: "2026-01-15", endDate: "2026-02-28", budget: 25000, responses: 0, orgId: "org-1" },
    { id: "camp2", name: "SaaStr Conference 2025", status: "Completed", type: "Event", startDate: "2025-09-10", endDate: "2025-09-12", budget: 50000, actualCost: 47500, responses: 342, orgId: "org-1" },
    { id: "camp3", name: "Winter Webinar Series", status: "Active", type: "Webinar", startDate: "2025-11-01", endDate: "2026-01-31", budget: 8000, actualCost: 3200, responses: 156, orgId: "org-1" },
    { id: "camp4", name: "LinkedIn Ads - Enterprise", status: "Active", type: "Digital Ads", startDate: "2025-10-01", endDate: "2026-03-31", budget: 35000, actualCost: 18500, responses: 89, orgId: "org-1" },
    { id: "camp5", name: "Customer Referral Program", status: "Active", type: "Referral", startDate: "2025-07-01", endDate: "2026-06-30", budget: 15000, actualCost: 8200, responses: 28, orgId: "org-1" },
  ];
  for (const camp of seedCampaigns) {
    await db.prepare("INSERT OR IGNORE INTO campaigns (id, org_id, name, status, type, start_date, end_date, budget, actual_cost, responses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(camp.id, camp.orgId, camp.name, camp.status, camp.type, camp.startDate, camp.endDate, camp.budget, (camp as any).actualCost || null, camp.responses).run();
  }

  // Products
  const seedProducts = [
    { id: "p1", name: "Axia CRM Starter", code: "AX-START", description: "Basic CRM for small teams.", price: 29, family: "CRM", isActive: 1, pricingTiers: JSON.stringify([{minQty:1,price:29},{minQty:10,price:25},{minQty:50,price:20}]), orgId: "org-1" },
    { id: "p2", name: "Axia CRM Professional", code: "AX-PRO", description: "Advanced CRM with automation.", price: 79, family: "CRM", isActive: 1, pricingTiers: JSON.stringify([{minQty:1,price:79},{minQty:10,price:69},{minQty:50,price:55}]), orgId: "org-1" },
    { id: "p3", name: "Axia CRM Enterprise", code: "AX-ENT", description: "Full-featured CRM with unlimited customization.", price: 149, family: "CRM", isActive: 1, pricingTiers: JSON.stringify([{minQty:1,price:149},{minQty:10,price:129},{minQty:50,price:99}]), orgId: "org-1" },
    { id: "p4", name: "Power Dialer Add-On", code: "AX-DIAL", description: "Add power dialer functionality.", price: 35, family: "Add-Ons", isActive: 1, pricingTiers: JSON.stringify([{minQty:1,price:35},{minQty:10,price:30}]), orgId: "org-1" },
    { id: "p5", name: "Marketing Suite", code: "AX-MKT", description: "Email campaigns and lead scoring.", price: 49, family: "Marketing", isActive: 1, pricingTiers: JSON.stringify([{minQty:1,price:49},{minQty:10,price:42}]), orgId: "org-1" },
    { id: "p6", name: "Analytics Pro", code: "AX-ANALYTICS", description: "Advanced reporting and analytics.", price: 25, family: "Add-Ons", isActive: 1, orgId: "org-1" },
    { id: "p7", name: "Service Cloud", code: "AX-SVC", description: "Case management and knowledge base.", price: 59, family: "Service", isActive: 1, pricingTiers: JSON.stringify([{minQty:1,price:59},{minQty:10,price:49}]), orgId: "org-1" },
    { id: "p8", name: "Legacy Basic (Deprecated)", code: "AX-LEGACY", description: "Previous generation CRM.", price: 19, family: "CRM", isActive: 0, orgId: "org-1" },
  ];
  for (const p of seedProducts) {
    await db.prepare("INSERT OR IGNORE INTO products (id, org_id, name, code, description, price, family, is_active, pricing_tiers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(p.id, p.orgId, p.name, p.code, p.description, p.price, p.family, p.isActive, (p as any).pricingTiers || null).run();
  }

  // Integrations
  const seedIntegrations = [
    { id: "int1", name: "Google Workspace", type: "google", enabled: 1, orgId: "org-1" },
    { id: "int2", name: "Microsoft 365", type: "microsoft", enabled: 0, orgId: "org-1" },
    { id: "int3", name: "Slack", type: "slack", enabled: 1, orgId: "org-1" },
  ];
  for (const i of seedIntegrations) {
    await db.prepare("INSERT OR IGNORE INTO integrations (id, org_id, name, type, enabled) VALUES (?, ?, ?, ?, ?)").bind(i.id, i.orgId, i.name, i.type, i.enabled).run();
  }

  // Marketing Posts
  const seedPosts = [
    { id: "mp1", platform: "LinkedIn", text: "Just launched our new Q1 report...", scheduledAt: "2026-02-26 09:00:00", status: "Scheduled", orgId: "org-1" },
    { id: "mp2", platform: "X", text: "5 tips for better team productivity...", scheduledAt: "2026-02-26 14:00:00", status: "Draft", orgId: "org-1" },
    { id: "mp3", platform: "Instagram", text: "Behind the scenes of our product...", scheduledAt: "2026-02-27 10:00:00", status: "Scheduled", orgId: "org-1" },
    { id: "mp4", platform: "LinkedIn", text: "Customer spotlight: How Acme Corp...", scheduledAt: "2026-02-28 11:00:00", status: "Scheduled", orgId: "org-1" },
    { id: "mp5", platform: "X", text: "New feature alert! Introducing...", scheduledAt: "2026-03-01 09:00:00", status: "Draft", orgId: "org-1" },
    { id: "mp6", platform: "LinkedIn", text: "Weekly team update: What we shipped...", scheduledAt: "2026-03-03 09:00:00", status: "Scheduled", orgId: "org-1" },
  ];
  for (const p of seedPosts) {
    await db.prepare("INSERT OR IGNORE INTO marketing_posts (id, org_id, platform, text, scheduled_at, status) VALUES (?, ?, ?, ?, ?, ?)").bind(p.id, p.orgId, p.platform, p.text, p.scheduledAt, p.status).run();
  }

  // Vendors seed data
  const seedVendors = [
    { id: "v1", name: "TechSupply Co", contact: "Mark Stevens", email: "mark@techsupply.com", phone: "(555) 400-1001", category: "Hardware", status: "Active", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "v2", name: "CloudServices Inc", contact: "Anna Lee", email: "anna@cloudservices.com", phone: "(555) 400-1002", category: "Cloud", status: "Active", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "v3", name: "OfficeMax Pro", contact: "Jake Torres", email: "jake@officemax.com", phone: "(555) 400-1003", category: "Office Supplies", status: "Pending", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
  ];
  for (const v of seedVendors) {
    await db.prepare("INSERT OR IGNORE INTO vendors (id, org_id, name, contact, email, phone, category, status, owner_id, owner_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(v.id, v.orgId, v.name, v.contact, v.email, v.phone, v.category, v.status, v.ownerId, v.ownerName).run();
  }

  // Clients seed data
  const seedClients = [
    { id: "cl1", name: "Globex Corporation", industry: "Technology", contact: "John Smith", contractValue: 450000, startDate: "2025-01-15", status: "Active", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
    { id: "cl2", name: "Stark Industries", industry: "Manufacturing", contact: "Maria Garcia", contractValue: 520000, startDate: "2025-06-01", status: "Active", ownerId: "2", ownerName: "Sarah Chen", orgId: "org-1" },
    { id: "cl3", name: "Oscorp Industries", industry: "Biotech", contact: "Sophie Turner", contractValue: 320000, startDate: "2025-05-01", status: "Active", ownerId: "3", ownerName: "Mike Johnson", orgId: "org-1" },
    { id: "cl4", name: "Soylent Corp", industry: "Food & Beverage", contact: "Tom Anderson", contractValue: 155000, startDate: "2025-09-20", status: "At Risk", ownerId: "1", ownerName: "Maxwell Seefeld", orgId: "org-1" },
  ];
  for (const cl of seedClients) {
    await db.prepare("INSERT OR IGNORE INTO clients (id, org_id, name, industry, contact, contract_value, start_date, status, owner_id, owner_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(cl.id, cl.orgId, cl.name, cl.industry, cl.contact, cl.contractValue, cl.startDate, cl.status, cl.ownerId, cl.ownerName).run();
  }

  // Tags seed data
  const seedTags = [
    { id: "tag1", name: "VIP", color: "#FF4444", orgId: "org-1" },
    { id: "tag2", name: "Enterprise", color: "#2D7FF9", orgId: "org-1" },
    { id: "tag3", name: "Follow Up", color: "#FFB800", orgId: "org-1" },
    { id: "tag4", name: "Priority", color: "#FF6B00", orgId: "org-1" },
  ];
  for (const t of seedTags) {
    await db.prepare("INSERT OR IGNORE INTO tags (id, org_id, name, color) VALUES (?, ?, ?, ?)").bind(t.id, t.orgId, t.name, t.color).run();
  }

  // Emails seed data
  const seedEmails = [
    { id: "em-1", orgId: "org-1", sender: "Sarah Chen", senderEmail: "sarah.chen@acmecorp.com", subject: "RE: Q1 Pipeline Review", preview: "Thanks for the updated numbers. I think we should schedule a follow-up to discuss the Globex opportunity before end of week...", body: "Hi,\n\nThanks for the updated numbers. I think we should schedule a follow-up to discuss the Globex opportunity before end of week. The pricing looks competitive but we need to finalize the discount structure.\n\nAlso, can you loop in Mike from engineering? They had some questions about the integration timeline.\n\nBest,\nSarah", date: "2026-02-25", folder: "Inbox", read: 0, starred: 1 },
    { id: "em-2", orgId: "org-1", sender: "John Smith", senderEmail: "john.smith@globex.com", subject: "Proposal for Globex Enterprise License", preview: "Attached is the revised proposal with the updated pricing tiers...", body: "Hello,\n\nAttached is the revised proposal with the updated pricing tiers. Let me know if the discount structure works for their budget.\n\nKey changes:\n- Volume discount increased from 15% to 20% for 100+ seats\n- Added 90-day free trial for analytics module\n- Removed setup fee for first year\n\nRegards,\nJohn Smith\nVP of Sales, Globex Corporation", date: "2026-02-24", folder: "Inbox", read: 0, starred: 0 },
    { id: "em-3", orgId: "org-1", sender: "Maria Garcia", senderEmail: "maria.garcia@stark.com", subject: "Meeting Recap: Stark Industries", preview: "Great call today. Key takeaways: they want a demo of the analytics module next Tuesday...", body: "Team,\n\nGreat call today with Stark Industries. Here are the key takeaways:\n\n1. They want a demo of the analytics module next Tuesday at 2pm EST\n2. Need SOC2 compliance documentation before procurement can sign off\n3. Budget has been approved for Q1 implementation\n\nAction items:\n- Send SOC2 docs to Maria by Thursday\n- Prepare analytics demo environment\n- Schedule follow-up with their IT team\n\nBest,\nMaria", date: "2026-02-23", folder: "Inbox", read: 1, starred: 0 },
    { id: "em-4", orgId: "org-1", sender: "Accounting", senderEmail: "accounting@axiacrm.com", subject: "Invoice #INV-2026-001 - Payment Due", preview: "Please find attached the invoice for Q4 services...", body: "Dear Customer,\n\nPlease find attached the invoice for Q4 services rendered.\n\nInvoice Details:\n- Invoice #: INV-2026-001\n- Amount: $45,000.00\n- Due Date: March 25, 2026\n- Payment Terms: Net-30\n\nThank you for your business.\n\nAccounting Department\nAxia CRM", date: "2026-02-22", folder: "Inbox", read: 1, starred: 0 },
    { id: "em-5", orgId: "org-1", sender: "David Park", senderEmail: "david.park@wayneent.com", subject: "RE: Contract Renewal Discussion", preview: "We are looking to expand our seats from 50 to 120. Can you send over an updated quote...", body: "Hi,\n\nWe are looking to expand our seats from 50 to 120. Can you send over an updated quote reflecting the volume discount?\n\nAlso, a few things we would like to discuss:\n- Custom API integrations for our internal tools\n- SSO setup with our Azure AD\n- Dedicated account manager for the expanded team\n\nThanks,\nDavid Park\nHead of Procurement, Wayne Enterprises", date: "2026-02-21", folder: "Inbox", read: 1, starred: 0 },
    { id: "em-6", orgId: "org-1", sender: "Lisa Thompson", senderEmail: "lisa.t@initech.com", subject: "Product Demo Request - Forecasting Features", preview: "Our VP of Sales would like to see a live demo of the forecasting features...", body: "Hello,\n\nOur VP of Sales, James Taylor, would like to see a live demo of the forecasting features in Axia CRM. He is particularly interested in:\n\n- AI-powered deal scoring\n- Revenue forecasting accuracy\n- Pipeline velocity metrics\n- Custom report builder\n\nHe is available next Thursday or Friday afternoon (EST). Would either of those work?\n\nBest regards,\nLisa Thompson\nInitech", date: "2026-02-20", folder: "Inbox", read: 1, starred: 0 },
    { id: "em-7", orgId: "org-1", sender: "Kevin O'Brien", senderEmail: "kobrien@umbrellacorp.com", subject: "Integration API Documentation Request", preview: "Our engineering team needs the API documentation for the webhook and REST endpoints...", body: "Hi,\n\nOur engineering team is starting the integration work and needs the following documentation:\n\n1. REST API endpoint reference\n2. Webhook configuration and event types\n3. Authentication flow (OAuth 2.0 details)\n4. Rate limiting policies\n5. Sample code for common operations\n\nCan you share the developer portal link or send the docs directly?\n\nThanks,\nKevin O'Brien\nUmbrella Corp", date: "2026-02-19", folder: "Inbox", read: 1, starred: 1 },
    { id: "em-8", orgId: "org-1", sender: "Rachel Kim", senderEmail: "rachel.kim@soylent.co", subject: "RE: Onboarding Checklist Complete", preview: "All items on the checklist are complete. The team has been trained...", body: "Hi,\n\nGreat news - all items on the onboarding checklist are complete!\n\nCompleted items:\n- User accounts created for all 25 team members\n- Historical data migration (15,000 contacts, 3,200 deals)\n- Custom fields configured\n- Email integration set up\n- Training sessions completed (3 sessions)\n\nThe team is ready to go live on Monday.\n\nBest,\nRachel Kim\nSoylent Corp", date: "2026-02-18", folder: "Inbox", read: 1, starred: 0 },
    { id: "em-9", orgId: "org-1", sender: "You", senderEmail: "demo@axia.crm", subject: "RE: Partnership Opportunity with CloudFirst", preview: "Thanks for reaching out. I would love to explore the integration partnership...", body: "Hi Alex,\n\nThanks for reaching out about the partnership opportunity. I would love to explore the integration between CloudFirst and Axia CRM.\n\nI am looping in our product team to discuss technical feasibility.\n\nLet me know when your team is available for a discovery call.\n\nBest,\nDemo User", date: "2026-02-23", folder: "Sent", read: 1, starred: 0 },
    { id: "em-10", orgId: "org-1", sender: "You", senderEmail: "demo@axia.crm", subject: "Follow-up: Wayne Enterprises Renewal", preview: "Hi team, just wanted to follow up on the Wayne Enterprises renewal...", body: "Hi team,\n\nJust wanted to follow up on the Wayne Enterprises renewal. David Park has confirmed they want to proceed with the expanded license.\n\nKey details:\n- Expanding from 50 to 120 seats\n- 2-year commitment with annual billing\n- Requesting custom API integration support\n\nLet me know if there are any blockers.\n\nThanks,\nDemo User", date: "2026-02-22", folder: "Sent", read: 1, starred: 0 },
    { id: "em-11", orgId: "org-1", sender: "You", senderEmail: "demo@axia.crm", subject: "Q1 Pipeline Projections Report", preview: "Attached is the Q1 projection report. Highlights: 23% increase in pipeline value...", body: "Team,\n\nAttached is the Q1 2026 pipeline projection report.\n\nHighlights:\n- Total pipeline value: $3.2M (up 23% from Q4)\n- 4 new enterprise accounts added\n- 3 deals in negotiation stage ($1.1M combined)\n- Win rate trending at 32% (target: 35%)\n\nFull report attached.\n\nBest,\nDemo User", date: "2026-02-21", folder: "Sent", read: 1, starred: 0 },
    { id: "em-12", orgId: "org-1", sender: "You", senderEmail: "demo@axia.crm", subject: "Draft: New Enterprise Plus Tier Announcement", preview: "We are excited to announce our new Enterprise Plus tier...", body: "DRAFT - DO NOT SEND\n\nSubject: Introducing Enterprise Plus\n\nDear valued customers,\n\nWe are excited to announce our new Enterprise Plus tier, designed for organizations with 500+ seats.\n\nNew features include:\n- Dedicated infrastructure\n- 99.99% SLA guarantee\n- Custom AI model training\n- White-label options\n- Priority 24/7 support\n\nPricing starts at $199/seat/month with annual billing.\n\nLaunch date: March 15, 2026.", date: "2026-02-24", folder: "Drafts", read: 1, starred: 0 },
    { id: "em-13", orgId: "org-1", sender: "You", senderEmail: "demo@axia.crm", subject: "Draft: Customer Success Playbook v2", preview: "This playbook outlines the key touchpoints for onboarding new enterprise customers...", body: "DRAFT\n\nCustomer Success Playbook v2\n\nPhase 1 - Week 1-2: Kickoff\n- Welcome call with stakeholders\n- Technical requirements gathering\n- Data migration planning\n\nPhase 2 - Week 3-6: Implementation\n- System configuration\n- Data import and validation\n- Integration setup\n\nPhase 3 - Week 7-10: Training\n- Admin training sessions\n- End-user training\n- Best practices workshop\n\nPhase 4 - Week 11-12: Go-Live\n- Soft launch with pilot team\n- Full rollout\n- Post-launch review\n\nSuccess Metrics:\n- 90% user adoption within 30 days of go-live\n- CSAT score of 4.5+ at 90-day review", date: "2026-02-22", folder: "Drafts", read: 1, starred: 0 },
    { id: "em-14", orgId: "org-1", sender: "Alex Turner", senderEmail: "aturner@massivedev.io", subject: "Feature Request: Bulk Email Templates", preview: "Our marketing team has requested the ability to create and manage bulk email templates...", body: "Hi Axia team,\n\nOur marketing team has a feature request: the ability to create and manage bulk email templates with merge fields and scheduled sending.\n\nSpecifically:\n- Template builder with rich text editor\n- Merge fields for contact/account data\n- A/B testing support\n- Scheduled sending with timezone awareness\n\nHappy to discuss further.\n\nThanks,\nAlex Turner\nMassiveDev", date: "2026-02-17", folder: "Inbox", read: 1, starred: 0 },
    { id: "em-15", orgId: "org-1", sender: "Axia Team", senderEmail: "team@axiacrm.com", subject: "Welcome to Axia CRM - Getting Started Guide", preview: "Welcome aboard! Here are some quick tips to get started with your new CRM...", body: "Welcome to Axia CRM!\n\nHere are some quick tips to get started:\n\n1. Import your contacts from CSV or connect your email\n2. Set up your deal pipeline stages\n3. Configure your team members and roles\n4. Install the mobile app for on-the-go access\n5. Explore the power dialer for outbound calling\n\nNeed help? Our support team is available 24/7.\n\nHappy selling!\nThe Axia Team", date: "2026-02-15", folder: "Inbox", read: 1, starred: 0 },
  ];
  for (const e of seedEmails) {
    await db.prepare("INSERT OR IGNORE INTO emails (id, org_id, sender, sender_email, subject, preview, body, date, folder, read, starred) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(e.id, e.orgId, e.sender, e.senderEmail, e.subject, e.preview, e.body, e.date, e.folder, e.read, e.starred).run();
  }

  return c.json({ success: true, message: "Seed data inserted" });
});

export default app;
