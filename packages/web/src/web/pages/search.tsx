import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "../components/ProductCard";

export default function SearchPage() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q") || "";
  const [query, setQuery] = useState(q);
  const [, navigate] = useLocation();
  const [sort, setSort] = useState("relevance");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQuery(p.get("q") || "");
  }, [location]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", q, sort],
    queryFn: async () => {
      if (!q.trim()) return { products: [] };
      const res = await fetch(`/api/products?search=${encodeURIComponent(q)}&sort=${sort}&limit=48`);
      return res.json();
    },
    enabled: !!q.trim(),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const products = data?.products || [];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, brands, categories..."
              autoFocus
              className="w-full bg-[#111] border border-gray-700 rounded-xl pl-11 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-base"
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-3 rounded-xl font-semibold">
            Search
          </button>
        </form>

        {q && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Results for <span className="gradient-text">"{q}"</span>
              </h1>
              {!isLoading && (
                <p className="text-gray-500 text-sm mt-1">{products.length} products found</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-gray-500" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-purple-500"
              >
                <option value="relevance">Most Relevant</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top Rated</option>
                <option value="newest">Newest</option>
              </select>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        )}

        {!isLoading && q && products.length === 0 && (
          <div className="text-center py-20">
            <SearchIcon size={64} className="mx-auto text-gray-700 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">No results for "{q}"</h2>
            <p className="text-gray-400">Try different keywords or browse our categories.</p>
          </div>
        )}

        {!isLoading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {!q && (
          <div className="text-center py-20">
            <SearchIcon size={64} className="mx-auto text-gray-700 mb-6" />
            <h2 className="text-2xl font-bold text-white mb-3">What are you looking for?</h2>
            <p className="text-gray-400">Type something above and we'll find it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
