import { Hono } from 'hono';
import { getOrgId } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// Calendar events derived from activities with due_date
app.get('/events', async (c) => {
  const orgId = getOrgId(c);
  const start = c.req.query('start');
  const end = c.req.query('end');

  let sql = 'SELECT * FROM activities WHERE org_id = ? AND due_date IS NOT NULL';
  const params: any[] = [orgId];

  if (start) { sql += ' AND due_date >= ?'; params.push(start); }
  if (end) { sql += ' AND due_date <= ?'; params.push(end); }
  sql += ' ORDER BY due_date ASC';

  const result = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json(result.results);
});

export default app;
