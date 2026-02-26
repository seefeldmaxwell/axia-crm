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

export default app;
