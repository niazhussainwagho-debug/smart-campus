import { auth } from "@/auth";
import { UserStatus } from "@/generated/prisma/enums";
import { isTimetableBatchPart, isTimetableProgram } from "@/lib/timetable-options";
import { prisma } from "@/lib/prisma";

const dayLabels = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
} as const;

function formatTime(value: Date): string {
  return value.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Authentication is required." }, { status: 401 });
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });
  if (!account || account.status !== UserStatus.APPROVED) {
    return Response.json({ error: "An approved account is required." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const program = searchParams.get("program") ?? "";
  const batchPart = searchParams.get("batchPart") ?? "";
  if (!isTimetableProgram(program) || !isTimetableBatchPart(batchPart)) {
    return Response.json(
      { error: "Select a valid program and batch part." },
      { status: 400 },
    );
  }

  const slots = await prisma.timetableSlot.findMany({
    where: {
      section: { program, batchPart },
    },
    include: {
      course: { select: { code: true, name: true } },
      room: { select: { name: true } },
      teacher: { select: { name: true } },
      teachers: { select: { name: true } },
    },
    orderBy: [{ dayOfWeek: "asc" }, { slotNumber: "asc" }, { startTime: "asc" }],
  });

  return Response.json({
    slots: slots.map((slot) => ({
      id: slot.id,
      day: dayLabels[slot.dayOfWeek],
      slotNumber: slot.slotNumber,
      startTime: formatTime(slot.startTime),
      endTime: formatTime(slot.endTime),
      subjectCode: slot.course.code,
      subjectName: slot.course.name,
      teacherName: [
        ...new Set([slot.teacher.name, ...slot.teachers.map(({ name }) => name)]),
      ].join(", "),
      roomNo: slot.room.name,
    })),
  });
}
