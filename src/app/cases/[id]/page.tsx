import { CaseDetailClient } from "./client";

export function generateStaticParams() {
  // IDs matching D1 seed data
  return Array.from({ length: 8 }, (_, i) => ({ id: `cs${i + 1}` }));
}

export default function Page() {
  return <CaseDetailClient />;
}
