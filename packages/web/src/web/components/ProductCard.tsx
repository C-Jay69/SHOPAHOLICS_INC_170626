import { Heart, Star, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { formatPrice, parseImages } from "../lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "../lib/auth";
import { getSessionId } from "../lib/utils";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  brand?: string | null;
  images: string;
  avgRating?: number | null;
  reviewCount?: number | null;
  featured?: boolean;
  discount?: number | null;
  stock?: number;
}

interface Props {
  product: Product;
  onAddToCart?: () => void;
}

export default function ProductCard({ product }: Props) {
  const images = parseImages(product.images);
  const img = images[0] || `https://picsum.photos/seed/${product.id}/400/400`;
  const { data: session } = authClient.useSession();
  const qc = useQueryClient();

  const addToCart = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": getSessionId(),
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/wishlist/${product.id}`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });

  const discount = product.comparePrice && product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : null;

  return (
    <div className="product-card bg-[#111] border border-gray-800 rounded-xl overflow-hidden flex flex-col transition-all duration-200 cursor-pointer group">
      <Link to={`/product/${product.id}`} className="block relative">
        <div className="aspect-square overflow-hidden bg-[#1a1a1a]">
          <img
            src={img}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
        {discount && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            -{discount}%
          </span>
        )}
        {product.featured && !discount && (
          <span className="absolute top-2 left-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-medium px-2 py-1 rounded-full">
            Featured
          </span>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-1">
        {product.brand && (
          <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand}</span>
        )}
        <Link to={`/product/${product.id}`} className="block">
          <h3 className="text-sm font-medium text-white line-clamp-2 hover:text-gray-200 mb-2 leading-snug">
            {product.name}
          </h3>
        </Link>

        {product.avgRating !== null && product.avgRating !== undefined && (
          <div className="flex items-center gap-1 mb-2">
            <Star size={12} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-400">{product.avgRating?.toFixed(1)} ({product.reviewCount || 0})</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="font-bold text-white">{formatPrice(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xs text-gray-500 line-through ml-2">{formatPrice(product.comparePrice)}</span>
            )}
          </div>
          <div className="flex gap-1">
            {session && (
              <button
                onClick={(e) => { e.preventDefault(); wishlistMutation.mutate(); }}
                className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5"
              >
                <Heart size={16} />
              </button>
            )}
            <button
              onClick={(e) => { e.preventDefault(); addToCart.mutate(); }}
              disabled={addToCart.isPending || (product.stock !== undefined && product.stock <= 0)}
              className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:opacity-90 disabled:opacity-50"
            >
              {addToCart.isPending ? (
                <span className="block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <ShoppingCart size={16} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
