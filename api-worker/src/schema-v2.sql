-- Schema V2: Team hierarchy, org domains, record transfers/shares

-- Add columns to users table
ALTER TABLE users ADD COLUMN manager_id TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN title TEXT;
ALTER TABLE users ADD COLUMN department TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE users ADD COLUMN last_login TEXT;

-- Org domains (for email-based org matching)
CREATE TABLE IF NOT EXISTS org_domains (
  domain TEXT PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES organizations(id),
  verified INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Record transfers audit trail
CREATE TABLE IF NOT EXISTS record_transfers (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  from_user_id TEXT,
  to_user_id TEXT NOT NULL,
  transferred_by TEXT NOT NULL,
  reason TEXT,
  org_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Record shares
CREATE TABLE IF NOT EXISTS record_shares (
  id TEXT PRIMARY KEY,
  record_type TEXT NOT NULL,
  record_id TEXT NOT NULL,
  shared_with_user_id TEXT NOT NULL,
  permission TEXT DEFAULT 'view' CHECK(permission IN ('view', 'edit')),
  shared_by TEXT NOT NULL,
  org_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(record_type, record_id, shared_with_user_id)
);
