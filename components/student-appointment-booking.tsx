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

const statusLabels: Record<AppointmentStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  RESCHEDULED: "Rescheduled",
  REJECTED: "Cancelled / Rejected",
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-[#2563eb] focus:ring-4 focus:ring-blue-500/10";

function todayLocal(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function weekdayForDate(date: string): DayOfWeek | null {
  if (!date) return null;
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
  const [result, setResult] = useState<StudentAppointmentActionResult | null>(null);

  const weekday = useMemo(() => weekdayForDate(date), [date]);

  const freeSlots = useMemo(
    () =>
      availability.filter(
        (slot) =>
          slot.teacherId === teacherId &&
          (!weekday || slot.dayOfWeek === weekday),
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

  const selectTeacher = (id: string) => {
    setTeacherId(id);
    setAvailabilityId("");
    setResult(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-w-0 space-y-6">
      {/* ── TEACHERS DIRECTORY (Design 5 Screen 4) ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Teachers &amp; Office Hours
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Faculty members available for student appointments
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#2563eb] border border-blue-200">
            {teachers.length} Faculty Listed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-5">Teacher</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Available Slots</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {teachers.map((teacher) => {
                const teacherSlots = availability.filter((s) => s.teacherId === teacher.id);
                const isSelected = teacherId === teacher.id;
                const initials = teacher.name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <tr key={teacher.id} className={isSelected ? "bg-blue-50/50" : "hover:bg-slate-50/60"}>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] font-bold text-white text-xs shadow-sm">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{teacher.name}</p>
                          <p className="text-[11px] text-slate-500">Faculty Instructor</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-bold text-green-700 border border-green-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                        Available
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {teacherSlots.length ? (
                        <div className="flex flex-wrap gap-1.5">
                          {teacherSlots.slice(0, 2).map((s) => (
                            <span key={s.id} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              {s.dayOfWeek} · {s.startTime} – {s.endTime}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Check upcoming dates</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => selectTeacher(teacher.id)}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-sm ${
                          isSelected
                            ? "bg-[#2563eb] text-white"
                            : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                        }`}
                      >
                        {isSelected ? "Selected ✓" : "Book Appointment"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Booking Form Card ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Schedule Appointment
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Pick a date and choose an office hours slot to send your consultation request.
          </p>
        </div>

        <form className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-5" onSubmit={submitRequest}>
          <label className="block text-xs font-semibold text-slate-700">
            Faculty Professor
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
              <option value="">Select a professor...</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700">
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

          <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
            Available Office Hours Slot
            <select
              className={inputClass}
              disabled={!teacherId || !date}
              name="availabilityId"
              onChange={(event) => {
                setAvailabilityId(event.target.value);
                setResult(null);
              }}
              required
              value={availabilityId}
            >
              <option value="">
                {!teacherId || !date
                  ? "Select professor and date first..."
                  : freeSlots.length
                  ? "Select a consultation time..."
                  : "No office hours on this weekday"}
              </option>
              {freeSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.dayOfWeek}: {slot.startTime} – {slot.endTime}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 sm:col-span-2">
            Reason / Topic (Optional)
            <textarea
              className={inputClass}
              maxLength={1000}
              name="note"
              placeholder="E.g. Final project review, question about week 4 lecture..."
              rows={3}
            />
          </label>

          <div className="sm:col-span-2">
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isPending || !selectedFreeSlot}
            >
              {isPending ? "Submitting..." : "Confirm & Send Request →"}
            </button>
          </div>
        </form>

        {result ? (
          <div
            aria-live="polite"
            className={`mt-5 rounded-xl border p-4 text-xs font-medium ${
              result.ok
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
            role={result.ok ? "status" : "alert"}
          >
            <p className="font-semibold">{result.message}</p>
          </div>
        ) : null}
      </section>

      {/* ── My Requests List ── */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              My Appointment Requests
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Track status of pending and approved consultations.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
            {appointments.length} Total
          </span>
        </div>

        {appointments.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {appointments.map((appointment) => {
              const statusColors = {
                PENDING: "border-amber-200 bg-amber-50 text-amber-800",
                APPROVED: "border-green-200 bg-green-50 text-green-800",
                RESCHEDULED: "border-blue-200 bg-blue-50 text-blue-800",
                REJECTED: "border-rose-200 bg-rose-50 text-rose-800",
              }[appointment.status];

              return (
                <li
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  key={appointment.id}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {appointment.teacherName}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {formatDate(appointment.date)} · <span className="font-semibold text-slate-700">{appointment.startTime} – {appointment.endTime}</span>
                    </p>
                    {appointment.note && (
                      <p className="mt-1.5 rounded-lg bg-slate-50 border border-slate-200 p-2 text-xs text-slate-600">
                        {appointment.note}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors}`}>
                      {statusLabels[appointment.status]}
                    </span>
                    {appointment.status === "PENDING" && (
                      <button
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                        disabled={isPending}
                        onClick={() => cancelRequest(appointment.id)}
                        type="button"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="py-10 text-center text-xs text-slate-400">
            No appointment requests submitted yet.
          </div>
        )}
      </section>
    </div>
  );
}
