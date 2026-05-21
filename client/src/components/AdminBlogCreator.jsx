import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Sparkles, Loader2, BookOpen, ExternalLink } from "lucide-react";
import { api } from "../lib/api";

export default function AdminBlogCreator({ blogs = [], onCreated, compact = false }) {
  const [blogTitle, setBlogTitle] = useState("");
  const [blogGenerating, setBlogGenerating] = useState(false);

  const createBlogWithAI = async (e) => {
    e.preventDefault();
    const title = blogTitle.trim();
    if (!title) {
      toast.error("Enter a blog title");
      return;
    }
    setBlogGenerating(true);
    try {
      const { data } = await api.post("/blogs/ai", { title });
      toast.success(`Blog published with AI (${data.aiProvider || "ai"})!`);
      setBlogTitle("");
      onCreated?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to generate blog");
    } finally {
      setBlogGenerating(false);
    }
  };

  return (
    <div className={`glass rounded-xl ${compact ? "p-5" : "p-6"} border border-violet-500/20`}>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className={`font-semibold flex items-center gap-2 ${compact ? "text-base" : "text-lg"}`}>
            <Sparkles size={18} className="text-violet-400" />
            Create blog with AI
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Type a title only — Groq AI writes the full article, excerpt, tags, and SEO, then publishes it live.
          </p>
        </div>
        <Link
          to="/blog"
          target="_blank"
          className="text-sm text-violet-400 flex items-center gap-1 hover:underline shrink-0"
        >
          <BookOpen size={14} /> View public blog <ExternalLink size={12} />
        </Link>
      </div>

      <form onSubmit={createBlogWithAI} className="flex flex-col sm:flex-row gap-3">
        <input
          placeholder="Blog title, e.g. Best Figma Plugins for 2026"
          value={blogTitle}
          onChange={(e) => setBlogTitle(e.target.value)}
          className="flex-1 bg-slate-800/60 border border-white/10 p-3 rounded-xl text-sm focus:border-violet-500/50 outline-none"
          disabled={blogGenerating}
          maxLength={200}
          required
        />
        <button
          type="submit"
          disabled={blogGenerating}
          className="btn-primary py-3 px-6 flex items-center justify-center gap-2 shrink-0 disabled:opacity-60 min-w-[180px]"
        >
          {blogGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Generate & Publish
            </>
          )}
        </button>
      </form>

      {!compact && blogs.length > 0 && (
        <p className="text-xs text-slate-500 mt-3">{blogs.length} post{blogs.length !== 1 ? "s" : ""} in library</p>
      )}
    </div>
  );
}
