import { Hono } from 'hono';
import { getUserId } from '../middleware/auth';
import { getValidAccessToken } from './auth';

type Env = { Bindings: { DB: D1Database; GOOGLE_CLIENT_SECRET: string } };
const app = new Hono<Env>();

const GMAIL_API = 'https://gmail.googleapis.com/gmail/v1/users/me';

// Helper: get access token or return 401
async function getToken(c: any): Promise<string | null> {
  const userId = getUserId(c);
  if (!userId) return null;
  return getValidAccessToken(c.env.DB, userId, c.env.GOOGLE_CLIENT_SECRET);
}

// Helper: parse email headers
function getHeader(headers: any[], name: string): string {
  const h = headers?.find((h: any) => h.name?.toLowerCase() === name.toLowerCase());
  return h?.value || '';
}

// Helper: decode base64url
function decodeBase64Url(str: string): string {
  try {
    const padded = str.replace(/-/g, '+').replace(/_/g, '/');
    return decodeURIComponent(escape(atob(padded)));
  } catch {
    return '';
  }
}

// Helper: extract email body from message parts
function extractBody(payload: any): { text: string; html: string } {
  let text = '';
  let html = '';

  if (payload.body?.data) {
    const decoded = decodeBase64Url(payload.body.data);
    if (payload.mimeType === 'text/html') html = decoded;
    else text = decoded;
  }

  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text = decodeBase64Url(part.body.data);
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html = decodeBase64Url(part.body.data);
      } else if (part.parts) {
        // Nested multipart
        const nested = extractBody(part);
        if (nested.text) text = nested.text;
        if (nested.html) html = nested.html;
      }
    }
  }

  return { text, html };
}

// Helper: parse a Gmail message into our format
function parseMessage(msg: any): any {
  const headers = msg.payload?.headers || [];
  const { text, html } = extractBody(msg.payload || {});
  const from = getHeader(headers, 'From');
  const subject = getHeader(headers, 'Subject');
  const date = getHeader(headers, 'Date');
  const to = getHeader(headers, 'To');
  const labels = msg.labelIds || [];

  // Parse sender name and email
  const fromMatch = from.match(/^(.+?)\s*<(.+?)>$/);
  const senderName = fromMatch ? fromMatch[1].replace(/"/g, '').trim() : from.split('@')[0];
  const senderEmail = fromMatch ? fromMatch[2] : from;

  // Determine folder from labels
  let folder = 'Inbox';
  if (labels.includes('SENT')) folder = 'Sent';
  else if (labels.includes('DRAFT')) folder = 'Drafts';
  else if (labels.includes('TRASH')) folder = 'Trash';
  else if (labels.includes('SPAM')) folder = 'Spam';

  return {
    id: msg.id,
    threadId: msg.threadId,
    sender: senderName,
    senderEmail: senderEmail,
    to: to,
    subject: subject || '(no subject)',
    snippet: msg.snippet || '',
    body: html || text || msg.snippet || '',
    bodyText: text || msg.snippet || '',
    date: date,
    folder: folder,
    read: !labels.includes('UNREAD'),
    starred: labels.includes('STARRED'),
    labels: labels,
  };
}

// GET /api/mail/inbox — List emails
app.get('/inbox', async (c) => {
  const token = await getToken(c);
  if (!token) return c.json({ error: 'Not authenticated or token expired' }, 401);

  const maxResults = c.req.query('maxResults') || '30';
  const pageToken = c.req.query('pageToken') || '';
  const folder = c.req.query('folder') || 'INBOX';

  // Map folder names to Gmail label IDs
  const labelMap: Record<string, string> = {
    'Inbox': 'INBOX',
    'INBOX': 'INBOX',
    'Sent': 'SENT',
    'SENT': 'SENT',
    'Drafts': 'DRAFT',
    'DRAFT': 'DRAFT',
    'Starred': 'STARRED',
    'STARRED': 'STARRED',
    'Trash': 'TRASH',
    'TRASH': 'TRASH',
    'Spam': 'SPAM',
    'SPAM': 'SPAM',
  };

  const labelId = labelMap[folder] || 'INBOX';

  let url = `${GMAIL_API}/messages?maxResults=${maxResults}&labelIds=${labelId}`;
  if (pageToken) url += `&pageToken=${pageToken}`;

  const listRes = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const err: any = await listRes.json().catch(() => ({}));
    if (listRes.status === 401) return c.json({ error: 'token_expired', message: 'Google token expired' }, 401);
    return c.json({ error: 'Gmail API error', details: err }, listRes.status);
  }

  const listData: any = await listRes.json();
  const messageIds = (listData.messages || []).map((m: any) => m.id);

  if (messageIds.length === 0) {
    return c.json({ messages: [], nextPageToken: null });
  }

  // Fetch message details in parallel (batch of up to 30)
  const messages = await Promise.all(
    messageIds.map(async (id: string) => {
      const res = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return null;
      const msg = await res.json();
      return parseMessage(msg);
    })
  );

  return c.json({
    messages: messages.filter(Boolean),
    nextPageToken: listData.nextPageToken || null,
  });
});

// GET /api/mail/message/:id — Get single email with full body
app.get('/message/:id', async (c) => {
  const token = await getToken(c);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const id = c.req.param('id');
  const res = await fetch(`${GMAIL_API}/messages/${id}?format=full`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 401) return c.json({ error: 'token_expired' }, 401);
    return c.json({ error: 'Failed to fetch message' }, res.status);
  }

  const msg = await res.json();
  return c.json(parseMessage(msg));
});

// POST /api/mail/send — Send email via Gmail
app.post('/send', async (c) => {
  const token = await getToken(c);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const { to, subject, body, cc, bcc } = await c.req.json();

  // Build RFC 2822 email
  const lines = [];
  lines.push(`To: ${to}`);
  if (cc) lines.push(`Cc: ${cc}`);
  if (bcc) lines.push(`Bcc: ${bcc}`);
  lines.push(`Subject: ${subject || '(no subject)'}`);
  lines.push('Content-Type: text/html; charset=UTF-8');
  lines.push('');
  lines.push(body || '');

  const raw = lines.join('\r\n');
  const encoded = btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!res.ok) {
    const err: any = await res.json().catch(() => ({}));
    if (res.status === 401) return c.json({ error: 'token_expired' }, 401);
    return c.json({ error: 'Failed to send', details: err }, res.status);
  }

  const result = await res.json();
  return c.json({ success: true, id: (result as any).id });
});

// GET /api/mail/folders — List Gmail labels
app.get('/folders', async (c) => {
  const token = await getToken(c);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const res = await fetch(`${GMAIL_API}/labels`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return c.json({ error: 'Failed to fetch labels' }, res.status);

  const data: any = await res.json();
  return c.json(data.labels || []);
});

// POST /api/mail/star/:id — Star/unstar email
app.post('/star/:id', async (c) => {
  const token = await getToken(c);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const id = c.req.param('id');
  const { starred } = await c.req.json();

  const res = await fetch(`${GMAIL_API}/messages/${id}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      starred
        ? { addLabelIds: ['STARRED'] }
        : { removeLabelIds: ['STARRED'] }
    ),
  });

  if (!res.ok) return c.json({ error: 'Failed to modify' }, res.status);
  return c.json({ success: true });
});

// POST /api/mail/read/:id — Mark read/unread
app.post('/read/:id', async (c) => {
  const token = await getToken(c);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const id = c.req.param('id');
  const { read } = await c.req.json();

  const res = await fetch(`${GMAIL_API}/messages/${id}/modify`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      read
        ? { removeLabelIds: ['UNREAD'] }
        : { addLabelIds: ['UNREAD'] }
    ),
  });

  if (!res.ok) return c.json({ error: 'Failed to modify' }, res.status);
  return c.json({ success: true });
});

// DELETE /api/mail/message/:id — Trash email
app.delete('/message/:id', async (c) => {
  const token = await getToken(c);
  if (!token) return c.json({ error: 'Not authenticated' }, 401);

  const id = c.req.param('id');
  const res = await fetch(`${GMAIL_API}/messages/${id}/trash`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return c.json({ error: 'Failed to trash' }, res.status);
  return c.json({ success: true });
});

export default app;
