"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";

const isHosted = process.env.NEXT_PUBLIC_APP_MODE === "hosted";

export function AuthButtons() {
  const { data: session, status } = useSession();

  if (!isHosted || status === "loading") return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="flex items-center gap-1.5 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Sign in"
      >
        <LogIn size={15} />
        <span>Sign in</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {session.user?.image ? (
        // eslint-disable-next-line @next/next-intl/no-raw-text
        <img
          src={session.user.image}
          alt={session.user.name ?? "User"}
          className="w-6 h-6 rounded-full"
        />
      ) : (
        <User size={15} className="opacity-60" />
      )}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Sign out"
      >
        <LogOut size={13} />
      </button>
    </div>
  );
}
