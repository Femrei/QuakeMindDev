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
  login: (role: UserRole, email?: string) => void;
  logout: () => void;
  notificationsCount: number;
  setNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<UserRole>("responder");
  const [user, setUser] = useState<UserProfile | null>({
    id: "user-101",
    name: "Afet Saha Ekibi",
    email: "saha@quakemind.gov.tr",
    role: "responder",
    city: "Hatay",
    unit: "Arama Kurtarma Lideri",
  });
  const [notificationsCount, setNotificationsCount] = useState<number>(3);

  const login = (newRole: UserRole, email = "user@quakemind.org") => {
    setRole(newRole);
    setUser({
      id: "usr-" + Math.random().toString(36).substr(2, 6),
      name: newRole === "survivor" ? "Afetzede Kullanıcı" : "Arama Kurtarma Ekibi",
      email: email,
      role: newRole,
      city: "Hatay",
      unit: newRole === "responder" ? "Operasyon Merkezi" : "Sivil",
    });
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        login,
        logout,
        notificationsCount,
        setNotificationsCount,
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
