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
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10";

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
        className="mt-4 grid grid-cols-3 gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1"
        role="tablist"
      >
        {(["STUDENT", "TEACHER", "ADMIN"] as const).map((item) => (
          <button
            aria-selected={role === item}
            className={`min-h-10 rounded-lg px-3 py-2 text-xs font-bold transition ${
              role === item
                ? "bg-white text-[#2563eb] shadow-sm border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
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
              ? "🎓 Student"
              : item === "TEACHER"
                ? "👨‍🏫 Teacher"
                : "🛡️ Admin"}
          </button>
        ))}
      </div>

      <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="min-w-0 text-xs font-semibold text-slate-700">
          Full Name
          <input
            autoComplete="name"
            className={fieldClass}
            maxLength={120}
            name="name"
            placeholder="Muhammad Ali"
            required
          />
        </label>
        <label className="min-w-0 text-xs font-semibold text-slate-700">
          University Email
          <input
            autoComplete="email"
            className={fieldClass}
            maxLength={254}
            name="email"
            placeholder="ali@smartcampus.test"
            required
            type="email"
          />
        </label>
        <label className="min-w-0 text-xs font-semibold text-slate-700 sm:col-span-2">
          Password
          <input
            autoComplete="new-password"
            className={fieldClass}
            maxLength={72}
            minLength={12}
            name="password"
            placeholder="••••••••••••"
            required
            type="password"
          />
          <span className="mt-1 block text-[11px] font-normal text-slate-500">
            Must be at least 12 characters.
          </span>
        </label>
        <label className="min-w-0 text-xs font-semibold text-slate-700 sm:col-span-2">
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
            <option value="">Select your department...</option>
            {departments.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <div className="space-y-3 sm:col-span-2">
          <p className="text-xs font-bold text-slate-800">
            Required Verification Documents
          </p>
          <p className="text-xs leading-relaxed text-slate-500">
            Upload PDF, JPEG, or PNG (max 2 MB each). Admin verifies your account before portal access.
          </p>
          {verificationDocumentsByRole[role].map((document) => (
            <label
              className="block min-w-0 text-xs font-semibold text-slate-700"
              key={document.field}
            >
              {document.label}
              <input
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="mt-1.5 block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-[#2563eb] hover:file:bg-blue-100 cursor-pointer"
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
            className={`rounded-xl border p-3.5 text-xs font-medium sm:col-span-2 ${
              result.ok
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
            role={result.ok ? "status" : "alert"}
          >
            {result.message}
          </p>
        )}
        <button
          className="min-h-11 rounded-xl bg-[#2563eb] px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#1d4ed8] disabled:cursor-wait disabled:opacity-70 sm:col-span-2"
          disabled={isPending || departments.length === 0}
          type="submit"
        >
          {isPending
            ? "Submitting Application…"
            : role === "STUDENT"
              ? "Create Student Account"
              : role === "TEACHER"
                ? "Submit Teacher Registration"
                : "Submit Admin Application"}
        </button>
      </form>
      {departments.length === 0 && (
        <p className="mt-3 text-xs text-amber-700">
          Registration is unavailable until campus departments are configured.
        </p>
      )}
    </>
  );
}
