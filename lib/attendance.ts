import type { AttendanceStatus } from "@/generated/prisma/enums";

export type AttendanceRecordForRate = {
  status: AttendanceStatus;
};

export function getAttendancePercentage(
  records: AttendanceRecordForRate[],
): number {
  if (records.length === 0) return 0;
  const attended = records.filter(
    ({ status }) =>
      status === "PRESENT" || status === "LATE",
  ).length;
  return Math.round((attended / records.length) * 100);
}
