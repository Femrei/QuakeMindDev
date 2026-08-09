"use client";

import RouteGuard from "@/components/auth/RouteGuard";

/** Every page under /survivor/* requires a "survivor" session. */
export default function SurvivorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RouteGuard allowedRoles={["survivor"]}>
      {children}
    </RouteGuard>
  );
}
