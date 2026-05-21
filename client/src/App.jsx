import { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams, Link, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import toast from "react-hot-toast";
import { ShoppingCart, Heart, Trash2, CreditCard, Search, Tag, ArrowRight, Star, Sparkles, Package, ClipboardList, BookOpen, Clock, User, SlidersHorizontal, X } from "lucide-react";
import Layout from "./components/Layout";
import SEO from "./components/SEO";
import Breadcrumbs from "./components/Breadcrumbs";
import AdminPanel from "./components/AdminPanel";
import ProductCard from "./components/ProductCard";
import BlogCard from "./components/BlogCard";
import { resolveImageSrc, blogCoverSrc } from "./lib/images";
import GoogleSignInButton from "./components/GoogleSignInButton";
import { trackEvent } from "./hooks/usePageTracking";
import { api } from "./lib/api";
import { setCredentials } from "./store/slices/authSlice";
import { addToCart, clearCart, removeFromCart, toggleWishlist, updateCartQty } from "./store/slices/shopSlice";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY?.trim();
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

const Protected = ({ children }) =>
  useSelector((s) => s.auth.user) ? children : <Navigate to="/login" replace />;
const AdminOnly = ({ children }) =>
  useSelector((s) => s.auth.user?.role) === "admin" ? children : <Navigate to="/" replace />;

/* ─── Home ─── */
function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [blogs, setBlogs] = useState([]);
  useEffect(() => {
    api.get("/products?limit=4").then((r) => setProducts(r.data.items));
    api.get("/categories").then((r) => setCategories(r.data));
    api
      .get("/blogs?limit=3&featured=true")
      .then((r) => {
        if (r.data.items?.length) setBlogs(r.data.items);
        else return api.get("/blogs?limit=3").then((r2) => setBlogs(r2.data.items));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in-up">
      <SEO
        title="Digital Bazaar | Premium Digital Products"
        description="Shop premium digital products: UI kits, templates, ebooks, source code bundles, and AI prompts. Instant download after purchase."
        keywords="digital products, templates, ui kits, ebooks, source code, marketplace"
      />
      {/* Hero */}
      <div className="text-center py-12 mb-8">
        <div className="inline-flex items-center gap-2 badge mb-4"><Sparkles size={14} /> Premium Digital Marketplace</div>
        <h1 className="text-4xl md:text-5xl font-extrabold gradient-text leading-tight">Discover Premium<br />Digital Products</h1>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto text-lg">UI kits, templates, ebooks, source code bundles, and AI prompts crafted by experts.</p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Link to="/products" className="inline-flex items-center gap-2 btn-primary px-6 py-3">Browse Products <ArrowRight size={16} /></Link>
          <Link to="/blog" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/10 hover:border-violet-500/40 text-slate-200 hover:text-white transition-all">
            Read Blog <BookOpen size={16} />
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-slate-500">
          <span>✓ Instant download</span>
          <span>✓ Secure Stripe checkout</span>
          <span>✓ Lifetime access</span>
        </div>
      </div>
      {/* Featured */}
      <h2 className="text-2xl font-bold mb-5 flex items-center gap-2"><Star size={20} className="text-violet-400" /> Featured Products</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{products.map((p) => <ProductCard key={p._id} product={p} />)}</div>
      {/* Blog */}
      {blogs.length > 0 && (
        <>
          <div className="flex items-center justify-between mt-12 mb-5">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen size={20} className="text-violet-400" /> From the Blog
            </h2>
            <Link to="/blog" className="text-sm text-violet-400 hover:text-violet-300 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-5">{blogs.map((b) => <BlogCard key={b._id} blog={b} />)}</div>
        </>
      )}

      {/* Categories */}
      <h2 className="text-2xl font-bold mt-12 mb-5 flex items-center gap-2"><Tag size={20} className="text-violet-400" /> Categories</h2>
      <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((c) => (
          <Link
            key={c._id}
            to={`/products?category=${c._id}`}
            className="glass rounded-xl p-4 text-center card-hover block hover:border-violet-500/30 border border-transparent transition-all"
          >
            <p className="font-semibold text-white">{c.name}</p>
            {c.description && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{c.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ─── Products ─── */
function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const featuredOnly = searchParams.get("featured") === "true";

  useEffect(() => {
    api.get("/categories").then((r) => setCategories(r.data));
    api.get("/products?featured=true&limit=4").then((r) => setFeatured(r.data.items)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const sortParam = sort === "price-asc" ? "price-asc" : sort === "price-desc" ? "price-desc" : sort === "title" ? "title" : "";
    const q = new URLSearchParams({ page, limit: 12 });
    if (search) q.set("search", search);
    if (category) q.set("category", category);
    if (sortParam) q.set("sort", sortParam);
    if (minPrice) q.set("minPrice", minPrice);
    if (maxPrice) q.set("maxPrice", maxPrice);
    if (featuredOnly) q.set("featured", "true");

    api.get(`/products?${q}`).then((r) => {
      setItems(r.data.items);
      setTotal(r.data.total);
      setPages(r.data.pages);
      setLoading(false);
    });
    if (search) trackEvent("search", { query: search });
  }, [page, search, category, sort, minPrice, maxPrice, featuredOnly]);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort, minPrice, maxPrice, featuredOnly]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setSearchParams(next);
    setPage(1);
  };

  const clearFilters = () => {
    setSearchParams({});
    setPage(1);
  };

  const activeCategory = categories.find((c) => c._id === category);

  return (
    <div className="animate-fade-in-up">
      <SEO
        title={activeCategory ? `${activeCategory.name} Products` : "Browse Products"}
        description="Browse and search premium digital products. Filter by category, sort by price, and add to cart instantly."
        keywords="digital products, templates, ui kits, ebooks, source code, prompts"
        breadcrumbs={[{ label: "Products", href: "/products" }, ...(activeCategory ? [{ label: activeCategory.name }] : [])]}
        itemList={items.slice(0, 12).map((p) => ({
          name: p.title,
          url: `${window.location.origin}/products/${p.slug}`
        }))}
      />
      <Breadcrumbs items={[{ label: "Products", href: "/products" }, ...(activeCategory ? [{ label: activeCategory.name }] : [])]} />

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold gradient-text">
            {featuredOnly ? "Featured Products" : activeCategory ? activeCategory.name : "All Products"}
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            {loading ? "Loading..." : `${total} product${total !== 1 ? "s" : ""} available`}
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="w-full bg-slate-800/50 border border-white/10 pl-11 pr-4 py-3 rounded-xl text-sm placeholder:text-slate-500"
            placeholder="Search by name, tag..."
            value={search}
            onChange={(e) => updateParam("search", e.target.value)}
          />
        </div>
      </div>

      {featured.length > 0 && !category && !search && !featuredOnly && page === 1 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star size={18} className="text-amber-400" /> Featured
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}

      <div className="glass rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <SlidersHorizontal size={16} className="text-violet-400" />
          Filters
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => updateParam("category", "")}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${!category ? "bg-violet-600/20 border-violet-500/40 text-violet-300" : "border-white/10 text-slate-400 hover:border-violet-500/30"}`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c._id}
              type="button"
              onClick={() => updateParam("category", c._id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${category === c._id ? "bg-violet-600/20 border-violet-500/40 text-violet-300" : "border-white/10 text-slate-400 hover:border-violet-500/30"}`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={sort}
            onChange={(e) => updateParam("sort", e.target.value)}
            className="bg-slate-800/60 border border-white/10 px-3 py-2 rounded-lg text-sm"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="title">Name A–Z</option>
          </select>
          <input
            type="number"
            placeholder="Min $"
            className="w-20 bg-slate-800/60 border border-white/10 px-2 py-2 rounded-lg text-sm"
            value={minPrice}
            onChange={(e) => updateParam("minPrice", e.target.value)}
          />
          <input
            type="number"
            placeholder="Max $"
            className="w-20 bg-slate-800/60 border border-white/10 px-2 py-2 rounded-lg text-sm"
            value={maxPrice}
            onChange={(e) => updateParam("maxPrice", e.target.value)}
          />
          {(category || search || minPrice || maxPrice || sort !== "newest") && (
            <button type="button" onClick={clearFilters} className="text-xs text-red-400 flex items-center gap-1 hover:text-red-300">
              <X size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-slate-800/40 aspect-[4/5] animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <Package size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No products match your filters.</p>
          <button type="button" onClick={clearFilters} className="btn-primary px-6 py-2.5 mt-4">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex gap-2 mt-8 justify-center flex-wrap">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${page === i + 1 ? "btn-primary" : "bg-slate-800/50 border border-white/10 hover:border-violet-500/30"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Product Detail ─── */
function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const dispatch = useDispatch();
  useEffect(() => {
    api.get(`/products/${slug}`).then((r) => {
      setProduct(r.data);
      trackEvent("product_view", { slug: r.data.slug, title: r.data.title });
    });
  }, [slug]);
  if (!product) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const imgSrc = resolveImageSrc(product.images?.[0], product.slug);
  const productUrl = `${window.location.origin}/products/${product.slug}`;
  const crumbItems = [
    { label: "Products", href: "/products" },
    ...(product.category?.name ? [{ label: product.category.name, href: `/products?category=${product.category._id}` }] : []),
    { label: product.title }
  ];

  return (
    <div className="animate-fade-in-up">
      <SEO
        title={product.metaTitle || product.title}
        description={product.metaDescription || product.description?.slice(0, 160)}
        keywords={(product.metaKeywords || product.tags || []).join(", ")}
        image={imgSrc}
        type="product"
        url={productUrl}
        price={product.price}
        breadcrumbs={crumbItems.filter((c) => c.href)}
      />
      <Breadcrumbs items={crumbItems} />
      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-2xl overflow-hidden bg-slate-800/30 border border-white/5 aspect-square">
          <img src={imgSrc} alt={product.title} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap gap-2 mb-3">
            {product.featured && <span className="badge flex items-center gap-1"><Star size={12} /> Featured</span>}
            {product.category?.name && (
              <Link to={`/products?category=${product.category._id}`} className="badge hover:bg-violet-500/20 transition-colors">
                {product.category.name}
              </Link>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">{product.title}</h1>
          <p className="text-slate-400 mt-3 leading-relaxed">{product.description}</p>
          {product.tags?.length > 0 && <div className="flex flex-wrap gap-2 mt-4">{product.tags.map((t) => <span key={t} className="text-xs px-2 py-1 rounded-md bg-slate-800/60 text-slate-400 border border-white/5">{t}</span>)}</div>}
          <p className="text-3xl font-bold gradient-text mt-6">${product.price}</p>
          <div className="flex gap-3 mt-6">
            <button className="btn-primary px-6 py-3 flex items-center gap-2" onClick={() => { dispatch(addToCart({ productId: product._id, title: product.title, price: product.price, image: product.images?.[0], quantity: 1 })); trackEvent("add_to_cart", { productId: product._id, title: product.title }); toast.success("Added to cart!"); }}>
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <button className="px-6 py-3 rounded-lg border border-white/10 hover:border-violet-500/30 text-slate-300 hover:text-violet-400 transition-all flex items-center gap-2" onClick={() => { dispatch(toggleWishlist(product._id)); toast.success("Wishlist updated!"); }}>
              <Heart size={18} /> Wishlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Cart ─── */
function Cart() {
  const { cart } = useSelector((s) => s.shop);
  const dispatch = useDispatch();
  const total = useMemo(() => cart.reduce((a, b) => a + b.price * b.quantity, 0), [cart]);

  return (
    <div className="animate-fade-in-up max-w-3xl mx-auto">
      <SEO title="Shopping Cart" description="Your Digital Bazaar cart." noindex />
      <h1 className="text-3xl font-bold gradient-text mb-6">Shopping Cart</h1>
      {cart.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <ShoppingCart size={48} className="text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Your cart is empty.</p>
          <Link to="/products" className="inline-flex items-center gap-2 btn-primary px-6 py-3 mt-4">Browse Products <ArrowRight size={16} /></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {cart.map((i) => (
            <div key={i.productId} className="glass rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {i.image && <img src={resolveImageSrc(i.image, i.slug || i.productId)} alt={i.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />}
                <div className="min-w-0">
                  {i.slug ? (
                    <Link to={`/products/${i.slug}`} className="font-medium truncate block hover:text-violet-300">{i.title}</Link>
                  ) : (
                    <p className="font-medium truncate">{i.title}</p>
                  )}
                  <p className="text-sm text-violet-400 font-semibold">${i.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="number" min={1} className="w-16 bg-slate-800/60 border border-white/10 p-2 rounded-lg text-center text-sm" value={i.quantity} onChange={(e) => dispatch(updateCartQty({ productId: i.productId, quantity: Number(e.target.value) }))} />
                <button className="text-red-400 hover:text-red-300 transition-colors p-2" onClick={() => dispatch(removeFromCart(i.productId))}><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
          <div className="glass rounded-xl p-5 mt-4 flex items-center justify-between">
            <p className="text-xl font-bold">Total: <span className="gradient-text">${total.toFixed(2)}</span></p>
            <Link className="btn-primary px-6 py-3 flex items-center gap-2" to="/checkout"><CreditCard size={18} /> Checkout</Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Checkout ─── */
function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { cart } = useSelector((s) => s.shop);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const total = cart.reduce((a, b) => a + b.price * b.quantity, 0);
  const pay = async () => {
    if (!stripe || !elements) return;
    trackEvent("checkout", { amount: total });
    try {
      const { data } = await api.post("/payments/create-payment-intent", { amount: total });
      const result = await stripe.confirmCardPayment(data.clientSecret, { payment_method: { card: elements.getElement(CardElement) } });
      if (result.error) return toast.error(result.error.message);
      await api.post("/orders", { products: cart.map((c) => ({ product: c.productId, quantity: c.quantity, price: c.price })), totalAmount: total, transactionId: result.paymentIntent.id, paymentStatus: "paid" });
      dispatch(clearCart());
      toast.success("Payment successful!");
      navigate("/dashboard");
    } catch (err) { toast.error(err.response?.data?.message || "Payment failed"); }
  };
  return (
    <div className="animate-fade-in-up max-w-lg mx-auto">
      <SEO title="Checkout" description="Secure checkout for digital products." noindex />
      <h1 className="text-3xl font-bold gradient-text mb-6">Checkout</h1>
      <div className="glass rounded-2xl p-6 space-y-4">
        <p className="text-lg">Total: <span className="font-bold gradient-text">${total.toFixed(2)}</span></p>
        <div className="p-4 border border-white/10 rounded-xl bg-slate-800/30"><CardElement options={{ style: { base: { color: "#e2e8f0", fontSize: "16px", "::placeholder": { color: "#64748b" } } } }} /></div>
        <button className="btn-primary w-full py-3 flex items-center justify-center gap-2" onClick={pay}><CreditCard size={18} /> Pay ${total.toFixed(2)}</button>
      </div>
    </div>
  );
}
function Checkout() {
  if (!stripePromise) {
    return (
      <div className="max-w-lg mx-auto card p-6 text-center text-slate-300">
        Checkout is unavailable — set VITE_STRIPE_PUBLIC_KEY on Render and redeploy the web service.
      </div>
    );
  }
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}

/* ─── Auth ─── */
function Auth({ mode }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post(mode === "signup" ? "/auth/register" : "/auth/login", form);
      dispatch(setCredentials({ user: { _id: data._id, name: data.name, email: data.email, role: data.role }, token: data.token }));
      toast.success("Welcome!");
      navigate("/");
    } catch (err) { toast.error(err.response?.data?.message || "Authentication failed"); }
  };
  return (
    <div className="animate-fade-in-up max-w-md mx-auto">
      <SEO title={mode === "signup" ? "Sign Up" : "Login"} description="Access your Digital Bazaar account." noindex />
      <div className="glass rounded-2xl p-8">
        <h1 className="text-2xl font-bold gradient-text text-center mb-6">{mode === "signup" ? "Create Account" : "Welcome Back"}</h1>
        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && <input className="w-full bg-slate-800/60 border border-white/10 p-3 rounded-xl text-sm" placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />}
          <input className="w-full bg-slate-800/60 border border-white/10 p-3 rounded-xl text-sm" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input type="password" className="w-full bg-slate-800/60 border border-white/10 p-3 rounded-xl text-sm" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <button className="btn-primary w-full py-3">{mode === "signup" ? "Create Account" : "Login"}</button>
        </form>
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-slate-500 uppercase tracking-wide">or</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
        <GoogleSignInButton />
        <p className="text-sm text-slate-400 text-center mt-4">
          {mode === "signup" ? <>Have an account? <Link to="/login" className="text-violet-400 hover:underline">Login</Link></> : <>New here? <Link to="/signup" className="text-violet-400 hover:underline">Signup</Link></>}
        </p>
      </div>
    </div>
  );
}

/* ─── Dashboard ─── */
function Dashboard() {
  const [orders, setOrders] = useState([]);
  const { wishlist } = useSelector((s) => s.shop);
  const { user } = useSelector((s) => s.auth);
  useEffect(() => { api.get("/orders/mine").then((r) => setOrders(r.data)); }, []);
  return (
    <div className="animate-fade-in-up">
      <h1 className="text-3xl font-bold gradient-text mb-6">Dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="glass rounded-xl p-5"><p className="text-sm text-slate-400">Welcome</p><p className="text-lg font-semibold mt-1">{user?.name}</p></div>
        <div className="glass rounded-xl p-5"><p className="text-sm text-slate-400">Orders</p><p className="text-lg font-semibold mt-1">{orders.length}</p></div>
        <div className="glass rounded-xl p-5"><p className="text-sm text-slate-400">Wishlist</p><p className="text-lg font-semibold mt-1">{wishlist.length} items</p></div>
      </div>
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><ClipboardList size={20} className="text-violet-400" /> Order History</h2>
      {orders.length === 0 ? (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-slate-400">No orders yet.</p>
          <Link to="/products" className="inline-flex items-center gap-2 btn-primary px-5 py-2.5 mt-4 text-sm">Start shopping <ArrowRight size={14} /></Link>
        </div>
      ) : (
        <div className="space-y-3">{orders.map((o) => (
          <div key={o._id} className="glass rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div><p className="font-medium">Order #{o._id.slice(-6).toUpperCase()}</p><p className="text-sm text-slate-400">{new Date(o.createdAt).toLocaleDateString()} · {o.products?.length || 0} items</p></div>
            <div className="text-right"><p className="font-semibold gradient-text">${o.totalAmount}</p><span className={`text-xs px-2 py-0.5 rounded-full ${o.orderStatus === "completed" ? "bg-green-500/10 text-green-400" : o.orderStatus === "delivered" ? "bg-blue-500/10 text-blue-400" : "bg-yellow-500/10 text-yellow-400"}`}>{o.orderStatus}</span></div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

/* ─── Blog list ─── */
function Blogs() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    api.get(`/blogs?page=${page}&search=${encodeURIComponent(search)}`).then((r) => {
      setItems(r.data.items);
      setPages(r.data.pages);
    });
  }, [page, search]);

  const featured = items.find((b) => b.featured);

  return (
    <div className="animate-fade-in-up">
      <SEO
        title="Blog"
        description="Tips on UI design, digital products, AI prompts, SaaS development, and growing your creator business."
        keywords="digital products blog, ui kits, templates, saas, design tips"
        breadcrumbs={[{ label: "Blog" }]}
      />
      <Breadcrumbs items={[{ label: "Blog" }]} />
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 badge mb-3"><BookOpen size={14} /> Insights & Guides</div>
        <h1 className="text-3xl md:text-4xl font-bold gradient-text">Digital Bazaar Blog</h1>
        <p className="text-slate-400 mt-3 max-w-lg mx-auto">Expert articles on design, development, pricing, and selling digital products.</p>
      </div>

      <div className="relative mb-8 max-w-md mx-auto">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="w-full bg-slate-800/50 border border-white/10 pl-11 pr-4 py-3 rounded-xl text-sm placeholder:text-slate-500"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {featured && page === 1 && !search && (
        <div className="mb-8">
          <BlogCard blog={featured} featured />
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.filter((b) => !(featured && page === 1 && !search && b._id === featured._id)).map((b) => (
          <BlogCard key={b._id} blog={b} />
        ))}
      </div>

      {items.length === 0 && <p className="text-center text-slate-500 py-12">No articles found.</p>}

      {pages > 1 && (
        <div className="flex gap-2 mt-8 justify-center">
          {Array.from({ length: pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${page === i + 1 ? "btn-primary" : "bg-slate-800/50 border border-white/10 hover:border-violet-500/30"}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Blog detail ─── */
function BlogDetail() {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [cover, setCover] = useState("");

  useEffect(() => {
    api.get(`/blogs/${slug}`).then((r) => {
      setBlog(r.data);
      setCover(blogCoverSrc(r.data.slug, r.data.coverImage));
      trackEvent("blog_view", { slug: r.data.slug, title: r.data.title });
    });
    api.get(`/blogs/${slug}/related`).then((r) => setRelated(r.data)).catch(() => {});
  }, [slug]);

  if (!blog) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const paragraphs = blog.content.split(/\n\n+/).filter(Boolean);

  const blogUrl = `${window.location.origin}/blog/${blog.slug}`;

  return (
    <article className="animate-fade-in-up max-w-3xl mx-auto">
      <SEO
        title={blog.metaTitle || blog.title}
        description={blog.metaDescription || blog.excerpt}
        image={cover}
        type="article"
        url={blogUrl}
        keywords={(blog.tags || []).join(", ")}
        breadcrumbs={[{ label: "Blog", href: "/blog" }, { label: blog.title }]}
        article={{
          headline: blog.title,
          author: blog.author,
          publishedTime: blog.createdAt,
          modifiedTime: blog.updatedAt,
          tags: blog.tags
        }}
      />
      <Breadcrumbs items={[{ label: "Blog", href: "/blog" }, { label: blog.title }]} />

      <div className="rounded-2xl overflow-hidden mb-8 aspect-[21/9] border border-white/5 bg-slate-800/40">
        <img
          src={cover}
          alt={blog.title}
          className="w-full h-full object-cover"
          onError={() => setCover(blogCoverSrc(blog.slug, null))}
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(blog.tags || []).map((t) => (
          <span key={t} className="text-xs px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20">{t}</span>
        ))}
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{blog.title}</h1>
      <p className="text-lg text-slate-400 mt-3">{blog.excerpt}</p>

      <div className="flex flex-wrap items-center gap-4 mt-5 text-sm text-slate-500 border-b border-white/5 pb-6">
        <span className="flex items-center gap-1.5"><User size={14} /> {blog.author}</span>
        <span className="flex items-center gap-1.5"><Clock size={14} /> {blog.readTime} min read</span>
        <span>{new Date(blog.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
      </div>

      <div className="prose prose-invert prose-violet max-w-none mt-8 space-y-5">
        {paragraphs.map((p, i) => (
          <p key={i} className="text-slate-300 leading-relaxed text-[15px]">{p}</p>
        ))}
      </div>

      {related.length > 0 && (
        <section className="mt-14 pt-8 border-t border-white/5">
          <h2 className="text-xl font-bold mb-5">Related articles</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {related.map((b) => <BlogCard key={b._id} blog={b} />)}
          </div>
        </section>
      )}
    </article>
  );
}

function NotFound() {
  return (
    <div className="animate-fade-in-up text-center py-16">
      <SEO title="Page Not Found" description="The page you requested could not be found." noindex />
      <p className="text-6xl font-bold gradient-text">404</p>
      <h1 className="text-2xl font-semibold mt-4 text-white">Page not found</h1>
      <p className="text-slate-400 mt-2 max-w-md mx-auto">The link may be broken or the page was removed.</p>
      <div className="flex flex-wrap justify-center gap-3 mt-8">
        <Link to="/" className="btn-primary px-5 py-2.5">Go home</Link>
        <Link to="/products" className="px-5 py-2.5 rounded-lg border border-white/10 hover:border-violet-500/30">Browse products</Link>
      </div>
    </div>
  );
}

/* ─── Router ─── */
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/blog" element={<Blogs />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
        <Route path="/login" element={<Auth mode="login" />} />
        <Route path="/signup" element={<Auth mode="signup" />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/admin" element={<AdminOnly><AdminPanel /></AdminOnly>} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
