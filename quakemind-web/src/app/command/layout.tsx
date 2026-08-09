"use client";

import RouteGuard from "@/components/auth/RouteGuard";

/** Every page under /command/* requires a "responder" or "admin" session. */
export default function CommandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={["responder", "admin"]}>
      {children}
    </RouteGuard>
  );
}
