"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  submitAdminRequestAction,
  type AdminRequestResult,
} from "@/app/admin-request/actions";
import { adminVerificationDocuments } from "@/lib/admin-verification";

const inputClass =
  "mt-2 block min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground";

export function AdminRequestForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AdminRequestResult | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const response = await submitAdminRequestAction(formData);
      setResult(response);
      if (response.ok) form.reset();
    });
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-7"
      onSubmit={submit}
    >
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Submit verification documents
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a clear PDF, JPEG, or PNG for each item. Maximum 2 MB per file.
        </p>
      </div>
      {adminVerificationDocuments.map((document) => (
        <label
          className="block text-sm font-semibold text-foreground"
          key={document.field}
        >
          {document.label}
          <input
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className={inputClass}
            name={document.field}
            required
            type="file"
          />
        </label>
      ))}
      {result ? (
        <p
          aria-live="polite"
          className={`rounded-xl border p-3 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
          role={result.ok ? "status" : "alert"}
        >
          {result.message}
        </p>
      ) : null}
      <button
        className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Submitting documents..." : "Submit for Admin Review"}
      </button>
    </form>
  );
}
