import { deals } from "@/lib/mock-data";
import { DealDetailClient } from "./client";

export function generateStaticParams() {
  return deals.map((d) => ({ id: d.id }));
}

export default function Page() {
  return <DealDetailClient />;
}
