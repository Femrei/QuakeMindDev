"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "survivor" | "responder" | "admin" | null;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  unit?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  setRole: (role: UserRole) => void;
  login: (role: UserRole, email?: string, name?: string) => void;
  loginWithProfile: (profile: UserProfile, token?: string) => void;
  logout: () => void;
  notificationsCount: number;
  setNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
  token: string | null;
  /** True once the localStorage-persisted session has been checked. Route
   * guards must wait for this before deciding "not logged in" -- otherwise
   * an already-logged-in visitor gets bounced during the brief window before
   * the persisted session loads. */
  ready: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Start signed-out until the localStorage check below resolves -- a brand-new
  // visitor must never appear pre-authenticated as a responder.
  const [role, setRoleState] = useState<UserRole>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [notificationsCount, setNotificationsCount] = useState<number>(0);
  const [ready, setReady] = useState(false);

  // Load persisted auth from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("quakemind_user");
      const savedRole = localStorage.getItem("quakemind_role") as UserRole;
      const savedToken = localStorage.getItem("quakemind_token");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        setRoleState(parsed.role || savedRole || "responder");
      }
      if (savedToken) setToken(savedToken);
    } catch (e) {
      console.warn("Error loading persisted auth state:", e);
    } finally {
      setReady(true);
    }
  }, []);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
      try {
        localStorage.setItem("quakemind_user", JSON.stringify(updated));
        if (newRole) localStorage.setItem("quakemind_role", newRole);
      } catch (e) {}
    }
  };

  const loginWithProfile = (profile: UserProfile, newToken?: string) => {
    setUser(profile);
    setRoleState(profile.role);
    if (newToken) setToken(newToken);
    try {
      localStorage.setItem("quakemind_user", JSON.stringify(profile));
      if (profile.role) localStorage.setItem("quakemind_role", profile.role);
      if (newToken) localStorage.setItem("quakemind_token", newToken);
    } catch (e) {}
  };

  const login = (newRole: UserRole, email = "user@quakemind.org", name?: string) => {
    const profile: UserProfile = {
      id: "usr-" + Math.random().toString(36).substring(2, 8),
      name: name || (newRole === "survivor" ? "Afetzede Vatandaş" : "Arama Kurtarma Ekibi"),
      email: email,
      role: newRole,
      city: "Hatay",
      unit: newRole === "responder" ? "Arama Kurtarma Operatörü" : "Sivil Afetzede",
    };
    loginWithProfile(profile, "demo-token-" + profile.id);
  };

  const logout = () => {
    setUser(null);
    setRoleState(null);
    setToken(null);
    try {
      localStorage.removeItem("quakemind_user");
      localStorage.removeItem("quakemind_role");
      localStorage.removeItem("quakemind_token");
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        login,
        loginWithProfile,
        logout,
        notificationsCount,
        setNotificationsCount,
        token,
        ready,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
