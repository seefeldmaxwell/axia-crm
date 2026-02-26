import type { Context } from 'hono';

export function getOrgId(c: Context): string {
  return c.req.header('X-Org-Id') || c.req.query('org_id') || '';
}

export function getUserId(c: Context): string {
  return c.req.header('X-User-Id') || '';
}

export function uuid(): string {
  return crypto.randomUUID();
}

export function now(): string {
  return new Date().toISOString().replace('T', ' ').split('.')[0];
}

export function dynamicUpdate(body: Record<string, any>, id: string, ts: string): { sql: string; values: any[] } {
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
  return { sql: fields.join(', '), values };
}
