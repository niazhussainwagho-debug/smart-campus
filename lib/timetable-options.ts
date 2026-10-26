export const timetablePrograms = [
  { value: "BSSW", label: "Software Engineering" },
  { value: "BSIT", label: "Information Technology" },
  { value: "BSDS", label: "Data Science" },
] as const;

export const timetableBatchParts = [
  "Part-I",
  "Part-II",
  "Part-III",
  "Part-IV",
] as const;

export type TimetableProgram = (typeof timetablePrograms)[number]["value"];
export type TimetableBatchPart = (typeof timetableBatchParts)[number];

export function isTimetableProgram(value: string): value is TimetableProgram {
  return timetablePrograms.some((program) => program.value === value);
}

export function isTimetableBatchPart(
  value: string,
): value is TimetableBatchPart {
  return timetableBatchParts.some((batchPart) => batchPart === value);
}
