import { Hono } from 'hono';
import { getOrgId, getUserId, uuid, now } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; GOOGLE_CLIENT_SECRET: string } };
const app = new Hono<Env>();

const GOOGLE_CLIENT_ID = '416218053988-rdvn9os69iid871l62dcvreqbt6ss550.apps.googleusercontent.com';

// Helper: send welcome email via Gmail API using user's access token
async function sendWelcomeEmail(accessToken: string, userEmail: string, firstName: string): Promise<void> {
  try {
    const subject = 'Welcome to Axia CRM 🚀';
    const body = `Hi ${firstName},

Welcome to Axia CRM — your new home for managing leads, deals, and client relationships.

Here's what you can do:
• Track leads from cold to closed
• Manage your sales pipeline
• Power dial prospects directly from the CRM
• Collaborate with your team

Get started: https://axia-crm.pages.dev/home

— The Axia Team`;

    // Build RFC 2822 email
    const emailLines = [
      `To: ${userEmail}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      body,
    ];
    const rawEmail = emailLines.join('\r\n');
    // Base64url encode
    const encoded = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encoded }),
    });
  } catch (e) {
    console.error('Failed to send welcome email:', e);
  }
}

// Helper: refresh Google access token
async function refreshGoogleToken(db: D1Database, userId: string, refreshToken: string, clientSecret: string): Promise<string | null> {
  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const data: any = await res.json();
    if (data.access_token) {
      const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
      await db.prepare('UPDATE users SET google_access_token = ?, token_expires_at = ? WHERE id = ?')
        .bind(data.access_token, expiresAt, userId).run();
      return data.access_token;
    }
    return null;
  } catch {
    return null;
  }
}

// Get a valid access token for a user, refreshing if needed
export async function getValidAccessToken(db: D1Database, userId: string, clientSecret: string): Promise<string | null> {
  const user: any = await db.prepare('SELECT google_access_token, google_refresh_token, token_expires_at FROM users WHERE id = ?').bind(userId).first();
  if (!user) return null;

  // Check if token is still valid (with 5 min buffer)
  if (user.google_access_token && user.token_expires_at) {
    const expiresAt = new Date(user.token_expires_at).getTime();
    if (Date.now() < expiresAt - 300000) {
      return user.google_access_token;
    }
  }

  // Token expired or missing — try refresh
  if (user.google_refresh_token) {
    return refreshGoogleToken(db, userId, user.google_refresh_token, clientSecret);
  }

  return user.google_access_token || null;
}

// OAuth login — check email domain against org_domains
app.post('/login', async (c) => {
  const body = await c.req.json();
  const { email, name, orgId, provider, id_token, avatar, google_access_token, google_refresh_token, token_expires_at } = body;
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
    return c.json({ error: 'org_not_found', message: 'Organization not found for this email domain' }, 403);
  }

  // Check if user already exists
  let user = await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

  const ts = now();
  let isNewUser = false;

  if (!user) {
    // Create new user with Google tokens
    isNewUser = true;
    const id = uuid();
    await db.prepare(
      `INSERT INTO users (id, org_id, email, name, role, is_admin, avatar_url, provider, last_login, is_active, google_access_token, google_refresh_token, token_expires_at)
       VALUES (?, ?, ?, ?, 'admin', 1, ?, ?, ?, 1, ?, ?, ?)`
    ).bind(id, resolvedOrgId, email, name, avatar || null, provider || null, ts,
      google_access_token || null, google_refresh_token || null, token_expires_at || null).run();
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
  } else {
    // Update last_login, avatar, and tokens
    await db.prepare(
      `UPDATE users SET last_login = ?, avatar_url = COALESCE(?, avatar_url),
       google_access_token = COALESCE(?, google_access_token),
       google_refresh_token = COALESCE(?, google_refresh_token),
       token_expires_at = COALESCE(?, token_expires_at)
       WHERE id = ?`
    ).bind(ts, avatar || null, google_access_token || null, google_refresh_token || null, token_expires_at || null, user.id).run();
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  }

  const org = await db.prepare('SELECT * FROM organizations WHERE id = ?').bind((user as any)!.org_id).first();

  // Send welcome email for new users
  if (isNewUser && google_access_token) {
    const firstName = name?.split(' ')[0] || 'there';
    // Fire and forget — don't block the login response
    c.executionCtx.waitUntil(sendWelcomeEmail(google_access_token, email, firstName));
  }

  return c.json({ user, org, isNewUser });
});

app.get('/me', async (c) => {
  const userId = getUserId(c);
  if (!userId) return c.json({ error: 'Not authenticated' }, 401);
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  const org = await c.env.DB.prepare('SELECT * FROM organizations WHERE id = ?').bind((user as any).org_id).first();
  return c.json({ user, org });
});

// Google OAuth token exchange — frontend sends auth code, we exchange for tokens
app.post('/google/exchange', async (c) => {
  const { code, redirect_uri } = await c.req.json();
  const GOOGLE_CLIENT_SECRET = c.env.GOOGLE_CLIENT_SECRET;

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

  // Calculate token expiry
  const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

  return c.json({
    email: payload.email,
    name: payload.name || payload.email?.split('@')[0],
    avatar: payload.picture || null,
    provider: 'google',
    id_token: idToken,
    google_access_token: tokenData.access_token,
    google_refresh_token: tokenData.refresh_token || null,
    token_expires_at: expiresAt,
  });
});

export default app;
