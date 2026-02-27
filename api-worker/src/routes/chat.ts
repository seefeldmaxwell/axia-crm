import { Hono } from 'hono';
import { getOrgId, getUserId } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database; ANTHROPIC_API_KEY: string } };
const app = new Hono<Env>();

// CRM tool definitions for function calling
const CRM_TOOLS = [
  {
    name: 'search_leads',
    description: 'Search leads in the CRM by name, company, email, status, or rating',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term (name, company, email)' },
        status: { type: 'string', enum: ['New', 'Contacted', 'Qualified', 'Unqualified'] },
        rating: { type: 'string', enum: ['Hot', 'Warm', 'Cold'] },
      },
    },
  },
  {
    name: 'search_contacts',
    description: 'Search contacts in the CRM by name, email, or company',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' },
      },
    },
  },
  {
    name: 'search_deals',
    description: 'Search deals/opportunities by name, stage, or account',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search term' },
        stage: { type: 'string', enum: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'] },
      },
    },
  },
  {
    name: 'get_stats',
    description: 'Get CRM statistics like count of leads, deals, contacts, open deals value, etc.',
    input_schema: {
      type: 'object',
      properties: {
        metric: { type: 'string', description: 'What to count: leads, contacts, deals, open_deals, won_deals, activities' },
      },
      required: ['metric'],
    },
  },
  {
    name: 'create_lead',
    description: 'Create a new lead in the CRM',
    input_schema: {
      type: 'object',
      properties: {
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        company: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        rating: { type: 'string', enum: ['Hot', 'Warm', 'Cold'] },
      },
      required: ['first_name', 'last_name'],
    },
  },
  {
    name: 'navigate',
    description: 'Generate a navigation link to a CRM page',
    input_schema: {
      type: 'object',
      properties: {
        page: { type: 'string', description: 'Page name: home, leads, contacts, deals, activities, mail, calendar, reports, settings, marketing, products, dialer' },
      },
      required: ['page'],
    },
  },
];

// Execute CRM tool calls
async function executeTool(toolName: string, input: any, db: D1Database, orgId: string, userId: string): Promise<string> {
  switch (toolName) {
    case 'search_leads': {
      let sql = 'SELECT id, first_name, last_name, company, email, phone, status, rating FROM leads WHERE org_id = ?';
      const params: any[] = [orgId];
      if (input.query) {
        sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR company LIKE ? OR email LIKE ?)`;
        const q = `%${input.query}%`;
        params.push(q, q, q, q);
      }
      if (input.status) { sql += ' AND status = ?'; params.push(input.status); }
      if (input.rating) { sql += ' AND rating = ?'; params.push(input.rating); }
      sql += ' LIMIT 10';
      const results = await db.prepare(sql).bind(...params).all();
      if (!results.results?.length) return 'No leads found matching that criteria.';
      return results.results.map((l: any) =>
        `• ${l.first_name} ${l.last_name} — ${l.company || 'No company'} (${l.status}, ${l.rating}) ${l.email || ''}`
      ).join('\n');
    }

    case 'search_contacts': {
      let sql = 'SELECT id, first_name, last_name, email, phone, account_name FROM contacts WHERE org_id = ?';
      const params: any[] = [orgId];
      if (input.query) {
        sql += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR account_name LIKE ?)`;
        const q = `%${input.query}%`;
        params.push(q, q, q, q);
      }
      sql += ' LIMIT 10';
      const results = await db.prepare(sql).bind(...params).all();
      if (!results.results?.length) return 'No contacts found.';
      return results.results.map((c: any) =>
        `• ${c.first_name} ${c.last_name} — ${c.account_name || 'No account'} (${c.email || 'no email'})`
      ).join('\n');
    }

    case 'search_deals': {
      let sql = 'SELECT id, name, amount, stage, close_date, account_name FROM deals WHERE org_id = ?';
      const params: any[] = [orgId];
      if (input.query) {
        sql += ` AND (name LIKE ? OR account_name LIKE ?)`;
        const q = `%${input.query}%`;
        params.push(q, q);
      }
      if (input.stage) { sql += ' AND stage = ?'; params.push(input.stage); }
      sql += ' LIMIT 10';
      const results = await db.prepare(sql).bind(...params).all();
      if (!results.results?.length) return 'No deals found.';
      return results.results.map((d: any) =>
        `• ${d.name} — $${(d.amount || 0).toLocaleString()} (${d.stage}) ${d.account_name || ''}`
      ).join('\n');
    }

    case 'get_stats': {
      const metric = input.metric?.toLowerCase();
      if (metric === 'leads' || metric === 'lead') {
        const r = await db.prepare('SELECT COUNT(*) as count FROM leads WHERE org_id = ?').bind(orgId).first();
        return `Total leads: ${(r as any)?.count || 0}`;
      }
      if (metric === 'contacts' || metric === 'contact') {
        const r = await db.prepare('SELECT COUNT(*) as count FROM contacts WHERE org_id = ?').bind(orgId).first();
        return `Total contacts: ${(r as any)?.count || 0}`;
      }
      if (metric === 'deals' || metric === 'deal') {
        const r = await db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM deals WHERE org_id = ?').bind(orgId).first();
        return `Total deals: ${(r as any)?.count || 0}, Total pipeline value: $${((r as any)?.total || 0).toLocaleString()}`;
      }
      if (metric === 'open_deals' || metric === 'open deals') {
        const r = await db.prepare("SELECT COUNT(*) as count, SUM(amount) as total FROM deals WHERE org_id = ? AND stage NOT IN ('Closed Won', 'Closed Lost')").bind(orgId).first();
        return `Open deals: ${(r as any)?.count || 0}, Open pipeline value: $${((r as any)?.total || 0).toLocaleString()}`;
      }
      if (metric === 'won_deals' || metric === 'won deals') {
        const r = await db.prepare("SELECT COUNT(*) as count, SUM(amount) as total FROM deals WHERE org_id = ? AND stage = 'Closed Won'").bind(orgId).first();
        return `Won deals: ${(r as any)?.count || 0}, Total won: $${((r as any)?.total || 0).toLocaleString()}`;
      }
      if (metric === 'activities' || metric === 'activity') {
        const r = await db.prepare('SELECT COUNT(*) as count FROM activities WHERE org_id = ?').bind(orgId).first();
        const pending = await db.prepare("SELECT COUNT(*) as count FROM activities WHERE org_id = ? AND status != 'Done'").bind(orgId).first();
        return `Total activities: ${(r as any)?.count || 0}, Pending: ${(pending as any)?.count || 0}`;
      }
      // General stats
      const leads = await db.prepare('SELECT COUNT(*) as c FROM leads WHERE org_id = ?').bind(orgId).first();
      const contacts = await db.prepare('SELECT COUNT(*) as c FROM contacts WHERE org_id = ?').bind(orgId).first();
      const deals = await db.prepare('SELECT COUNT(*) as c, SUM(amount) as t FROM deals WHERE org_id = ?').bind(orgId).first();
      return `Leads: ${(leads as any)?.c || 0} | Contacts: ${(contacts as any)?.c || 0} | Deals: ${(deals as any)?.c || 0} ($${((deals as any)?.t || 0).toLocaleString()})`;
    }

    case 'create_lead': {
      const id = crypto.randomUUID();
      const ts = new Date().toISOString();
      await db.prepare(
        `INSERT INTO leads (id, org_id, first_name, last_name, company, email, phone, status, rating, owner_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'New', ?, ?, ?)`
      ).bind(id, orgId, input.first_name, input.last_name, input.company || null, input.email || null, input.phone || null, input.rating || 'Warm', userId, ts).run();
      return `Lead created: ${input.first_name} ${input.last_name}${input.company ? ' at ' + input.company : ''}. You can view it at /leads.`;
    }

    case 'navigate': {
      const pages: Record<string, string> = {
        home: '/home', leads: '/leads', contacts: '/contacts', deals: '/deals',
        activities: '/activities', mail: '/mail', calendar: '/calendar',
        reports: '/reports', settings: '/settings', marketing: '/marketing',
        products: '/products', dialer: '/dialer', phone: '/dialer',
      };
      const url = pages[input.page?.toLowerCase()] || '/home';
      return `Navigate to: ${url}`;
    }

    default:
      return 'Unknown tool';
  }
}

// POST /api/chat — AI chatbot endpoint
app.post('/', async (c) => {
  const apiKey = c.env.ANTHROPIC_API_KEY;
  const db = c.env.DB;
  const userId = getUserId(c);
  const orgId = getOrgId(c);

  const { message, history } = await c.req.json();

  if (!apiKey) {
    // Fallback: provide helpful responses without AI
    const msg = (message || '').toLowerCase();
    let reply = "I'm Axia AI! My AI brain isn't connected yet (ANTHROPIC_API_KEY needed), but I can still help you navigate. Try asking to go to leads, deals, contacts, or mail.";

    if (msg.includes('lead')) reply = "Navigate to your leads: [Leads](/leads)";
    else if (msg.includes('deal')) reply = "Navigate to your deals: [Deals](/deals)";
    else if (msg.includes('contact')) reply = "Navigate to your contacts: [Contacts](/contacts)";
    else if (msg.includes('mail') || msg.includes('email')) reply = "Navigate to your mail: [Mail](/mail)";
    else if (msg.includes('calendar')) reply = "Navigate to your calendar: [Calendar](/calendar)";
    else if (msg.includes('report')) reply = "Navigate to reports: [Reports](/reports)";
    else if (msg.includes('setting')) reply = "Navigate to settings: [Settings](/settings)";
    else if (msg.includes('activit')) reply = "Navigate to activities: [Activities](/activities)";
    else if (msg.includes('dial') || msg.includes('phone') || msg.includes('call')) reply = "Navigate to the dialer: [Phone](/dialer)";
    else if (msg.includes('product')) reply = "Navigate to products: [Products](/products)";
    else if (msg.includes('home') || msg.includes('dashboard')) reply = "Navigate to your dashboard: [Home](/home)";
    else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey')) reply = `Hello! I'm Axia AI. I can help you navigate the CRM. To unlock full AI features (search records, get stats, create leads), ask your admin to set the ANTHROPIC_API_KEY. For now, try: "go to leads", "show me deals", or "open mail".`;

    return c.json({ reply });
  }

  // Get user context
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

  const systemPrompt = `You are Axia AI, the intelligent CRM assistant built into Axia CRM. You help users navigate Axia CRM, find records, create tasks, and answer questions about their data. Be concise, helpful, and friendly.

Current user: ${userName}
Organization: ${orgName}

You have access to tools to search leads, contacts, deals, get CRM stats, create leads, and navigate to pages. Use them when the user asks about their data.

When returning navigation links, format them as clickable: [Page Name](/path)

Keep responses brief — 1-3 sentences for simple questions. Only use tools when the user asks about specific data.`;

  // Build messages array
  const messages: any[] = [];
  if (history && Array.isArray(history)) {
    for (const h of history.slice(-10)) {
      messages.push({ role: h.role, content: h.content });
    }
  }
  messages.push({ role: 'user', content: message });

  try {
    // Call Claude API with tools
    let response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        tools: CRM_TOOLS,
        messages,
      }),
    });

    let data: any = await response.json();

    if (data.error) {
      console.error('Claude API error:', data.error);
      return c.json({ reply: 'Sorry, I encountered an error. Please try again.' });
    }

    // Handle tool use — execute tools and send results back
    let maxIterations = 5;
    while (data.stop_reason === 'tool_use' && maxIterations > 0) {
      maxIterations--;

      // Find tool use blocks
      const toolUseBlocks = data.content.filter((b: any) => b.type === 'tool_use');
      const toolResults: any[] = [];

      for (const tool of toolUseBlocks) {
        const result = await executeTool(tool.name, tool.input, db, orgId, userId || '');
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tool.id,
          content: result,
        });
      }

      // Continue conversation with tool results
      messages.push({ role: 'assistant', content: data.content });
      messages.push({ role: 'user', content: toolResults });

      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          system: systemPrompt,
          tools: CRM_TOOLS,
          messages,
        }),
      });

      data = await response.json();
      if (data.error) break;
    }

    // Extract text response
    const textBlocks = (data.content || []).filter((b: any) => b.type === 'text');
    const reply = textBlocks.map((b: any) => b.text).join('\n') || "I'm not sure how to help with that. Try asking about your leads, deals, or contacts.";

    return c.json({ reply });
  } catch (e: any) {
    console.error('Chat error:', e);
    return c.json({ reply: 'Sorry, something went wrong. Please try again.' });
  }
});

export default app;
