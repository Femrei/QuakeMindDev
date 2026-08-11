"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth, UserRole } from "@/context/AuthContext";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRoles: Exclude<UserRole, null>[];
}

/**
 * Wraps protected pages so that:
 *   1. An unauthenticated visitor never sees the protected content -- not
 *      even for one frame -- and is sent to /login?redirect=<original path>.
 *   2. A logged-in user with the wrong role is bounced to their own portal.
 *
 * Waits for AuthContext.ready before deciding "not logged in", since the
 * persisted session loads from localStorage asynchronously on mount --
 * deciding on `user === null` before that finishes would incorrectly kick
 * out an already-logged-in visitor.
 *
 * This is a UI-level guard only. It stops the page from *rendering*
 * protected content in the browser; it does not and cannot make an API
 * call secure. Every sensitive endpoint must independently verify the
 * caller's token/role server-side (see backend `_require_role`) -- a
 * client-side guard can always be bypassed by calling the API directly.
 */
export default function RouteGuard({ children, allowedRoles }: RouteGuardProps) {
  const { user, role, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!ready) return; // still checking the persisted session

    if (!user || !role) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!allowedRoles.includes(role)) {
      router.replace(role === "survivor" ? "/survivor" : "/command");
    }
  }, [ready, user, role, allowedRoles, router, pathname]);

  const authorized = ready && !!user && !!role && allowedRoles.includes(role);

  if (!authorized) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p>Yetki kontrol ediliyor...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
