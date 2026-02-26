import { Hono } from 'hono';
import { getOrgId } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// --- Integrations ---
app.get('/integrations', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM integrations WHERE org_id = ?').bind(orgId).all();
  return c.json(result.results.map((r: any) => ({ ...r, enabled: r.enabled === 1 })));
});

app.put('/integrations/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  await c.env.DB.prepare('UPDATE integrations SET enabled = ? WHERE id = ?').bind(body.enabled ? 1 : 0, id).run();
  const record = await c.env.DB.prepare('SELECT * FROM integrations WHERE id = ?').bind(id).first() as any;
  return c.json({ ...record, enabled: record.enabled === 1 });
});

// --- Organizations ---
app.get('/org', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.put('/org', async (c) => {
  const orgId = getOrgId(c);
  const body = await c.req.json();
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id') continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  values.push(orgId);
  await c.env.DB.prepare(`UPDATE organizations SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(orgId).first();
  return c.json(record);
});

// --- Users ---
app.get('/users', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM users WHERE org_id = ? ORDER BY name ASC').bind(orgId).all();
  return c.json(result.results);
});

export default app;
