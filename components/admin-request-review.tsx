"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  reviewAdminRequestAction,
  type AdminReviewResult,
} from "@/app/admin/requests/actions";

type AdminRequest = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  role: "STUDENT" | "TEACHER";
  createdAt: string;
  documents: string[];
};

const documentLabels = ["Appointment Letter", "CNIC", "ID Card"];

export function AdminRequestReview({
  requests,
}: {
  requests: AdminRequest[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AdminReviewResult | null>(null);

  function decide(id: string, decision: "APPROVED" | "REJECTED") {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("decision", decision);
    startTransition(async () => {
      const result = await reviewAdminRequestAction(formData);
      setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-lg sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Pending Admin requests
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Verify the submitted appointment letter and identity documents.
          </p>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-300">
          {requests.length} pending
        </span>
      </div>

      {notice ? (
        <p
          aria-live="polite"
          className={`mt-4 rounded-xl border p-3 text-sm ${
            notice.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
          role={notice.ok ? "status" : "alert"}
        >
          {notice.message}
        </p>
      ) : null}

      {requests.length ? (
        <ul className="mt-5 divide-y divide-border">
          {requests.map((request) => (
            <li className="space-y-4 py-5 first:pt-0 last:pb-0" key={request.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {request.name}
                  </h3>
                  <p className="break-all text-sm text-muted-foreground">
                    {request.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.role} · {request.department ?? "No department"} ·
                    Submitted{" "}
                    {new Date(request.createdAt).toLocaleString([], {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="min-h-10 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-500/20 disabled:opacity-60 dark:text-emerald-300"
                    disabled={isPending}
                    onClick={() => decide(request.id, "APPROVED")}
                    type="button"
                  >
                    Approve
                  </button>
                  <button
                    className="min-h-10 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-500/20 disabled:opacity-60 dark:text-rose-300"
                    disabled={isPending}
                    onClick={() => decide(request.id, "REJECTED")}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              </div>
              <ul className="flex flex-wrap gap-2" aria-label="Submitted documents">
                {request.documents.map((url, index) => (
                  <li key={url}>
                    <a
                      className="inline-flex min-h-10 items-center rounded-lg border border-border px-3 py-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                      href={url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View {documentLabels[index] ?? `document ${index + 1}`}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          There are no pending Admin verification requests.
        </p>
      )}
    </section>
  );
}
