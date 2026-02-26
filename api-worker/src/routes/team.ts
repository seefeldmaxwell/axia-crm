import { Hono } from 'hono';
import { getOrgId } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// Get org hierarchy tree
app.get('/hierarchy', async (c) => {
  const db = c.env.DB;
  const orgId = getOrgId(c);

  const result = await db.prepare(
    `SELECT u.id, u.name, u.email, u.role, u.title, u.department, u.manager_id, u.is_active, u.avatar_url,
            m.name as manager_name
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.org_id = ?
     ORDER BY u.name`
  ).bind(orgId).all();

  return c.json(result.results);
});

export default app;
