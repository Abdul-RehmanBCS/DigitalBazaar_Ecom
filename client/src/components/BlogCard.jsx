import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, User, ArrowRight } from "lucide-react";
import { blogCoverSrc } from "../lib/images";

function formatDate(d) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function BlogCard({ blog, featured = false }) {
  const [cover, setCover] = useState(blogCoverSrc(blog.slug, blog.coverImage));

  return (
    <Link
      to={`/blog/${blog.slug}`}
      className={`glass rounded-2xl overflow-hidden card-hover flex flex-col group border border-white/5 ${featured ? "md:flex-row md:items-stretch" : ""}`}
    >
      <div className={`relative overflow-hidden bg-slate-800/50 ${featured ? "md:w-2/5 aspect-[16/10] md:aspect-auto md:min-h-[220px]" : "aspect-[16/10]"}`}>
        <img
          src={cover}
          alt={blog.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          onError={() => setCover(blogCoverSrc(blog.slug, null))}
        />
        {blog.featured && (
          <span className="absolute top-3 left-3 text-xs px-2 py-1 rounded-full bg-violet-600/90 text-white font-medium">
            Featured
          </span>
        )}
      </div>
      <div className={`p-5 flex flex-col flex-1 ${featured ? "md:w-3/5" : ""}`}>
        <div className="flex flex-wrap gap-2 mb-2">
          {(blog.tags || []).slice(0, 2).map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">
              {t}
            </span>
          ))}
        </div>
        <h3 className={`font-bold text-white group-hover:text-violet-300 transition-colors ${featured ? "text-xl" : "text-base line-clamp-2"}`}>
          {blog.title}
        </h3>
        <p className="text-sm text-slate-400 mt-2 line-clamp-2 flex-1">{blog.excerpt}</p>
        <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <User size={12} /> {blog.author}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {blog.readTime} min
            </span>
          </div>
          <span>{formatDate(blog.createdAt)}</span>
        </div>
        <span className="inline-flex items-center gap-1 text-sm text-violet-400 mt-3 font-medium group-hover:gap-2 transition-all">
          Read more <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
}
