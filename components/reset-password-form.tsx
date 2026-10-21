"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "Could not update password.");
        return;
      }

      setMessage(result.message ?? "Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setError("Request failed. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (message) {
    return (
      <div className="space-y-5">
        <p aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300" role="status">
          {message}
        </p>
        <Link
          className="block w-full rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 py-3.5 text-center font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110"
          href="/login"
        >
          Sign In Now
        </Link>
      </div>
    );
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          htmlFor="new-password"
        >
          New Password
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/15"
          id="new-password"
          maxLength={72}
          minLength={12}
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </div>
      <div>
        <label
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          htmlFor="confirm-password"
        >
          Confirm New Password
        </label>
        <input
          autoComplete="new-password"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/15"
          id="confirm-password"
          maxLength={72}
          minLength={12}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          type="password"
          value={confirmPassword}
        />
      </div>
      {error ? (
        <p aria-live="polite" className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Updating password..." : "Update Password"}
      </button>
    </form>
  );
}
