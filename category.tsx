import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import ProductCard from "../components/ProductCard";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [location] = useLocation();
  const params = new URLSearchParams(location.split("?")[1] || "");

  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const res = await fetch(`/api/categories/${slug}`);
      return res.json();
    },
    enabled: !!slug && slug !== "more",
  });

  const queryParams = new URLSearchParams({
    ...(slug && slug !== "more" ? { category: slug } : {}),
    sort,
    page: page.toString(),
    limit: "24",
    ...(minPrice ? { minPrice } : {}),
    ...(maxPrice ? { maxPrice } : {}),
  });

  const products = useQuery({
    queryKey: ["products", slug, sort, minPrice, maxPrice, page],
    queryFn: async () => {
      const res = await fetch(`/api/products?${queryParams}`);
      return res.json();
    },
  });

  const catName = slug === "more" ? "All Categories" : category.data?.category?.name || slug;
  const totalPages = Math.ceil((products.data?.total || 0) / 24);

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{catName}</h1>
          {products.data && (
            <p className="text-gray-500 text-sm">{products.data.total} products found</p>
          )}
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters — Desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="bg-[#111] border border-gray-800 rounded-xl p-5 sticky top-24">
              <h3 className="font-semibold text-white mb-4">Filters</h3>

              {/* Subcategories */}
              {category.data?.category?.subcategories?.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Subcategory</h4>
                  <div className="space-y-1">
                    {category.data.category.subcategories.map((sub: any) => (
                      <a
                        key={sub.id}
                        href={`/category/${slug}?sub=${encodeURIComponent(sub.name)}`}
                        className="block text-sm text-gray-400 hover:text-white py-1"
                      >
                        {sub.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Price Range</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => { setMinPrice(e.target.value); setPage(1); }}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-2 py-1 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => { setMaxPrice(e.target.value); setPage(1); }}
                    className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-2 py-1 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={() => { setMinPrice(""); setMaxPrice(""); setSort("newest"); setPage(1); }}
                className="text-xs text-gray-500 hover:text-white"
              >
                Clear filters
              </button>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6 gap-4">
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden flex items-center gap-2 text-sm text-gray-400 border border-gray-700 rounded-lg px-3 py-2"
              >
                <SlidersHorizontal size={16} />
                Filters
              </button>
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-gray-500 hidden sm:block">Sort by:</span>
                <select
                  value={sort}
                  onChange={(e) => { setSort(e.target.value); setPage(1); }}
                  className="bg-[#111] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Best Rated</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Mobile filters */}
            {filtersOpen && (
              <div className="lg:hidden bg-[#111] border border-gray-800 rounded-xl p-4 mb-4">
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min price"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max price"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {products.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-72 bg-[#111] rounded-xl animate-pulse" />
                ))}
              </div>
            ) : products.data?.products?.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-2">Nothing here. Impressive restraint, actually.</p>
                <p className="text-gray-600 text-sm">Try different filters or browse another category.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(products.data?.products || []).map((prod: any) => (
                    <ProductCard key={prod.id} product={prod} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-40"
                    >
                      ← Prev
                    </button>
                    <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 text-sm border border-gray-700 rounded-lg text-gray-400 hover:text-white disabled:opacity-40"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
