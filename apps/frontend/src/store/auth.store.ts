import { create } from "zustand";
import { apiFetch } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  fetchUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const res = await apiFetch("/auth/me");
      if (!res.ok) { set({ user: null }); return; }
      const user = await res.json();
      set({ user });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    const res = await fetch(`${API}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    set({ user: null });
    // Redirect to Keycloak logout so SSO session is cleared too
    if (data.logoutUrl) window.location.href = data.logoutUrl;
    else window.location.href = "/login";
  },
}));
