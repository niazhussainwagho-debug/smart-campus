"use client";

import { useState } from "react";

const semesters = [
  "First",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
] as const;

type AttendanceBreakdownRow = {
  key: string;
  semester: number;
  courseCode: string;
  name: string;
  totalClasses: number;
  present: number;
  percentage: number;
};

type StudentAttendanceBreakdownProps = {
  activeSemester: number;
  currentDate: string;
  rows: AttendanceBreakdownRow[];
};

export function StudentAttendanceBreakdown({
  activeSemester,
  currentDate,
  rows,
}: StudentAttendanceBreakdownProps) {
  const [selectedSemester, setSelectedSemester] = useState(activeSemester);
  const semesterRows = rows.filter(
    (row) => row.semester === selectedSemester,
  );
  const totalClasses = semesterRows.reduce(
    (total, row) => total + row.totalClasses,
    0,
  );
  const presentClasses = semesterRows.reduce(
    (total, row) => total + row.present,
    0,
  );
  const cumulativePercentage =
    totalClasses === 0
      ? 0
      : Math.round((presentClasses / totalClasses) * 100);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
      <div className="flex flex-col gap-4 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Semester-wise &amp; subject-wise attendance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Late arrivals count as attended toward your percentage.
          </p>
        </div>
        <label className="flex items-center gap-3 text-sm font-medium text-foreground">
          <span>Semester</span>
          <select
            className="min-h-11 min-w-44 rounded-xl border border-border bg-background px-3 py-2 text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
            onChange={(event) =>
              setSelectedSemester(Number(event.currentTarget.value))
            }
            value={selectedSemester}
          >
            {semesters.map((semester, index) => (
              <option key={semester} value={index + 1}>
                {semester} Semester
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-left text-sm">
          <thead className="bg-muted/70 text-xs font-bold tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 sm:px-6" scope="col">
                COURSE NO
              </th>
              <th className="px-4 py-3" scope="col">
                SUBJECTS
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                TOTAL CLASSES
              </th>
              <th className="px-4 py-3 text-center" scope="col">
                PRESENT
              </th>
              <th className="px-4 py-3 text-right sm:px-6" scope="col">
                PERCENTAGE
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {semesterRows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-muted-foreground sm:px-6"
                  colSpan={5}
                >
                  No attendance has been recorded for this semester.
                </td>
              </tr>
            ) : (
              semesterRows.map((row) => (
                <tr className="text-foreground" key={row.key}>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold sm:px-6">
                    {row.courseCode}
                  </td>
                  <td className="px-4 py-4">{row.name}</td>
                  <td className="px-4 py-4 text-center">
                    {row.totalClasses}
                  </td>
                  <td className="px-4 py-4 text-center">{row.present}</td>
                  <td
                    className={`px-4 py-4 text-right font-bold sm:px-6 ${
                      row.percentage < 75
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-foreground"
                    }`}
                  >
                    {row.percentage}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="border-t-2 border-border bg-muted/40 font-semibold text-foreground">
            <tr>
              <th
                className="px-4 py-4 text-left text-xs tracking-wide sm:px-6"
                colSpan={2}
                scope="row"
              >
                CUMULATIVE PERCENTAGE
              </th>
              <td className="px-4 py-4 text-center">{totalClasses}</td>
              <td className="px-4 py-4 text-center">{presentClasses}</td>
              <td className="px-4 py-4 text-right sm:px-6">
                <span
                  className={
                    cumulativePercentage < 75
                      ? "text-amber-700 dark:text-amber-300"
                      : ""
                  }
                >
                  {cumulativePercentage}%
                </span>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {currentDate}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
