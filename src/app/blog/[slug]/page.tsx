import { BlogDetailClient } from "./client";

export function generateStaticParams() {
  return [
    { slug: "introducing-axia-crm" },
    { slug: "ai-powered-lead-scoring" },
    { slug: "cloudflare-edge-architecture" },
  ];
}

export default function Page() {
  return <BlogDetailClient />;
}
