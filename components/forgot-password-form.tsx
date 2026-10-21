"use client";

import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        setError(result.message ?? "Could not send reset link.");
        return;
      }

      setMessage(
        result.message ?? "If an account exists, please check your email for the reset link.",
      );
    } catch {
      setError("Request failed. Please check your internet connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400"
          htmlFor="reset-email"
        >
          University Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:bg-slate-900 focus:ring-4 focus:ring-cyan-500/15"
          id="reset-email"
          maxLength={254}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@smartcampus.test"
          required
          type="email"
          value={email}
        />
      </div>
      {error ? (
        <p aria-live="polite" className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p aria-live="polite" className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300" role="status">
          {message}
        </p>
      ) : null}
      <button
        className="w-full rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 py-3.5 font-bold text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:brightness-110 focus:outline-none focus:ring-4 focus:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Sending Link..." : "Email Reset Link"}
      </button>
    </form>
  );
}
