import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

// OAuth login — check email domain against org_domains
app.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, name, orgId, provider, id_token, avatar } = body;
  const db = c.env.DB;

  // Extract email domain
  const domain = email?.split('@')[1]?.toLowerCase();
  if (!domain) return c.json({ error: 'Invalid email' }, 400);

  // Check org_domains for matching org
  const orgDomain = await db.prepare('SELECT * FROM org_domains WHERE domain = ? AND verified = 1').bind(domain).first();

  // Determine the org to use
  let resolvedOrgId = orgId;
  if (orgDomain) {
    resolvedOrgId = orgDomain.org_id;
  } else if (!orgId) {
    // No org domain match and no orgId provided — reject
    return c.json({ error: 'org_not_found', message: 'Organization not found for this email domain' }, 403);
  }

  // Check if user already exists
  let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

  const ts = now();
  if (!user) {
    // Create new user
    const id = uuid();
    await db.prepare(
      `INSERT INTO users (id, org_id, email, name, role, is_admin, avatar_url, provider, last_login, is_active)
       VALUES (?, ?, ?, ?, 'admin', 1, ?, ?, ?, 1)`
    ).bind(id, resolvedOrgId, email, name, avatar || null, provider || null, ts).run();
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  } else {
    // Update last_login and avatar
    await db.prepare('UPDATE users SET last_login = ?, avatar_url = COALESCE(?, avatar_url) WHERE id = ?')
      .bind(ts, avatar || null, user.id).run();
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  }

  const org = await db.prepare('SELECT * FROM organizations WHERE id = ?').bind(user!.org_id).first();
  return c.json({ user, org });
});

app.get('/me', async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: 'Not authenticated' }, 401);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  const org = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind(user.org_id).first();
  return c.json({ user, org });
});

// Google OAuth token exchange — frontend sends auth code, we exchange for id_token using secret
app.post('/google/exchange', async (c) => {
  const { code, redirect_uri } = await c.req.json();
  const GOOGLE_CLIENT_ID = '416218053988-rdvn9os69iid871l62dcvreqbt6ss550.apps.googleusercontent.com';
  const GOOGLE_CLIENT_SECRET = (c.env as any).GOOGLE_CLIENT_SECRET;

  if (!GOOGLE_CLIENT_SECRET) {
    return c.json({ error: 'Google OAuth not configured on server' }, 500);
  }

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData: any = await tokenRes.json();
  if (tokenData.error) {
    return c.json({ error: tokenData.error, description: tokenData.error_description }, 400);
  }

  // Decode id_token to get user info
  const idToken = tokenData.id_token;
  const payload = JSON.parse(atob(idToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));

  return c.json({
    email: payload.email,
    name: payload.name || payload.email?.split('@')[0],
    avatar: payload.picture || null,
    provider: 'google',
    id_token: idToken,
  });
});

export default app;
