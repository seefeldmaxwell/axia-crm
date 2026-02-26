import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const db = c.env.DB;
  const ownerId = c.req.query('owner_id');

  // Get current user to check role
  const user = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(userId, orgId).first() as any;
  const isAdmin = user?.role === 'admin' || user?.is_admin === 1;

  let sql = '';
  const params: string[] = [];

  if (ownerId) {
    sql = 'SELECT * FROM vendors WHERE org_id = ? AND owner_id = ? ORDER BY created_at DESC';
    params.push(orgId, ownerId);
  } else if (isAdmin) {
    sql = 'SELECT * FROM vendors WHERE org_id = ? ORDER BY created_at DESC';
    params.push(orgId);
  } else if (userId) {
    sql = `SELECT DISTINCT v.* FROM vendors v
           LEFT JOIN record_shares rs ON rs.record_type = 'vendor' AND rs.record_id = v.id AND rs.shared_with_user_id = ?
           WHERE v.org_id = ? AND (v.owner_id = ? OR rs.id IS NOT NULL)
           ORDER BY v.created_at DESC`;
    params.push(userId, orgId, userId);
  } else {
    sql = 'SELECT * FROM vendors WHERE org_id = ? ORDER BY created_at DESC';
    params.push(orgId);
  }

  const result = await db.prepare(sql).bind(...params).all();
  return c.json(result.results);
});

app.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM vendors WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO vendors (id, org_id, name, contact, email, phone, category, status, owner_id, owner_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.contact || null, body.email || null, body.phone || null, body.category || null, body.status || 'Pending', body.owner_id || null, body.owner_name || null, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM vendors WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id' || key === 'org_id') continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE vendors SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM vendors WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM record_shares WHERE record_type = 'vendor' AND record_id = ?").bind(id).run();
  await c.env.DB.prepare('DELETE FROM vendors WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default app;
