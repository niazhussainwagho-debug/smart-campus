"use client";

import { useState, type FormEvent } from "react";
import { getSession, signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardPath } from "@/lib/roles";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@smartcampus.test");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (!result?.ok || result.error) {
        if (result?.code === "account-pending") {
          setError("Account pending admin approval");
          return;
        }
        setError("Incorrect email or password. Please try again.");
        return;
      }

      const session = await getSession();

      if (!session?.user?.role) {
        setError(
          "Signed in, but the session could not be loaded. Please try again.",
        );
        return;
      }

      router.replace(getDashboardPath(session.user.role));
      router.refresh();
    } catch {
      setError(
        "Login failed. Please check your internet connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {/* Email field */}
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          htmlFor="email"
        >
          University Email
        </label>
        <div className="relative">
          {/* Mail icon */}
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </span>
          <input
            autoComplete="email"
            className="min-h-11 w-full max-w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-3 pl-10 pr-4 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/15 sm:text-sm"
            id="email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@smartcampus.test"
            required
            type="email"
            value={email}
          />
        </div>
      </div>

      {/* Password field */}
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          htmlFor="password"
        >
          Password
        </label>
        <div className="relative">
          {/* Lock icon */}
          <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <input
            autoComplete="current-password"
            className="min-h-11 w-full max-w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-3 pl-10 pr-11 text-base text-white outline-none transition-all placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/15 sm:text-sm"
            id="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          {/* Eye toggle */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        <div className="mt-2 text-right">
          <Link
            className="text-xs font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
            href="/forgot-password"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {/* Error message */}
      {error ? (
        <div
          aria-live="polite"
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3"
        >
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="text-sm text-rose-300">{error}</p>
        </div>
      ) : null}

      {/* Submit button */}
      <button
        className="relative flex min-h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/40 border-t-slate-950"
            />
            Authenticating...
          </>
        ) : (
          <>
            Sign In to Portal
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-sm text-slate-400">
        New to CAMPUS.OS?{" "}
        <Link
          className="font-semibold text-cyan-400 transition-colors hover:text-cyan-300"
          href="/signup"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
