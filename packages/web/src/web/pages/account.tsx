import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Package, Heart, User, LogOut, ChevronRight, ShoppingBag } from "lucide-react";
import { authClient, clearToken } from "../lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "../lib/auth";
import { formatPrice } from "../lib/utils";

export default function Account() {
  const [, navigate] = useLocation();
  const { data: session } = authClient.useSession();
  const qc = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch("/api/orders", {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      });
      return res.json();
    },
    enabled: !!session,
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    clearToken();
    qc.clear();
    navigate("/");
  };

  if (!session) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <User size={64} className="text-gray-700 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">Sign in to view your account</h1>
        <div className="flex gap-3">
          <Link to="/login" className="btn-primary px-6 py-3 rounded-xl font-semibold">Sign In</Link>
          <Link to="/signup" className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white font-semibold">Create Account</Link>
        </div>
      </div>
    );
  }

  const orders = ordersQuery.data?.orders || [];

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
              {session.user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{session.user.name}</h1>
              <p className="text-gray-400 text-sm">{session.user.email}</p>
              {(session.user as any).role === "admin" && (
                <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-600/30 mt-1 inline-block">
                  Admin
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Package, label: "Orders", count: orders.length, to: "#orders" },
            { icon: Heart, label: "Wishlist", count: null, to: "#" },
            { icon: User, label: "Profile", count: null, to: "#" },
            ...(((session.user as any).role === "admin") ? [{ icon: ShoppingBag, label: "Admin", count: null, to: "/admin" }] : []),
          ].map(({ icon: Icon, label, count, to }) => (
            <Link key={label} to={to} className="card p-4 text-center hover:border-purple-500/50">
              <Icon size={24} className="mx-auto mb-2 text-purple-400" />
              <p className="text-white font-medium text-sm">{label}</p>
              {count !== null && <p className="text-gray-500 text-xs mt-0.5">{count} items</p>}
            </Link>
          ))}
        </div>

        {/* Orders */}
        <div id="orders">
          <h2 className="text-xl font-bold text-white mb-4">Recent Orders</h2>
          {ordersQuery.isLoading ? (
            <div className="card p-8 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="card p-10 text-center">
              <Package size={48} className="mx-auto text-gray-700 mb-4" />
              <p className="text-gray-400 mb-4">No orders yet. The cart awaits.</p>
              <Link to="/" className="btn-primary px-6 py-2 rounded-lg text-sm font-semibold">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order: any) => (
                <div key={order.id} className="card p-4 flex items-center justify-between hover:border-gray-600">
                  <div>
                    <p className="text-white font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()} · {" "}
                      <span className={`capitalize ${
                        order.paymentStatus === "paid" ? "text-green-400" :
                        order.paymentStatus === "pending" ? "text-yellow-400" : "text-red-400"
                      }`}>{order.paymentStatus}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white font-semibold">{formatPrice(order.total)}</span>
                    <ChevronRight size={16} className="text-gray-600" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
