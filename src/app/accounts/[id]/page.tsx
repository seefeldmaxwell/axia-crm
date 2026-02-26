import { accounts } from "@/lib/mock-data";
import { AccountDetailClient } from "./client";

export function generateStaticParams() {
  return accounts.map((a) => ({ id: a.id }));
}

export default function Page() {
  return <AccountDetailClient />;
}
