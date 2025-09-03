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
  const [token, setToken] = useState<string | null>(() => {
    // Check localStorage when initializing
    if (typeof window !== 'undefined') {
      return localStorage.getItem("authToken");
    }
    return null;
  });
  const [hasAuthError, setHasAuthError] = useState(false);
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: !!token && !hasAuthError,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime)
  });

  // Handle authentication errors by clearing invalid tokens
  useEffect(() => {
    if (error && token && !hasAuthError) {
      console.log("Authentication error detected, clearing token");
      setHasAuthError(true);
      if (typeof window !== 'undefined') {
        localStorage.removeItem("authToken");
      }
      setToken(null);
      queryClient.clear();
    }
  }, [error, token, hasAuthError, queryClient]);

  // Reset auth error when token changes (for retry)
  useEffect(() => {
    if (token && hasAuthError) {
      setHasAuthError(false);
    }
  }, [token, hasAuthError]);

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      return response.json();
    },
    onSuccess: (data) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem("authToken", data.token);
      }
      setToken(data.token);
      setHasAuthError(false);
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("authToken");
      }
      setToken(null);
      setHasAuthError(false);
      queryClient.clear();
    },
  });


  const login = async (email: string, password: string) => {
    try {
      await loginMutation.mutateAsync({ email, password });
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message || "Login mislukt" };
    }
  };

  const logout = () => {
    // Immediate cleanup regardless of API response
    if (typeof window !== 'undefined') {
      localStorage.removeItem("authToken");
    }
    setToken(null);
    setHasAuthError(false);
    queryClient.clear();
    
    // Also try the API logout but don't wait for it
    logoutMutation.mutate();
    
    // Force redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = "/login";
    }
  };

  return {
    user: (user as any)?.user || null,
    loading: isLoading,
    login,
    logout,
  };
}
