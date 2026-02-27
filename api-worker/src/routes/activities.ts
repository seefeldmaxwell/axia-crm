import { Hono } from 'hono';
import { getOrgId, uuid, now, dynamicUpdate } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const contactId = c.req.query('contact_id');
  const accountId = c.req.query('account_id');
  const dealId = c.req.query('deal_id');

  let sql = 'SELECT * FROM activities WHERE org_id = ?';
  const params: any[] = [orgId];

  if (contactId) { sql += ' AND contact_id = ?'; params.push(contactId); }
  if (accountId) { sql += ' AND account_id = ?'; params.push(accountId); }
  if (dealId) { sql += ' AND deal_id = ?'; params.push(dealId); }
  sql += ' ORDER BY due_date ASC';

  const result = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(result.results);
});

app.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO activities (id, org_id, type, subject, description, status, due_date, contact_id, contact_name, account_id, account_name, deal_id, owner_id, owner_name, duration_minutes, completed_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.type, body.subject, body.description || null, body.status || 'To Do', body.due_date || null, body.contact_id || null, body.contact_name || null, body.account_id || null, body.account_name || null, body.deal_id || null, body.owner_id || null, body.owner_name || null, body.duration_minutes || null, body.completed_at || null, ts, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE activities SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM activities WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// ── Activity Sub-Items ──

app.get('/:activityId/items', async (c) => {
  const activityId = c.req.param('activityId');
  const result = await c.env.DB.prepare(
    'SELECT * FROM activity_items WHERE activity_id = ? ORDER BY sort_order ASC, created_at ASC'
  ).bind(activityId).all();
  return c.json(result.results);
});

app.post('/:activityId/items', async (c) => {
  const activityId = c.req.param('activityId');
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO activity_items (id, activity_id, title, completed, sort_order, created_at)
     VALUES (?, ?, ?, 0, ?, ?)`
  ).bind(id, activityId, body.title, body.sort_order || 0, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM activity_items WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:activityId/items/:itemId', async (c) => {
  const itemId = c.req.param('itemId');
  const body = await c.req.json();
  const fields: string[] = [];
  const values: any[] = [];
  if (body.title !== undefined) { fields.push('title = ?'); values.push(body.title); }
  if (body.completed !== undefined) { fields.push('completed = ?'); values.push(body.completed ? 1 : 0); }
  if (body.sort_order !== undefined) { fields.push('sort_order = ?'); values.push(body.sort_order); }
  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400);
  values.push(itemId);
  await c.env.DB.prepare(`UPDATE activity_items SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM activity_items WHERE id = ?').bind(itemId).first();
  return c.json(record);
});

app.delete('/:activityId/items/:itemId', async (c) => {
  await c.env.DB.prepare('DELETE FROM activity_items WHERE id = ?').bind(c.req.param('itemId')).run();
  return c.json({ success: true });
});

export default app;
