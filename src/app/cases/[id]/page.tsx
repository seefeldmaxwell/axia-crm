import { cases } from "@/lib/mock-data";
import { CaseDetailClient } from "./client";

export function generateStaticParams() {
  return cases.map((c) => ({ id: c.id }));
}

export default function Page() {
  return <CaseDetailClient />;
}
