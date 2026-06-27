import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  BarChart3, Package, Users, DollarSign, Download, Zap,
  RefreshCw, ShieldAlert, Brain, CheckCircle, XCircle, Loader
} from "lucide-react";
import { authClient } from "../lib/auth";
import { getToken } from "../lib/auth";
import { formatPrice } from "../lib/utils";

function authHeaders() {
  const token = getToken();
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

export default function Admin() {
  const [, navigate] = useLocation();
  const { data: session, isPending } = authClient.useSession();
  const qc = useQueryClient();
  const [seedLog, setSeedLog] = useState<string[]>([]);
  const [genCount, setGenCount] = useState(10);
  const [genCategory, setGenCategory] = useState("electronics");
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "users" | "generate">("overview");

  // Redirect if not admin
  if (!isPending && (!session || (session.user as any)?.role !== "admin")) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <ShieldAlert size={64} className="text-red-400 mb-6" />
        <h1 className="text-2xl font-bold text-white mb-3">Access Denied</h1>
        <p className="text-gray-400 mb-6">You need admin privileges to view this page.</p>
        <Link to="/" className="btn-primary px-6 py-3 rounded-xl font-semibold">Go Home</Link>
      </div>
    );
  }

  const analyticsQuery = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", { headers: authHeaders() });
      return res.json();
    },
    enabled: !!session && (session.user as any)?.role === "admin",
  });

  const ordersQuery = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics", { headers: authHeaders() });
      const data = await res.json();
      return data.recentOrders || [];
    },
    enabled: activeTab === "orders" && !!session,
  });

  const usersQuery = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/users", { headers: authHeaders() });
      return res.json();
    },
    enabled: activeTab === "users" && !!session,
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      setSeedLog(["Starting seed..."]);
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers: authHeaders(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSeedLog((l) => [...l, data.message || "Seed complete!", ...Object.entries(data).filter(([k]) => k !== "message").map(([k, v]) => `${k}: ${JSON.stringify(v)}`)]);
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (err: any) => setSeedLog((l) => [...l, `Error: ${err.message}`]),
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/products/generate-mock", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ count: genCount, category: genCategory }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSeedLog([`Generated ${data.count || genCount} products in ${genCategory}`]);
      qc.invalidateQueries({ queryKey: ["admin-analytics"] });
    },
    onError: (err: any) => setSeedLog([`Error: ${err.message}`]),
  });

  const exportCSV = () => {
    const token = getToken();
    const url = "/api/admin/export-csv";
    const a = document.createElement("a");
    a.href = url;
    a.download = "shopaholics-orders.csv";
    // Fetch with auth header
    fetch(url, { headers: authHeaders() })
      .then((r) => r.blob())
      .then((blob) => {
        const u = URL.createObjectURL(blob);
        a.href = u;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(u);
      });
  };

  const stats = analyticsQuery.data;
  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "orders", label: "Orders", icon: Package },
    { id: "users", label: "Users", icon: Users },
    { id: "generate", label: "Generate", icon: Zap },
  ] as const;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-500 text-sm mt-1">Shopaholics Inc. — Backend control center</p>
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:border-gray-500"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-[#111] p-1 rounded-xl border border-gray-800 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {analyticsQuery.isLoading ? (
              <div className="flex justify-center py-16"><div className="w-10 h-10 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>
            ) : (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Total Revenue", value: formatPrice(stats?.revenue || 0), icon: DollarSign, color: "text-green-400" },
                    { label: "Orders", value: stats?.orders || 0, icon: Package, color: "text-blue-400" },
                    { label: "Products", value: stats?.products || 0, icon: Package, color: "text-purple-400" },
                    { label: "Customers", value: stats?.customers || 0, icon: Users, color: "text-cyan-400" },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="card p-5">
                      <Icon size={22} className={`${color} mb-3`} />
                      <p className="text-gray-400 text-xs mb-1">{label}</p>
                      <p className="text-2xl font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>

                {/* ImpulseCoach stats */}
                {stats?.impulseCoach && (
                  <div className="card p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Brain size={20} className="text-purple-400" />
                      <h3 className="font-bold text-white">ImpulseCoach™ Stats</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.impulseCoach.optedIn}</p>
                        <p className="text-xs text-gray-500 mt-1">Users Opted In</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-white">{stats.impulseCoach.dupesSelected}</p>
                        <p className="text-xs text-gray-500 mt-1">Dupes Selected</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold gradient-text">{formatPrice(stats.impulseCoach.totalSaved)}</p>
                        <p className="text-xs text-gray-500 mt-1">Total Saved</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent orders */}
                <div className="card p-6">
                  <h3 className="font-bold text-white mb-4">Recent Orders</h3>
                  {(stats?.recentOrders || []).length === 0 ? (
                    <p className="text-gray-500 text-sm">No orders yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(stats?.recentOrders || []).map((o: any) => (
                        <div key={o.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0 text-sm">
                          <div>
                            <span className="text-white font-medium">{o.orderNumber}</span>
                            <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                              o.paymentStatus === "paid" ? "bg-green-500/10 text-green-400" :
                              o.paymentStatus === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                              "bg-red-500/10 text-red-400"
                            }`}>{o.paymentStatus}</span>
                          </div>
                          <span className="text-white font-semibold">{formatPrice(o.total)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Seed button */}
                <div className="card p-6">
                  <h3 className="font-bold text-white mb-2">Database Seed</h3>
                  <p className="text-gray-500 text-sm mb-4">Populate categories and sample products for demo/testing.</p>
                  <button
                    onClick={() => seedMutation.mutate()}
                    disabled={seedMutation.isPending}
                    className="flex items-center gap-2 btn-primary px-5 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    {seedMutation.isPending ? <><Loader size={15} className="animate-spin" /> Seeding...</> : <><RefreshCw size={15} /> Run Seed</>}
                  </button>
                  {seedLog.length > 0 && (
                    <div className="mt-4 bg-black/50 rounded-lg p-4 font-mono text-xs text-green-400 space-y-1 max-h-32 overflow-y-auto border border-gray-800">
                      {seedLog.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="card p-6">
            <h3 className="font-bold text-white mb-4">All Recent Orders</h3>
            {ordersQuery.isLoading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left py-2 font-medium">Order #</th>
                      <th className="text-left py-2 font-medium">Status</th>
                      <th className="text-left py-2 font-medium">Payment</th>
                      <th className="text-right py-2 font-medium">Total</th>
                      <th className="text-right py-2 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordersQuery.data?.map((o: any) => (
                      <tr key={o.id} className="border-b border-gray-800/50 hover:bg-white/2">
                        <td className="py-3 text-white font-medium">{o.orderNumber}</td>
                        <td className="py-3 capitalize text-gray-400">{o.status}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            o.paymentStatus === "paid" ? "bg-green-500/10 text-green-400" :
                            o.paymentStatus === "pending" ? "bg-yellow-500/10 text-yellow-400" :
                            "bg-red-500/10 text-red-400"
                          }`}>{o.paymentStatus}</span>
                        </td>
                        <td className="py-3 text-right text-white font-semibold">{formatPrice(o.total)}</td>
                        <td className="py-3 text-right text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {(!ordersQuery.data || ordersQuery.data.length === 0) && (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-600">No orders found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="card p-6">
            <h3 className="font-bold text-white mb-4">Users</h3>
            {usersQuery.isLoading ? (
              <div className="flex justify-center py-8"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>
            ) : (
              <div className="space-y-2">
                {(usersQuery.data?.users || []).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-3 border-b border-gray-800/50">
                    <div>
                      <p className="text-white text-sm font-medium">{u.name || "—"}</p>
                      <p className="text-gray-500 text-xs">{u.email}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      u.role === "admin" ? "bg-purple-500/10 text-purple-400" : "bg-gray-800 text-gray-400"
                    }`}>{u.role}</span>
                  </div>
                ))}
                {(!usersQuery.data?.users || usersQuery.data.users.length === 0) && (
                  <p className="text-gray-600 text-sm text-center py-8">No users found</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Generate Tab */}
        {activeTab === "generate" && (
          <div className="card p-6 max-w-lg">
            <h3 className="font-bold text-white text-lg mb-2">AI Product Generator</h3>
            <p className="text-gray-500 text-sm mb-6">Generate realistic product listings using AI for any category.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Category</label>
                <select
                  value={genCategory}
                  onChange={(e) => setGenCategory(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                >
                  {["electronics", "smart-home", "fashion", "kids-baby", "beauty-health", "home-kitchen", "automotive-tools", "pets-outdoors", "arts-crafts", "travel-luggage"].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Number of Products</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={genCount}
                  onChange={(e) => setGenCount(parseInt(e.target.value) || 10)}
                  className="w-full bg-[#1a1a1a] border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <button
                onClick={() => { setSeedLog([]); generateMutation.mutate(); }}
                disabled={generateMutation.isPending}
                className="w-full btn-primary py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generateMutation.isPending ? <><Loader size={16} className="animate-spin" /> Generating...</> : <><Zap size={16} /> Generate Products</>}
              </button>
              {seedLog.length > 0 && (
                <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-green-400 space-y-1 max-h-32 overflow-y-auto border border-gray-800">
                  {seedLog.map((l, i) => <div key={i}>{l}</div>)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
