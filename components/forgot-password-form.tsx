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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-1.5 block text-xs font-semibold text-slate-700"
          htmlFor="reset-email"
        >
          University Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10"
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
        <p aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p aria-live="polite" className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs font-medium text-green-700" role="status">
          {message}
        </p>
      ) : null}

      <button
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-[#2563eb] py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Sending Link..." : "Email Reset Link"}
      </button>
    </form>
  );
}
