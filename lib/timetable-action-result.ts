import type { TimetableClash } from "@/lib/clash";

export type TimetableActionResult = {
  ok: boolean;
  message: string;
  clashes?: TimetableClash[];
};
