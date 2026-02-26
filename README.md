# Axia CRM

A modern CRM platform built with Next.js 15, TypeScript, and Tailwind CSS v4.

## Features

- **Sales**: Leads management, Deals pipeline, Power Dialer
- **Marketing**: Buffer-style social media publishing
- **Service**: Contacts, Accounts, Cases, Activities
- **Analytics**: Reports & Settings
- **Design**: Apple (Jony Ive) design language + Palantir dark theme

## Tech Stack

- Next.js 15 (App Router, static export)
- TypeScript (strict)
- Tailwind CSS v4
- Recharts, @hello-pangea/dnd, lucide-react
- Cloudflare Pages (frontend) + D1 (backend API)

## Getting Started

```bash
npm install
npm run dev    # http://localhost:3333
npm run build  # Static export to /out
```

## Deployment

Frontend deploys to Cloudflare Pages. Backend API is a separate Cloudflare Worker with D1 database in `api-worker/`.

## License

Proprietary — Y12.AI
