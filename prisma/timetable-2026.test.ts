import { describe, expect, it } from "vitest";
import {
  morningPeriodTimes,
  morningPrograms2026,
} from "./timetable-2026";

describe("2026 morning timetable data", () => {
  it("covers all three departments and four program sections", () => {
    expect(morningPrograms2026).toHaveLength(12);
    for (const department of ["BSIT", "BSSW", "BSDS"]) {
      expect(
        morningPrograms2026
          .filter((program) => program.department === department)
          .map((program) => program.section)
          .sort(),
      ).toEqual(["P-I", "P-II", "P-III", "P-IV"]);
    }
  });

  it("maps seven valid periods on every weekday of every program", () => {
    for (const program of morningPrograms2026) {
      for (const periods of Object.values(program.days)) {
        const periodClasses = periods.split(" ");
        expect(periodClasses).toHaveLength(morningPeriodTimes.length);
        for (const classKey of periodClasses) {
          expect(classKey === "." || program.classes[classKey]).toBeTruthy();
        }
      }
    }
  });

  it("has a room and at least one instructor for every listed class", () => {
    for (const program of morningPrograms2026) {
      for (const timetableClass of Object.values(program.classes)) {
        expect(timetableClass.code).not.toBe("");
        expect(timetableClass.name).not.toBe("");
        expect(timetableClass.room).not.toBe("");
        expect(timetableClass.teachers.length).toBeGreaterThan(0);
      }
    }
  });

  it("matches the updated BSIT P-II and BSSW P-III timetable blocks", () => {
    const bsitPartTwo = morningPrograms2026.find(
      (program) => program.department === "BSIT" && program.section === "P-II",
    );
    const bsswPartThree = morningPrograms2026.find(
      (program) => program.department === "BSSW" && program.section === "P-III",
    );

    expect(bsitPartTwo?.days.THU).toBe("G K H H I I .");
    expect(bsitPartTwo?.classes.K).toMatchObject({
      code: "IT24-424",
      room: "Room No 22",
    });
    expect(bsswPartThree?.days).toMatchObject({
      MON: "A A B B . . .",
      TUE: ". C C . D D .",
      WED: "E E F G G . .",
      THU: "H H I I J J .",
      FRI: ". . . . . . .",
    });
  });
});
