import { describe, expect, it } from "vitest";
import { AttendanceStatus } from "@/generated/prisma/enums";
import { getAttendancePercentage } from "@/lib/attendance";

describe("getAttendancePercentage", () => {
  it("counts both present and late records as attended", () => {
    expect(
      getAttendancePercentage([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.PRESENT },
      ]),
    ).toBe(75);
  });

  it("returns zero when no attendance has been recorded", () => {
    expect(getAttendancePercentage([])).toBe(0);
  });

  it("rounds the calculated percentage to a whole number", () => {
    expect(
      getAttendancePercentage([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.ABSENT },
        { status: AttendanceStatus.ABSENT },
      ]),
    ).toBe(33);
  });
});
