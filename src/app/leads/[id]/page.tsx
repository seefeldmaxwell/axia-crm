import { leads } from "@/lib/mock-data";
import { LeadDetailClient } from "./client";

export function generateStaticParams() {
  return leads.map((l) => ({ id: l.id }));
}

export default function Page() {
  return <LeadDetailClient />;
}
