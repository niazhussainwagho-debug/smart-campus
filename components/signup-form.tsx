"use client";

import { useState, useTransition, type FormEvent } from "react";
import { registerAccountAction } from "@/app/signup/actions";
import type { RegistrationResult } from "@/app/signup/actions";
import {
  verificationDocumentGroupsByRole,
  verificationDocumentsByRole,
} from "@/lib/verification-documents";

type SignupTarget = {
  department: string;
};

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2.5 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 sm:text-sm";

export function SignupForm({ targets }: { targets: SignupTarget[] }) {
  const [role, setRole] = useState<"STUDENT" | "TEACHER" | "ADMIN">("STUDENT");
  const [department, setDepartment] = useState("");
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const departments = [...new Set(targets.map((target) => target.department))];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("role", role);
    startTransition(async () => {
      const response = await registerAccountAction(formData);
      setResult(response);
      if (response.ok) {
        form.reset();
        setDepartment("");
      }
    });
  }

  return (
    <>
      <div
        aria-label="Account type"
        className="mt-6 grid grid-cols-3 gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-1"
        role="tablist"
      >
        {(["STUDENT", "TEACHER", "ADMIN"] as const).map((item) => (
          <button
            aria-selected={role === item}
            className={`min-h-10 rounded-lg px-3 py-2 text-sm font-semibold transition ${
              role === item
                ? "border border-cyan-500/30 bg-cyan-500/15 text-cyan-300"
                : "text-slate-400 hover:text-white"
            }`}
            key={item}
            onClick={() => {
              setRole(item);
              setResult(null);
            }}
            role="tab"
            type="button"
          >
            {item === "STUDENT"
              ? "Student"
              : item === "TEACHER"
                ? "Teacher"
                : "Admin"}
          </button>
        ))}
      </div>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Full name
          <input
            autoComplete="name"
            className={fieldClass}
            maxLength={120}
            name="name"
            required
          />
        </label>
        <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
          University email
          <input
            autoComplete="email"
            className={fieldClass}
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </label>
        <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:col-span-2">
          Password
          <input
            autoComplete="new-password"
            className={fieldClass}
            maxLength={72}
            minLength={12}
            name="password"
            required
            type="password"
          />
          <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-slate-500">
            Use 12–72 characters.
          </span>
        </label>
        <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Department
          <select
            className={fieldClass}
            name="department"
            onChange={(event) => {
              setDepartment(event.target.value);
            }}
            required
            value={department}
          >
            <option value="">Select department</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-3 sm:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Required verification documents
          </p>
          <p className="text-xs leading-relaxed text-slate-500">
            Upload a PDF, JPEG, or PNG file (maximum 2 MB each). Students and
            teachers must provide at least one listed document; Admin
            applicants must provide all three. Dashboard access follows
            administrator verification.
          </p>
          {verificationDocumentsByRole[role].map((document) => (
            <label
              className="block min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400"
              key={document.field}
            >
              {document.label}
              <input
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className={fieldClass}
                name={document.field}
                required={verificationDocumentGroupsByRole[role].some(
                  (group) =>
                    group.length === 1 && group[0] === document.type,
                )}
                type="file"
              />
            </label>
          ))}
        </div>
        {result && (
          <p
            aria-live="polite"
            className={`rounded-xl border p-3 text-sm sm:col-span-2 ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
            role={result.ok ? "status" : "alert"}
          >
            {result.message}
          </p>
        )}
        <button
          className="min-h-12 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
          disabled={isPending || departments.length === 0}
          type="submit"
        >
          {isPending
            ? "Submitting…"
            : role === "STUDENT"
              ? "Create student account"
              : role === "TEACHER"
                ? "Submit teacher request"
                : "Submit Admin request"}
        </button>
      </form>
      {departments.length === 0 && (
        <p className="mt-3 text-sm text-amber-300">
          Registration is unavailable until campus departments are configured.
        </p>
      )}
    </>
  );
}
