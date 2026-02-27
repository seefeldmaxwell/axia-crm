import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// List emails
app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const folder = c.req.query('folder');
  let sql = 'SELECT * FROM emails WHERE org_id = ?';
  const params: string[] = [orgId];
  if (folder && folder !== 'Starred') {
    sql += ' AND folder = ?';
    params.push(folder);
  }
  sql += ' ORDER BY date DESC';
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(result.results);
});

// Create email
app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO emails (id, org_id, sender, sender_email, subject, preview, body, date, folder, read, starred, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    id, body.org_id, body.sender, body.sender_email, body.subject,
    body.preview || '', body.body || '', body.date || ts.split('T')[0],
    body.folder || 'Sent', body.read ? 1 : 0, body.starred ? 1 : 0, ts
  ).run();
  const record = await c.env.DB.prepare('SELECT * FROM emails WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

// Update email (star, read, move folder)
app.put('/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id') continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  if (fields.length === 0) return c.json({ error: 'No fields to update' }, 400);
  values.push(id);
  await c.env.DB.prepare(`UPDATE emails SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM emails WHERE id = ?').bind(id).first();
  return c.json(record);
});

// Delete email
app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM emails WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
