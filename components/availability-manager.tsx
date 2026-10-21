"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { DayOfWeek } from "@/generated/prisma/enums";
import {
  addAvailabilityAction,
  deleteAvailabilityAction,
  type AvailabilityActionResult,
} from "@/app/teacher/availability/actions";

export type AvailabilityRow = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
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

const inputClass =
  "mt-1.5 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20";

export function AvailabilityManager({
  slots,
}: {
  slots: AvailabilityRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AvailabilityActionResult | null>(null);

  function addSlot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const response = await addAvailabilityAction(formData);
      setResult(response);
      if (response.ok) {
        form.reset();
        router.refresh();
      }
    });
  }

  function deleteSlot(id: string) {
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      const response = await deleteAvailabilityAction(formData);
      setResult(response);
      if (response.ok) {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-8">
      {/* Add Slot Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              Add New Availability Slot
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Define the recurring hours you are available for student appointments. Overlapping slots on the same day are disallowed.
            </p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs font-semibold text-teal-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
            Recurring Weekly
          </span>
        </div>

        <form
          className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={addSlot}
        >
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Day of Week
            <select className={inputClass} name="dayOfWeek" required>
              <option value="">Select Day</option>
              {days.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            Start Time
            <input className={inputClass} name="startTime" required type="time" />
          </label>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
            End Time
            <input className={inputClass} name="endTime" required type="time" />
          </label>
          <div className="flex items-end">
            <button
              className="inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500 px-4 text-xs font-bold text-slate-950 shadow-lg shadow-teal-500/20 transition hover:from-teal-400 hover:to-emerald-300 disabled:opacity-50"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Save Free Slot
                </>
              )}
            </button>
          </div>
        </form>

        {result ? (
          <p
            aria-live="polite"
            className={`mt-5 rounded-xl border p-4 text-xs font-medium ${
              result.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
            role={result.ok ? "status" : "alert"}
          >
            {result.message}
          </p>
        ) : null}
      </section>

      {/* Slots List Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-6 shadow-xl backdrop-blur-md sm:p-8">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">My Weekly Office Hours</h2>
            <p className="mt-1 text-xs text-slate-400">
              Active slots visible to students when booking consultations.
            </p>
          </div>
          <span className="rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300">
            {slots.length} Active Slots
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {days.map((day) => {
            const dailySlots = slots.filter(
              (slot) => slot.dayOfWeek === day.value,
            );
            if (!dailySlots.length) {
              return null;
            }

            return (
              <div
                className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4"
                key={day.value}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400">{day.label}</h3>
                  <span className="text-[11px] text-slate-500">{dailySlots.length} slot(s)</span>
                </div>
                <ul className="mt-3 divide-y divide-slate-800/60">
                  {dailySlots.map((slot) => (
                    <li
                      className="flex items-center justify-between gap-3 py-2.5 text-xs"
                      key={slot.id}
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span className="font-semibold tabular-nums text-slate-200">
                          {slot.startTime} – {slot.endTime}
                        </span>
                      </div>
                      <button
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/20 disabled:opacity-50"
                        disabled={isPending}
                        onClick={() => deleteSlot(slot.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {slots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-5 py-12 text-center text-xs text-slate-500">
              You haven't defined any office hours yet. Add a slot above to get started.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
