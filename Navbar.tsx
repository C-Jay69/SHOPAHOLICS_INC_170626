import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Search, User, Menu, X, ChevronDown } from "lucide-react";
import { authClient, clearToken } from "../lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { getSessionId } from "../lib/utils";

const CATEGORIES = [
  { name: "Electronics", slug: "electronics", subs: ["Headphones", "Cameras", "Laptops", "Wearables"] },
  { name: "Smart Home", slug: "smart-home", subs: ["Lights", "Security", "Hubs"] },
  { name: "Fashion", slug: "fashion", subs: ["Women's", "Men's", "Accessories"] },
  { name: "Kids & Baby", slug: "kids-baby", subs: ["Girls'", "Boys'", "Baby Gear", "Toys"] },
  { name: "Beauty & Health", slug: "beauty-health", subs: ["Skincare", "Makeup", "Vitamins"] },
  { name: "Home & Kitchen", slug: "home-kitchen", subs: ["Cookware", "Furniture", "Decor"] },
  { name: "Automotive", slug: "automotive-tools", subs: ["Tools", "Car Care", "Power Tools"] },
  { name: "Pets & Outdoors", slug: "pets-outdoors", subs: ["Dog", "Cat", "Fitness", "Camping"] },
  { name: "Arts & Crafts", slug: "arts-crafts", subs: ["Painting", "Board Games", "Toys"] },
  { name: "Travel", slug: "travel-luggage", subs: ["Suitcases", "Accessories"] },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { data: session } = authClient.useSession();
  const [location, navigate] = useLocation();
  const qc = useQueryClient();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => {
      const res = await fetch("/api/cart", {
        headers: { "x-session-id": getSessionId() },
      });
      return res.json();
    },
    refetchInterval: 30000,
  });

  const cartCount = cartQuery.data?.items?.reduce((sum: number, i: any) => sum + i.quantity, 0) || 0;

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    qc.clear();
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        {/* Main bar */}
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/logo.png" alt="Shopaholics Inc" className="h-10 w-10 object-contain" />
            <span className="font-bold text-lg hidden sm:block">
              <span className="gradient-text">Shopaholics</span>
              <span className="text-white"> Inc.</span>
            </span>
          </Link>

          {/* Desktop Category Nav */}
          <div className="hidden lg:flex items-center gap-1 overflow-x-auto">
            {CATEGORIES.slice(0, 6).map((cat) => (
              <div key={cat.slug} className="relative group">
                <Link
                  to={`/category/${cat.slug}`}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-300 hover:text-white rounded-lg hover:bg-white/5"
                  onMouseEnter={() => setActiveCategory(cat.slug)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  {cat.name}
                  <ChevronDown size={12} />
                </Link>
                {/* Dropdown */}
                <div className="absolute top-full left-0 w-44 bg-[#111] border border-gray-800 rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  {cat.subs.map((sub) => (
                    <Link
                      key={sub}
                      to={`/category/${cat.slug}?sub=${encodeURIComponent(sub)}`}
                      className="block px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
            <Link to="/category/more" className="px-3 py-2 text-sm text-gray-400 hover:text-white">
              More ▾
            </Link>
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5"
            >
              <Search size={20} />
            </button>

            {session ? (
              <div className="relative group hidden sm:block">
                <button className="flex items-center gap-2 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                  <User size={20} />
                </button>
                <div className="absolute right-0 top-full w-48 bg-[#111] border border-gray-800 rounded-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link to="/account" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">My Account</Link>
                  <Link to="/account/orders" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">Orders</Link>
                  <Link to="/account/wishlist" className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5">Wishlist</Link>
                  {(session.user as any)?.role === "admin" && (
                    <Link to="/admin" className="block px-4 py-2 text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-white/5">Admin Panel</Link>
                  )}
                  <hr className="border-gray-800 my-1" />
                  <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5">
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:flex items-center gap-1 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
                <User size={20} />
              </Link>
            )}

            <Link to="/cart" className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs flex items-center justify-center font-bold">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            <button
              className="lg:hidden p-2 text-gray-400 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="py-3 border-t border-gray-800">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands..."
                className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button type="submit" className="btn-primary px-4 py-2 rounded-lg font-medium text-sm">
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-800 py-4">
            <div className="space-y-1">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/category/${cat.slug}`}
                  className="block px-4 py-2 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  {cat.name}
                </Link>
              ))}
              <hr className="border-gray-800 my-2" />
              {session ? (
                <>
                  <Link to="/account" className="block px-4 py-2 text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Account</Link>
                  {(session.user as any)?.role === "admin" && (
                    <Link to="/admin" className="block px-4 py-2 text-purple-400 font-medium" onClick={() => setMobileOpen(false)}>Admin Panel</Link>
                  )}
                  <button onClick={handleSignOut} className="block w-full text-left px-4 py-2 text-gray-400">Sign Out</button>
                </>
              ) : (
                <Link to="/login" className="block px-4 py-2 text-gray-300 hover:text-white" onClick={() => setMobileOpen(false)}>Sign In</Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
