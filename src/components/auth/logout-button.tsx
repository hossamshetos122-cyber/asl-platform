"use client";

import { logoutAction } from "@/lib/actions/auth";

export function LogoutButton({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <form action={logoutAction}>
      <button type="submit" className={className}>{children}</button>
    </form>
  );
}
