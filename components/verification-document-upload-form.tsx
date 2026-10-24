"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import {
  submitMissingVerificationDocumentsAction,
  type VerificationUploadResult,
} from "@/app/verification/actions";
import type { UserRole, VerificationDocumentType } from "@/generated/prisma/enums";
import {
  verificationDocumentGroupsByRole,
  verificationDocumentsByRole,
} from "@/lib/verification-documents";

export function VerificationDocumentUploadForm({
  role,
  missingTypes,
}: {
  role: UserRole;
  missingTypes: VerificationDocumentType[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VerificationUploadResult | null>(null);
  const missingDocuments = verificationDocumentsByRole[role].filter(
    ({ type }) => missingTypes.includes(type),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const response = await submitMissingVerificationDocumentsAction(formData);
      setResult(response);
      if (response.ok) router.refresh();
    });
  }

  if (missingDocuments.length === 0) return null;

  return (
    <form
      className="mt-6 space-y-4 border-t border-border pt-5"
      onSubmit={submit}
    >
      <div>
        <h2 className="font-semibold text-foreground">
          Submit missing verification documents
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a PDF, JPEG, or PNG. Maximum 2 MB per file.
        </p>
      </div>
      {missingDocuments.map((document) => (
        <label
          className="block text-sm font-medium text-foreground"
          key={document.field}
        >
          {document.label}
          <input
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="mt-2 block min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground"
            name={document.field}
            required={verificationDocumentGroupsByRole[role].some(
              (group) => group.length === 1 && group[0] === document.type,
            )}
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
        {isPending ? "Uploading..." : "Submit missing documents"}
      </button>
    </form>
  );
}
