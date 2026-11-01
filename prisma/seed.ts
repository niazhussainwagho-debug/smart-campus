import { PrismaNeon } from "@prisma/adapter-neon";
import { hash } from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client";
import { timeRangesOverlap } from "../lib/clash";
import { syncOfficialTimetable } from "./sync-official-timetable";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set before running the seed.");
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
      adminStatus: "APPROVED",
      emailVerifiedAt: new Date(),
      passwordHash: adminPasswordHash,
    },
    create: {
      name: "Campus Admin",
      email: "admin@smartcampus.test",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      status: "APPROVED",
      adminStatus: "APPROVED",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "teacher@smartcampus.test" },
    update: {
      name: "Demo Teacher",
      role: "TEACHER",
      status: "APPROVED",
      emailVerifiedAt: new Date(),
      passwordHash: teacherPasswordHash,
    },
    create: {
      name: "Demo Teacher",
      email: "teacher@smartcampus.test",
      passwordHash: teacherPasswordHash,
      role: "TEACHER",
      status: "APPROVED",
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "student@smartcampus.test" },
    update: {
      name: "Demo Student",
      role: "STUDENT",
      status: "APPROVED",
      emailVerifiedAt: new Date(),
      passwordHash: studentPasswordHash,
    },
    create: {
      name: "Demo Student",
      email: "student@smartcampus.test",
      passwordHash: studentPasswordHash,
      role: "STUDENT",
      status: "APPROVED",
      emailVerifiedAt: new Date(),
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

  const { sectionByProgram, importedSlotCount } =
    await syncOfficialTimetable(prisma);

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
    `Seed complete: demo data plus 12 morning-program sections and ${importedSlotCount} 2026 period slots are ready.`,
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
