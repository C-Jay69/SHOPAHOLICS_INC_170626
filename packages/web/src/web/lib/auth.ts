import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "http://localhost:4200",
});

export const { signIn, signUp, signOut, useSession } = authClient;

// Token helpers — better-auth uses cookies/sessions so these are stubs
// kept for compatibility with pages that import them
let _token: string | null = null;

export function getToken(): string | null {
  return _token;
}

export function captureToken(response: any): any {
  // Extract bearer token from response headers if present
  if (response?.headers) {
    const auth = response.headers.get?.("authorization") || response.headers.get?.("set-cookie");
    if (auth) _token = auth.replace("Bearer ", "");
  }
  return response;
}

export function clearToken() {
  _token = null;
}
