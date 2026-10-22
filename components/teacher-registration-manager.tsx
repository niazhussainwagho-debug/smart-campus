"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  updateTeacherRegistrationAction,
  type TeacherApprovalResult,
} from "@/app/admin/teachers/actions";

type PendingTeacher = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  createdAt: string;
};

export function TeacherRegistrationManager({
  teachers,
}: {
  teachers: PendingTeacher[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<TeacherApprovalResult | null>(null);

  function submitDecision(id: string, status: "APPROVED" | "REJECTED") {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("status", status);
    startTransition(async () => {
      const result = await updateTeacherRegistrationAction(formData);
      setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-[#111827]/90 p-4 shadow-xl sm:p-6">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-bold text-white">
            Pending teacher requests
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Approve requests to enable teacher sign-in, or reject them.
          </p>
        </div>
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
          {teachers.length} pending
        </span>
      </div>
      {notice && (
        <p
          aria-live="polite"
          className={`mt-4 text-sm ${
            notice.ok ? "text-emerald-300" : "text-rose-300"
          }`}
          role={notice.ok ? "status" : "alert"}
        >
          {notice.message}
        </p>
      )}
      {teachers.length ? (
        <ul className="mt-4 divide-y divide-slate-800/80">
          {teachers.map((teacher) => (
            <li
              className="flex min-w-0 flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              key={teacher.id}
            >
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-white">
                  {teacher.name}
                </h3>
                <p className="break-all text-sm text-slate-400">{teacher.email}</p>
                <p className="mt-1 break-words text-xs text-slate-500">
                  {teacher.department ?? "Department not provided"} · Requested{" "}
                  {new Date(teacher.createdAt).toLocaleString([], {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="min-h-10 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-60"
                  disabled={isPending}
                  onClick={() => submitDecision(teacher.id, "APPROVED")}
                  type="button"
                >
                  Approve
                </button>
                <button
                  className="min-h-10 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-60"
                  disabled={isPending}
                  onClick={() => submitDecision(teacher.id, "REJECTED")}
                  type="button"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
          No pending teacher registration requests.
        </p>
      )}
    </section>
  );
}
