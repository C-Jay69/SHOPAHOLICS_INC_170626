import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { getSessionId, formatPrice } from "../lib/utils";
import { authClient } from "../lib/auth";
import { getToken } from "../lib/auth";

async function fetchCart() {
  const res = await fetch("/api/cart", {
    headers: { "x-session-id": getSessionId() },
  });
  return res.json();
}

export default function Checkout() {
  const [, navigate] = useLocation();
  const { data: session } = authClient.useSession();
  const { data: cartData, isLoading } = useQuery({ queryKey: ["cart"], queryFn: fetchCart });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: session?.user?.email || "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const items = cartData?.items || [];
  const subtotal = items.reduce((s: number, i: any) => s + i.productPrice * i.quantity, 0);
  const tax = subtotal * 0.08;
  const shipping = subtotal > 50 ? 0 : 9.99;
  const total = subtotal + tax + shipping;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/orders/checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-session-id": getSessionId(),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          items,
          email: form.email,
          shippingAddress: {
            name: `${form.firstName} ${form.lastName}`,
            address: form.address,
            city: form.city,
            state: form.state,
            zip: form.zip,
            country: form.country,
          },
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create checkout session");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold text-white mb-4">Nothing to checkout</h1>
        <Link to="/cart" className="btn-primary px-6 py-3 rounded-xl font-semibold">Back to Cart</Link>
      </div>
    );
  }

  const inputClass = "w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm";

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        <Link to="/cart" className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-6">
          <ArrowLeft size={16} /> Back to cart
        </Link>
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Shipping */}
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="font-bold text-white text-lg mb-4">Shipping Information</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">First Name</label>
                    <input required value={form.firstName} onChange={set("firstName")} placeholder="John" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                    <input required value={form.lastName} onChange={set("lastName")} placeholder="Doe" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Email</label>
                  <input type="email" required value={form.email} onChange={set("email")} placeholder="you@email.com" className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Street Address</label>
                  <input required value={form.address} onChange={set("address")} placeholder="123 Main St" className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">City</label>
                    <input required value={form.city} onChange={set("city")} placeholder="New York" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">State</label>
                    <input required value={form.state} onChange={set("state")} placeholder="NY" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">ZIP Code</label>
                    <input required value={form.zip} onChange={set("zip")} placeholder="10001" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Country</label>
                    <select value={form.country} onChange={set("country")} className={inputClass}>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="GB">United Kingdom</option>
                      <option value="MX">Mexico</option>
                      <option value="AU">Australia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-4 flex items-center gap-3">
              <Lock size={18} className="text-green-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Secure Checkout via Stripe</p>
                <p className="text-xs text-gray-500">Your payment info is encrypted and never stored on our servers.</p>
              </div>
            </div>
          </div>

          {/* Right: Summary */}
          <div className="space-y-4">
            <div className="card p-6">
              <h2 className="font-bold text-white text-lg mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {items.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-400 line-clamp-1 flex-1 pr-2">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="text-white shrink-0">{formatPrice(item.productPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-700 mt-4 pt-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span><span className="text-white">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (8%)</span><span className="text-white">{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-400" : "text-white"}>
                    {shipping === 0 ? "FREE" : formatPrice(shipping)}
                  </span>
                </div>
                <div className="border-t border-gray-700 pt-2 flex justify-between font-bold text-base">
                  <span className="text-white">Total</span>
                  <span className="gradient-text">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck size={20} />
              {loading ? "Redirecting to Stripe..." : `Pay ${formatPrice(total)}`}
            </button>
            <p className="text-xs text-gray-600 text-center">
              You'll be redirected to Stripe's secure payment page.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
