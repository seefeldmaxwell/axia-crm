import { Hono } from 'hono';
import { getOrgId, uuid, now, dynamicUpdate } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// ── Deals CRUD ──

app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM deals WHERE org_id = ? ORDER BY created_at DESC').bind(orgId).all();
  return c.json(result.results);
});

app.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (id === 'items') return c.json({ error: 'Use /deals/:dealId/items' }, 400);
  const result = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO deals (id, org_id, name, amount, stage, close_date, account_id, account_name, contact_id, contact_name, owner_id, owner_name, probability, description, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.amount || 0, body.stage || 'Prospecting', body.close_date || null, body.account_id || null, body.account_name || null, body.contact_id || null, body.contact_name || null, body.owner_id || null, body.owner_name || null, body.probability || 0, body.description || null, ts, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE deals SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM deals WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM deals WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ── Deal Sub-Items ──

app.get('/:dealId/items', async (c) => {
  const dealId = c.req.param('dealId');
  const result = await c.env.DB.prepare(
    'SELECT * FROM deal_items WHERE deal_id = ? ORDER BY sort_order ASC, created_at ASC'
  ).bind(dealId).all();
  return c.json(result.results);
});

app.post('/:dealId/items', async (c) => {
  const dealId = c.req.param('dealId');
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO deal_items (id, deal_id, title, completed, sort_order, created_at)
     VALUES (?, ?, ?, 0, ?, ?)`
  ).bind(id, dealId, body.title, body.sort_order || 0, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM deal_items WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:dealId/items/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const body = await c.req.json();
  const fields: string[] = [];
  const values: any[] = [];
  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.completed !== undefined) { fields.push('completed = ?'); values.push(body.completed ? 1 : 0); }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }
  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400);
  values.push(itemId);
  await c.env.DB.prepare(`UPDATE deal_items SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM deal_items WHERE id = ?').bind(itemId).first();
  return c.json(record);
});

app.delete('/:dealId/items/:itemId', async (c) => {
  await c.env.DB.prepare('DELETE FROM deal_items WHERE id = ?').bind(c.req.param('itemId')).run();
  return c.json({ success: true });
});

export default app;
