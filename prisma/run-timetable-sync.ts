import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { syncOfficialTimetable } from "./sync-official-timetable";

const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DIRECT_URL or DATABASE_URL must be set before syncing the timetable.");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

syncOfficialTimetable(prisma)
  .then(({ importedSlotCount }) => {
    console.log(
      `Official 2026 timetable synced: 12 sections and ${importedSlotCount} period slots.`,
    );
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown error.";
    const safeMessage = message.replace(
      /postgres(?:ql)?:\/\/\S+/gi,
      "[database URL redacted]",
    );
    console.error("Timetable sync failed:", safeMessage);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
