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
    sql = 'SELECT * FROM clients WHERE org_id = ? AND owner_id = ? ORDER BY created_at DESC';
    params.push(orgId, ownerId);
  } else if (isAdmin) {
    sql = 'SELECT * FROM clients WHERE org_id = ? ORDER BY created_at DESC';
    params.push(orgId);
  } else if (userId) {
    sql = `SELECT DISTINCT cl.* FROM clients cl
           LEFT JOIN record_shares rs ON rs.record_type = 'client' AND rs.record_id = cl.id AND rs.shared_with_user_id = ?
           WHERE cl.org_id = ? AND (cl.owner_id = ? OR rs.id IS NOT NULL)
           ORDER BY cl.created_at DESC`;
    params.push(userId, orgId, userId);
  } else {
    sql = 'SELECT * FROM clients WHERE org_id = ? ORDER BY created_at DESC';
    params.push(orgId);
  }

  const result = await db.prepare(sql).bind(...params).all();
  return c.json(result.results);
});

app.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO clients (id, org_id, name, industry, contact, contract_value, start_date, status, owner_id, owner_name, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.industry || null, body.contact || null, body.contract_value || 0, body.start_date || null, body.status || 'Active', body.owner_id || null, body.owner_name || null, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
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
  await c.env.DB.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM clients WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  await c.env.DB.prepare("DELETE FROM record_shares WHERE record_type = 'client' AND record_id = ?").bind(id).run();
  await c.env.DB.prepare('DELETE FROM clients WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

export default app;
