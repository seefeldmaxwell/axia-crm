import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// Transfer record ownership
app.put('/transfer', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const { record_type, record_id, to_user_id, reason } = body;

  if (!record_type || !record_id || !to_user_id) {
    return c.json({ error: 'record_type, record_id, and to_user_id are required' }, 400);
  }

  // Check requesting user is admin or record owner
  const user = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(userId, orgId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);

  // Get the target user
  const toUser = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(to_user_id, orgId).first();
  if (!toUser) return c.json({ error: 'Target user not found' }, 404);

  // Get table name from record_type
  const tableMap: Record<string, string> = {
    lead: 'leads', vendor: 'vendors', client: 'clients',
    contact: 'contacts', deal: 'deals', account: 'accounts',
    activity: 'activities', case: 'cases',
  };
  const table = tableMap[record_type];
  if (!table) return c.json({ error: 'Invalid record_type' }, 400);

  // Check record exists
  const record = await db.prepare(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`).bind(record_id, orgId).first() as any;
  if (!record) return c.json({ error: 'Record not found' }, 404);

  // Only owner or admin can transfer
  const isAdmin = user.role === 'admin' || user.is_admin === 1;
  if (!isAdmin && record.owner_id !== userId) {
    return c.json({ error: 'Only record owner or admin can transfer' }, 403);
  }

  const fromUserId = record.owner_id || null;
  const ts = now();

  // Update the record's owner
  await db.prepare(`UPDATE ${table} SET owner_id = ?, owner_name = ?, updated_at = ? WHERE id = ?`)
    .bind(to_user_id, toUser.name, ts, record_id).run();

  // Create audit entry
  const transferId = uuid();
  await db.prepare(
    'INSERT INTO record_transfers (id, record_type, record_id, from_user_id, to_user_id, transferred_by, reason, org_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(transferId, record_type, record_id, fromUserId, to_user_id, userId, reason || null, orgId).run();

  return c.json({ success: true, transfer_id: transferId });
});

// Share record
app.post('/share', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const { record_type, record_id, user_id, permission } = body;

  if (!record_type || !record_id || !user_id) {
    return c.json({ error: 'record_type, record_id, and user_id are required' }, 400);
  }

  // Check requesting user
  const user = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(userId, orgId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);

  // Get table name
  const tableMap: Record<string, string> = {
    lead: 'leads', vendor: 'vendors', client: 'clients',
    contact: 'contacts', deal: 'deals', account: 'accounts',
    activity: 'activities', case: 'cases',
  };
  const table = tableMap[record_type];
  if (!table) return c.json({ error: 'Invalid record_type' }, 400);

  // Check record exists
  const record = await db.prepare(`SELECT * FROM ${table} WHERE id = ? AND org_id = ?`).bind(record_id, orgId).first() as any;
  if (!record) return c.json({ error: 'Record not found' }, 404);

  // Only owner or admin can share
  const isAdmin = user.role === 'admin' || user.is_admin === 1;
  if (!isAdmin && record.owner_id !== userId) {
    return c.json({ error: 'Only record owner or admin can share' }, 403);
  }

  // Verify target user exists in org
  const targetUser = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(user_id, orgId).first();
  if (!targetUser) return c.json({ error: 'Target user not found in org' }, 404);

  const shareId = uuid();
  try {
    await db.prepare(
      'INSERT INTO record_shares (id, record_type, record_id, shared_with_user_id, permission, shared_by, org_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(shareId, record_type, record_id, user_id, permission || 'view', userId, orgId).run();
  } catch (e: any) {
    if (e.message?.includes('UNIQUE')) {
      // Update existing share permission
      await db.prepare(
        'UPDATE record_shares SET permission = ? WHERE record_type = ? AND record_id = ? AND shared_with_user_id = ?'
      ).bind(permission || 'view', record_type, record_id, user_id).run();
      return c.json({ success: true, updated: true });
    }
    throw e;
  }

  return c.json({ success: true, share_id: shareId }, 201);
});

// Revoke share
app.delete('/share/:id', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const shareId = c.req.param('id');

  const share = await db.prepare('SELECT * FROM record_shares WHERE id = ? AND org_id = ?').bind(shareId, orgId).first() as any;
  if (!share) return c.json({ error: 'Share not found' }, 404);

  // Only the sharer or admin can revoke
  const user = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(userId, orgId).first() as any;
  const isAdmin = user?.role === 'admin' || user?.is_admin === 1;
  if (!isAdmin && share.shared_by !== userId) {
    return c.json({ error: 'Only admin or share creator can revoke' }, 403);
  }

  await db.prepare('DELETE FROM record_shares WHERE id = ?').bind(shareId).run();
  return c.json({ success: true });
});

// Get shares for a record
app.get('/shares/:recordType/:recordId', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const recordType = c.req.param('recordType');
  const recordId = c.req.param('recordId');

  const result = await db.prepare(
    `SELECT rs.*, u.name as shared_with_name, u.email as shared_with_email
     FROM record_shares rs
     JOIN users u ON rs.shared_with_user_id = u.id
     WHERE rs.record_type = ? AND rs.record_id = ? AND rs.org_id = ?`
  ).bind(recordType, recordId, orgId).all();

  return c.json(result.results);
});

// Get records shared with current user
app.get('/shared-with-me', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);

  const result = await db.prepare(
    `SELECT rs.*, u.name as shared_by_name
     FROM record_shares rs
     JOIN users u ON rs.shared_by = u.id
     WHERE rs.shared_with_user_id = ? AND rs.org_id = ?
     ORDER BY rs.created_at DESC`
  ).bind(userId, orgId).all();

  return c.json(result.results);
});

export default app;
