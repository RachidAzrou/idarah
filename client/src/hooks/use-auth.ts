import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { type User } from "@shared/schema";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [token, setToken] = useState<string | null>(localStorage.getItem("authToken"));
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("authToken", data.token);
      setToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      localStorage.removeItem("authToken");
      setToken(null);
      queryClient.clear();
    },
  });

  // Set authorization header for requests
  useEffect(() => {
    if (token) {
      const originalRequest = apiRequest;
      // Override apiRequest to include authorization header
      (window as any).apiRequest = async (method: string, url: string, data?: unknown) => {
        const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(url, {
          method,
          headers,
          body: data ? JSON.stringify(data) : undefined,
          credentials: "include",
        });

        if (!res.ok) {
          const text = (await res.text()) || res.statusText;
          throw new Error(`${res.status}: ${text}`);
        }
        return res;
      };
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || "Login mislukt" };
    }
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: (user as User) || null,
    loading: isLoading,
    login,
    logout,
  };
}
