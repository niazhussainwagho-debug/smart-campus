"use client";

import { useState, useTransition, type FormEvent } from "react";
import { registerAccountAction } from "@/app/signup/actions";
import type { RegistrationResult } from "@/app/signup/actions";

type SignupTarget = {
  department: string;
  semester: number;
};

const fieldClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2.5 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 sm:text-sm";

export function SignupForm({ targets }: { targets: SignupTarget[] }) {
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [department, setDepartment] = useState("");
  const [semester, setSemester] = useState("");
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const departments = [...new Set(targets.map((target) => target.department))];
  const semesters = [
    ...new Set(
      targets
        .filter((target) => target.department === department)
        .map((target) => target.semester),
    ),
  ].sort((first, second) => first - second);

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
        setSemester("");
      }
    });
  }

  return (
    <>
      <div
        aria-label="Account type"
        className="mt-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-800 bg-slate-900/70 p-1"
        role="tablist"
      >
        {(["STUDENT", "TEACHER"] as const).map((item) => (
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
            {item === "STUDENT" ? "Student" : "Teacher"}
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
              setSemester("");
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
        {role === "STUDENT" ? (
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Semester
            <select
              className={fieldClass}
              disabled={!department}
              name="semester"
              onChange={(event) => setSemester(event.target.value)}
              required
              value={semester}
            >
              <option value="">Select semester</option>
              {semesters.map((semester) => (
                <option key={semester} value={semester}>
                  Semester {semester}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="self-center text-xs leading-relaxed text-slate-400">
            Teacher registration requests remain pending until an administrator approves them.
          </p>
        )}
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
              : "Submit teacher request"}
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
