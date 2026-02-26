import { Hono } from 'hono';
import { getOrgId } from '../middleware/auth';

type Env = { Bindings: { DB: D1Database } };
const app = new Hono<Env>();

app.get('/dashboard', async (c) => {
  const orgId = getOrgId(c);
  const db = c.env.DB;

  const deals = (await db.prepare('SELECT * FROM deals WHERE org_id = ?').bind(orgId).all()).results as any[];
  const leads = (await db.prepare('SELECT * FROM leads WHERE org_id = ?').bind(orgId).all()).results as any[];
  const activities = (await db.prepare('SELECT * FROM activities WHERE org_id = ?').bind(orgId).all()).results as any[];

  const stages = ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
  const pipelineByStage = stages.map((stage) => ({
    stage,
    value: deals.filter((d) => d.stage === stage).reduce((sum: number, d: any) => sum + (d.amount || 0), 0),
    count: deals.filter((d) => d.stage === stage).length,
  }));

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueOverTime = months.map((month, i) => {
    const won = deals.filter((d) => {
      if (d.stage !== 'Closed Won' || !d.close_date) return false;
      return new Date(d.close_date).getMonth() === i;
    });
    return { month, revenue: won.reduce((sum: number, d: any) => sum + (d.amount || 0), 0) };
  });

  const sourceMap: Record<string, number> = {};
  leads.forEach((l: any) => { if (l.source) sourceMap[l.source] = (sourceMap[l.source] || 0) + 1; });
  const leadSources = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

  const closedDeals = deals.filter((d) => d.stage === 'Closed Won' || d.stage === 'Closed Lost');
  const wonDeals = closedDeals.filter((d) => d.stage === 'Closed Won');
  const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
  const totalPipeline = deals.filter((d) => !d.stage.startsWith('Closed')).reduce((s: number, d: any) => s + (d.amount || 0), 0);
  const owners = [...new Set(deals.map((d: any) => d.owner_name).filter(Boolean))] as string[];

  const openDeals = deals.filter((d) => !d.stage.startsWith('Closed')).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const tasksDue = activities.filter((a: any) => a.status !== 'Done' && a.due_date && a.due_date <= todayStr).length;
  const meetingsToday = activities.filter((a: any) => a.type === 'meeting' && a.due_date === todayStr).length;

  return c.json({
    pipelineByStage,
    revenueOverTime,
    leadSources,
    winRate,
    totalPipeline,
    owners,
    openDeals,
    tasksDue,
    meetingsToday,
  });
});

export default app;
