"use client";

import { useEffect, useState } from "react";
import type { DayOfWeek } from "@/generated/prisma/enums";

export type WeeklyScheduleSlot = {
  id: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  roomName: string;
  teacherName: string;
  sectionName?: string;
};

const dayOrder: DayOfWeek[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

const dayLabels: Record<DayOfWeek, string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

// Color accents for timetable slot cards
const slotColorStyles = [
  {
    bg: "bg-cyan-950/40",
    border: "border-cyan-500/30 hover:border-cyan-400",
    text: "text-cyan-300",
    pill: "bg-cyan-500/20 text-cyan-200",
  },
  {
    bg: "bg-emerald-950/40",
    border: "border-emerald-500/30 hover:border-emerald-400",
    text: "text-emerald-300",
    pill: "bg-emerald-500/20 text-emerald-200",
  },
  {
    bg: "bg-indigo-950/40",
    border: "border-indigo-500/30 hover:border-indigo-400",
    text: "text-indigo-300",
    pill: "bg-indigo-500/20 text-indigo-200",
  },
  {
    bg: "bg-purple-950/40",
    border: "border-purple-500/30 hover:border-purple-400",
    text: "text-purple-300",
    pill: "bg-purple-500/20 text-purple-200",
  },
  {
    bg: "bg-teal-950/40",
    border: "border-teal-500/30 hover:border-teal-400",
    text: "text-teal-300",
    pill: "bg-teal-500/20 text-teal-200",
  },
];

export function WeeklyTimetable({
  slots,
}: {
  slots: WeeklyScheduleSlot[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  useEffect(() => {
    const mobileLayout = window.matchMedia("(max-width: 639px)");
    const syncViewMode = () => setViewMode(mobileLayout.matches ? "list" : "grid");
    syncViewMode();
    mobileLayout.addEventListener("change", syncViewMode);
    return () => mobileLayout.removeEventListener("change", syncViewMode);
  }, []);

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-[#111827]/70 p-6 text-center backdrop-blur-md sm:p-12">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-cyan-400">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect height="18" rx="2" width="18" x="3" y="4" />
            <line x1="16" x2="16" y1="2" y2="6" />
            <line x1="8" x2="8" y1="2" y2="6" />
            <line x1="3" x2="21" y1="10" y2="10" />
          </svg>
        </div>
        <h2 className="mt-4 break-words text-lg font-bold text-white">
          No classes scheduled yet
        </h2>
        <p className="mx-auto mt-1 max-w-prose break-words text-sm text-slate-400">
          Once your academic timetable is configured, your weekly schedule will appear here.
        </p>
      </div>
    );
  }

  const sortedSlots = [...slots].sort(
    (first, second) =>
      dayOrder.indexOf(first.dayOfWeek) - dayOrder.indexOf(second.dayOfWeek) ||
      first.startTime.localeCompare(second.startTime),
  );

  // Active weekdays with classes (default to Mon-Fri at minimum)
  const activeDays = dayOrder.filter((d) =>
    ["MON", "TUE", "WED", "THU", "FRI"].includes(d) ||
    sortedSlots.some((s) => s.dayOfWeek === d),
  );

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* View Toggle Bar */}
      <div className="flex min-w-0 flex-col items-stretch justify-between gap-3 rounded-2xl border border-slate-800 bg-[#111827]/90 px-3 py-3 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4">
        <div className="min-w-0">
          <h2 className="break-words text-base font-bold text-white sm:text-lg">Weekly Academic Timetable</h2>
          <p className="break-words text-xs text-slate-400">
            {slots.length} lecture slots scheduled across the week
          </p>
        </div>

        <div className="flex w-full min-w-0 items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/80 p-1 sm:w-auto sm:gap-2">
          <button
            className={`hidden min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition sm:flex sm:flex-none sm:px-3 sm:py-1.5 sm:text-xs ${
              viewMode === "grid"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setViewMode("grid")}
            type="button"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect height="7" width="7" x="3" y="3" />
              <rect height="7" width="7" x="14" y="3" />
              <rect height="7" width="7" x="14" y="14" />
              <rect height="7" width="7" x="3" y="14" />
            </svg>
            Weekly Grid
          </button>
          <button
            className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition sm:flex-none sm:px-3 sm:py-1.5 sm:text-xs ${
              viewMode === "list"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setViewMode("list")}
            type="button"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="8" x2="21" y1="6" y2="6" />
              <line x1="8" x2="21" y1="12" y2="12" />
              <line x1="8" x2="21" y1="18" y2="18" />
              <line x1="3" x2="3.01" y1="6" y2="6" />
              <line x1="3" x2="3.01" y1="12" y2="12" />
              <line x1="3" x2="3.01" y1="18" y2="18" />
            </svg>
            List View
          </button>
        </div>
      </div>

      {/* ── 1. WEEKLY GRID VIEW (Inspired by Demo Image) ── */}
      {viewMode === "grid" ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#111827]/90 shadow-2xl backdrop-blur-md">
          <div className="min-w-[800px]">
            {/* Grid Days Header */}
            <div className="grid grid-cols-5 border-b border-slate-800 bg-slate-900/80">
              {activeDays.slice(0, 5).map((day) => {
                const count = sortedSlots.filter((s) => s.dayOfWeek === day).length;
                return (
                  <div
                    className="border-r border-slate-800/80 p-4 text-center last:border-r-0"
                    key={day}
                  >
                    <p className="text-sm font-bold text-white">{dayLabels[day]}</p>
                    <span className="mt-0.5 inline-block text-[11px] font-semibold text-cyan-400">
                      {count} {count === 1 ? "class" : "classes"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Grid Columns Content */}
            <div className="grid grid-cols-5 divide-x divide-slate-800/80 p-4">
              {activeDays.slice(0, 5).map((day) => {
                const daySlots = sortedSlots.filter((s) => s.dayOfWeek === day);

                return (
                  <div className="space-y-3 px-2 py-1" key={day}>
                    {daySlots.length ? (
                      daySlots.map((slot, index) => {
                        const style = slotColorStyles[index % slotColorStyles.length];
                        return (
                          <div
                            className={`group relative overflow-hidden rounded-xl border ${style.border} ${style.bg} p-3.5 shadow-md backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5`}
                            key={slot.id}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${style.pill}`}
                              >
                                {slot.courseCode}
                              </span>
                              <span className="text-[11px] font-bold tabular-nums text-slate-300">
                                {slot.startTime}–{slot.endTime}
                              </span>
                            </div>

                            <p className="mt-2 text-xs font-bold leading-snug text-white line-clamp-2">
                              {slot.courseName}
                            </p>

                            <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-slate-400">
                              <span className="font-semibold text-slate-300">
                                📍 {slot.roomName}
                              </span>
                              {slot.sectionName ? (
                                <span className="truncate max-w-[80px]">
                                  Sec: {slot.sectionName}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-1 truncate text-[10px] text-slate-400">
                              👤 {slot.teacherName}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-900/20 p-4 text-center">
                        <span className="text-xs text-slate-600">No classes</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ── 2. LIST VIEW ── */
        <div className="space-y-4">
          {dayOrder.map((day) => {
            const dailySlots = sortedSlots.filter((slot) => slot.dayOfWeek === day);
            if (dailySlots.length === 0) {
              return null;
            }

            return (
              <section
                aria-labelledby={`day-${day}`}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 shadow-xl backdrop-blur-md"
                key={day}
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/80 px-3 py-3 sm:px-6 sm:py-3.5">
                  <h3 className="min-w-0 break-words text-sm font-bold text-white" id={`day-${day}`}>
                    {dayLabels[day]}
                  </h3>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-300">
                    {dailySlots.length} {dailySlots.length === 1 ? "Class" : "Classes"}
                  </span>
                </div>

                <ol className="divide-y divide-slate-800/80">
                  {dailySlots.map((slot, index) => {
                    const style = slotColorStyles[index % slotColorStyles.length];
                    return (
                      <li
                        className="flex min-w-0 flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                        key={slot.id}
                      >
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${style.border} ${style.bg} text-xs font-bold ${style.text}`}>
                            {slot.courseCode.slice(0, 4)}
                          </div>
                          <div className="min-w-0">
                            <p className="break-words text-sm font-bold text-white">
                              {slot.courseCode} · {slot.courseName}
                            </p>
                            <p className="mt-1 break-words text-xs leading-relaxed text-slate-400">
                              Room: <span className="text-slate-200 font-semibold">{slot.roomName}</span> · Faculty: <span className="text-slate-200 font-semibold">{slot.teacherName}</span>
                              {slot.sectionName ? ` · Section: ${slot.sectionName}` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 sm:text-right">
                          <span className="inline-flex max-w-full flex-wrap items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-bold tabular-nums text-cyan-300">
                            🕒 {slot.startTime} – {slot.endTime}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
