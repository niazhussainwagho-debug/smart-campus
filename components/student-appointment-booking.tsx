"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import type {
  AppointmentStatus,
  DayOfWeek,
} from "@/generated/prisma/enums";
import {
  cancelAppointmentAction,
  requestAppointmentAction,
  type StudentAppointmentActionResult,
} from "@/app/student/appointments/actions";

export type AppointmentAvailabilityRow = {
  id: string;
  teacherId: string;
  teacherName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
};

export type StudentAppointmentRow = {
  id: string;
  teacherName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  note: string | null;
};

const days: { value: DayOfWeek; label: string }[] = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  RESCHEDULED: "Rescheduled",
  REJECTED: "Cancelled / Rejected",
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

function todayLocal(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function weekdayForDate(date: string): DayOfWeek | null {
  if (!date) {
    return null;
  }
  const weekdays: DayOfWeek[] = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
  ];
  return weekdays[new Date(`${date}T00:00:00.000Z`).getUTCDay()] ?? null;
}

function formatDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function StudentAppointmentBooking({
  teachers,
  availability,
  appointments,
}: {
  teachers: { id: string; name: string }[];
  availability: AppointmentAvailabilityRow[];
  appointments: StudentAppointmentRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [teacherId, setTeacherId] = useState("");
  const [date, setDate] = useState("");
  const [availabilityId, setAvailabilityId] = useState("");
  const [result, setResult] =
    useState<StudentAppointmentActionResult | null>(null);

  const weekday = weekdayForDate(date);
  const freeSlots = useMemo(
    () =>
      availability.filter(
        (slot) =>
          slot.teacherId === teacherId && slot.dayOfWeek === weekday,
      ),
    [availability, teacherId, weekday],
  );
  const selectedFreeSlot = freeSlots.find(
    (slot) => slot.id === availabilityId,
  );

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await requestAppointmentAction(formData);
      setResult(response);
      if (response.ok) {
        form.reset();
        setTeacherId("");
        setDate("");
        setAvailabilityId("");
        router.refresh();
      }
    });
  }

  function cancelRequest(id: string) {
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      const response = await cancelAppointmentAction(formData);
      setResult(response);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Booking Form Card */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-3 shadow-xl backdrop-blur-md sm:p-6 lg:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-white">
              Book Faculty Consultation
            </h2>
            <p className="mt-1 break-words text-xs text-slate-400">
              Select a professor, pick an upcoming date, and choose from their confirmed office hours.
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live Availability
          </span>
        </div>

        {!teachers.length ? (
          <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-300">
            No faculty members have posted available office hours yet.
          </div>
        ) : (
          <form className="mt-6 grid gap-4 sm:grid-cols-2 sm:gap-5" onSubmit={submitRequest}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Select Professor
              <select
                className={inputClass}
                name="teacherId"
                onChange={(event) => {
                  setTeacherId(event.target.value);
                  setAvailabilityId("");
                  setResult(null);
                }}
                required
                value={teacherId}
              >
                <option value="">Choose a faculty member</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Appointment Date
              <input
                className={inputClass}
                min={todayLocal()}
                name="date"
                onChange={(event) => {
                  setDate(event.target.value);
                  setAvailabilityId("");
                  setResult(null);
                }}
                required
                type="date"
                value={date}
              />
            </label>

            <div className="sm:col-span-2">
              {teacherId && date ? (
                freeSlots.length ? (
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Available Consultation Window
                    <select
                      className={inputClass}
                      name="availabilitySlotId"
                      onChange={(event) =>
                        setAvailabilityId(event.target.value)
                      }
                      required
                      value={availabilityId}
                    >
                      <option value="">Select a free time window</option>
                      {freeSlots.map((slot) => (
                        <option key={slot.id} value={slot.id}>
                          {slot.startTime} – {slot.endTime}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-300">
                    {weekday
                      ? `This professor has no posted office hours on ${days.find((day) => day.value === weekday)?.label}.`
                      : "Could not determine the weekday for this date."}
                  </div>
                )
              ) : null}
            </div>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Proposed Start Time
              <input
                className={inputClass}
                max={selectedFreeSlot?.endTime}
                min={selectedFreeSlot?.startTime}
                name="startTime"
                required
                type="time"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Proposed End Time
              <input
                className={inputClass}
                max={selectedFreeSlot?.endTime}
                min={selectedFreeSlot?.startTime}
                name="endTime"
                required
                type="time"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 sm:col-span-2">
              Reason / Topic (Optional)
              <textarea
                className={inputClass}
                maxLength={1000}
                name="note"
                placeholder="E.g. Final project review, question about week 4 lecture slides..."
                rows={3}
              />
            </label>

            <div className="sm:col-span-2">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending || !selectedFreeSlot}
              >
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                    Submitting Request...
                  </>
                ) : (
                  <>
                    Submit Appointment Request
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {result ? (
          <div
            aria-live="polite"
            className={`mt-6 rounded-xl border p-4 text-xs font-medium ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
            role={result.ok ? "status" : "alert"}
          >
            <p className="font-semibold">{result.message}</p>
            {result.timetableWarning ? (
              <p className="mt-1 text-slate-300">
                Notice: The professor also has an academic class scheduled around this time. The request was still registered.
              </p>
            ) : null}
          </div>
        ) : null}
      </section>

      {/* Appointment History Card */}
      <section className="relative min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-3 shadow-xl backdrop-blur-md sm:p-6 lg:p-8">
        <div className="flex flex-col items-start justify-between gap-3 border-b border-slate-800/80 pb-4 min-[420px]:flex-row">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold text-white">
              My Appointment Requests
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Track pending, approved, rescheduled, or cancelled consultations.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300">
            {appointments.length} Total
          </span>
        </div>

        {appointments.length ? (
          <ul className="mt-4 divide-y divide-slate-800/80">
            {appointments.map((appointment) => {
              const statusColors = {
                PENDING: "border-amber-500/30 bg-amber-500/10 text-amber-300",
                APPROVED: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                RESCHEDULED: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
                REJECTED: "border-rose-500/30 bg-rose-500/10 text-rose-300",
              }[appointment.status];

              return (
                <li
                  className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  key={appointment.id}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="break-words text-sm font-bold text-white">
                        {appointment.teacherName}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                      {formatDate(appointment.date)} · <span className="font-semibold text-slate-200">{appointment.startTime} – {appointment.endTime}</span>
                    </p>
                    {appointment.note ? (
                      <p className="mt-2 break-words rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs text-slate-400">
                        <span className="font-semibold text-slate-300">Note:</span> {appointment.note}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-bold ${statusColors}`}>
                      {statusLabels[appointment.status]}
                    </span>
                    {appointment.status === "PENDING" ? (
                      <button
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => cancelRequest(appointment.id)}
                        type="button"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="mt-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-5 py-10 text-center text-xs text-slate-500">
            You do not have any appointment requests registered yet.
          </div>
        )}
      </section>
    </div>
  );
}
