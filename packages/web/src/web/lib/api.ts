const BASE = "";

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export const api = {
  // Products
  getProducts: (params?: Record<string, string>) => {
    const q = params ? "?" + new URLSearchParams(params).toString() : "";
    return req<any>(`/api/products${q}`);
  },
  getProduct: (id: number) => req<any>(`/api/products/${id}`),
  getProductDupes: (id: number) => req<any>(`/api/products/${id}/dupes`),
  getSearchSuggestions: (q: string) => req<any>(`/api/products/search-suggestions?q=${encodeURIComponent(q)}`),

  // Categories
  getCategories: () => req<any>("/api/categories"),
  getCategory: (slug: string) => req<any>(`/api/categories/${slug}`),

  // Cart
  getCart: () => req<any>("/api/cart"),
  addToCart: (productId: number, quantity: number, color?: string, size?: string) =>
    req<any>("/api/cart", { method: "POST", body: JSON.stringify({ productId, quantity, selectedColor: color, selectedSize: size }) }),
  updateCartItem: (id: number, quantity: number) =>
    req<any>(`/api/cart/${id}`, { method: "PUT", body: JSON.stringify({ quantity }) }),
  removeCartItem: (id: number) => req<any>(`/api/cart/${id}`, { method: "DELETE" }),
  clearCart: () => req<any>("/api/cart", { method: "DELETE" }),

  // Orders
  getOrders: () => req<any>("/api/orders"),
  getOrder: (id: number) => req<any>(`/api/orders/${id}`),
  createCheckoutSession: (items: any[], shippingAddress: any, email?: string) =>
    req<any>("/api/orders/checkout-session", { method: "POST", body: JSON.stringify({ items, shippingAddress, email }) }),
  getOrderBySession: (sessionId: string) => req<any>(`/api/orders/success/${sessionId}`),

  // Reviews
  getReviews: (productId: number) => req<any>(`/api/reviews?productId=${productId}`),
  addReview: (data: any) => req<any>("/api/reviews", { method: "POST", body: JSON.stringify(data) }),

  // Impulse Coach
  getImpulseCoach: () => req<any>("/api/impulse"),
  optInImpulse: () => req<any>("/api/impulse/opt-in", { method: "POST" }),
  optOutImpulse: () => req<any>("/api/impulse/opt-out", { method: "POST" }),
  trackImpulseEvent: (event: string, productId?: number, savedAmount?: number) =>
    req<any>("/api/impulse/track", { method: "POST", body: JSON.stringify({ event, productId, savedAmount }) }),

  // Users
  getMe: () => req<any>("/api/users/me"),
  getWishlist: () => req<any>("/api/users/wishlist"),
  toggleWishlist: (productId: number) => req<any>(`/api/users/wishlist/${productId}`, { method: "POST" }),
  getAddresses: () => req<any>("/api/users/addresses"),
  addAddress: (data: any) => req<any>("/api/users/addresses", { method: "POST", body: JSON.stringify(data) }),
  deleteAddress: (id: number) => req<any>(`/api/users/addresses/${id}`, { method: "DELETE" }),

  // Auth
  signUp: (email: string, password: string, name: string) =>
    req<any>("/api/auth/sign-up/email", { method: "POST", body: JSON.stringify({ email, password, name }) }),
  signIn: (email: string, password: string) =>
    req<any>("/api/auth/sign-in/email", { method: "POST", body: JSON.stringify({ email, password }) }),
  signOut: () => req<any>("/api/auth/sign-out", { method: "POST" }),
  getSession: () => req<any>("/api/auth/get-session"),

  // Admin
  getAnalytics: () => req<any>("/api/admin/analytics"),
  getAdminOrders: () => req<any>("/api/admin/orders"),
  updateOrderStatus: (id: number, status: string) =>
    req<any>(`/api/admin/orders/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  getAdminUsers: () => req<any>("/api/admin/users"),
  seedDatabase: () => req<any>("/api/admin/seed", { method: "POST" }),
  seedAdmin: () => req<any>("/api/admin/seed-admin", { method: "POST" }),
  generateMockProducts: (categoryId: number, count: number) =>
    req<any>("/api/products/generate-mock", { method: "POST", body: JSON.stringify({ categoryId, count }) }),
  exportCsv: () => fetch("/api/admin/export-csv", { credentials: "include" }),
};
