import { Hono } from 'hono';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// Get all permissions for the current user
app.get('/', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Missing user id' }, 400);
  const result = await c.env.DB.prepare('SELECT permission, granted FROM user_permissions WHERE user_id = ?').bind(userId).all();
  const perms: Record<string, boolean> = {};
  (result.results || []).forEach((r: any) => { perms[r.permission] = r.granted === 1; });
  return c.json(perms);
});

// Grant or revoke a permission
app.post('/:permission', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Missing user id' }, 400);
  const permission = c.req.param('permission');
  const body: any = await c.req.json();
  const granted = body.granted ? 1 : 0;

  await c.env.DB.prepare(
    `INSERT INTO user_permissions (id, user_id, permission, granted, granted_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, permission) DO UPDATE SET granted = ?, granted_at = ?`
  ).bind(
    `${userId}-${permission}`, userId, permission, granted, new Date().toISOString(),
    granted, new Date().toISOString()
  ).run();

  return c.json({ permission, granted: !!granted });
});

export default app;
