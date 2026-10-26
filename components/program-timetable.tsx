"use client";

import { useEffect, useState } from "react";
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
  if (typeof value !== "object" || value === null) {
    return false;
  }
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

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
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
  const [response, setResponse] = useState<{
    query: string;
    slots: TimetableEntry[];
    error: string | null;
  } | null>(null);
  const query = new URLSearchParams({ program, batchPart }).toString();
  const currentResponse = response?.query === query ? response : null;

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ program, batchPart }).toString();

    fetch(`/api/timetable?${query}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const data: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof data.error === "string"
              ? data.error
              : "The timetable could not be loaded.";
          throw new Error(message);
        }
        if (
          typeof data !== "object" ||
          data === null ||
          !("slots" in data) ||
          !Array.isArray(data.slots)
        ) {
          throw new Error("The timetable response was invalid.");
        }
        const slots: TimetableEntry[] = [];
        for (const entry of data.slots) {
          if (!isTimetableEntry(entry)) {
            throw new Error("The timetable response was invalid.");
          }
          slots.push(entry);
        }
        if (!controller.signal.aborted) {
          setResponse({ query, slots, error: null });
        }
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setResponse({
          query,
          slots: [],
          error:
            fetchError instanceof Error
              ? fetchError.message
              : "The timetable could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [program, batchPart]);

  const slots = currentResponse?.slots ?? [];
  const error = currentResponse?.error ?? null;
  const isLoading = currentResponse === null;
  const slotAt = (day: string, slotNumber: number) =>
    slots.find((slot) => slot.day === day && slot.slotNumber === slotNumber);

  return (
    <section className="rounded-2xl border border-[#26364a] bg-[#101b2a]/95 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.25)] sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Program
          <select
            className="mt-2 w-full rounded-xl border border-[#2e4258] bg-[#0d1727] px-3.5 py-3 text-sm text-white outline-none focus:border-[#4ed0d8]"
            onChange={(event) => {
              if (isTimetableProgram(event.target.value)) {
                setProgram(event.target.value);
              }
            }}
            value={program}
          >
            {timetablePrograms.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
          Batch / Year
          <select
            className="mt-2 w-full rounded-xl border border-[#2e4258] bg-[#0d1727] px-3.5 py-3 text-sm text-white outline-none focus:border-[#4ed0d8]"
            onChange={(event) => {
              if (isTimetableBatchPart(event.target.value)) {
                setBatchPart(event.target.value);
              }
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

      {autoDetected ? (
        <p className="mt-3 text-xs text-emerald-300">
          Showing the program and part linked to your enrollment. You can switch
          to another schedule using the filters.
        </p>
      ) : null}

      {error ? (
        <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300" role="alert">
          {error}
        </p>
      ) : isLoading ? (
        <p className="mt-5 text-sm text-slate-400" role="status">
          Loading timetable…
        </p>
      ) : slots.length === 0 ? (
        <p className="mt-5 rounded-xl border border-[#26364a] bg-[#0d1727] p-5 text-sm text-slate-400">
          No timetable entries have been published for this program and part.
        </p>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-[#26364a]">
          <table className="w-full min-w-[1050px] border-collapse text-left">
            <thead className="bg-[#0b1422]">
              <tr>
                <th className="sticky left-0 z-10 min-w-28 border-b border-r border-[#26364a] bg-[#0b1422] px-3 py-3 text-xs font-semibold text-slate-300">
                  Day
                </th>
                {periodTimes.map(([start, end], index) => (
                  <th
                    className="min-w-36 border-b border-r border-[#26364a] px-3 py-3 text-xs font-semibold text-slate-300"
                    key={start}
                  >
                    <span className="block text-[#66d3cf]">Period {index + 1}</span>
                    <span className="mt-1 block font-normal text-slate-500">
                      {start}–{end}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weekDays.map((day) => (
                <tr key={day}>
                  <th className="sticky left-0 z-10 border-b border-r border-[#26364a] bg-[#101b2a] px-3 py-3 text-xs font-semibold text-white">
                    {day}
                  </th>
                  {periodTimes.map((_, index) => {
                    const entry = slotAt(day, index + 1);
                    return (
                      <td
                        className="border-b border-r border-[#26364a] p-2 align-top"
                        key={`${day}-${index + 1}`}
                      >
                        {entry ? (
                          <article className="min-h-24 rounded-lg border border-cyan-500/20 bg-cyan-950/25 p-2.5">
                            <p className="text-[10px] font-bold tracking-wide text-[#66d3cf]">
                              {entry.subjectCode}
                            </p>
                            <p className="mt-1 text-xs font-semibold leading-snug text-white">
                              {entry.subjectName}
                            </p>
                            <p className="mt-2 text-[10px] text-slate-400">
                              {entry.startTime}–{entry.endTime}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {entry.teacherName}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-500">
                              {entry.roomNo}
                            </p>
                          </article>
                        ) : (
                          <span className="block min-h-24 rounded-lg bg-[#0b1422]/55" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
