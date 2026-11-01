import { randomBytes, randomUUID } from "node:crypto";
import { hash } from "bcryptjs";
import { Prisma, type PrismaClient } from "../generated/prisma/client";
import {
  morningPeriodTimes,
  morningPrograms2026,
  timetableRooms2026,
} from "./timetable-2026";

type TimetableDay = "MON" | "TUE" | "WED" | "THU" | "FRI";

export async function syncOfficialTimetable(prisma: PrismaClient) {
  const importedRooms = new Map<string, string>();
  await Promise.all(
    timetableRooms2026.map(async ({ name, capacity }) => {
      const room = await prisma.room.upsert({
        where: { name },
        update: { capacity },
        create: { name, capacity },
        select: { id: true },
      });
      importedRooms.set(name, room.id);
    }),
  );

  const teacherByName = new Map<string, string>();
  const teacherNames = [
    ...new Set(
      morningPrograms2026.flatMap((program) =>
        Object.values(program.classes).flatMap((course) => course.teachers),
      ),
    ),
  ];
  await Promise.all(
    teacherNames.map(async (name) => {
      const email = `timetable-${name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}@smartcampus.test`;
      const passwordHash = await hash(randomBytes(32).toString("hex"), 12);
      const teacher = await prisma.user.upsert({
        where: { email },
        update: {
          name,
          role: "TEACHER",
          status: "APPROVED",
          emailVerifiedAt: new Date(),
        },
        create: {
          name,
          email,
          passwordHash,
          role: "TEACHER",
          status: "APPROVED",
          emailVerifiedAt: new Date(),
        },
        select: { id: true },
      });
      teacherByName.set(name, teacher.id);
    }),
  );

  const teacherIdFor = (name: string): string => {
    const id = teacherByName.get(name);
    if (!id) {
      throw new Error(`Teacher ${name} was not initialized.`);
    }
    return id;
  };

  const codeNames = new Map<string, Set<string>>();
  for (const program of morningPrograms2026) {
    for (const timetableClass of Object.values(program.classes)) {
      const names = codeNames.get(timetableClass.code) ?? new Set<string>();
      names.add(timetableClass.name);
      codeNames.set(timetableClass.code, names);
    }
  }

  const courseByKey = new Map<string, string>();
  const sectionByProgram = new Map<string, string>();
  const newSlots: {
    id: string;
    courseId: string;
    sectionId: string;
    roomId: string;
    teacherId: string;
    teacherIds: string[];
    dayOfWeek: TimetableDay;
    slotNumber: number;
    startTime: Date;
    endTime: Date;
  }[] = [];

  for (const program of morningPrograms2026) {
    const batchPart = {
      "P-I": "Part-I",
      "P-II": "Part-II",
      "P-III": "Part-III",
      "P-IV": "Part-IV",
    }[program.section];
    const sectionDetails = {
      name: program.section,
      department: program.department,
      program: program.department,
      batchPart,
      semester: 2,
    };
    let section = await prisma.section.findFirst({
      where: {
        name: sectionDetails.name,
        department: sectionDetails.department,
        semester: sectionDetails.semester,
      },
      select: { id: true },
    });
    if (!section) {
      section = await prisma.section.create({
        data: sectionDetails,
        select: { id: true },
      });
    } else {
      await prisma.section.update({
        where: { id: section.id },
        data: { program: sectionDetails.program, batchPart },
      });
    }
    sectionByProgram.set(`${program.department}-${program.section}`, section.id);

    for (const [dayOfWeek, periods] of Object.entries(program.days) as [
      TimetableDay,
      string,
    ][]) {
      const periodClasses = periods.split(" ");
      if (periodClasses.length !== morningPeriodTimes.length) {
        throw new Error(
          `${program.department} ${program.section} ${dayOfWeek} must have exactly 7 period entries.`,
        );
      }

      for (const [periodIndex, classKey] of periodClasses.entries()) {
        if (classKey === ".") {
          continue;
        }
        const timetableClass = program.classes[classKey];
        if (!timetableClass) {
          throw new Error(
            `Unknown class key ${classKey} for ${program.department} ${program.section}.`,
          );
        }

        const nameVariants = codeNames.get(timetableClass.code);
        const courseCode =
          nameVariants && nameVariants.size > 1
            ? `${timetableClass.code}-${program.department}`
            : timetableClass.code;
        const courseKey = `${courseCode}-${timetableClass.name}`;
        let courseId = courseByKey.get(courseKey);
        if (!courseId) {
          const firstTeacherId = teacherIdFor(timetableClass.teachers[0]);
          const existingCourse = await prisma.course.findUnique({
            where: { code: courseCode },
            select: { id: true },
          });
          const course = existingCourse
            ? await prisma.course.update({
                where: { id: existingCourse.id },
                data: {
                  name: timetableClass.name,
                  teacherId: firstTeacherId,
                },
                select: { id: true },
              })
            : await prisma.course.create({
                data: {
                  code: courseCode,
                  name: timetableClass.name,
                  teacherId: firstTeacherId,
                },
                select: { id: true },
              });
          courseId = course.id;
          courseByKey.set(courseKey, courseId);
        }

        const teacherIds = [
          ...new Set(timetableClass.teachers.map(teacherIdFor)),
        ];
        const roomId = importedRooms.get(timetableClass.room);
        if (!roomId) {
          throw new Error(`Room ${timetableClass.room} was not initialized.`);
        }
        const [start, end] = morningPeriodTimes[periodIndex];
        newSlots.push({
          id: randomUUID(),
          courseId,
          sectionId: section.id,
          roomId,
          teacherId: teacherIds[0],
          teacherIds,
          dayOfWeek,
          slotNumber: periodIndex + 1,
          startTime: new Date(`1970-01-01T${start}:00.000Z`),
          endTime: new Date(`1970-01-01T${end}:00.000Z`),
        });
      }
    }
  }

  const teacherAssignments = newSlots.flatMap(({ id, teacherIds }) =>
    teacherIds.map((teacherId) => ({ slotId: id, teacherId })),
  );
  const teacherLinks = Prisma.join(
    teacherAssignments.map(({ slotId, teacherId }) =>
      Prisma.sql`(${slotId}, ${teacherId})`,
    ),
  );

  await prisma.$transaction(async (transaction) => {
    await transaction.timetableSlot.deleteMany({
      where: { sectionId: { in: [...sectionByProgram.values()] } },
    });
    await transaction.timetableSlot.createMany({
      data: newSlots.map((slot) => ({
        id: slot.id,
        courseId: slot.courseId,
        sectionId: slot.sectionId,
        roomId: slot.roomId,
        teacherId: slot.teacherId,
        dayOfWeek: slot.dayOfWeek,
        slotNumber: slot.slotNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
    });
    await transaction.$executeRaw(
      Prisma.sql`INSERT INTO "_TimetableSlotTeachers" ("A", "B") VALUES ${teacherLinks}`,
    );
  });

  const importedSlotCount = await prisma.timetableSlot.count({
    where: { sectionId: { in: [...sectionByProgram.values()] } },
  });
  if (importedSlotCount !== newSlots.length) {
    throw new Error(
      `Expected ${newSlots.length} official timetable slots, but found ${importedSlotCount}.`,
    );
  }

  return {
    sectionByProgram,
    importedSlotCount,
  };
}
