import { AccountDetailClient } from "./client";

export function generateStaticParams() {
  // IDs matching D1 seed data
  return Array.from({ length: 14 }, (_, i) => ({ id: `a${i + 1}` }));
}

export default function Page() {
  return <AccountDetailClient />;
}
