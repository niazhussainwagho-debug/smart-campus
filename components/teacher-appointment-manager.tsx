"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { AppointmentStatus } from "@/generated/prisma/enums";
import {
  approveAppointmentAction,
  rejectAppointmentAction,
  rescheduleAppointmentAction,
  type TeacherAppointmentActionResult,
} from "@/app/teacher/appointments/actions";

export type TeacherAppointmentRow = {
  id: string;
  studentName: string;
  studentEmail: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  note: string | null;
};

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  RESCHEDULED: "Rescheduled",
  REJECTED: "Rejected",
};

function todayLocal(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function formatDate(value: string): string {
  return new Date(`${value}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

export function TeacherAppointmentManager({
  appointments,
}: {
  appointments: TeacherAppointmentRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] =
    useState<TeacherAppointmentActionResult | null>(null);

  function runAction(
    action: (
      formData: FormData,
    ) => Promise<TeacherAppointmentActionResult>,
    formData: FormData,
  ) {
    startTransition(async () => {
      const response = await action(formData);
      setResult(response);
      if (response.ok) {
        router.refresh();
      }
    });
  }

  function submitReschedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runAction(
      rescheduleAppointmentAction,
      new FormData(event.currentTarget),
    );
  }

  return (
    <div className="space-y-6">
      {result ? (
        <div
          aria-live="polite"
          className={`rounded-xl border p-4 text-xs font-medium ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}
          role={result.ok ? "status" : "alert"}
        >
          <p className="font-semibold">{result.message}</p>
          {result.timetableWarning ? (
            <p className="mt-1 text-slate-300">
              Notice: You also have a scheduled class in your timetable at this time. The appointment was still updated.
            </p>
          ) : null}
        </div>
      ) : null}

      {appointments.length ? (
        appointments.map((appointment) => {
          const isPendingRequest = appointment.status === "PENDING";
          const canReschedule = appointment.status !== "REJECTED";
          const idFormData = new FormData();
          idFormData.set("id", appointment.id);

          const statusColors = {
            PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
            APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
            RESCHEDULED: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
            REJECTED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
          }[appointment.status];

          return (
            <article
              className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-6 shadow-xl backdrop-blur-md"
              key={appointment.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-white">
                    {appointment.studentName}
                  </h2>
                  {appointment.studentEmail ? (
                    <p className="text-xs text-slate-400">
                      {appointment.studentEmail}
                    </p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-300">
                    <span className="font-semibold text-slate-400">Scheduled:</span> {formatDate(appointment.date)} ·{" "}
                    <span className="font-bold text-cyan-400">{appointment.startTime} – {appointment.endTime}</span>
                  </p>
                  {appointment.note ? (
                    <p className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-300">
                      <span className="font-semibold text-slate-400">Student Note:</span> {appointment.note}
                    </p>
                  ) : null}
                </div>
                <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusColors}`}>
                  {statusLabels[appointment.status]}
                </span>
              </div>

              {isPendingRequest ? (
                <div className="mt-5 flex flex-wrap gap-2.5 border-t border-slate-800/80 pt-4">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => runAction(approveAppointmentAction, idFormData)}
                    type="button"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Approve Request
                  </button>
                  <button
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => runAction(rejectAppointmentAction, idFormData)}
                    type="button"
                  >
                    Reject
                  </button>
                </div>
              ) : null}

              {canReschedule ? (
                <details className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                  <summary className="cursor-pointer text-xs font-bold uppercase tracking-wider text-cyan-400 hover:text-cyan-300">
                    Propose Alternative Time (Reschedule)
                  </summary>
                  <form
                    className="mt-4 grid gap-4 sm:grid-cols-3"
                    onSubmit={submitReschedule}
                  >
                    <input name="id" type="hidden" value={appointment.id} />
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      New Date
                      <input
                        className={inputClass}
                        defaultValue={appointment.date}
                        min={todayLocal()}
                        name="date"
                        required
                        type="date"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      New Start Time
                      <input
                        className={inputClass}
                        name="startTime"
                        required
                        type="time"
                      />
                    </label>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      New End Time
                      <input
                        className={inputClass}
                        name="endTime"
                        required
                        type="time"
                      />
                    </label>
                    <button
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-xs font-bold text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50 sm:col-span-3 sm:w-auto"
                      disabled={isPending}
                    >
                      {isPending ? "Validating & Rescheduling..." : "Confirm Rescheduled Slot"}
                    </button>
                  </form>
                </details>
              ) : null}
            </article>
          );
        })
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-5 py-12 text-center text-xs text-slate-500">
          You do not have any appointment requests at this moment.
        </div>
      )}
    </div>
  );
}
