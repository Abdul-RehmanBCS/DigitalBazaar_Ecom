import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import usePageTracking from "../hooks/usePageTracking";
import ChatbotWidget from "./ChatbotWidget";
import { OrganizationSEO } from "./SEO";
import { ShoppingCart, User, LogOut, Shield, Package, Store, BookOpen, Menu, X } from "lucide-react";

export default function Layout() {
  const { user } = useSelector((s) => s.auth);
  const { cart } = useSelector((s) => s.shop);
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  usePageTracking();

  const navLink = ({ isActive }) =>
    `block px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive ? "text-violet-400 bg-violet-500/10" : "text-slate-300 hover:text-white hover:bg-white/5"
    }`;

  const navItems = (
    <>
      <NavLink to="/products" className={navLink} onClick={() => setMobileOpen(false)}>
        <span className="flex items-center gap-2"><Package size={16} /> Products</span>
      </NavLink>
      <NavLink to="/blog" className={navLink} onClick={() => setMobileOpen(false)}>
        <span className="flex items-center gap-2"><BookOpen size={16} /> Blog</span>
      </NavLink>
      <NavLink to="/cart" className={navLink} onClick={() => setMobileOpen(false)}>
        <span className="flex items-center gap-2">
          <ShoppingCart size={16} /> Cart
          {cart.length > 0 && (
            <span className="w-5 h-5 text-xs flex items-center justify-center rounded-full bg-violet-600 text-white font-bold">
              {cart.length}
            </span>
          )}
        </span>
      </NavLink>
      {user ? (
        <>
          <NavLink to="/dashboard" className={navLink} onClick={() => setMobileOpen(false)}>
            <span className="flex items-center gap-2"><User size={16} /> Dashboard</span>
          </NavLink>
          {user.role === "admin" && (
            <>
              <NavLink to="/admin" className={navLink} onClick={() => setMobileOpen(false)}>
                <span className="flex items-center gap-2"><Shield size={16} /> Admin</span>
              </NavLink>
              <NavLink to="/admin?tab=blogs" className={navLink} onClick={() => setMobileOpen(false)}>
                <span className="flex items-center gap-2"><BookOpen size={16} /> Blog (AI)</span>
              </NavLink>
            </>
          )}
          <button
            type="button"
            onClick={() => { dispatch(logout()); setMobileOpen(false); }}
            className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10"
          >
            <LogOut size={16} /> Logout
          </button>
        </>
      ) : (
        <NavLink to="/login" className={navLink} onClick={() => setMobileOpen(false)}>
          <span className="flex items-center gap-2"><User size={16} /> Login</span>
        </NavLink>
      )}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <OrganizationSEO />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-violet-600 focus:rounded-lg text-white text-sm">
        Skip to content
      </a>

      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Store size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text hidden sm:inline">Digital Bazaar</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">{navItems}</div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg hover:bg-white/5 text-slate-300"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a1a]/98 px-4 py-4 flex flex-col gap-1">
            {navItems}
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm text-slate-500">
          <div>
            <Link to="/" className="font-semibold text-slate-300 hover:text-violet-400 transition-colors">Digital Bazaar</Link>
            <p className="mt-2">Premium digital products for designers and developers. Instant download after purchase.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-300 mb-2">Shop</p>
            <div className="flex flex-col gap-2">
              <Link to="/products" className="hover:text-violet-400 transition-colors">All Products</Link>
              <Link to="/products?featured=true" className="hover:text-violet-400 transition-colors">Featured</Link>
              <Link to="/blog" className="hover:text-violet-400 transition-colors">Blog</Link>
              <Link to="/cart" className="hover:text-violet-400 transition-colors">Cart ({cart.length})</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-300 mb-2">Categories</p>
            <div className="flex flex-col gap-2">
              <Link to="/products?search=ui" className="hover:text-violet-400 transition-colors">UI Kits</Link>
              <Link to="/products?search=template" className="hover:text-violet-400 transition-colors">Templates</Link>
              <Link to="/products?search=ebook" className="hover:text-violet-400 transition-colors">Ebooks</Link>
            </div>
          </div>
          <div>
            <p className="font-semibold text-slate-300 mb-2">Account</p>
            <div className="flex flex-col gap-2">
              <Link to="/login" className="hover:text-violet-400 transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-violet-400 transition-colors">Sign up</Link>
              <Link to="/dashboard" className="hover:text-violet-400 transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-6 text-xs text-slate-600 text-center border-t border-white/5 pt-4">
          &copy; {new Date().getFullYear()} Digital Bazaar. All rights reserved.
        </div>
      </footer>

      <ChatbotWidget />
    </div>
  );
}
