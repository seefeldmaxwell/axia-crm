-- Seed V2: Org domains and user hierarchy updates

-- Org domains
INSERT OR IGNORE INTO org_domains (domain, org_id, verified) VALUES ('axia.crm', 'org-1', 1);
INSERT OR IGNORE INTO org_domains (domain, org_id, verified) VALUES ('y12.ai', 'org-1', 1);
INSERT OR IGNORE INTO org_domains (domain, org_id, verified) VALUES ('gmail.com', 'org-1', 1);

-- Update existing users with hierarchy
UPDATE users SET title = 'CEO', department = 'Executive', manager_id = NULL WHERE id = '1';
UPDATE users SET title = 'VP Sales', department = 'Sales', manager_id = '1' WHERE id = '2';
UPDATE users SET title = 'Sales Rep', department = 'Sales', manager_id = '2' WHERE id = '3';
UPDATE users SET title = 'Marketing Lead', department = 'Marketing', manager_id = '1' WHERE id = '4';
