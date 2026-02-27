"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, User } from "lucide-react";
import { AxiaLogo } from "@/components/ui/axia-logo";
import { api, mapBlogPost } from "@/lib/api";
import { BlogPost } from "@/lib/types";

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    api.getBlogPosts("published")
      .then((data: any[]) => setPosts(data.map(mapBlogPost)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="https://axia-crm.pages.dev" className="flex items-center gap-3">
            <AxiaLogo size={28} color="#0071E3" />
            <span className="text-[13px] font-semibold tracking-[0.2em] uppercase" style={{ ...mono, color: "var(--text-primary)" }}>
              AXIA
            </span>
          </a>
          <div className="flex items-center gap-4">
            <Link
              href="/blog/admin"
              className="text-[11px] uppercase tracking-[0.08em] px-4 py-2 transition-colors"
              style={{ ...mono, color: "var(--text-tertiary)" }}
            >
              Admin
            </Link>
            <Link
              href="/"
              className="text-[11px] uppercase tracking-[0.08em] px-5 py-2 text-white font-medium"
              style={{ ...mono, background: "var(--accent-blue)", borderRadius: "var(--radius-sm)" }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-12">
        <span className="text-[10px] uppercase tracking-[0.2em] mb-4 block" style={{ ...mono, color: "var(--accent-blue)" }}>
          Blog
        </span>
        <h1 className="text-[clamp(28px,4vw,44px)] font-bold tracking-[-0.02em] mb-3" style={{ color: "var(--text-primary)" }}>
          Insights & Updates
        </h1>
        <p className="text-[15px] max-w-xl" style={{ color: "var(--text-secondary)" }}>
          Product updates, best practices, and insights from the Axia team.
        </p>
      </div>

      {/* Divider */}
      <div style={{ borderTop: "1px solid var(--border-secondary)" }} />

      {/* Posts grid */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        {loading ? (
          <div className="text-center py-20">
            <p className="text-[12px]" style={{ ...mono, color: "var(--text-tertiary)" }}>Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[14px]" style={{ color: "var(--text-tertiary)" }}>No published posts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block transition-all duration-300"
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-primary)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(45,127,249,0.4)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(45,127,249,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-primary)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Cover image placeholder */}
                <div
                  className="w-full h-[180px] flex items-center justify-center"
                  style={{
                    background: "var(--bg-tertiary)",
                    borderBottom: "1px solid var(--border-secondary)",
                  }}
                >
                  {post.coverImage ? (
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                  ) : (
                    <AxiaLogo size={40} color="var(--border-primary)" />
                  )}
                </div>

                <div className="p-5">
                  {/* Meta */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={11} style={{ color: "var(--text-tertiary)" }} />
                      <span className="text-[10px]" style={{ ...mono, color: "var(--text-tertiary)" }}>
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Draft"}
                      </span>
                    </div>
                    {post.authorName && (
                      <div className="flex items-center gap-1.5">
                        <User size={11} style={{ color: "var(--text-tertiary)" }} />
                        <span className="text-[10px]" style={{ ...mono, color: "var(--text-tertiary)" }}>
                          {post.authorName}
                        </span>
                      </div>
                    )}
                  </div>

                  <h2 className="text-[15px] font-semibold mb-2 leading-snug" style={{ color: "var(--text-primary)" }}>
                    {post.title}
                  </h2>
                  <p className="text-[13px] leading-relaxed mb-4 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                    {post.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em]" style={{ ...mono, color: "var(--accent-blue)" }}>
                    Read More <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-10 px-6" style={{ borderTop: "1px solid var(--border-primary)", background: "var(--bg-secondary)" }}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-[10px]" style={{ ...mono, color: "var(--text-tertiary)" }}>
            &copy; 2026 Axia Technologies
          </p>
          <a href="https://axia-crm.pages.dev" className="text-[10px] uppercase tracking-[0.08em]" style={{ ...mono, color: "var(--text-tertiary)" }}>
            Back to Home
          </a>
        </div>
      </footer>
    </div>
  );
}
