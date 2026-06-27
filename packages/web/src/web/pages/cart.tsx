import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Tag } from "lucide-react";
import { getSessionId, formatPrice, parseImages } from "../lib/utils";
import ImpulseCoach from "../components/ImpulseCoach";

async function fetchCart() {
  const res = await fetch("/api/cart", {
    headers: { "x-session-id": getSessionId() },
  });
  return res.json();
}

export default function Cart() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["cart"], queryFn: fetchCart });

  const updateQty = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: number; quantity: number }) => {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
        body: JSON.stringify({ quantity }),
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await fetch(`/api/cart/${itemId}`, {
        method: "DELETE",
        headers: { "x-session-id": getSessionId() },
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/cart", {
        method: "DELETE",
        headers: { "x-session-id": getSessionId() },
      });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cart"] }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const items = data?.items || [];
  const subtotal = items.reduce((sum: number, i: any) => sum + i.productPrice * i.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <ShoppingCart size={80} className="text-gray-700 mb-6" />
        <h1 className="text-3xl font-bold text-white mb-3">Your cart is lonely</h1>
        <p className="text-gray-400 mb-8 max-w-md">
          It's empty and it knows it. Let's fix that.
        </p>
        <Link to="/" className="btn-primary px-8 py-3 rounded-xl font-semibold">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Cart <span className="text-gray-500 text-lg font-normal">({items.length} {items.length === 1 ? "item" : "items"})</span></h1>
          <button
            onClick={() => clearCart.mutate()}
            className="text-sm text-gray-500 hover:text-red-400 flex items-center gap-1"
          >
            <Trash2 size={14} /> Clear all
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any) => {
              const imgs = parseImages(item.productImages);
              return (
                <div key={item.id} className="card p-4 flex gap-4">
                  <Link to={`/product/${item.productSlug || item.productId}`}>
                    <img
                      src={imgs[0] || "/placeholder.jpg"}
                      alt={item.productName}
                      className="w-24 h-24 object-cover rounded-lg bg-gray-800 shrink-0"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.productSlug || item.productId}`}>
                      <h3 className="font-medium text-white hover:text-purple-300 line-clamp-2 text-sm sm:text-base">
                        {item.productName}
                      </h3>
                    </Link>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Tag size={10} /> {item.variantName}
                      </p>
                    )}
                    <p className="text-purple-400 font-semibold mt-1">{formatPrice(item.productPrice)}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg border border-gray-700">
                        <button
                          onClick={() => item.quantity > 1
                            ? updateQty.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                            : removeItem.mutate(item.id)
                          }
                          className="p-2 text-gray-400 hover:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="w-8 text-center text-white font-medium text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQty.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                          className="p-2 text-gray-400 hover:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem.mutate(item.id)}
                        className="p-2 text-gray-600 hover:text-red-400"
                      >
                        <Trash2 size={14} />
                      </button>
                      <span className="ml-auto font-semibold text-white">
                        {formatPrice(item.productPrice * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="font-bold text-white text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (8%)</span>
                  <span className="text-white">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-400" : "text-white"}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-600">
                    Add {formatPrice(50 - subtotal)} more for free shipping
                  </p>
                )}
                <div className="border-t border-gray-700 pt-3 flex justify-between font-bold text-white text-base">
                  <span>Total</span>
                  <span className="gradient-text">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full btn-primary py-3 rounded-xl font-semibold mt-6 flex items-center justify-center gap-2"
              >
                Checkout <ArrowRight size={18} />
              </button>
              <Link to="/" className="block text-center text-sm text-gray-500 hover:text-gray-300 mt-3">
                Continue Shopping
              </Link>
            </div>

            {/* ImpulseCoach widget */}
            <ImpulseCoach cartItems={items} totalAmount={total} />
          </div>
        </div>
      </div>
    </div>
  );
}
