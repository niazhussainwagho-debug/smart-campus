import { randomBytes } from "node:crypto";
import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { timeRangesOverlap } from "../lib/clash";
import {
  morningPeriodTimes,
  morningPrograms2026,
  timetableRooms2026,
} from "./timetable-2026";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set.");
}

function requiredSeedPassword(name: string): string {
  const password = process.env[name];

  if (!password) {
    throw new Error(`${name} must be set before running the seed.`);
  }

  return password;
}

const seedPasswords = {
  admin: requiredSeedPassword("SEED_ADMIN_PASSWORD"),
  teacher: requiredSeedPassword("SEED_TEACHER_PASSWORD"),
  student: requiredSeedPassword("SEED_STUDENT_PASSWORD"),
};

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  const [adminPasswordHash, teacherPasswordHash, studentPasswordHash] =
    await Promise.all([
      hash(seedPasswords.admin, 12),
      hash(seedPasswords.teacher, 12),
      hash(seedPasswords.student, 12),
    ]);

  await prisma.user.upsert({
    where: { email: "admin@smartcampus.test" },
    update: {
      name: "Campus Admin",
      role: "ADMIN",
      status: "APPROVED",
      passwordHash: adminPasswordHash,
    },
    create: {
      name: "Campus Admin",
      email: "admin@smartcampus.test",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "APPROVED",
    },
  });

  await prisma.user.upsert({
    where: { email: "teacher@smartcampus.test" },
    update: {
      name: "Demo Teacher",
      role: "TEACHER",
      status: "APPROVED",
      passwordHash: teacherPasswordHash,
    },
    create: {
      name: "Demo Teacher",
      email: "teacher@smartcampus.test",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
      status: "APPROVED",
    },
  });

  await prisma.user.upsert({
    where: { email: "student@smartcampus.test" },
    update: {
      name: "Demo Student",
      role: "STUDENT",
      status: "APPROVED",
      passwordHash: studentPasswordHash,
    },
    create: {
      name: "Demo Student",
      email: "student@smartcampus.test",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      status: "APPROVED",
    },
  });

  const mainHall = await prisma.room.upsert({
    where: { name: "Main Hall" },
    update: { capacity: 120 },
    create: { name: "Main Hall", capacity: 120 },
  });

  await prisma.room.upsert({
    where: { name: "Computer Lab 1" },
    update: { capacity: 30 },
    create: { name: "Computer Lab 1", capacity: 30 },
  });

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
        update: { name, role: "TEACHER", status: "APPROVED" },
        create: {
          name,
          email,
          passwordHash,
          role: "TEACHER",
          status: "APPROVED",
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
  let importedSlotCount = 0;

  for (const program of morningPrograms2026) {
    const sectionDetails = {
      name: program.section,
      department: program.department,
      semester: 2,
    };
    let section = await prisma.section.findFirst({
      where: sectionDetails,
      select: { id: true },
    });
    if (!section) {
      section = await prisma.section.create({
        data: sectionDetails,
        select: { id: true },
      });
    }
    sectionByProgram.set(`${program.department}-${program.section}`, section.id);

    const existingSlots = await prisma.timetableSlot.findMany({
      where: { sectionId: section.id },
      select: { dayOfWeek: true, startTime: true },
    });
    const existingSlotKeys = new Set(
      existingSlots.map(
        (slot) => `${slot.dayOfWeek}-${slot.startTime.toISOString().slice(11, 16)}`,
      ),
    );
    const newSlots: {
      courseId: string;
      sectionId: string;
      roomId: string;
      teacherId: string;
      teacherIds: string[];
      dayOfWeek: "MON" | "TUE" | "WED" | "THU" | "FRI";
      startTime: Date;
      endTime: Date;
    }[] = [];

    for (const [dayOfWeek, periods] of Object.entries(program.days) as [
      "MON" | "TUE" | "WED" | "THU" | "FRI",
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

        const [start, end] = morningPeriodTimes[periodIndex];
        const slotKey = `${dayOfWeek}-${start}`;
        if (existingSlotKeys.has(slotKey)) {
          continue;
        }

        const nameVariants = codeNames.get(timetableClass.code);
        const courseCode =
          nameVariants && nameVariants.size > 1
            ? `${timetableClass.code}-${program.department}`
            : timetableClass.code;
        const courseKey = `${courseCode}-${timetableClass.name}`;
        let courseId = courseByKey.get(courseKey);
        if (!courseId) {
          const firstTeacherName = timetableClass.teachers[0];
          const firstTeacherId = teacherIdFor(firstTeacherName);
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
          ...new Set(
            timetableClass.teachers.map(teacherIdFor),
          ),
        ];
        const roomId = importedRooms.get(timetableClass.room);
        if (!roomId) {
          throw new Error(`Room ${timetableClass.room} was not initialized.`);
        }
        newSlots.push({
          courseId,
          sectionId: section.id,
          roomId,
          teacherId: teacherIds[0],
          teacherIds,
          dayOfWeek,
          startTime: new Date(`1970-01-01T${start}:00.000Z`),
          endTime: new Date(`1970-01-01T${end}:00.000Z`),
        });
        existingSlotKeys.add(slotKey);
      }
    }

    for (let index = 0; index < newSlots.length; index += 20) {
      await Promise.all(
        newSlots.slice(index, index + 20).map((slot) =>
          prisma.timetableSlot.create({
            data: {
              courseId: slot.courseId,
              sectionId: slot.sectionId,
              roomId: slot.roomId,
              teacherId: slot.teacherId,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              teachers: {
                connect: slot.teacherIds.map((id) => ({ id })),
              },
            },
          }),
        ),
      );
    }
    importedSlotCount += newSlots.length;
  }

  const demoStudent = await prisma.user.findUniqueOrThrow({
    where: { email: "student@smartcampus.test" },
    select: { id: true },
  });
  const demoProgramSectionId = sectionByProgram.get("BSIT-P-I");
  if (!demoProgramSectionId) {
    throw new Error("The BSIT P-I demo section was not initialized.");
  }
  await prisma.enrollment.upsert({
    where: {
      studentId_sectionId: {
        studentId: demoStudent.id,
        sectionId: demoProgramSectionId,
      },
    },
    update: {},
    create: { studentId: demoStudent.id, sectionId: demoProgramSectionId },
  });

  const sectionDetails = {
    name: "Section A",
    department: "Computer Science",
    semester: 1,
  };
  const section = await prisma.section.findFirst({
    where: sectionDetails,
  });

  const demoSection =
    section ?? (await prisma.section.create({ data: sectionDetails }));

  const teacher = await prisma.user.findUniqueOrThrow({
    where: { email: "teacher@smartcampus.test" },
  });
  const student = await prisma.user.findUniqueOrThrow({
    where: { email: "student@smartcampus.test" },
  });
  const course = await prisma.course.upsert({
    where: { code: "SC101" },
    update: {
      name: "Introduction to Smart Campus",
      teacherId: teacher.id,
    },
    create: {
      code: "SC101",
      name: "Introduction to Smart Campus",
      teacherId: teacher.id,
    },
  });

  await prisma.enrollment.upsert({
    where: {
      studentId_sectionId: {
        studentId: student.id,
        sectionId: demoSection.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      sectionId: demoSection.id,
    },
  });

  const sampleSlots = [
    { dayOfWeek: "MON" as const, start: "09:00", end: "10:00" },
    { dayOfWeek: "WED" as const, start: "09:00", end: "10:00" },
    { dayOfWeek: "FRI" as const, start: "09:00", end: "10:00" },
  ];

  for (const sample of sampleSlots) {
    const startTime = new Date(`1970-01-01T${sample.start}:00.000Z`);
    const endTime = new Date(`1970-01-01T${sample.end}:00.000Z`);
    const existingSlot = await prisma.timetableSlot.findFirst({
      where: {
        courseId: course.id,
        sectionId: demoSection.id,
        dayOfWeek: sample.dayOfWeek,
        startTime,
      },
      select: { id: true },
    });

    if (!existingSlot) {
      await prisma.timetableSlot.create({
        data: {
          courseId: course.id,
          sectionId: demoSection.id,
          roomId: mainHall.id,
          teacherId: teacher.id,
          dayOfWeek: sample.dayOfWeek,
          startTime,
          endTime,
        },
      });
    }
  }

  const sampleAvailability = [
    { dayOfWeek: "TUE" as const, start: "13:00", end: "15:00" },
    { dayOfWeek: "THU" as const, start: "13:00", end: "15:00" },
  ];

  for (const sample of sampleAvailability) {
    const startTime = new Date(`1970-01-01T${sample.start}:00.000Z`);
    const endTime = new Date(`1970-01-01T${sample.end}:00.000Z`);
    const existingSlots = await prisma.availabilitySlot.findMany({
      where: { teacherId: teacher.id, dayOfWeek: sample.dayOfWeek },
    });

    const exactSlotExists = existingSlots.some(
      (slot) =>
        slot.startTime.getTime() === startTime.getTime() &&
        slot.endTime.getTime() === endTime.getTime(),
    );
    const overlapsExisting = existingSlots.some((slot) =>
      timeRangesOverlap(startTime, endTime, slot.startTime, slot.endTime),
    );

    if (!exactSlotExists && !overlapsExisting) {
      await prisma.availabilitySlot.create({
        data: {
          teacherId: teacher.id,
          dayOfWeek: sample.dayOfWeek,
          startTime,
          endTime,
        },
      });
    }
  }

  console.log(
    `Seed complete: demo data plus 12 morning-program sections and ${importedSlotCount} new 2026 period slots are ready.`,
  );
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const safeMessage = message.replace(
      /postgres(?:ql)?:\/\/\S+/gi,
      "[database URL redacted]",
    );
    console.error("Database seeding failed:", safeMessage);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
