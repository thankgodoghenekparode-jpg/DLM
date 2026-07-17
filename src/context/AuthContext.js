"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { ROLE_PERMISSIONS, PORTAL_ROLES } from "@/lib/constants";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getSession()?.user || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(false);
  }, []);

  const login = useCallback(async (identifier, password, endpoint = "/auth/company/login") => {
    const data = await api.post(endpoint, { identifier, password });
    api.setSession(data.accessToken, data.refreshToken, data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = api.getRefreshToken();
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch {
      // ignore logout errors
    }
    api.clearSession();
    setUser(null);
  }, []);

  const fetchMe = useCallback(async () => {
    const data = await api.get("/auth/me");
    const session = api.getSession();
    if (session) {
      api.setSession(session.accessToken, session.refreshToken, data);
    }
    setUser(data);
    return data;
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    return api.post("/auth/change-password", { currentPassword, newPassword });
  }, []);

  const forgotPassword = useCallback(async (identifier) => {
    return api.post("/auth/forgot-password", { identifier });
  }, []);

  const resetPassword = useCallback(async (token, newPassword) => {
    return api.post("/auth/reset-password", { token, newPassword });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch {
      return user;
    }
  }, [user]);

  const isAuthenticated = !!user;

  const hasRole = useCallback((role) => user?.role === role, [user]);

  const hasAnyRole = useCallback((roles) => roles.includes(user?.role), [user]);

  const hasPermission = useCallback((permission) => {
    if (!user?.role) return false;
    const perms = ROLE_PERMISSIONS[user.role] || [];
    return perms.includes(permission);
  }, [user]);

  const canAccessPortal = useCallback((portal) => {
    if (!user?.role) return false;
    const roles = PORTAL_ROLES[portal] || [];
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchMe, changePassword, forgotPassword, resetPassword, refreshUser, isAuthenticated, hasRole, hasAnyRole, hasPermission, canAccessPortal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
