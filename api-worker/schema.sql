-- Organizations (multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo_url TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'rep' CHECK(role IN ('admin','manager','rep','viewer')),
  avatar_url TEXT,
  provider TEXT CHECK(provider IN ('google','microsoft')),
  provider_id TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Contacts
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  title TEXT,
  department TEXT,
  account_id TEXT REFERENCES accounts(id),
  account_name TEXT,
  owner_id TEXT REFERENCES users(id),
  owner_name TEXT,
  description TEXT,
  mailing_address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  industry TEXT,
  type TEXT,
  phone TEXT,
  website TEXT,
  billing_address TEXT,
  description TEXT,
  employees INTEGER,
  annual_revenue REAL,
  owner_id TEXT REFERENCES users(id),
  owner_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Deals/Opportunities
CREATE TABLE IF NOT EXISTS deals (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  amount REAL DEFAULT 0,
  stage TEXT DEFAULT 'Prospecting' CHECK(stage IN ('Prospecting','Qualification','Proposal','Negotiation','Closed Won','Closed Lost')),
  close_date TEXT,
  account_id TEXT REFERENCES accounts(id),
  account_name TEXT,
  contact_id TEXT REFERENCES contacts(id),
  contact_name TEXT,
  owner_id TEXT REFERENCES users(id),
  owner_name TEXT,
  probability INTEGER DEFAULT 0,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL CHECK(type IN ('call','email','meeting','task')),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'To Do' CHECK(status IN ('To Do','In Progress','Waiting','Done')),
  due_date TEXT,
  contact_id TEXT REFERENCES contacts(id),
  contact_name TEXT,
  account_id TEXT REFERENCES accounts(id),
  account_name TEXT,
  deal_id TEXT REFERENCES deals(id),
  owner_id TEXT REFERENCES users(id),
  owner_name TEXT,
  duration_minutes INTEGER,
  completed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  status TEXT DEFAULT 'New' CHECK(status IN ('New','Contacted','Qualified','Unqualified')),
  source TEXT,
  rating TEXT CHECK(rating IN ('Hot','Warm','Cold')),
  industry TEXT,
  description TEXT,
  owner_id TEXT REFERENCES users(id),
  owner_name TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Cases
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  subject TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'New' CHECK(status IN ('New','Working','Escalated','Closed')),
  priority TEXT DEFAULT 'Medium' CHECK(priority IN ('Low','Medium','High')),
  contact_id TEXT REFERENCES contacts(id),
  contact_name TEXT,
  account_id TEXT REFERENCES accounts(id),
  account_name TEXT,
  owner_id TEXT REFERENCES users(id),
  owner_name TEXT,
  resolution TEXT,
  closed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Call Scripts
CREATE TABLE IF NOT EXISTS call_scripts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  blocks TEXT NOT NULL, -- JSON array of script blocks
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Call Records
CREATE TABLE IF NOT EXISTS call_records (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  contact_id TEXT REFERENCES contacts(id),
  contact_name TEXT,
  disposition TEXT,
  duration INTEGER DEFAULT 0,
  notes TEXT,
  script_id TEXT REFERENCES call_scripts(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Planned' CHECK(status IN ('Planned','Active','Completed','Aborted')),
  type TEXT,
  start_date TEXT,
  end_date TEXT,
  budget REAL DEFAULT 0,
  actual_cost REAL,
  responses INTEGER DEFAULT 0,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  price REAL DEFAULT 0,
  family TEXT,
  is_active INTEGER DEFAULT 1,
  pricing_tiers TEXT, -- JSON array
  created_at TEXT DEFAULT (datetime('now'))
);

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  type TEXT CHECK(type IN ('google','microsoft','slack')),
  enabled INTEGER DEFAULT 0
);

-- Marketing Posts
CREATE TABLE IF NOT EXISTS marketing_posts (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  platform TEXT NOT NULL,
  text TEXT NOT NULL,
  scheduled_at TEXT,
  status TEXT DEFAULT 'Draft' CHECK(status IN ('Draft','Scheduled','Published')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT,
  category TEXT,
  status TEXT DEFAULT 'Pending' CHECK(status IN ('Active','Inactive','Pending')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  industry TEXT,
  contact TEXT,
  contract_value REAL DEFAULT 0,
  start_date TEXT,
  status TEXT DEFAULT 'Active' CHECK(status IN ('Active','At Risk','Churned')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tags
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#2D7FF9',
  org_id TEXT NOT NULL REFERENCES organizations(id)
);

-- Record Tags (junction)
CREATE TABLE IF NOT EXISTS record_tags (
  tag_id TEXT NOT NULL REFERENCES tags(id),
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  PRIMARY KEY (tag_id, record_type, record_id)
);
