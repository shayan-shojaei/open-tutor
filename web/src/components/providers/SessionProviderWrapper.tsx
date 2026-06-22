"use client";

import { SessionProvider } from "next-auth/react";

const isHosted = process.env.NEXT_PUBLIC_APP_MODE === "hosted";

export function SessionProviderWrapper({ children }: { children: React.ReactNode }) {
  if (!isHosted) return <>{children}</>;
  return <SessionProvider>{children}</SessionProvider>;
}
