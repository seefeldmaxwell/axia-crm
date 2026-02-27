import { DealDetailClient } from "./client";

export function generateStaticParams() {
  // IDs matching D1 seed data
  return Array.from({ length: 18 }, (_, i) => ({ id: `d${i + 1}` }));
}

export default function Page() {
  return <DealDetailClient />;
}
