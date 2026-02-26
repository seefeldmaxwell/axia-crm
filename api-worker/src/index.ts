import { Hono } from 'hono';
import { cors } from 'hono/cors';

import auth from './routes/auth';
import contacts from './routes/contacts';
import accounts from './routes/accounts';
import deals from './routes/deals';
import activities from './routes/activities';
import leads from './routes/leads';
import cases from './routes/cases';
import vendors from './routes/vendors';
import clients from './routes/clients';
import products from './routes/products';
import marketing from './routes/marketing';
import tags from './routes/tags';
import dialer from './routes/dialer';
import reports from './routes/reports';
import settings from './routes/settings';
import calendar from './routes/calendar';
import seed from './routes/seed';
import records from './routes/records';
import team from './routes/team';
import users from './routes/users';

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'X-User-Id', 'X-Org-Id'],
}));

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Mount routes
app.route('/api/auth', auth);
app.route('/api/contacts', contacts);
app.route('/api/accounts', accounts);
app.route('/api/deals', deals);
app.route('/api/activities', activities);
app.route('/api/leads', leads);
app.route('/api/cases', cases);
app.route('/api/vendors', vendors);
app.route('/api/clients', clients);
app.route('/api/products', products);
app.route('/api/marketing', marketing);
app.route('/api/tags', tags);
app.route('/api/dialer', dialer);
app.route('/api/reports', reports);
app.route('/api/settings', settings);
app.route('/api/calendar', calendar);
app.route('/api/seed', seed);
app.route('/api/records', records);
app.route('/api/team', team);
app.route('/api/users', users);

export default app;
