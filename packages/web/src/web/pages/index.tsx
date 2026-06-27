import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Cpu, Home, Shirt, Baby, Heart, ChefHat, Wrench, PawPrint, Palette, Luggage, ArrowRight, Zap, Shield, Truck } from "lucide-react";
import ProductCard from "../components/ProductCard";

const CATEGORY_ICONS: Record<string, any> = {
  electronics: Cpu, "smart-home": Home, fashion: Shirt, "kids-baby": Baby,
  "beauty-health": Heart, "home-kitchen": ChefHat, "automotive-tools": Wrench,
  "pets-outdoors": PawPrint, "arts-crafts": Palette, "travel-luggage": Luggage,
};

const HERO_BADGES = [
  { icon: Truck, text: "Free shipping over $50" },
  { icon: Shield, text: "Secure checkout" },
  { icon: Zap, text: "Fast delivery" },
];

export default function HomePage() {
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return res.json();
    },
  });

  const featured = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const res = await fetch("/api/products?featured=true&limit=8");
      return res.json();
    },
  });

  const newest = useQuery({
    queryKey: ["products", "newest"],
    queryFn: async () => {
      const res = await fetch("/api/products?sort=newest&limit=8");
      return res.json();
    },
  });

  return (
    <div className="min-h-screen w-full bg-black">
      {/* Hero */}
      <section className="relative w-full pt-28 pb-20 lg:pt-36 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-cyan-900/10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-gray-400 mb-6">
              <Zap size={14} className="text-cyan-400" />
              <span>Your wallet's nemesis, and you love it.</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-black leading-none mb-6">
              <span className="gradient-text">Shop Smart.</span>
              <br />
              <span className="text-white">Spend Less.</span>
              <br />
              <span className="text-gray-500">Brag More.</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mb-8 leading-relaxed">
              80+ categories. AI-powered dupe finder. A sarcastic AI mate watching your back.
              Professional, fast, and never up its own arse.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/category/electronics"
                className="btn-primary px-8 py-3 rounded-lg font-semibold flex items-center gap-2"
              >
                Shop Now <ArrowRight size={18} />
              </Link>
              <Link
                to="/search"
                className="border-2 border-white/20 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-black transition-colors"
              >
                Browse All
              </Link>
            </div>
            <div className="flex flex-wrap gap-6 mt-10">
              {HERO_BADGES.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-gray-500">
                  <Icon size={16} className="text-purple-400" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white">Shop by Category</h2>
            <Link to="/search" className="text-sm text-gray-500 hover:text-white flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {categories.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-28 bg-[#111] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {(categories.data?.categories || []).map((cat: any) => {
                const Icon = CATEGORY_ICONS[cat.slug] || Cpu;
                return (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="group bg-[#111] border border-gray-800 hover:border-purple-500/40 rounded-xl p-4 flex flex-col items-center gap-3 text-center transition-all"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500/20 to-cyan-500/20 flex items-center justify-center group-hover:from-purple-500/30 group-hover:to-cyan-500/30 transition-all">
                      <Icon size={22} className="text-purple-400 group-hover:text-purple-300" />
                    </div>
                    <span className="text-sm font-medium text-gray-300 group-hover:text-white leading-tight">{cat.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Featured Products</h2>
              <p className="text-sm text-gray-500 mt-1">Stuff we actually think you'll want. Revolutionary, we know.</p>
            </div>
            <Link to="/search?featured=true" className="text-sm text-gray-500 hover:text-white flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {featured.isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-72 bg-[#111] rounded-xl animate-pulse" />
              ))}
            </div>
          ) : featured.data?.products?.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-4">Nothing here yet. The shelves are embarrassingly bare.</p>
              <p className="text-xs text-gray-700">Go to Admin → Seed Database to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(featured.data?.products || []).map((prod: any) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🤖",
                title: "Shopaholics Anonymous Mate",
                desc: "Our AI watches your cart and calls out the BS impulse buys. It's like having a financially responsible friend — but funnier.",
              },
              {
                icon: "💸",
                title: "Dupe Finder",
                desc: "Found a £300 smartwatch you don't need? Our AI finds a £80 one with the same specs. Your wallet will send a thank-you card.",
              },
              {
                icon: "⚡",
                title: "Sub-2-Second Loading",
                desc: "We know you've got the attention span of a goldfish on espresso. The site loads fast. Really fast.",
              },
            ].map((item) => (
              <div key={item.title} className="bg-[#111] border border-gray-800 rounded-xl p-6">
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newest */}
      {newest.data?.products?.length > 0 && (
        <section className="py-16 border-t border-gray-900">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-white">Just Landed</h2>
                <p className="text-sm text-gray-500 mt-1">Fresh arrivals. Totally unnecessary. You'll love them.</p>
              </div>
              <Link to="/search" className="text-sm text-gray-500 hover:text-white flex items-center gap-1">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(newest.data?.products || []).map((prod: any) => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 border-t border-gray-900">
        <div className="max-w-3xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl lg:text-5xl font-black mb-4">
            Ready to <span className="gradient-text">overspend responsibly</span>?
          </h2>
          <p className="text-gray-500 mb-8">
            Create an account. Get a wishlist. Activate the Impulse Coach. Try not to buy everything.
          </p>
          <Link to="/signup" className="btn-primary px-10 py-4 rounded-lg font-bold text-lg inline-flex items-center gap-2">
            Let's Go <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
