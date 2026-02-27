import { ContactDetailClient } from "./client";

export function generateStaticParams() {
  // IDs matching D1 seed data
  return Array.from({ length: 24 }, (_, i) => ({ id: `c${i + 1}` }));
}

export default function Page() {
  return <ContactDetailClient />;
}
