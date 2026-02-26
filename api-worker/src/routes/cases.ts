import { Hono } from 'hono';
import { getOrgId, uuid, now, dynamicUpdate } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM cases WHERE org_id = ? ORDER BY created_at DESC').bind(orgId).all();
  return c.json(result.results);
});

app.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM cases WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO cases (id, org_id, subject, description, status, priority, contact_id, contact_name, account_id, account_name, owner_id, owner_name, resolution, closed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.subject, body.description || null, body.status || 'New', body.priority || 'Medium', body.contact_id || null, body.contact_name || null, body.account_id || null, body.account_name || null, body.owner_id || null, body.owner_name || null, body.resolution || null, body.closed_at || null, ts, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM cases WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE cases SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM cases WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM cases WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
