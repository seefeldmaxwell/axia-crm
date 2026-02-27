import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// GET /api/notes?record_type=lead&record_id=l1
app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const recordType = c.req.query('record_type');
  const recordId = c.req.query('record_id');
  if (!recordType || !recordId) return c.json({ error: 'record_type and record_id required' }, 400);

  const result = await c.env.DB.prepare(
    'SELECT * FROM notes WHERE org_id = ? AND record_type = ? AND record_id = ? ORDER BY created_at DESC'
  ).bind(orgId, recordType, recordId).all();
  return c.json(result.results);
});

// POST /api/notes
app.post('/', async (c) => {
  const body = await c.req.json();
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const id = uuid();
  const ts = now();

  await c.env.DB.prepare(
    `INSERT INTO notes (id, org_id, record_type, record_id, content, author_id, author_name, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, orgId, body.record_type, body.record_id, body.content, userId || body.author_id || '', body.author_name || '', ts, ts).run();
  const record = await c.env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

// PUT /api/notes/:id
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const ts = now();
  await c.env.DB.prepare(
    'UPDATE notes SET content = ?, updated_at = ? WHERE id = ?'
  ).bind(body.content, ts, id).run();
  const record = await c.env.DB.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first();
  return c.json(record);
});

// DELETE /api/notes/:id
app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
