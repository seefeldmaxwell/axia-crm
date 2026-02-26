import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now, dynamicUpdate } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const db = c.env.DB;
  const ownerId = c.req.query('owner_id');
  const shared = c.req.query('shared');

  // Get current user to check role
  const user = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(userId, orgId).first() as any;
  const isAdmin = user?.role === 'admin' || user?.is_admin === 1;

  let sql = '';
  const params: string[] = [];

  if (ownerId) {
    // Filter by specific owner
    sql = 'SELECT * FROM leads WHERE org_id = ? AND owner_id = ? ORDER BY created_at DESC';
    params.push(orgId, ownerId);
  } else if (isAdmin) {
    // Admin sees all
    sql = 'SELECT * FROM leads WHERE org_id = ? ORDER BY created_at DESC';
    params.push(orgId);
  } else if (userId) {
    // Member sees own + shared
    sql = `SELECT DISTINCT l.* FROM leads l
           LEFT JOIN record_shares rs ON rs.record_type = 'lead' AND rs.record_id = l.id AND rs.shared_with_user_id = ?
           WHERE l.org_id = ? AND (l.owner_id = ? OR rs.id IS NOT NULL)
           ORDER BY l.created_at DESC`;
    params.push(userId, orgId, userId);
  } else {
    sql = 'SELECT * FROM leads WHERE org_id = ? ORDER BY created_at DESC';
    params.push(orgId);
  }

  const result = await db.prepare(sql).bind(...params).all();
  return c.json(result.results);
});

app.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  const ts = now();
  await c.env.DB.prepare(
    `INSERT INTO leads (id, org_id, first_name, last_name, email, phone, company, title, status, source, rating, industry, description, owner_id, owner_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, body.org_id, body.first_name, body.last_name, body.email || null, body.phone || null, body.company || null, body.title || null, body.status || 'New', body.source || null, body.rating || null, body.industry || null, body.description || null, body.owner_id || null, body.owner_name || null, ts, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:id', async (c) => {
  const body = await c.req.json();
  const id = c.req.param('id');
  const ts = now();
  const { sql, values } = dynamicUpdate(body, id, ts);
  await c.env.DB.prepare(`UPDATE leads SET ${sql} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/:id', async (c) => {
  const id = c.req.param('id');
  // Also clean up shares
  await c.env.DB.prepare("DELETE FROM record_shares WHERE record_type = 'lead' AND record_id = ?").bind(id).run();
  await c.env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(id).run();
  return c.json({ success: true });
});

// Convert lead to contact
app.post('/:id/convert', async (c) => {
  const leadId = c.req.param('id');
  const lead = await c.env.DB.prepare('SELECT * FROM leads WHERE id = ?').bind(leadId).first() as any;
  if (!lead) return c.json({ error: 'Lead not found' }, 404);

  const contactId = uuid();
  const ts = now();

  await c.env.DB.prepare(
    `INSERT INTO contacts (id, org_id, first_name, last_name, email, phone, title, account_name, owner_id, owner_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(contactId, lead.org_id, lead.first_name, lead.last_name, lead.email, lead.phone, lead.title, lead.company, lead.owner_id, lead.owner_name, ts, ts).run();

  await c.env.DB.prepare('DELETE FROM leads WHERE id = ?').bind(leadId).run();

  const contact = await c.env.DB.prepare('SELECT * FROM contacts WHERE id = ?').bind(contactId).first();
  return c.json(contact, 201);
});

export default app;
