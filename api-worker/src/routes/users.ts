import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// List org users
app.get('/', async (c) => {
  const orgId = getOrgId(c);
  const result = await c.env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.title, u.department, u.manager_id, u.is_active, u.avatar_url, u.is_admin,
            m.name as manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.org_id = ?
     ORDER BY u.name ASC`
  ).bind(orgId).all();
  return c.json(result.results);
});

// Invite user by email
app.post('/invite', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const body = await c.req.json();
  const { email } = body;

  if (!email) return c.json({ error: 'Email is required' }, 400);

  // Check requesting user is admin
  const requester = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(userId, orgId).first() as any;
  if (!requester || (requester.role !== 'admin' && requester.is_admin !== 1)) {
    return c.json({ error: 'Only admins can invite users' }, 403);
  }

  // Check email domain matches org domain
  const domain = email.split('@')[1]?.toLowerCase();
  const orgDomain = await db.prepare('SELECT * FROM org_domains WHERE domain = ? AND org_id = ?').bind(domain, orgId).first();
  if (!orgDomain) {
    return c.json({ error: 'Email domain does not match organization' }, 400);
  }

  // Check if user already exists
  const existing = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (existing) {
    return c.json({ error: 'User already exists' }, 409);
  }

  // Create inactive user
  const id = uuid();
  const name = email.split('@')[0];
  await db.prepare(
    'INSERT INTO users (id, org_id, email, name, role, is_admin, is_active) VALUES (?, ?, ?, ?, ?, 0, 0)'
  ).bind(id, orgId, email, name, 'member').run();

  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  return c.json(user, 201);
});

// Update user role
app.put('/:id/role', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);
  const userId = getUserId(c);
  const targetId = c.req.param('id');
  const body = await c.req.json();
  const { role } = body;

  if (!role) return c.json({ error: 'Role is required' }, 400);

  // Check requesting user is admin
  const requester = await db.prepare('SELECT * FROM users WHERE id = ? AND org_id = ?').bind(userId, orgId).first() as any;
  if (!requester || (requester.role !== 'admin' && requester.is_admin !== 1)) {
    return c.json({ error: 'Only admins can change roles' }, 403);
  }

  await db.prepare('UPDATE users SET role = ? WHERE id = ? AND org_id = ?').bind(role, targetId, orgId).run();
  const user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(targetId).first();
  return c.json(user);
});

export default app;
