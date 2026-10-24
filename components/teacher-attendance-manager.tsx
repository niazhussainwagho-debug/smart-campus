"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { AttendanceStatus } from "@/generated/prisma/enums";
import {
  loadAttendanceRosterAction,
  saveAttendanceAction,
  type AttendanceStudentRow,
  type AttendanceActionResult,
} from "@/app/teacher/attendance/actions";

export type TeacherAttendanceClass = {
  id: string;
  courseCode: string;
  courseName: string;
  department: string;
  semester: number;
  sectionName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
};

const statusChoices: {
  value: AttendanceStatus;
  label: string;
  classes: string;
}[] = [
  {
    value: AttendanceStatus.PRESENT,
    label: "Present",
    classes: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    value: AttendanceStatus.ABSENT,
    label: "Absent",
    classes: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
  {
    value: AttendanceStatus.LATE,
    label: "Late",
    classes: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
];

function todayDateValue(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export function TeacherAttendanceManager({
  classes,
}: {
  classes: TeacherAttendanceClass[];
}) {
  const router = useRouter();
  const [selectedSlotId, setSelectedSlotId] = useState(classes[0]?.id ?? "");
  const [date, setDate] = useState(todayDateValue);
  const [students, setStudents] = useState<AttendanceStudentRow[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [loadingError, setLoadingError] = useState("");
  const [result, setResult] = useState<AttendanceActionResult | null>(null);
  const [quickEntryFeedback, setQuickEntryFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const quickEntryInput = useRef<HTMLInputElement>(null);
  const highlightTimeout = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (highlightTimeout.current !== null) {
        window.clearTimeout(highlightTimeout.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (!selectedSlotId || !date) return;
    let cancelled = false;
    const loadRoster = window.setTimeout(() => {
      setLoadingError("");
      setLoadingRoster(true);
      void loadAttendanceRosterAction(selectedSlotId, date)
        .then((response) => {
          if (cancelled) return;
          if (response.ok) {
            setStudents(response.students);
          } else {
            setStudents([]);
            setLoadingError(response.message);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setStudents([]);
            setLoadingError("Could not load the roster. Please try again.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingRoster(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(loadRoster);
    };
  }, [selectedSlotId, date]);

  function updateStatus(studentId: string, status: AttendanceStatus) {
    setStudents((current) =>
      current.map((student) =>
        student.id === studentId ? { ...student, status } : student,
      ),
    );
  }

  function markAllPresent() {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        status: AttendanceStatus.PRESENT,
      })),
    );
  }

  function submitQuickEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = quickEntryInput.current;
    const entry = input?.value.trim() ?? "";
    if (!entry) {
      input?.focus();
      return;
    }

    const normalizedEntry = entry.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const matches = students.filter((student) => {
      if (!student.rollNo) return false;
      const normalizedRollNo = student.rollNo
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      const lastRollNumberPart = student.rollNo
        .split(/[\\/.-]/)
        .filter(Boolean)
        .at(-1)
        ?.toUpperCase()
        .replace(/[^A-Z0-9]/g, "");
      return (
        normalizedRollNo === normalizedEntry ||
        lastRollNumberPart === normalizedEntry
      );
    });

    if (input) input.value = "";
    input?.focus();

    if (matches.length === 0) {
      setQuickEntryFeedback({
        ok: false,
        message: `No student with roll number "${entry}" was found in this section.`,
      });
      return;
    }
    if (matches.length > 1) {
      setQuickEntryFeedback({
        ok: false,
        message: `More than one student matches "${entry}". Enter the full roll number.`,
      });
      return;
    }

    const [student] = matches;
    updateStatus(student.id, AttendanceStatus.PRESENT);
    setQuickEntryFeedback({
      ok: true,
      message: `${student.name} (${student.rollNo}) marked present.`,
    });
    setHighlightedStudentId(student.id);
    if (highlightTimeout.current !== null) {
      window.clearTimeout(highlightTimeout.current);
    }
    highlightTimeout.current = window.setTimeout(() => {
      setHighlightedStudentId(null);
      highlightTimeout.current = null;
    }, 1200);
  }

  function saveAttendance() {
    if (students.some((student) => student.status === null)) {
      setResult({
        ok: false,
        message: "Choose a status for every student before saving.",
      });
      return;
    }
    const formData = new FormData();
    formData.set("slotId", selectedSlotId);
    formData.set("date", date);
    formData.set(
      "records",
      JSON.stringify(
        students.map((student) => ({
          studentId: student.id,
          status: student.status,
        })),
      ),
    );
    startTransition(async () => {
      const response = await saveAttendanceAction(formData);
      setResult(response);
      if (response.ok) {
        router.refresh();
      }
    });
  }

  const selectedClass = classes.find(({ id }) => id === selectedSlotId);
  const allMarked =
    students.length > 0 && students.every((student) => student.status !== null);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-4 shadow-xl sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-foreground">
              Class / subject
              <select
                className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-cyan-500"
                onChange={(event) => {
                  setSelectedSlotId(event.target.value);
                  setResult(null);
                }}
                value={selectedSlotId}
              >
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.courseCode} · {classItem.sectionName} ·{" "}
                    {classItem.dayOfWeek} {classItem.startTime}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-foreground">
              Attendance date
              <input
                className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-cyan-500"
                onChange={(event) => {
                  setDate(event.target.value);
                  setResult(null);
                }}
                type="date"
                value={date}
              />
            </label>
          </div>
          <button
            className="min-h-10 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/15 dark:text-emerald-300"
            disabled={students.length === 0 || loadingRoster || isPending}
            onClick={markAllPresent}
            type="button"
          >
            Mark All Present
          </button>
        </div>
        {selectedClass ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {selectedClass.courseName} · {selectedClass.department} · Semester{" "}
            {selectedClass.semester} · {selectedClass.startTime}–
            {selectedClass.endTime}
          </p>
        ) : null}
      </section>

      {result ? (
        <div
          aria-live="polite"
          className={`rounded-xl border p-3 text-sm ${
            result.ok
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
              : "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300"
          }`}
          role={result.ok ? "status" : "alert"}
        >
          {result.message}
        </div>
      ) : null}
      {loadingError ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-800 dark:text-rose-300" role="alert">
          {loadingError}
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:px-6">
          <div>
            <h2 className="font-semibold text-foreground">Enrolled students</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {loadingRoster
                ? "Loading class roster…"
                : `${students.length} ${students.length === 1 ? "student" : "students"}`}
            </p>
          </div>
          <button
            className="min-h-10 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 px-4 py-2 text-sm font-bold text-slate-950 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={
              loadingRoster ||
              isPending ||
              students.length === 0 ||
              !allMarked
            }
            onClick={saveAttendance}
            type="button"
          >
            {isPending ? "Saving…" : "Save attendance"}
          </button>
        </div>

        {!loadingRoster && students.length > 0 ? (
          <div className="border-b border-border bg-muted/30 p-4 sm:px-6">
            <form
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
              onSubmit={submitQuickEntry}
            >
              <label className="grid flex-1 gap-1.5 text-sm font-semibold text-foreground">
                Quick entry by roll number
                <input
                  autoComplete="off"
                  className="min-h-11 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  onChange={() => setQuickEntryFeedback(null)}
                  placeholder="Scan or enter roll number, then press Enter"
                  ref={quickEntryInput}
                  type="text"
                />
              </label>
              <button
                className="min-h-11 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:bg-cyan-500/15 dark:text-cyan-200"
                type="submit"
              >
                Mark Present
              </button>
            </form>
            {quickEntryFeedback ? (
              <p
                aria-live="polite"
                className={`mt-2 text-sm ${
                  quickEntryFeedback.ok
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-rose-700 dark:text-rose-300"
                }`}
                role={quickEntryFeedback.ok ? "status" : "alert"}
              >
                {quickEntryFeedback.message}
              </p>
            ) : null}
          </div>
        ) : null}

        {classes.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">
            No assigned timetable classes are available for attendance yet.
          </p>
        ) : loadingRoster ? (
          <p className="p-6 text-sm text-muted-foreground" role="status">
            Loading the enrolled student roster…
          </p>
        ) : students.length === 0 && !loadingError ? (
          <p className="p-6 text-sm text-muted-foreground">
            No students are enrolled in this class.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {students.map((student) => (
              <li
                className={`flex flex-col gap-3 p-4 transition-colors duration-300 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
                  highlightedStudentId === student.id
                    ? "bg-emerald-500/15"
                    : ""
                }`}
                key={student.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">
                    {student.name}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-medium text-muted-foreground">
                    Roll No: {student.rollNo || "Not provided"}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {student.email}
                  </p>
                </div>
                <div
                  aria-label={`Attendance status for ${student.name}`}
                  className="flex flex-wrap gap-2"
                  role="group"
                >
                  {statusChoices.map((choice) => (
                    <button
                      aria-pressed={student.status === choice.value}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                        student.status === choice.value
                          ? choice.classes
                          : "border-border bg-background text-muted-foreground hover:bg-muted"
                      }`}
                      key={choice.value}
                      onClick={() => updateStatus(student.id, choice.value)}
                      type="button"
                    >
                      {choice.label}
                    </button>
                  ))}
                  {student.status === null ? (
                    <span className="self-center text-xs text-muted-foreground">
                      Not marked
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
