import { Hono } from 'hono';
import { getOrgId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// --- Posts ---
app.get('/posts', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM marketing_posts WHERE org_id = ? ORDER BY scheduled_at ASC').bind(orgId).all();
  return c.json(result.results);
});

app.get('/posts/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM marketing_posts WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/posts', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO marketing_posts (id, org_id, platform, text, scheduled_at, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.platform, body.text, body.scheduled_at || null, body.status || 'Draft', ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM marketing_posts WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/posts/:id', async (c) => {
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
  await c.env.DB.prepare(`UPDATE marketing_posts SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM marketing_posts WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/posts/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM marketing_posts WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// --- Campaigns ---
app.get('/campaigns', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM campaigns WHERE org_id = ? ORDER BY created_at DESC').bind(orgId).all();
  return c.json(result.results);
});

app.get('/campaigns/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/campaigns', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO campaigns (id, org_id, name, status, type, start_date, end_date, budget, actual_cost, responses, description, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.status || 'Planned', body.type || null, body.start_date || null, body.end_date || null, body.budget || 0, body.actual_cost || null, body.responses || 0, body.description || null, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/campaigns/:id', async (c) => {
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
  await c.env.DB.prepare(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM campaigns WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/campaigns/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM campaigns WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
