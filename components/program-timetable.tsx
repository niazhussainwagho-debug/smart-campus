"use client";

import { useEffect, useMemo, useState } from "react";
import {
  timetableBatchParts,
  timetablePrograms,
  isTimetableBatchPart,
  isTimetableProgram,
  type TimetableBatchPart,
  type TimetableProgram,
} from "@/lib/timetable-options";

type TimetableEntry = {
  id: string;
  day: string;
  slotNumber: number;
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  roomNo: string;
};

function isTimetableEntry(value: unknown): value is TimetableEntry {
  if (typeof value !== "object" || value === null) return false;
  return (
    "id" in value &&
    typeof value.id === "string" &&
    "day" in value &&
    typeof value.day === "string" &&
    "slotNumber" in value &&
    typeof value.slotNumber === "number" &&
    "startTime" in value &&
    typeof value.startTime === "string" &&
    "endTime" in value &&
    typeof value.endTime === "string" &&
    "subjectCode" in value &&
    typeof value.subjectCode === "string" &&
    "subjectName" in value &&
    typeof value.subjectName === "string" &&
    "teacherName" in value &&
    typeof value.teacherName === "string" &&
    "roomNo" in value &&
    typeof value.roomNo === "string"
  );
}

const activeDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;

const periodTimes = [
  ["08:30", "09:15"],
  ["09:15", "10:00"],
  ["10:00", "10:45"],
  ["10:45", "11:30"],
  ["11:30", "12:15"],
  ["12:15", "13:00"],
  ["13:00", "13:45"],
] as const;

export function ProgramTimetable({
  initialProgram,
  initialBatchPart,
  autoDetected,
}: {
  initialProgram: TimetableProgram;
  initialBatchPart: TimetableBatchPart;
  autoDetected: boolean;
}) {
  const [program, setProgram] = useState(initialProgram);
  const [batchPart, setBatchPart] = useState(initialBatchPart);
  const [activeDayTab, setActiveDayTab] = useState<string>("ALL");
  const [response, setResponse] = useState<{
    query: string;
    slots: TimetableEntry[];
    error: string | null;
  } | null>(null);

  const query = new URLSearchParams({ program, batchPart }).toString();
  const currentResponse = response?.query === query ? response : null;

  useEffect(() => {
    const controller = new AbortController();
    const q = new URLSearchParams({ program, batchPart }).toString();

    fetch(`/api/timetable?${q}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (res) => {
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            typeof data === "object" && data !== null && "error" in data && typeof data.error === "string"
              ? data.error
              : "The timetable could not be loaded.";
          throw new Error(msg);
        }
        if (typeof data !== "object" || data === null || !("slots" in data) || !Array.isArray(data.slots)) {
          throw new Error("Invalid timetable response format.");
        }
        const slots: TimetableEntry[] = [];
        for (const entry of data.slots) {
          if (isTimetableEntry(entry)) {
            slots.push(entry);
          }
        }
        if (!controller.signal.aborted) {
          setResponse({ query: q, slots, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setResponse({
            query: q,
            slots: [],
            error: err instanceof Error ? err.message : "The timetable could not be loaded.",
          });
        }
      });

    return () => controller.abort();
  }, [program, batchPart]);

  const slots = useMemo(() => currentResponse?.slots ?? [], [currentResponse?.slots]);
  const isLoading = response === null || (response.query !== query && !response.error);
  const error = currentResponse?.error ?? null;

  const slotAt = (day: string, slotNumber: number) =>
    slots.find((s) => s.day.toLowerCase() === day.toLowerCase() && s.slotNumber === slotNumber);

  const getTone = (code: string) => {
    if (code.includes("IT") || code.includes("CS")) {
      return "border-l-blue-500 bg-blue-50/80 text-blue-900 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-900/50";
    }
    if (code.includes("GICP") || code.includes("GENG")) {
      return "border-l-amber-500 bg-amber-50/80 text-amber-900 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-900/50";
    }
    if (code.includes("GQUR") || code.includes("MATH") || code.includes("DCMT")) {
      return "border-l-purple-500 bg-purple-50/80 text-purple-900 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-200 dark:border-purple-900/50";
    }
    return "border-l-emerald-500 bg-emerald-50/80 text-emerald-900 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900/50";
  };

  // Classes filtered by day for single-day list view
  const singleDaySlots = useMemo(() => {
    if (activeDayTab === "ALL") return [];
    return slots
      .filter((s) => s.day.toLowerCase() === activeDayTab.toLowerCase())
      .sort((a, b) => a.slotNumber - b.slotNumber);
  }, [slots, activeDayTab]);

  return (
    <section className="w-full min-w-0 space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-7 dark:border-[#243244] dark:bg-[#101b2a]/95">
      {/* ── Top Filters Row ── */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-[#233246]">
        <div className="grid grid-cols-2 gap-3 sm:w-auto sm:min-w-[420px]">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Department / Program
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 dark:border-[#2b3c4b] dark:bg-[#0d1727] dark:text-slate-100"
              onChange={(e) => {
                if (isTimetableProgram(e.target.value)) setProgram(e.target.value);
              }}
              value={program}
            >
              {timetablePrograms.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Batch / Part
            <select
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-blue-100 dark:border-[#2b3c4b] dark:bg-[#0d1727] dark:text-slate-100"
              onChange={(e) => {
                if (isTimetableBatchPart(e.target.value)) setBatchPart(e.target.value);
              }}
              value={batchPart}
            >
              {timetableBatchParts.map((part) => (
                <option key={part} value={part}>
                  {part}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* View / Day Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl bg-slate-50 p-1 border border-slate-200 dark:border-[#2b3c4b] dark:bg-[#0d1727]">
          <button
            type="button"
            onClick={() => setActiveDayTab("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              activeDayTab === "ALL"
                ? "bg-[#2563eb] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            📅 Weekly Grid
          </button>
          {activeDays.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setActiveDayTab(day)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                activeDayTab === day
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {autoDetected && (
        <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
          ✓ Showing official FET Second Semester 2026 timetable linked to your department enrollment.
        </p>
      )}

      {error ? (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </p>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-16 text-xs text-slate-400">
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          Loading timetable schedule...
        </div>
      ) : slots.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-xs text-slate-500 dark:border-[#243244] dark:bg-[#0d1727]/50 dark:text-slate-400">
          No scheduled classes found for this program and batch.
        </p>
      ) : activeDayTab === "ALL" ? (
        /* ========================================================
           VIEW A: DESIGN 5 SCREEN 3 EXACT MATRIX (FITS ON LAPTOPS!)
           Columns = Time + 5 Days (Monday - Friday)
           ======================================================== */
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-[#233246]">
          <table className="w-full min-w-[760px] table-fixed border-collapse text-left">
            <thead className="bg-slate-50 border-b border-slate-200 dark:border-[#233246] dark:bg-[#0d1727]">
              <tr>
                <th className="w-[110px] p-3 text-xs font-bold text-slate-600 border-r border-slate-200 text-center dark:border-[#233246] dark:text-slate-400">
                  Time Slot
                </th>
                {activeDays.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-xs font-bold text-slate-800 border-r border-slate-200 last:border-r-0 text-center dark:border-[#233246] dark:text-slate-200"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#233246]">
              {periodTimes.map(([start, end], periodIdx) => {
                const periodNum = periodIdx + 1;
                return (
                  <tr key={start} className="hover:bg-slate-50/40 transition dark:hover:bg-slate-800/30">
                    {/* Time Slot Column */}
                    <td className="w-[110px] p-2.5 border-r border-slate-200 bg-slate-50/60 text-center align-middle dark:border-[#233246] dark:bg-[#0c1422]">
                      <div className="text-[11px] font-bold text-[#2563eb] dark:text-blue-400">
                        P{periodNum}
                      </div>
                      <div className="text-[10px] font-medium text-slate-500 whitespace-nowrap dark:text-slate-400">
                        {start} – {end}
                      </div>
                    </td>

                    {/* 5 Day Columns */}
                    {activeDays.map((day) => {
                      const entry = slotAt(day, periodNum);
                      return (
                        <td
                          key={day + periodNum}
                          className="p-2 border-r border-slate-100 last:border-r-0 align-top h-[94px] dark:border-[#233246]"
                        >
                          {entry ? (
                            <div className={`h-full rounded-lg border-l-4 p-2 shadow-xs transition hover:shadow-sm ${getTone(entry.subjectCode)}`}>
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-extrabold text-[11px] tracking-tight">
                                  {entry.subjectCode}
                                </span>
                              </div>
                              <p className="mt-1 text-[11px] font-bold leading-tight line-clamp-2">
                                {entry.subjectName}
                              </p>
                              <div className="mt-1.5 flex flex-wrap items-center gap-1 text-[9px] opacity-80 font-medium">
                                <span>📍 {entry.roomNo}</span>
                              </div>
                              <div className="text-[9px] opacity-75 truncate mt-0.5">
                                👤 {entry.teacherName}
                              </div>
                            </div>
                          ) : (
                            <div className="h-full rounded-lg bg-slate-50/60 border border-dashed border-slate-100 dark:border-[#233246]/50 dark:bg-[#0d1727]/30" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* ========================================================
           VIEW B: SINGLE DAY CARD LIST (Mobile, Tablet, Clean View)
           ======================================================== */
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-[#233246]">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeDayTab} Schedule
            </h3>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-[#2563eb] border border-blue-200 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {singleDaySlots.length} Classes
            </span>
          </div>

          {singleDaySlots.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {singleDaySlots.map((cls) => (
                <div
                  key={cls.id}
                  className={`rounded-xl border-l-4 p-4 shadow-xs ${getTone(cls.subjectCode)}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-xs">{cls.subjectCode}</span>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold shadow-xs dark:bg-slate-900/80">
                      {cls.startTime} – {cls.endTime}
                    </span>
                  </div>
                  <h4 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                    {cls.subjectName}
                  </h4>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    <span>📍 {cls.roomNo}</span>
                    <span>•</span>
                    <span>👤 {cls.teacherName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              No classes scheduled on {activeDayTab}.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
