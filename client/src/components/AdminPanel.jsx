import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Users,
  ClipboardList,
  DollarSign,
  Package,
  MessageCircle,
  Eye,
  TrendingUp,
  ThumbsUp,
  Search,
  Trash2,
  BarChart3,
  Tag,
  ExternalLink,
  RefreshCw,
  Store,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { api } from "../lib/api";
import SEO from "./SEO";
import AdminBlogCreator from "./AdminBlogCreator";
import { resolveImageSrc } from "../lib/images";

function ProgressBar({ label, value, max, color = "bg-violet-500", href }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  const inner = (
    <>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400 truncate pr-2">{label}</span>
        <span className="text-slate-300 font-medium">{value}</span>
      </div>
      <div className="h-2 bg-slate-800/60 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </>
  );
  if (href) {
    return (
      <Link to={href} className="block hover:opacity-90 transition-opacity rounded-lg p-1 -m-1">
        {inner}
      </Link>
    );
  }
  return <div>{inner}</div>;
}

function MiniBars({ data, valueKey = "count", labelKey = "_id", color = "bg-violet-500" }) {
  if (!data?.length) return <p className="text-sm text-slate-500">No data yet.</p>;
  const max = Math.max(...data.map((d) => d[valueKey] || 0), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d) => (
        <div key={d[labelKey]} className="flex-1 flex flex-col items-center gap-1 min-w-0">
          <div
            className={`w-full ${color} rounded-t opacity-80`}
            style={{ height: `${((d[valueKey] || 0) / max) * 100}%`, minHeight: d[valueKey] ? "4px" : 0 }}
            title={`${d[labelKey]}: ${d[valueKey]}`}
          />
          <span className="text-[9px] text-slate-500 truncate w-full text-center">{String(d[labelKey]).slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "chat", label: "Chat", icon: MessageCircle },
  { id: "traffic", label: "Traffic", icon: Eye },
  { id: "seo", label: "SEO", icon: Search },
  { id: "catalog", label: "Catalog", icon: Package },
  { id: "blogs", label: "Blogs", icon: BookOpen }
];

const KPI_TAB = {
  Users: "catalog",
  Orders: "catalog",
  Revenue: "overview",
  Products: "catalog",
  Chats: "chat",
  "Views (7d)": "traffic",
  Blogs: "blogs"
};

const TAB_IDS = TABS.map((t) => t.id);

export default function AdminPanel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TAB_IDS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "overview";
  const [tab, setTab] = useState(initialTab);
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    category: "",
    digitalFileURL: "",
    metaTitle: "",
    metaDescription: "",
    tags: "",
    metaKeywords: ""
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    const [statsRes, ordersRes, usersRes, productsRes, catsRes, blogsRes] = await Promise.allSettled([
      api.get("/analytics/admin/full-stats"),
      api.get("/orders"),
      api.get("/users"),
      api.get("/products?limit=100"),
      api.get("/categories"),
      api.get("/blogs/admin/all")
    ]);

    if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
    else setStats({});

    if (ordersRes.status === "fulfilled") setOrders(ordersRes.value.data);
    if (usersRes.status === "fulfilled") setUsers(usersRes.value.data);
    if (productsRes.status === "fulfilled") setProducts(productsRes.value.data.items || []);
    if (catsRes.status === "fulfilled") setCategories(catsRes.value.data);
    if (blogsRes.status === "fulfilled") setBlogs(blogsRes.value.data.items || []);

    const failed = [statsRes, ordersRes, usersRes, productsRes, catsRes, blogsRes].filter((r) => r.status === "rejected");
    if (failed.length === 6) toast.error("Failed to load admin data — is the server running?");
    else if (failed.length > 0 && !quiet) toast.error("Some admin sections failed to load");

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const urlTab = searchParams.get("tab");
    if (urlTab && TAB_IDS.includes(urlTab) && urlTab !== tab) setTab(urlTab);
  }, [searchParams]);

  const switchTab = (id) => {
    setTab(id);
    setSearchParams(id === "overview" ? {} : { tab: id }, { replace: true });
  };

  const createProduct = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });
      imageFiles.forEach((f) => fd.append("images", f));
      await api.post("/products", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Product created!");
      setForm({ title: "", description: "", price: "", category: "", digitalFileURL: "", metaTitle: "", metaDescription: "", tags: "", metaKeywords: "" });
      setImageFiles([]);
      load(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create product");
    }
  };

  const confirmDelete = (label, action) => {
    if (window.confirm(`Delete ${label}? This cannot be undone.`)) action();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats || {};
  const chatMax = Math.max(...(s.chatCategoryBreakdown || []).map((c) => c.count), 1);

  return (
    <div className="animate-fade-in-up">
      <SEO title="Admin Dashboard" description="Digital Bazaar admin panel." noindex />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage store, analytics, and content</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => load(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
          </button>
          <Link to="/" target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-lg border border-violet-500/30 text-violet-300 text-sm hover:bg-violet-500/10">
            <Store size={14} /> View store
          </Link>
          <button
            type="button"
            onClick={() => switchTab("blogs")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600/30 border border-violet-500/40 text-violet-200 text-sm hover:bg-violet-600/40"
          >
            <BookOpen size={14} /> Create Blog (AI)
          </button>
          <Link to="/products" target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary text-sm">
            <ExternalLink size={14} /> Products page
          </Link>
        </div>
      </div>

      <AdminBlogCreator blogs={blogs} onCreated={() => load(true)} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6 mt-6">
        {[
          { label: "Users", value: s.totalUsers, icon: Users, color: "text-blue-400" },
          { label: "Orders", value: s.totalOrders, icon: ClipboardList, color: "text-green-400" },
          { label: "Revenue", value: `$${Number(s.totalRevenue || 0).toFixed(0)}`, icon: DollarSign, color: "text-violet-400" },
          { label: "Products", value: s.totalProducts, icon: Package, color: "text-amber-400" },
          { label: "Blogs", value: blogs.length, icon: BookOpen, color: "text-indigo-400" },
          { label: "Chats", value: s.totalChats, icon: MessageCircle, color: "text-pink-400" },
          { label: "Views (7d)", value: s.pageViewsWeek, icon: Eye, color: "text-cyan-400" }
        ].map((card) => (
          <button
            key={card.label}
            type="button"
            onClick={() => switchTab(KPI_TAB[card.label] || "overview")}
            className="glass rounded-xl p-4 text-left card-hover hover:border-violet-500/30 border border-transparent transition-all"
          >
            <card.icon size={18} className={`${card.color} mb-2`} />
            <p className="text-xs text-slate-400">{card.label}</p>
            <p className="text-xl font-bold mt-0.5">{card.value ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => switchTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t.id ? "bg-violet-600/20 text-violet-300 border border-violet-500/30" : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-violet-400" /> Revenue (30 days)
              </h3>
              <MiniBars data={s.dailyRevenue} valueKey="revenue" labelKey="_id" color="bg-green-500" />
            </div>
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-3">Today&apos;s activity</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Orders today", value: s.todayOrders, color: "text-green-400" },
                  { label: "Chats today", value: s.todayChats, color: "text-pink-400" },
                  { label: "Views today", value: s.pageViewsToday, color: "text-cyan-400" },
                  { label: "Orders (7d)", value: s.weekOrders, color: "text-white" }
                ].map((box) => (
                  <button
                    key={box.label}
                    type="button"
                    onClick={() => setTab(box.label.includes("Chat") ? "chat" : box.label.includes("View") ? "traffic" : "catalog")}
                    className="bg-slate-800/40 rounded-lg p-3 text-left hover:bg-slate-800/70 transition-colors"
                  >
                    <p className="text-slate-400">{box.label}</p>
                    <p className={`text-2xl font-bold ${box.color}`}>{box.value ?? 0}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-5">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Recent Orders</h3>
              <button type="button" onClick={() => setTab("catalog")} className="text-xs text-violet-400 hover:underline flex items-center gap-1">
                Manage orders <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {(s.recentOrders || []).map((o) => (
                <div key={o._id} className="flex justify-between items-center p-3 rounded-lg bg-slate-800/30 border border-white/5 text-sm hover:border-violet-500/20 transition-colors">
                  <span className="truncate">{o.userId?.email || "Guest"}</span>
                  <span className="gradient-text font-semibold mx-2">${o.totalAmount}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${o.orderStatus === "completed" ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"}`}>
                    {o.orderStatus}
                  </span>
                </div>
              ))}
              {!s.recentOrders?.length && <p className="text-slate-500 text-sm">No orders yet.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "chat" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-4 gap-3">
            {[
              { label: "Total messages", value: s.totalChats },
              { label: "This week", value: s.weekChats },
              { label: "Unique sessions", value: s.uniqueChatSessions },
              { label: "Helpful rate", value: s.chatHelpfulRate != null ? `${s.chatHelpfulRate}%` : "—" }
            ].map((c) => (
              <div key={c.label} className="glass rounded-xl p-4">
                <p className="text-xs text-slate-400">{c.label}</p>
                <p className="text-2xl font-bold mt-1">{c.value ?? 0}</p>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-4">Chats by category</h3>
              <div className="space-y-3">
                {(s.chatCategoryBreakdown || []).map((c) => (
                  <ProgressBar key={c._id} label={c._id || "general"} value={c.count} max={chatMax} color="bg-pink-500" />
                ))}
              </div>
            </div>
            <div className="glass rounded-xl p-5">
              <h3 className="font-semibold mb-3">Daily chats (7 days)</h3>
              <MiniBars data={s.chatDaily} color="bg-pink-500" />
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold mb-4">Recent conversations</h3>
            <div className="space-y-3 max-h-96 overflow-auto">
              {(s.recentChats || []).map((c) => (
                <div key={c._id} className="p-3 rounded-lg bg-slate-800/30 border border-white/5 text-sm">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span className="badge">{c.category || "general"}</span>
                    <span>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-violet-300/90"><span className="text-slate-500">Q:</span> {c.userMessage}</p>
                  <p className="text-slate-300 mt-1"><span className="text-slate-500">A:</span> {c.botResponse}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "traffic" && (
        <div className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass rounded-xl p-5">
              <p className="text-sm text-slate-400">Page views (7 days)</p>
              <p className="text-3xl font-bold gradient-text">{s.pageViewsWeek}</p>
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-sm text-slate-400">Page views today</p>
              <p className="text-3xl font-bold">{s.pageViewsToday}</p>
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold mb-4">Top pages — click to open</h3>
            <div className="space-y-2">
              {(s.pageViewsByPath || []).map((p) => {
                const path = p._id?.startsWith("/") ? p._id : `/${p._id || ""}`;
                return (
                  <ProgressBar
                    key={p._id}
                    label={path}
                    value={p.count}
                    max={s.pageViewsByPath?.[0]?.count || 1}
                    color="bg-cyan-500"
                    href={path}
                  />
                );
              })}
              {!s.pageViewsByPath?.length && <p className="text-sm text-slate-500">Browse the storefront to collect traffic data.</p>}
            </div>
          </div>
        </div>
      )}

      {tab === "seo" && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Tag size={16} className="text-violet-400" /> Product SEO ({s.seoHealth?.totalProducts || 0} products)
            </h3>
            <div className="space-y-4">
              <ProgressBar label="Meta titles" value={s.seoHealth?.withMetaTitle || 0} max={s.seoHealth?.totalProducts || 1} />
              <ProgressBar label="Meta descriptions" value={s.seoHealth?.withMetaDesc || 0} max={s.seoHealth?.totalProducts || 1} color="bg-green-500" />
              <ProgressBar label="Meta keywords" value={s.seoHealth?.withKeywords || 0} max={s.seoHealth?.totalProducts || 1} color="bg-amber-500" />
            </div>
            <Link to="/products" target="_blank" className="inline-flex items-center gap-1 text-sm text-violet-400 mt-4 hover:underline">
              Preview storefront SEO <ExternalLink size={12} />
            </Link>
          </div>
          <div className="glass rounded-xl p-5">
            <h3 className="font-semibold mb-2">Top sellers</h3>
            <div className="space-y-2">
              {(s.topProducts || []).map((p, i) => (
                <div key={i} className="flex justify-between text-sm p-2 rounded bg-slate-800/30 hover:bg-slate-800/50">
                  <span>{p.title || "Unknown"}</span>
                  <span className="text-slate-400">{p.sold} sold · ${Number(p.revenue || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "blogs" && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Blog posts ({blogs.length})</h2>
              <Link to="/blog" target="_blank" className="text-sm text-violet-400 flex items-center gap-1 hover:underline">
                View blog <ExternalLink size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {blogs.length === 0 && <p className="text-sm text-slate-500">No blogs yet. Create one with AI above.</p>}
              {blogs.map((b) => (
                <div key={b._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-white/5 hover:border-violet-500/30 transition-all group gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{b.title}</p>
                    <p className="text-xs text-slate-400 truncate">{b.excerpt}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{b.readTime} min · {b.author}</p>
                  </div>
                  <Link
                    to={`/blog/${b.slug}`}
                    target="_blank"
                    className="flex items-center gap-1 text-xs text-violet-400 px-3 py-1.5 rounded-lg hover:bg-violet-500/10 shrink-0"
                  >
                    Read <ExternalLink size={12} />
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      confirmDelete(b.title, async () => {
                        await api.delete(`/blogs/${b._id}`);
                        toast.success("Blog deleted");
                        load(true);
                      })
                    }
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 shrink-0"
                    title="Delete blog"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "catalog" && (
        <div className="space-y-6">
          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Create Product</h2>
            <form onSubmit={createProduct} className="grid sm:grid-cols-3 gap-3">
              <input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm" required />
              <input placeholder="Description *" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm sm:col-span-2" required />
              <input placeholder="Price *" type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm" required />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm">
                <option value="">Category</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <input placeholder="Digital File URL *" value={form.digitalFileURL} onChange={(e) => setForm({ ...form, digitalFileURL: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm" required />
              <input placeholder="Tags (comma)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm" />
              <input placeholder="SEO Meta Title" value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm" />
              <input placeholder="SEO Meta Description" value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm sm:col-span-2" />
              <input placeholder="SEO Keywords (comma)" value={form.metaKeywords} onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm" />
              <input type="file" accept="image/*" multiple onChange={(e) => setImageFiles(Array.from(e.target.files))} className="bg-slate-800/60 border border-white/10 p-2.5 rounded-lg text-sm" />
              <button type="submit" className="btn-primary py-2.5 sm:col-span-2 cursor-pointer">Create Product</button>
            </form>
          </div>

          <div className="glass rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4">Products ({products.length})</h2>
            <div className="space-y-2">
              {products.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-white/5 hover:border-violet-500/25 transition-all gap-3">
                  <Link to={`/products/${p.slug}`} target="_blank" className="flex items-center gap-3 min-w-0 flex-1 group">
                    <img src={resolveImageSrc(p.images?.[0], p.slug)} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm group-hover:text-violet-300 truncate">{p.title}</p>
                      <p className="text-xs text-slate-400">
                        ${p.price} · {p.category?.name || "N/A"} · {p.metaTitle ? "SEO ✓" : "SEO ✗"}
                      </p>
                    </div>
                    <ExternalLink size={14} className="text-slate-500 group-hover:text-violet-400 shrink-0" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => confirmDelete(p.title, async () => { await api.delete(`/products/${p._id}`); toast.success("Deleted"); load(true); })}
                    className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 shrink-0"
                    title="Delete product"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h2 className="font-semibold text-lg mb-4">Orders ({orders.length})</h2>
              <div className="space-y-2 max-h-80 overflow-auto">
                {orders.map((o) => (
                  <div key={o._id} className="p-3 rounded-lg bg-slate-800/30 border border-white/5 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate">{o.userId?.email || "N/A"}</span>
                      <span className="gradient-text font-semibold">${o.totalAmount}</span>
                    </div>
                    <select
                      value={o.orderStatus}
                      onChange={async (e) => {
                        await api.put(`/orders/${o._id}`, { orderStatus: e.target.value });
                        toast.success("Order updated");
                        load(true);
                      }}
                      className="w-full bg-slate-800/60 border border-white/10 p-2 rounded-lg text-xs cursor-pointer"
                    >
                      <option>processing</option>
                      <option>completed</option>
                      <option>delivered</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass rounded-xl p-6">
              <h2 className="font-semibold text-lg mb-4">Users ({users.length})</h2>
              <div className="space-y-2 max-h-80 overflow-auto">
                {users.map((u) => (
                  <div key={u._id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-white/5">
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email} · <span className={u.role === "admin" ? "text-violet-400" : ""}>{u.role}</span></p>
                    </div>
                    {u.role !== "admin" && (
                      <button
                        type="button"
                        onClick={() => confirmDelete(u.email, async () => { await api.delete(`/users/${u._id}`); toast.success("User removed"); load(true); })}
                        className="text-red-400 hover:bg-red-500/10 p-2 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
