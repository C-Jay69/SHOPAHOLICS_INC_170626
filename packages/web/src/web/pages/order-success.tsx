import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { CheckCircle, Package, ArrowRight } from "lucide-react";
import { getToken } from "../lib/auth";
import { getSessionId } from "../lib/utils";

export default function OrderSuccess() {
  const [location] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const sessionId = params.get("session_id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    const token = getToken();
    fetch(`/api/orders/success/${sessionId}`, {
      headers: {
        "x-session-id": getSessionId(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((r) => r.json())
      .then((d) => setOrder(d.order))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-400 flex items-center justify-center">
            <CheckCircle size={48} className="text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Order Confirmed!</h1>
        <p className="text-gray-400 text-lg mb-2">
          Your compulsive purchase has been processed.
        </p>
        {order && (
          <p className="text-gray-500 text-sm mb-8">
            Order #{order.orderNumber}
          </p>
        )}

        <div className="card p-6 mb-8 text-left space-y-3">
          <div className="flex items-center gap-3 text-sm">
            <Package size={18} className="text-purple-400 shrink-0" />
            <div>
              <p className="text-white font-medium">What's next?</p>
              <p className="text-gray-500 text-xs mt-0.5">
                You'll receive a confirmation email shortly. Your items will ship within 1–2 business days.
              </p>
            </div>
          </div>
          {order && (
            <div className="border-t border-gray-800 pt-3 text-sm text-gray-400">
              <span className="text-gray-300 font-medium">Status: </span>
              <span className="capitalize text-green-400">{order.paymentStatus}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/account/orders"
            className="flex items-center justify-center gap-2 btn-primary px-6 py-3 rounded-xl font-semibold"
          >
            View My Orders <ArrowRight size={16} />
          </Link>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 font-semibold"
          >
            Keep Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
