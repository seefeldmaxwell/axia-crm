import { contacts } from "@/lib/mock-data";
import { ContactDetailClient } from "./client";

export function generateStaticParams() {
  return contacts.map((c) => ({ id: c.id }));
}

export default function Page() {
  return <ContactDetailClient />;
}
