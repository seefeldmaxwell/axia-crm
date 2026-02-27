import { LeadDetailClient } from "./client";

export function generateStaticParams() {
  // IDs matching D1 seed data
  return Array.from({ length: 12 }, (_, i) => ({ id: `l${i + 1}` }));
}

export default function Page() {
  return <LeadDetailClient />;
}
