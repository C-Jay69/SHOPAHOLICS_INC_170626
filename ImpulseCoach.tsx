import { useState } from "react";
import { Brain, X, ChevronDown, ChevronUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { getSessionId } from "../lib/utils";

interface Props {
  cartItems?: any[];
  totalAmount?: number;
}

export default function ImpulseCoach({ cartItems = [], totalAmount = 0 }: Props) {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("impulse_coach") !== "disabled");
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const analyze = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/impulse/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-id": getSessionId() },
        body: JSON.stringify({
          items: cartItems,
          totalAmount,
          hour: new Date().getHours(),
        }),
      });
      return res.json();
    },
    onSuccess: (data) => setMessage(data.message),
  });

  const toggle = () => {
    const newVal = !enabled;
    setEnabled(newVal);
    localStorage.setItem("impulse_coach", newVal ? "enabled" : "disabled");
    if (newVal) {
      fetch("/api/impulse/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "opted_in", sessionId: getSessionId() }),
      });
    }
  };

  if (!enabled) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={toggle}
          className="bg-[#111] border border-gray-700 rounded-full p-3 text-gray-500 hover:text-purple-400 hover:border-purple-500"
          title="Enable Impulse Coach"
        >
          <Brain size={20} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-80">
      {open && (
        <div className="bg-[#111] border border-purple-500/30 rounded-xl p-4 mb-3 shadow-xl shadow-purple-500/10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-purple-400" />
              <span className="text-sm font-semibold gradient-text">Shopaholics Anonymous Mate</span>
            </div>
            <div className="flex gap-1">
              <button onClick={toggle} className="p-1 text-gray-600 hover:text-gray-400 text-xs">Off</button>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-600 hover:text-gray-400">
                <X size={14} />
              </button>
            </div>
          </div>

          {message && (
            <p className="text-sm text-gray-300 bg-[#1a1a1a] rounded-lg p-3 mb-3 leading-relaxed border border-gray-800">
              {message}
            </p>
          )}

          {!message && (
            <p className="text-xs text-gray-500 mb-3">
              Your cheeky cart-checker. Let me have a look at what you're about to buy.
            </p>
          )}

          <button
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending || cartItems.length === 0}
            className="w-full btn-primary rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          >
            {analyze.isPending ? "Analysing your life choices..." : cartItems.length === 0 ? "Add something to cart first" : "Analyse My Cart"}
          </button>

          {cartItems.length > 0 && (
            <p className="text-xs text-gray-600 mt-2 text-center">
              {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} · ${totalAmount.toFixed(2)} total
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white rounded-full px-4 py-3 shadow-lg font-medium text-sm w-full justify-between"
      >
        <div className="flex items-center gap-2">
          <Brain size={18} />
          <span>Impulse Coach</span>
        </div>
        {open ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>
    </div>
  );
}
