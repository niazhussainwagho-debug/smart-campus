import { DashboardShell } from "@/components/dashboard-shell";
import { AttendanceStatus, UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth-helpers";
import { getAttendancePercentage } from "@/lib/attendance";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function StudentAttendancePage() {
  const student = await requireRole(UserRole.STUDENT);
  const records = await prisma.attendance.findMany({
    where: { studentId: student.id },
    include: {
      timetableSlot: {
        select: {
          course: { select: { name: true } },
          section: { select: { name: true, department: true, semester: true } },
          room: { select: { name: true } },
          startTime: true,
          endTime: true,
          dayOfWeek: true,
        },
      },
    },
    orderBy: [{ date: "desc" }, { timetableSlot: { startTime: "desc" } }],
  });

  const percentage = getAttendancePercentage(records);
  const presentCount = records.filter(
    ({ status }) => status === AttendanceStatus.PRESENT,
  ).length;
  const lateCount = records.filter(
    ({ status }) => status === AttendanceStatus.LATE,
  ).length;
  const absentCount = records.filter(
    ({ status }) => status === AttendanceStatus.ABSENT,
  ).length;
  const subjects = new Map<
    string,
    { name: string; section: string; records: { status: AttendanceStatus }[] }
  >();
  for (const record of records) {
    const key = `${record.courseCode}:${record.sectionId}`;
    const current = subjects.get(key) ?? {
      name: record.timetableSlot.course.name,
      section: `${record.timetableSlot.section.department} · ${record.timetableSlot.section.name}`,
      records: [],
    };
    current.records.push({ status: record.status });
    subjects.set(key, current);
  }

  return (
    <DashboardShell
      badge="Student Portal"
      role={UserRole.STUDENT}
      subtitle="Review your overall attendance, subject breakdown, and class-by-class history."
      title="My Attendance"
      user={student}
    >
      <div className="space-y-6">
        {records.length > 0 && percentage < 75 ? (
          <div
            className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 sm:p-5"
            role="alert"
          >
            <h2 className="font-bold">Attendance below 75%</h2>
            <p className="mt-1 text-sm">
              Your current attendance is {percentage}%. Please attend upcoming
              classes to improve your standing.
            </p>
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-border bg-card p-5 shadow-lg sm:col-span-2">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overall attendance
                </p>
                <p className="mt-2 text-4xl font-bold text-foreground">
                  {percentage}%
                </p>
              </div>
              <p className="text-right text-sm text-muted-foreground">
                {records.length} recorded{" "}
                {records.length === 1 ? "class" : "classes"}
              </p>
            </div>
            <div
              aria-label={`Overall attendance ${percentage}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={percentage}
              className="mt-4 h-3 overflow-hidden rounded-full bg-muted"
              role="progressbar"
            >
              <div
                className={`h-full rounded-full transition-all ${
                  percentage < 75 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </article>
          {[
            { label: "Present", count: presentCount, color: "text-emerald-700 dark:text-emerald-300" },
            { label: "Late", count: lateCount, color: "text-amber-700 dark:text-amber-300" },
            { label: "Absent", count: absentCount, color: "text-rose-700 dark:text-rose-300" },
          ].map((item) => (
            <article
              className="rounded-2xl border border-border bg-card p-5 shadow-lg"
              key={item.label}
            >
              <p className="text-sm font-medium text-muted-foreground">
                {item.label}
              </p>
              <p className={`mt-2 text-3xl font-bold ${item.color}`}>
                {item.count}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-border bg-card p-4 shadow-lg sm:p-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-foreground">
              Subject-wise attendance
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Late arrivals count as attended; absences lower the rate.
            </p>
          </div>
          {subjects.size === 0 ? (
            <p className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              No attendance has been recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {[...subjects.entries()].map(([key, subject]) => {
                const rate = getAttendancePercentage(subject.records);
                return (
                  <article className="space-y-2" key={key}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {subject.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {subject.section}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          rate < 75
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-foreground"
                        }`}
                      >
                        {rate}%
                      </span>
                    </div>
                    <div
                      aria-label={`${subject.name} attendance ${rate}%`}
                      aria-valuemax={100}
                      aria-valuemin={0}
                      aria-valuenow={rate}
                      className="h-2.5 overflow-hidden rounded-full bg-muted"
                      role="progressbar"
                    >
                      <div
                        className={`h-full rounded-full ${
                          rate < 75 ? "bg-amber-500" : "bg-cyan-500"
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
          <div className="border-b border-border p-4 sm:px-6">
            <h2 className="text-lg font-bold text-foreground">
              Attendance history
            </h2>
          </div>
          {records.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              Your class attendance history will appear here after your
              instructors record it.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {records.map((record) => {
                const isPresent = record.status === AttendanceStatus.PRESENT;
                const statusStyle = {
                  PRESENT:
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300",
                  LATE:
                    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
                  ABSENT:
                    "border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-300",
                }[record.status];
                return (
                  <li
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                    key={record.id}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {record.courseCode} · {record.timetableSlot.course.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(record.date)} ·{" "}
                        {record.timetableSlot.startTime
                          .toISOString()
                          .slice(11, 16)}{" "}
                        –{" "}
                        {record.timetableSlot.endTime
                          .toISOString()
                          .slice(11, 16)}{" "}
                        · Room {record.timetableSlot.room.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {record.timetableSlot.section.department} ·{" "}
                        {record.timetableSlot.section.name} · Semester{" "}
                        {record.timetableSlot.section.semester}
                      </p>
                    </div>
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle}`}
                    >
                      {isPresent
                        ? "Present"
                        : record.status === AttendanceStatus.LATE
                          ? "Late"
                          : "Absent"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </DashboardShell>
  );
}
