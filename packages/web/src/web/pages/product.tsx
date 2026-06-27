import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Link } from "wouter";
import { formatPrice, parseImages, parseJson, getSessionId } from "../lib/utils";
import { authClient } from "../lib/auth";
import ProductCard from "../components/ProductCard";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const { data: session } = authClient.useSession();
  const qc = useQueryClient();

  const productQuery = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const dupesQuery = useQuery({
    queryKey: ["dupes", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}/dupes`);
      return res.json();
    },
    enabled: !!id,
  });

  const product = productQuery.data?.product;
  const reviews = productQuery.data?.reviews || [];
  const images = product ? parseImages(product.images) : [];
  const colors = product ? parseJson<string[]>(product.colors, []) : [];
  const sizes = product ? parseJson<string[]>(product.sizes, []) : [];
  const specs = product ? parseJson<Record<string, string>>(product.specifications, {}) : {};

  const addToCart = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
        body: JSON.stringify({ productId: parseInt(id), quantity: qty, selectedColor, selectedSize }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/wishlist/${id}`, { method: "POST" });
      return res.json();
    },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: parseInt(id), rating: reviewRating, title: reviewTitle, body: reviewText }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["product", id] });
      setReviewText("");
      setReviewTitle("");
      setReviewRating(5);
    },
  });

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-black pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-[#111] rounded-xl animate-pulse" />
            <div className="space-y-4">
              {[1,2,3,4].map(i => <div key={i} className="h-8 bg-[#111] rounded animate-pulse" />)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-black pt-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🤔</p>
          <h2 className="text-xl font-bold text-white mb-2">Product not found</h2>
          <p className="text-gray-500 mb-6">Probably sold out. Or never existed. Either way.</p>
          <Link to="/" className="btn-primary px-6 py-2 rounded-lg text-sm font-medium">Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-white">Home</Link>
          <span>/</span>
          <span className="text-gray-300">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Images */}
          <div>
            <div className="aspect-square bg-[#111] rounded-xl overflow-hidden mb-4 relative">
              <img
                src={images[selectedImage] || `https://picsum.photos/seed/${product.id}/600/600`}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImage(i => Math.max(0, i - 1))}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setSelectedImage(i => Math.min(images.length - 1, i + 1))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 p-2 rounded-full text-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 ${i === selectedImage ? "border-purple-500" : "border-gray-700"}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.brand && (
              <span className="text-sm text-gray-500 uppercase tracking-wide">{product.brand}</span>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold text-white mt-1 mb-3">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-4">
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(product.avgRating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-700"} />
                ))}
              </div>
              <span className="text-sm text-gray-400">{product.avgRating?.toFixed(1) || "0.0"} ({product.reviewCount || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-black text-white">{formatPrice(product.price)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-lg text-gray-500 line-through">{formatPrice(product.comparePrice)}</span>
              )}
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="bg-green-500/20 text-green-400 text-sm font-medium px-2 py-1 rounded-full">
                  Save {formatPrice(product.comparePrice - product.price)}
                </span>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-gray-400 text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Colors */}
            {colors.length > 0 && (
              <div className="mb-4">
                <span className="text-sm font-medium text-gray-300 mb-2 block">Color: {selectedColor || "Select"}</span>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1 text-sm rounded-lg border ${selectedColor === c ? "border-purple-500 text-white" : "border-gray-700 text-gray-400"} hover:border-purple-400`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {sizes.length > 0 && (
              <div className="mb-6">
                <span className="text-sm font-medium text-gray-300 mb-2 block">Size: {selectedSize || "Select"}</span>
                <div className="flex gap-2 flex-wrap">
                  {sizes.map(s => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className={`w-10 h-10 text-sm rounded-lg border ${selectedSize === s ? "border-purple-500 text-white bg-purple-500/10" : "border-gray-700 text-gray-400"} hover:border-purple-400`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty & Add to Cart */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center border border-gray-700 rounded-lg overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5">−</button>
                <span className="px-4 py-2 text-white font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))} className="px-3 py-2 text-gray-400 hover:text-white hover:bg-white/5">+</button>
              </div>
              <button
                onClick={() => addToCart.mutate()}
                disabled={addToCart.isPending || product.stock <= 0}
                className="flex-1 btn-primary rounded-lg py-3 font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {addToCart.isPending ? "Adding..." : product.stock <= 0 ? "Out of Stock" : (
                  <><ShoppingCart size={18} /> Add to Cart</>
                )}
              </button>
              {session && (
                <button
                  onClick={() => wishlistMutation.mutate()}
                  className="p-3 border border-gray-700 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-400"
                >
                  <Heart size={20} />
                </button>
              )}
            </div>

            {/* Share */}
            <button
              onClick={() => {
                const text = `Just found this on Shopaholics Inc: ${product.name} for ${formatPrice(product.price)}! #SmartShopping`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`, "_blank");
              }}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-cyan-400 mb-6"
            >
              <Share2 size={14} /> Brag about this on X
            </button>

            {/* Trust badges */}
            <div className="border-t border-gray-800 pt-4 grid grid-cols-3 gap-4">
              {[
                { icon: Truck, text: "Free shipping over $50" },
                { icon: Shield, text: "Secure checkout" },
                { icon: RotateCcw, text: "30-day returns" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex flex-col items-center gap-1 text-center">
                  <Icon size={18} className="text-gray-500" />
                  <span className="text-xs text-gray-600">{text}</span>
                </div>
              ))}
            </div>

            {/* SKU */}
            <p className="text-xs text-gray-700 mt-4">SKU: {product.sku}</p>
          </div>
        </div>

        {/* Specs */}
        {Object.keys(specs).length > 0 && (
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 mb-8">
            <h3 className="font-bold text-white mb-4">Specifications</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(specs).map(([k, v]) => (
                <div key={k} className="flex gap-2">
                  <span className="text-gray-500 text-sm min-w-24">{k}:</span>
                  <span className="text-gray-300 text-sm">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dupe Finder */}
        {dupesQuery.data?.dupes?.length > 0 && (
          <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={18} className="text-cyan-400" />
              <h3 className="font-bold text-white">Psst — Dupe Finder</h3>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              Found cheaper alternatives that'll do the job just as well. Your wallet called. It's grateful.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {dupesQuery.data.dupes.map((dupe: any) => (
                <ProductCard key={dupe.id} product={dupe} />
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mb-8">
          <h3 className="font-bold text-white text-xl mb-6">
            Customer Reviews
            <span className="text-gray-500 text-sm font-normal ml-2">(Rate this or we'll assume you're chuffed to bits.)</span>
          </h3>

          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm mb-6">No reviews yet. Be the brave first soul.</p>
          ) : (
            <div className="space-y-4 mb-8">
              {reviews.map((rev: any) => (
                <div key={rev.id} className="bg-[#111] border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={14} className={s <= rev.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-700"} />
                      ))}
                    </div>
                    {rev.title && <span className="font-medium text-white text-sm">{rev.title}</span>}
                  </div>
                  {rev.body && <p className="text-sm text-gray-400">{rev.body}</p>}
                  <p className="text-xs text-gray-600 mt-2">{new Date(rev.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}

          {session && (
            <div className="bg-[#111] border border-gray-800 rounded-xl p-6">
              <h4 className="font-semibold text-white mb-4">Write a Review</h4>
              <div className="flex gap-2 mb-4">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star size={24} className={s <= reviewRating ? "text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                  </button>
                ))}
              </div>
              <input
                value={reviewTitle}
                onChange={e => setReviewTitle(e.target.value)}
                placeholder="Review title (optional)"
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 mb-3 text-sm"
              />
              <textarea
                value={reviewText}
                onChange={e => setReviewText(e.target.value)}
                placeholder="Tell everyone what you think..."
                rows={3}
                className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 text-sm resize-none mb-3"
              />
              <button
                onClick={() => submitReview.mutate()}
                disabled={submitReview.isPending || !reviewText.trim()}
                className="btn-primary px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {submitReview.isPending ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
