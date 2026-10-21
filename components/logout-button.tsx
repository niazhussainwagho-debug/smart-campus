"use client";

import { signOut } from "next-auth/react";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      className={
        className ??
        "flex items-center gap-2 rounded-xl border border-slate-700/80 bg-slate-800/60 px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:border-rose-500/50 hover:bg-rose-950/30 hover:text-rose-400"
      }
      onClick={() => signOut({ redirectTo: "/login" })}
      type="button"
      title="Sign Out"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Sign Out
    </button>
  );
}
