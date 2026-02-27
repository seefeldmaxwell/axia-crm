"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/dashboard-layout";
import { api, mapBlogPost } from "@/lib/api";
import { BlogPost } from "@/lib/types";
import { Plus, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

export default function BlogAdminPage() {
  const { user, org } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const fetchPosts = () => {
    api.getBlogPosts()
      .then((data: any[]) => setPosts(data.map(mapBlogPost)))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user && org) fetchPosts();
  }, [user, org]);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setExcerpt("");
    setContent("");
    setStatus("draft");
    setEditing(null);
    setShowForm(false);
  };

  const editPost = (post: BlogPost) => {
    setEditing(post);
    setTitle(post.title);
    setSlug(post.slug);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setStatus(post.status);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    const autoSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const payload = {
      title,
      slug: autoSlug,
      excerpt,
      content,
      status,
      author_name: user?.name || "",
      author_id: user?.id || "",
    };

    if (editing) {
      await api.updateBlogPost(editing.id, payload);
    } else {
      await api.createBlogPost(payload);
    }
    resetForm();
    fetchPosts();
  };

  const deletePost = async (id: string) => {
    await api.deleteBlogPost(id);
    fetchPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    const newStatus = post.status === "published" ? "draft" : "published";
    await api.updateBlogPost(post.id, { status: newStatus });
    fetchPosts();
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[20px] font-bold" style={{ color: "var(--text-primary)" }}>Blog Admin</h1>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
              {posts.length} post{posts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/blog"
              target="_blank"
              className="flex items-center gap-1.5 text-[11px] px-3 py-2 uppercase tracking-[0.06em]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <ExternalLink size={12} /> View Blog
            </Link>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-1.5 text-[11px] px-4 py-2 text-white font-medium uppercase tracking-[0.06em]"
              style={{
                fontFamily: "var(--font-mono)",
                background: "var(--accent-blue)",
                borderRadius: "var(--radius-sm)",
                border: "none",
              }}
            >
              <Plus size={13} /> New Post
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div
            className="mb-6 p-5"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <h2 className="text-[14px] font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              {editing ? "Edit Post" : "New Post"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] mb-1 uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] outline-none"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Post title"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1 uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Slug</label>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] outline-none"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="auto-generated-from-title"
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1 uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Excerpt</label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-[13px] outline-none resize-none"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1 uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Content</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className="w-full px-3 py-2 text-[13px] outline-none resize-y"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-mono)",
                    lineHeight: 1.7,
                  }}
                  placeholder="Write your post content here. Use ## for headings, - for bullet points. Separate paragraphs with blank lines."
                />
              </div>

              <div>
                <label className="block text-[11px] mb-1 uppercase tracking-[0.06em]" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "draft" | "published")}
                  className="px-3 py-2 text-[13px] outline-none"
                  style={{
                    background: "var(--bg-primary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: "var(--radius-sm)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="text-[11px] px-5 py-2 text-white font-medium uppercase tracking-[0.06em]"
                  style={{ fontFamily: "var(--font-mono)", background: "var(--accent-blue)", borderRadius: "var(--radius-sm)", border: "none" }}
                >
                  {editing ? "Update" : "Create"} Post
                </button>
                <button
                  onClick={resetForm}
                  className="text-[11px] px-4 py-2 uppercase tracking-[0.06em]"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)", border: "1px solid var(--border-primary)", borderRadius: "var(--radius-sm)", background: "transparent" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Posts table */}
        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
          }}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-primary)" }}>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.08em] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Title</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.08em] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Slug</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.08em] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Status</th>
                <th className="text-left px-4 py-3 text-[10px] uppercase tracking-[0.08em] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Date</th>
                <th className="text-right px-4 py-3 text-[10px] uppercase tracking-[0.08em] font-medium" style={{ fontFamily: "var(--font-mono)", color: "var(--text-tertiary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--text-tertiary)" }}>Loading...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center" style={{ color: "var(--text-tertiary)" }}>No posts yet. Create your first post above.</td></tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} style={{ borderBottom: "1px solid var(--border-secondary)" }}>
                    <td className="px-4 py-3 font-medium" style={{ color: "var(--text-primary)" }}>{post.title}</td>
                    <td className="px-4 py-3" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>{post.slug}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.06em] px-2 py-1"
                        style={{
                          fontFamily: "var(--font-mono)",
                          borderRadius: "var(--radius-sm)",
                          background: post.status === "published" ? "var(--accent-green-muted)" : "var(--bg-tertiary)",
                          color: post.status === "published" ? "var(--accent-green)" : "var(--text-tertiary)",
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: post.status === "published" ? "var(--accent-green)" : "var(--text-tertiary)" }} />
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px]" style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
                      {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : new Date(post.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => togglePublish(post)}
                          title={post.status === "published" ? "Unpublish" : "Publish"}
                          className="p-1.5 transition-colors"
                          style={{ color: "var(--text-tertiary)", borderRadius: "var(--radius-sm)" }}
                        >
                          {post.status === "published" ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        <button
                          onClick={() => editPost(post)}
                          title="Edit"
                          className="p-1.5 transition-colors"
                          style={{ color: "var(--text-tertiary)", borderRadius: "var(--radius-sm)" }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          title="Delete"
                          className="p-1.5 transition-colors"
                          style={{ color: "var(--accent-red)", borderRadius: "var(--radius-sm)" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
