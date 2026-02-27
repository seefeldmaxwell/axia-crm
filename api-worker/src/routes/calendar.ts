import { Hono } from 'hono';
import { getOrgId } from '../middleware/auth';
import { getValidAccessToken } from './auth';

type Env = { Bindings: { DB: D1Database; GOOGLE_CLIENT_SECRET?: string; MS_CLIENT_SECRET?: string } };
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

// Google Calendar events proxy
app.get('/google', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Missing user id' }, 400);

  const token = await getValidAccessToken(c.env.DB, userId, c.env.GOOGLE_CLIENT_SECRET || '');
  if (!token) return c.json({ error: 'No Google token — please reconnect Google account' }, 401);

  const timeMin = c.req.query('timeMin') || new Date(Date.now() - 90 * 86400000).toISOString();
  const timeMax = c.req.query('timeMax') || new Date(Date.now() + 90 * 86400000).toISOString();

  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime&maxResults=250`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.text();
    return c.json({ error: 'Google Calendar API error', detail: err }, res.status);
  }
  const data: any = await res.json();
  
  // Normalize to common format
  const events = (data.items || []).map((e: any) => ({
    id: e.id,
    source: 'google',
    title: e.summary || '(No title)',
    description: e.description || '',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    allDay: !e.start?.dateTime,
    location: e.location || '',
    status: e.status || 'confirmed',
    htmlLink: e.htmlLink || '',
    attendees: (e.attendees || []).map((a: any) => ({ email: a.email, name: a.displayName, status: a.responseStatus })),
  }));
  return c.json(events);
});

// Microsoft Calendar events proxy
app.get('/microsoft', async (c) => {
  const userId = c.req.header('X-User-Id');
  if (!userId) return c.json({ error: 'Missing user id' }, 400);

  const user: any = await c.env.DB.prepare('SELECT ms_access_token, ms_refresh_token, ms_token_expires_at FROM users WHERE id = ?').bind(userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);

  let token = user.ms_access_token;
  // Refresh if expired
  if (user.ms_refresh_token && user.ms_token_expires_at && Date.now() > user.ms_token_expires_at) {
    try {
      const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: c.env.MS_CLIENT_SECRET ? '' : '', // needs MS_CLIENT_ID env
          client_secret: c.env.MS_CLIENT_SECRET || '',
          refresh_token: user.ms_refresh_token,
          grant_type: 'refresh_token',
          scope: 'Calendars.Read offline_access',
        }),
      });
      const data: any = await res.json();
      if (data.access_token) {
        token = data.access_token;
        const expiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        await c.env.DB.prepare('UPDATE users SET ms_access_token = ?, ms_token_expires_at = ? WHERE id = ?')
          .bind(token, expiresAt, userId).run();
      }
    } catch { /* fall through with existing token */ }
  }

  if (!token) return c.json({ error: 'No Microsoft token — please connect Microsoft account' }, 401);

  const timeMin = c.req.query('timeMin') || new Date(Date.now() - 90 * 86400000).toISOString();
  const timeMax = c.req.query('timeMax') || new Date(Date.now() + 90 * 86400000).toISOString();

  const url = `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${encodeURIComponent(timeMin)}&endDateTime=${encodeURIComponent(timeMax)}&$top=250&$orderby=start/dateTime`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const err = await res.text();
    return c.json({ error: 'Microsoft Calendar API error', detail: err }, res.status);
  }
  const data: any = await res.json();

  const events = (data.value || []).map((e: any) => ({
    id: e.id,
    source: 'microsoft',
    title: e.subject || '(No title)',
    description: e.bodyPreview || '',
    start: e.start?.dateTime ? e.start.dateTime + 'Z' : '',
    end: e.end?.dateTime ? e.end.dateTime + 'Z' : '',
    allDay: e.isAllDay || false,
    location: e.location?.displayName || '',
    status: e.isCancelled ? 'cancelled' : 'confirmed',
    htmlLink: e.webLink || '',
    attendees: (e.attendees || []).map((a: any) => ({ email: a.emailAddress?.address, name: a.emailAddress?.name, status: a.status?.response })),
  }));
  return c.json(events);
});

export default app;
