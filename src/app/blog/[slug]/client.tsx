"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Calendar, User, ArrowLeft } from "lucide-react";
import { AxiaLogo } from "@/components/ui/axia-logo";
import { api, mapBlogPost } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export function BlogDetailClient() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    if (!slug) return;
    api.getBlogPost(slug)
      .then((data: any) => setPost(mapBlogPost(data)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const mono = { fontFamily: "var(--font-mono)" } as const;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Navbar */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(13, 14, 18, 0.95)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--border-secondary)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://axia-crm.pages.dev" className="flex items-center gap-3">
            <AxiaLogo size={28} color="#0071E3" />
            <span className="text-[13px] font-semibold tracking-[0.2em] uppercase" style={{ ...mono, color: "var(--text-primary)" }}>
              AXIA
            </span>
          </a>
          <Link
            href="/blog"
            className="text-[11px] uppercase tracking-[0.08em] px-4 py-2 transition-colors"
            style={{ ...mono, color: "var(--text-tertiary)" }}
          >
            All Posts
          </Link>
        </div>
      </nav>

      {loading ? (
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <p className="text-[12px]" style={{ ...mono, color: "var(--text-tertiary)" }}>Loading...</p>
        </div>
      ) : !post ? (
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <p className="text-[18px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Post not found</p>
          <Link href="/blog" className="text-[12px] uppercase tracking-[0.08em]" style={{ ...mono, color: "var(--accent-blue)" }}>
            <ArrowLeft size={12} className="inline mr-1" /> Back to Blog
          </Link>
        </div>
      ) : (
        <>
          {/* Article header */}
          <div className="max-w-4xl mx-auto px-6 pt-16 pb-8">
            <Link href="/blog" className="inline-flex items-center gap-1.5 mb-8 text-[11px] uppercase tracking-[0.08em] transition-colors" style={{ ...mono, color: "var(--text-tertiary)" }}>
              <ArrowLeft size={12} /> All Posts
            </Link>

            <h1 className="text-[clamp(28px,4vw,42px)] font-bold tracking-[-0.02em] leading-tight mb-6" style={{ color: "var(--text-primary)" }}>
              {post.title}
            </h1>

            {/* Meta row */}
            <div className="flex items-center gap-5 mb-8">
              {post.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} style={{ color: "var(--text-tertiary)" }} />
                  <span className="text-[12px]" style={{ ...mono, color: "var(--text-tertiary)" }}>
                    {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>
              )}
              {post.authorName && (
                <div className="flex items-center gap-1.5">
                  <User size={13} style={{ color: "var(--text-tertiary)" }} />
                  <span className="text-[12px]" style={{ ...mono, color: "var(--text-tertiary)" }}>
                    {post.authorName}
                  </span>
                </div>
              )}
            </div>

            {post.excerpt && (
              <p className="text-[16px] leading-relaxed mb-8 pb-8" style={{ color: "var(--text-secondary)", borderBottom: "1px solid var(--border-secondary)" }}>
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Article content */}
          <div className="max-w-4xl mx-auto px-6 pb-20">
            <div
              className="prose-dark text-[15px] leading-[1.8]"
              style={{ color: "var(--text-secondary)" }}
            >
              {post.content.split("\n\n").map((paragraph, i) => {
                if (paragraph.startsWith("## ")) {
                  return <h2 key={i} className="text-[20px] font-bold mt-10 mb-4" style={{ color: "var(--text-primary)" }}>{paragraph.replace("## ", "")}</h2>;
                }
                if (paragraph.startsWith("### ")) {
                  return <h3 key={i} className="text-[16px] font-semibold mt-8 mb-3" style={{ color: "var(--text-primary)" }}>{paragraph.replace("### ", "")}</h3>;
                }
                if (paragraph.startsWith("- ")) {
                  return (
                    <ul key={i} className="ml-4 mb-4 space-y-1.5">
                      {paragraph.split("\n").map((line, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--accent-blue)" }} />
                          <span>{line.replace(/^- /, "")}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                return <p key={i} className="mb-5">{paragraph}</p>;
              })}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="py-10 px-6" style={{ borderTop: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <p className="text-[10px]" style={{ ...mono, color: "var(--text-tertiary)" }}>
            &copy; 2026 Axia Technologies
          </p>
          <Link href="/blog" className="text-[10px] uppercase tracking-[0.08em]" style={{ ...mono, color: "var(--text-tertiary)" }}>
            All Posts
          </Link>
        </div>
      </footer>
    </div>
  );
}
