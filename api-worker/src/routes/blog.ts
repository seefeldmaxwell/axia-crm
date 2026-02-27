import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// GET /api/blog — list published posts (public) or all posts (with org header)
app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const status = c.req.query('status');
  let sql = 'SELECT * FROM blog_posts';
  const params: string[] = [];

  if (orgId && status) {
    sql += ' WHERE org_id = ? AND status = ?';
    params.push(orgId, status);
  } else if (orgId) {
    sql += ' WHERE org_id = ?';
    params.push(orgId);
  } else {
    sql += " WHERE status = 'published'";
  }
  sql += ' ORDER BY published_at DESC, created_at DESC';

  const stmt = params.length
    ? c.env.DB.prepare(sql).bind(...params)
    : c.env.DB.prepare(sql);
  const result = await stmt.all();
  return c.json(result.results);
});

// GET /api/blog/:slug
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const post = await c.env.DB.prepare(
    "SELECT * FROM blog_posts WHERE slug = ?"
  ).bind(slug).first();
  if (!post) return c.json({ error: 'Not found' }, 404);
  return c.json(post);
});

// POST /api/blog
app.post('/', async (c) => {
  const body = await c.req.json();
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const id = uuid();
  const ts = now();

  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const status = body.status || 'draft';
  const publishedAt = status === 'published' ? ts : null;

  await c.env.DB.prepare(
    `INSERT INTO blog_posts (id, org_id, title, slug, excerpt, content, cover_image, author_id, author_name, status, published_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(id, orgId, body.title, slug, body.excerpt || '', body.content || '', body.cover_image || '', userId || body.author_id || '', body.author_name || '', status, publishedAt, ts, ts).run();

  const record = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
  return c.json(record, 201);
});

// PUT /api/blog/:id
app.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json();
  const ts = now();

  // If publishing for the first time, set published_at
  if (body.status === 'published') {
    const existing = await c.env.DB.prepare('SELECT published_at FROM blog_posts WHERE id = ?').bind(id).first();
    if (!existing?.published_at) {
      body.published_at = ts;
    }
  }

  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (key === 'id' || key === 'org_id') continue;
    fields.push(`${key} = ?`);
    values.push(val);
  }
  fields.push('updated_at = ?');
  values.push(ts);
  values.push(id);

  await c.env.DB.prepare(
    `UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`
  ).bind(...values).run();

  const record = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first();
  return c.json(record);
});

// DELETE /api/blog/:id
app.delete('/:id', async (c) => {
  await c.env.DB.prepare('DELETE FROM blog_posts WHERE id = ?').bind(c.req.param('id')).run();
  return c.json({ success: true });
});

export default app;
