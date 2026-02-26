import { Hono } from 'hono';
import { getOrgId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM products WHERE org_id = ? ORDER BY created_at DESC').bind(orgId).all();
  return c.json(result.results.map((r: any) => ({
    ...r,
    pricing_tiers: r.pricing_tiers ? JSON.parse(r.pricing_tiers) : null,
    is_active: r.is_active === 1,
  })));
});

app.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(c.req.param('id')).first() as any;
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json({
    ...result,
    pricing_tiers: result.pricing_tiers ? JSON.parse(result.pricing_tiers) : null,
    is_active: result.is_active === 1,
  });
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO products (id, org_id, name, code, description, price, family, is_active, pricing_tiers, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.name, body.code || null, body.description || null, body.price || 0, body.family || null, body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1, body.pricing_tiers ? JSON.stringify(body.pricing_tiers) : null, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first() as any;
  return c.json({ ...record, pricing_tiers: record.pricing_tiers ? JSON.parse(record.pricing_tiers) : null, is_active: record.is_active === 1 }, 201);
});

app.put('/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id' || key === 'org_id') continue;
    if (key === 'pricing_tiers') {
      fields.push('pricing_tiers = ?');
      values.push(JSON.stringify(val));
    } else if (key === 'is_active') {
      fields.push('is_active = ?');
      values.push(val ? 1 : 0);
    } else {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  values.push(id);
  await c.env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first() as any;
  return c.json({ ...record, pricing_tiers: record.pricing_tiers ? JSON.parse(record.pricing_tiers) : null, is_active: record.is_active === 1 });
});

app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
