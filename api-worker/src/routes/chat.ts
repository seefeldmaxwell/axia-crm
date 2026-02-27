import { Hono } from 'hono';
import { getOrgId, getUserId } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; AI: any } };
const app = new Hono<Env>();

// Gather CRM context for the AI
async function getCRMContext(db: D1Database, orgId: string): Promise<string> {
  const parts: string[] = [];
  try {
    const leads = await db.prepare('SELECT COUNT(*) as c FROM leads WHERE org_id = ?').bind(orgId).first() as any;
    const contacts = await db.prepare('SELECT COUNT(*) as c FROM contacts WHERE org_id = ?').bind(orgId).first() as any;
    const deals = await db.prepare('SELECT COUNT(*) as c, SUM(amount) as t FROM deals WHERE org_id = ?').bind(orgId).first() as any;
    const openDeals = await db.prepare("SELECT COUNT(*) as c, SUM(amount) as t FROM deals WHERE org_id = ? AND stage NOT IN ('Closed Won', 'Closed Lost')").bind(orgId).first() as any;
    const wonDeals = await db.prepare("SELECT COUNT(*) as c, SUM(amount) as t FROM deals WHERE org_id = ? AND stage = 'Closed Won'").bind(orgId).first() as any;
    const activities = await db.prepare('SELECT COUNT(*) as c FROM activities WHERE org_id = ?').bind(orgId).first() as any;
    const pendingAct = await db.prepare("SELECT COUNT(*) as c FROM activities WHERE org_id = ? AND status != 'Done'").bind(orgId).first() as any;

    parts.push(`CRM Stats: ${leads?.c || 0} leads, ${contacts?.c || 0} contacts, ${deals?.c || 0} deals (total pipeline: $${((deals?.t || 0)).toLocaleString()})`);
    parts.push(`Open pipeline: ${openDeals?.c || 0} deals worth $${((openDeals?.t || 0)).toLocaleString()}`);
    parts.push(`Won deals: ${wonDeals?.c || 0} worth $${((wonDeals?.t || 0)).toLocaleString()}`);
    parts.push(`Activities: ${activities?.c || 0} total, ${pendingAct?.c || 0} pending`);

    // Recent leads
    const recentLeads = await db.prepare('SELECT first_name, last_name, company, status, rating FROM leads WHERE org_id = ? ORDER BY created_at DESC LIMIT 5').bind(orgId).all();
    if (recentLeads.results?.length) {
      parts.push('Recent leads: ' + recentLeads.results.map((l: any) => `${l.first_name} ${l.last_name} (${l.company || 'no company'}, ${l.status})`).join('; '));
    }

    // Recent deals
    const recentDeals = await db.prepare('SELECT name, amount, stage, account_name FROM deals WHERE org_id = ? ORDER BY created_at DESC LIMIT 5').bind(orgId).all();
    if (recentDeals.results?.length) {
      parts.push('Recent deals: ' + recentDeals.results.map((d: any) => `${d.name} - $${(d.amount || 0).toLocaleString()} (${d.stage})`).join('; '));
    }
  } catch (e) {
    parts.push('Could not fetch CRM stats.');
  }
  return parts.join('\n');
}

// POST /api/chat — AI chatbot endpoint using Cloudflare Workers AI
app.post('/', async (c) => {
  const db = c.env.DB;
  const ai = c.env.AI;
  const userId = getUserId(c);
  const orgId = getOrgId(c);

  const { message, history } = await c.req.json();

  // Get user and org context
  let userName = 'User';
  let orgName = 'Organization';
  try {
    if (userId) {
      const user: any = await db.prepare('SELECT name FROM users WHERE id = ?').bind(userId).first();
      if (user) userName = user.name;
    }
    if (orgId) {
      const org: any = await db.prepare('SELECT name FROM organizations WHERE id = ?').bind(orgId).first();
      if (org) orgName = org.name;
    }
  } catch {}

  // Gather CRM context
  const crmContext = await getCRMContext(db, orgId);

  const systemPrompt = `You are Axia AI, the intelligent CRM assistant built into Axia CRM. You help ${userName} from ${orgName} navigate the CRM, understand their data, and answer questions.

Be concise, helpful, and friendly. Keep responses to 1-3 sentences for simple questions.

Here is the current CRM data:
${crmContext}

CRM Pages (use markdown links like [Page Name](/path)):
- [Home Dashboard](/home) - [Leads](/leads) - [Contacts](/contacts) - [Deals](/deals)
- [Activities](/activities) - [Mail](/mail) - [Calendar](/calendar) - [Reports](/reports)
- [Settings](/settings) - [Marketing](/marketing) - [Products](/products) - [Phone/Dialer](/dialer)
- [Vendors](/vendors) - [Clients](/clients)

When the user asks about data, use the CRM stats above to answer. When they ask to navigate somewhere, provide the clickable link. When they ask about a specific record, mention what you know from the recent data.`;

  // Build messages array
  const messages: { role: string; content: string }[] = [
    { role: 'system', content: systemPrompt },
  ];

  if (history && Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: 'user', content: message });

  try {
    const res = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
      messages,
      max_tokens: 512,
    });

    const reply = res.response || res.result || "I'm not sure how to help with that. Try asking about your leads, deals, or contacts.";
    return c.json({ reply });
  } catch (e: any) {
    console.error('Workers AI error:', e);
    // Fallback: provide helpful responses without AI
    const msg = (message || '').toLowerCase();
    let reply = "I'm Axia AI! I'm having trouble connecting right now. Here are some quick links:";

    if (msg.includes('lead')) reply = "Navigate to your leads: [Leads](/leads)";
    else if (msg.includes('deal')) reply = "Navigate to your deals: [Deals](/deals)";
    else if (msg.includes('contact')) reply = "Navigate to your contacts: [Contacts](/contacts)";
    else if (msg.includes('mail') || msg.includes('email')) reply = "Navigate to your mail: [Mail](/mail)";
    else if (msg.includes('calendar')) reply = "Navigate to your calendar: [Calendar](/calendar)";
    else if (msg.includes('report')) reply = "Navigate to reports: [Reports](/reports)";
    else if (msg.includes('activit')) reply = "Navigate to activities: [Activities](/activities)";
    else if (msg.includes('home') || msg.includes('dashboard')) reply = "Navigate to your dashboard: [Home](/home)";

    return c.json({ reply });
  }
});

export default app;
