# Axia CRM — Salesforce-Clone Build Task

Build a **pixel-perfect Salesforce Lightning clone** CRM in Next.js + TypeScript + Tailwind CSS. This is a static-export app for Cloudflare Pages. All data is mock/demo data stored client-side (localStorage). No server-side APIs.

## Reference
See `salesforce-reference.webp` in the project root — match this exact visual style:
- **Left sidebar**: Dark navy (#032D60) with white icons + labels (Home, Contacts, Accounts, Sales, Service, Marketing, Commerce, More)
- **Top bar**: White background, global search bar, Salesforce-style tabs
- **Content area**: White/light gray (#F3F3F3) background, cards with white backgrounds and subtle shadows
- **Typography**: Salesforce Sans / system sans-serif, 13-14px body text
- **Colors**: Salesforce blue (#0176D3), navy sidebar (#032D60), light blue highlights (#EBF5FE), gray borders (#DDDBDA)
- **Inline edit pencil icons** on every field
- **Collapsible sections** with chevron toggles (About, Get in Touch, etc.)

## Pages to Build (All under src/app/)

### 1. Login Page (`/`)
- Clean centered card on gradient background
- **Only** "Sign in with Google" and "Sign in with Microsoft" buttons (SVG icons)
- No email/password fields
- Clicking either stores mock user in localStorage and redirects to /contacts
- Mock user: `{ id: "1", name: "Demo User", email: "demo@axia.crm", role: "admin", orgId: "org-1", orgName: "Acme Corp" }`

### 2. Dashboard/Home (`/home`)
- Salesforce-style home with:
  - Assistant panel (recent items, tasks due today)
  - Key metrics cards (Open Deals, Tasks Due, Meetings Today, Pipeline Value)
  - Recent records list
  - Activity timeline (today's events)

### 3. Contacts (`/contacts`)
- **List view** (default): Salesforce-style table with sortable columns (Name, Account, Title, Phone, Email, Owner)
- **Detail view** (`/contacts/[id]`): EXACT match of the screenshot — left panel (About, Get in Touch sections), right panel (Activity timeline, Upcoming & Overdue)
- Inline-editable fields with pencil icon
- "New Contact" button opens a modal form

### 4. Accounts (`/accounts`)
- List + detail views similar to Contacts
- Account detail shows: Account Name, Industry, Type, Phone, Website, Billing Address, Description
- Related lists: Contacts, Opportunities, Cases, Activity

### 5. Deals/Opportunities (`/deals`)
- **Kanban board** (default view) — columns: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
- Drag-and-drop cards between columns
- Each card shows: Deal name, Amount, Account, Close Date, Owner
- Also a list/table view toggle
- Detail page with deal info + activity timeline

### 6. Activities (`/activities`)
- **Kanban board** (Jira-style) — columns: To Do, In Progress, Waiting, Done
- Cards show: Activity type icon (call/email/meeting/task), subject, related contact, due date
- Drag-and-drop between columns
- Quick-add button per column
- Filter by type (Calls, Emails, Meetings, Tasks)

### 7. Leads (`/leads`)
- List view with status badges (New, Contacted, Qualified, Unqualified)
- Lead detail with convert-to-contact action
- Lead source, rating, industry fields

### 8. Cases/Service (`/cases`)
- List with priority badges (High=red, Medium=yellow, Low=green)
- Case detail with status, priority, description, resolution
- Activity timeline on case records

### 9. Reports (`/reports`)
- Dashboard with Recharts: Pipeline by Stage (bar), Revenue Over Time (line), Lead Sources (pie), Win Rate (gauge)
- Filter controls (date range, owner, stage)

### 10. Power Dialer (`/dialer`)
- **Dedicated full-page dialer** with:
  - Left panel: Call queue (list of contacts to call, drag to reorder)
  - Center: Active call card (large contact name, phone, account, timer, disposition buttons)
  - Right panel: Script viewer/editor
- **Script Builder**: Create/edit call scripts with:
  - Script name, description
  - Step-by-step script blocks (Intro, Discovery, Pitch, Objection Handling, Close)
  - Each block has: title, content (rich text), notes, branching logic hint
  - Save scripts to localStorage
  - Assign scripts to call queues
- Disposition buttons: Connected, No Answer, Voicemail, Busy, Wrong Number, Callback, Not Interested, Booked Meeting
- Call notes textarea
- After disposition, auto-advance to next in queue
- Stats bar: Calls Made, Connected, Avg Duration, Meetings Booked

### 11. Settings (`/settings`)
- **Organization**: Org name, logo upload placeholder, timezone, fiscal year
- **Users & Teams**: Multi-tenant user list (mock), invite user form, role assignment (Admin, Manager, Rep, Viewer)
- **Integrations**: Google, Microsoft, Slack toggle cards
- **Power Dialer Settings**: Default disposition, ring timeout, voicemail drop

### 12. Marketing (`/marketing`)
- Campaign list with status, type, budget, responses
- Campaign detail with member list and stats

### 13. Commerce (`/commerce`)
- Products/Price Books list
- Product detail with pricing tiers

## Shared Components (src/components/)

### Layout (`dashboard-layout.tsx`)
- Salesforce-style fixed left sidebar (dark navy, 56px wide collapsed, 240px expanded on hover)
- Icons: Home, Contacts, Accounts, Deals, Activities, Leads, Cases, Reports, Dialer, Marketing, Commerce, Settings, More
- Top bar: Search input, org switcher dropdown (multi-tenant), notifications bell, user avatar/menu
- Breadcrumb navigation
- Content area with proper padding

### UI Components (`ui/`)
Build these reusable components matching Salesforce Lightning style:
- `button.tsx` — primary (blue), neutral (white border), destructive (red), brand variants
- `card.tsx` — white bg, subtle shadow, rounded corners
- `input.tsx` — Salesforce-style with floating labels
- `badge.tsx` — status badges with colors
- `table.tsx` — sortable data table with hover rows
- `modal.tsx` — centered overlay dialog
- `tabs.tsx` — horizontal tab navigation
- `dropdown.tsx` — action menus
- `collapsible.tsx` — chevron toggle sections (like "About", "Get in Touch")
- `inline-edit.tsx` — click-to-edit field with pencil icon
- `kanban.tsx` — reusable Kanban board with @hello-pangea/dnd
- `avatar.tsx` — user/contact avatar circles
- `toast.tsx` — notification toasts
- `search.tsx` — global search with keyboard shortcut

### Data Layer (`lib/mock-data.ts`)
Create comprehensive mock data:
- 20+ contacts with full details (name, title, account, phone, email, address, owner, description)
- 10+ accounts with industry, type, contacts count
- 15+ deals at various stages with amounts ($10K-$500K)
- 30+ activities (calls, emails, meetings, tasks) with dates
- 10+ leads
- 5+ cases
- 3 orgs for multi-tenant demo (Acme Corp, TechStart Inc, Global Finance)
- 5+ call scripts with step blocks

### Multi-Tenant (`lib/tenant.ts`)
- Org switcher in top bar
- All data filtered by current orgId
- Switch org = switch data context
- Store current org in localStorage

### Auth (`lib/auth.ts`)
- Check localStorage for user session
- Redirect to / if not authenticated
- Expose useAuth hook with user, org, logout

## Technical Requirements
- Next.js 15 with App Router, `output: "export"` (static)
- TypeScript strict mode
- Tailwind CSS v4
- All data in localStorage (no API calls)
- @hello-pangea/dnd for Kanban drag-and-drop
- recharts for Reports charts
- lucide-react for icons
- date-fns for date formatting
- Mobile responsive (sidebar collapses to icons, tables scroll horizontally)
- No server components that use async/await (static export)

## Build Verification
After building everything:
1. Run `npm run build`
2. Fix ALL errors until build succeeds
3. The `out/` directory should contain all pages

## Style Guide (Salesforce Lightning)
```
Primary Blue: #0176D3
Dark Navy (sidebar): #032D60
Light Blue Bg: #EBF5FE
Surface: #FFFFFF
Background: #F3F3F3
Border: #DDDBDA
Text Primary: #181818
Text Secondary: #706E6B
Success: #2E844A
Warning: #FE9339
Error: #EA001E
Font: system-ui, -apple-system, sans-serif
Border Radius: 4px (inputs), 8px (cards)
Shadow: 0 2px 4px rgba(0,0,0,0.1)
```

When completely finished and build passes, run:
openclaw system event --text "Done: Axia CRM Salesforce-clone built — all pages, Kanban boards, power dialer, multi-tenant" --mode now
