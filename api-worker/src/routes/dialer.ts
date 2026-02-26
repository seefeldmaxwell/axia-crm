import { Hono } from 'hono';
import { getOrgId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// --- Call Scripts ---
app.get('/scripts', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM call_scripts WHERE org_id = ? ORDER BY created_at DESC').bind(orgId).all();
  return c.json(result.results.map((r: any) => ({ ...r, blocks: JSON.parse(r.blocks || '[]') })));
});

app.get('/scripts/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM call_scripts WHERE id = ?').bind(c.req.param('id')).first() as any;
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json({ ...result, blocks: JSON.parse(result.blocks || '[]') });
});

app.post('/scripts', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    'INSERT INTO call_scripts (id, org_id, name, description, blocks, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.org_id, body.name, body.description || null, JSON.stringify(body.blocks || []), ts, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM call_scripts WHERE id = ?').bind(id).first() as any;
  return c.json({ ...record, blocks: JSON.parse(record.blocks || '[]') }, 201);
});

app.put('/scripts/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const ts = now();
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id' || key === 'org_id') continue;
    if (key === 'blocks') {
      fields.push('blocks = ?');
      values.push(JSON.stringify(val));
    } else {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  fields.push('updated_at = ?');
  values.push(ts);
  values.push(id);
  await c.env.DB.prepare(`UPDATE call_scripts SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM call_scripts WHERE id = ?').bind(id).first() as any;
  return c.json({ ...record, blocks: JSON.parse(record.blocks || '[]') });
});

app.delete('/scripts/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM call_scripts WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// --- Call Records ---
app.get('/records', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM call_records WHERE org_id = ? ORDER BY created_at DESC').bind(orgId).all();
  return c.json(result.results);
});

app.post('/records', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    'INSERT INTO call_records (id, org_id, contact_id, contact_name, disposition, duration, notes, script_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, body.org_id, body.contact_id || null, body.contact_name || null, body.disposition || null, body.duration || 0, body.notes || null, body.script_id || null, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM call_records WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

export default app;
