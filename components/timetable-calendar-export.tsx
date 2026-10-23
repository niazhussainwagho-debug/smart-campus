"use client";

import { useEffect, useRef, useState } from "react";
import {
  createGoogleCalendarUrl,
  createIcsCalendar,
  type CalendarScheduleSlot,
} from "@/lib/calendar-export";

const dayLabels: Record<CalendarScheduleSlot["dayOfWeek"], string> = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

export function TimetableCalendarExport({
  slots,
}: {
  slots: CalendarScheduleSlot[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, []);

  function downloadIcs() {
    try {
      const calendar = createIcsCalendar(slots);
      const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "smart-campus-schedule.ics";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError(null);
      setIsOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to create the calendar file.",
      );
    }
  }

  return (
    <div className="relative shrink-0" ref={containerRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 sm:text-sm"
        disabled={slots.length === 0}
        onClick={() => {
          setError(null);
          setIsOpen((open) => !open);
        }}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <rect height="18" rx="2" width="18" x="3" y="4" />
          <line x1="16" x2="16" y1="2" y2="6" />
          <line x1="8" x2="8" y1="2" y2="6" />
          <line x1="3" x2="21" y1="10" y2="10" />
          <path d="m8 15 2 2 4-4" />
        </svg>
        Export to Calendar
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xl"
          role="dialog"
          aria-label="Calendar export options"
        >
          <div className="border-b border-border p-3">
            <button
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 text-left text-sm font-semibold text-foreground transition hover:bg-background"
              onClick={downloadIcs}
              type="button"
            >
              Download .ics file
            </button>
            <p className="mt-2 text-xs text-muted-foreground">
              Exports {slots.length} weekly recurring{" "}
              {slots.length === 1 ? "class" : "classes"} in your local time.
              With no term dates in the timetable, each event repeats weekly
              until removed.
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Add an individual class
            </p>
            {slots.map((slot) => (
              <a
                className="block rounded-lg px-2 py-2 text-sm transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-500"
                href={createGoogleCalendarUrl(slot)}
                key={slot.id}
                rel="noreferrer"
                target="_blank"
              >
                <span className="block font-semibold">
                  {slot.courseCode} · {slot.courseName}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {dayLabels[slot.dayOfWeek]} · {slot.startTime}–{slot.endTime} ·{" "}
                  {slot.roomName}
                </span>
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-rose-500/30 bg-card p-3 text-xs text-rose-700 shadow-lg dark:text-rose-300" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
