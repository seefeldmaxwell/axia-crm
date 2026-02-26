import { Hono } from 'hono';
import { getOrgId, uuid } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare('SELECT * FROM tags WHERE org_id = ? ORDER BY name ASC').bind(orgId).all();
  return c.json(result.results);
});

app.get('/:id', async (c) => {
  const result = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ?').bind(c.req.param('id')).first();
  if (!result) return c.json({ error: 'Not found' }, 404);
  return c.json(result);
});

app.post('/', async (c) => {
  const body = await c.req.json();
  const id = uuid();
  await c.env.DB.prepare(
    'INSERT INTO tags (id, org_id, name, color) VALUES (?, ?, ?, ?)'
  ).bind(id, body.org_id, body.name, body.color || '#2D7FF9').run();
  const record = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

app.put('/:id', async (c) => {
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
  await c.env.DB.prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  const record = await c.env.DB.prepare('SELECT * FROM tags WHERE id = ?').bind(id).first();
  return c.json(record);
});

app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM record_tags WHERE tag_id = ?').bind(c.req.param('id')).run();
  await c.env.DB.prepare('DELETE FROM tags WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

// Record tags - attach/detach tags to records
app.get('/records/:recordType/:recordId', async (c) => {
  const { recordType, recordId } = c.req.param();
  const result = await c.env.DB.prepare(
    'SELECT t.* FROM tags t INNER JOIN record_tags rt ON t.id = rt.tag_id WHERE rt.record_type = ? AND rt.record_id = ?'
  ).bind(recordType, recordId).all();
  return c.json(result.results);
});

app.post('/records/:recordType/:recordId/:tagId', async (c) => {
  const { recordType, recordId, tagId } = c.req.param();
  await c.env.DB.prepare(
    'INSERT OR IGNORE INTO record_tags (tag_id, record_type, record_id) VALUES (?, ?, ?)'
  ).bind(tagId, recordType, recordId).run();
  return c.json({ success: true }, 201);
});

app.delete('/records/:recordType/:recordId/:tagId', async (c) => {
  const { recordType, recordId, tagId } = c.req.param();
  await c.env.DB.prepare(
    'DELETE FROM record_tags WHERE tag_id = ? AND record_type = ? AND record_id = ?'
  ).bind(tagId, recordType, recordId).run();
  return c.json({ success: true });
});

export default app;
