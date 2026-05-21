import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ items = [] }) {
  if (!items.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1 text-sm text-slate-500 mb-6">
      <Link to="/" className="hover:text-violet-400 transition-colors flex items-center gap-1">
        <Home size={14} />
        <span className="sr-only sm:not-sr-only">Home</span>
      </Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight size={14} className="text-slate-600" />
          {item.href ? (
            <Link to={item.href} className="hover:text-violet-400 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-none">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
