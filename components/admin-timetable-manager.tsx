"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, useMemo, type FormEvent } from "react";
import type { DayOfWeek } from "@/generated/prisma/enums";
import type { ClashType } from "@/lib/clash";
import type { TimetableActionResult } from "@/lib/timetable-action-result";
import {
  createCourseAction,
  createRoomAction,
  createSectionAction,
  deleteTimetableSlotAction,
  saveTimetableSlotAction,
} from "@/app/admin/timetable/actions";

type CourseOption = {
  id: string;
  code: string;
  name: string;
  teacherId: string;
  teacherName: string;
};

type SectionOption = {
  id: string;
  name: string;
  department: string;
  program: string;
  batchPart: string;
  semester: number;
};

type RoomOption = {
  id: string;
  name: string;
  capacity: number;
};

type TeacherOption = {
  id: string;
  name: string;
};

type TimetableSlotRow = {
  id: string;
  courseId: string;
  sectionId: string;
  roomId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  slotNumber: number;
  startTime: string;
  endTime: string;
  courseLabel: string;
  sectionLabel: string;
  roomName: string;
  teacherName: string;
};

type ActionForm = (
  formData: FormData,
) => Promise<TimetableActionResult>;

type ActionNotice = {
  result: TimetableActionResult;
};

const days: { value: DayOfWeek; label: string }[] = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

const clashMessages: Record<ClashType, string> = {
  ROOM: "This room is already booked for another class at this time.",
  TEACHER: "This teacher is already assigned to another class at this time.",
  SECTION: "This section already has a class scheduled at this time.",
};

function Notice({ notice }: { notice: ActionNotice | null }) {
  if (!notice) {
    return null;
  }

  const { result } = notice;
  return (
    <div
      aria-live="polite"
      className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
        result.ok
          ? "border-emerald-500/30 bg-emerald-950/40 text-emerald-300"
          : "border-rose-500/30 bg-rose-950/40 text-rose-300"
      }`}
      role={result.ok ? "status" : "alert"}
    >
      <p className="font-semibold">{result.message}</p>
      {result.clashes?.length ? (
        <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-rose-200">
          {result.clashes.map((clash, index) => (
            <li key={`${clash.type}-${clash.slotId ?? index}`}>
              {clashMessages[clash.type]}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const inputClass =
  "mt-1 min-w-0 w-full rounded-xl border border-[#2e4258] bg-[#0d1727] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-[#4ed0d8] focus:bg-[#0d1727]";
const labelClass = "mt-3 block min-w-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400";
const buttonClass =
  "rounded-xl bg-gradient-to-r from-[#49d5d8] via-[#6af0cc] to-[#47d9c7] px-4 py-2.5 text-sm font-bold text-[#06141d] shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";
const timetableInputClass =
  "mt-1 min-w-0 w-full rounded-lg border border-[#2e4258] bg-[#0d1727] px-2.5 py-2 text-xs text-white placeholder:text-slate-500 outline-none transition focus:border-[#4ed0d8]";
const timetableLabelClass =
  "block min-w-0 text-[10px] font-semibold text-slate-400";
const timetableButtonClass =
  "rounded-lg bg-gradient-to-r from-[#49d5d8] via-[#6af0cc] to-[#47d9c7] px-3 py-2 text-xs font-bold text-[#06141d] shadow-md shadow-cyan-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export function AdminTimetableManager({
  canCreateCourses,
  courses,
  sections,
  rooms,
  teachers,
  slots,
}: {
  canCreateCourses: boolean;
  courses: CourseOption[];
  sections: SectionOption[];
  rooms: RoomOption[];
  teachers: TeacherOption[];
  slots: TimetableSlotRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [courseNotice, setCourseNotice] = useState<ActionNotice | null>(null);
  const [sectionNotice, setSectionNotice] = useState<ActionNotice | null>(null);
  const [roomNotice, setRoomNotice] = useState<ActionNotice | null>(null);
  const [slotNotice, setSlotNotice] = useState<ActionNotice | null>(null);
  const [editingSlot, setEditingSlot] = useState<TimetableSlotRow | null>(null);

  // Scheduled Classes filters
  const [adminSelectedDept, setAdminSelectedDept] = useState<string>("ALL");
  const [adminSelectedDay, setAdminSelectedDay] = useState<DayOfWeek | "ALL">("ALL");
  const [adminSlotSearch, setAdminSlotSearch] = useState<string>("");

  const adminDepartments = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    slots.forEach((s) => {
      // sectionLabel is e.g. "BSIT-3A · Information Technology"
      const parts = s.sectionLabel.split("·");
      if (parts.length > 1) {
        set.add(parts[1].trim());
      }
    });
    return Array.from(set).sort();
  }, [sections, slots]);

  const filteredAdminSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (adminSelectedDept !== "ALL" && !slot.sectionLabel.includes(adminSelectedDept)) {
        return false;
      }
      if (adminSelectedDay !== "ALL" && slot.dayOfWeek !== adminSelectedDay) {
        return false;
      }
      if (adminSlotSearch.trim()) {
        const q = adminSlotSearch.toLowerCase().trim();
        return (
          slot.courseLabel.toLowerCase().includes(q) ||
          slot.sectionLabel.toLowerCase().includes(q) ||
          slot.roomName.toLowerCase().includes(q) ||
          slot.teacherName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [slots, adminSelectedDept, adminSelectedDay, adminSlotSearch]);

  function submitAction(
    event: FormEvent<HTMLFormElement>,
    action: ActionForm,
    setNotice: (notice: ActionNotice) => void,
    resetAfterSuccess = false,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await action(formData);
      setNotice({ result });

      if (result.ok) {
        if (resetAfterSuccess) {
          form.reset();
        }
        router.refresh();
      }
    });
  }

  function deleteSlot(id: string) {
    if (!window.confirm("Are you sure you want to delete this timetable class?")) {
      return;
    }

    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      const result = await deleteTimetableSlotAction(formData);
      setSlotNotice({ result });
      if (result.ok) {
        if (editingSlot?.id === id) {
          setEditingSlot(null);
        }
        router.refresh();
      }
    });
  }

  function getSlotStatus(slot: TimetableSlotRow): "ongoing" | "upcoming" {
    const now = new Date();
    const dayMap = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };
    const currentDay = now.getDay();
    const targetDay = dayMap[slot.dayOfWeek];

    if (targetDay === currentDay) {
      const [sh, sm] = slot.startTime.split(":").map(Number);
      const [eh, em] = slot.endTime.split(":").map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      return nowMinutes >= startMinutes && nowMinutes <= endMinutes ? "ongoing" : "upcoming";
    }

    return targetDay > currentDay ? "upcoming" : "upcoming";
  }

  const todayValue: DayOfWeek =
    (["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as DayOfWeek[])[
      new Date().getDay()
    ] ?? "MON";

  return (
    <div className="min-w-0 space-y-3">
      <details className="group min-w-0 overflow-hidden rounded-xl border border-[#243244] bg-[#101b2a]/95 shadow-[0_12px_32px_rgba(15,23,42,0.25)]">
        <summary className="flex min-w-0 cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-white">
              Courses, Sections &amp; Rooms
            </span>
            <span className="mt-1 block text-xs text-slate-400">
              Add or review the records used by the timetable.
            </span>
          </span>
          <span className="shrink-0 rounded-lg border border-[#2b3c4b] bg-[#0d1727] px-3 py-1.5 text-xs font-semibold text-[#77ddd8] group-open:hidden">
            Manage +
          </span>
          <span className="hidden shrink-0 rounded-lg border border-[#2b3c4b] bg-[#0d1727] px-3 py-1.5 text-xs font-semibold text-slate-300 group-open:inline">
            Close −
          </span>
        </summary>

        <div className="border-t border-[#233246] p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {canCreateCourses ? (
            <form
              className="min-w-0 rounded-[22px] border border-[#2b3c4b] bg-[#101b2a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-5"
              onSubmit={(event) =>
                submitAction(event, createCourseAction, setCourseNotice, true)
              }
            >
              <h3 className="break-words text-xl font-bold text-white sm:text-2xl">
                Add Course
              </h3>
              <label className={labelClass}>
                Course code
                <input
                  className={inputClass}
                  name="code"
                  placeholder="e.g. CS-301"
                  required
                />
              </label>
              <label className={labelClass}>
                Course name
                <input
                  className={inputClass}
                  name="name"
                  placeholder="e.g. Data Structures"
                  required
                />
              </label>
              <label className={labelClass}>
                Assigned Teacher
                <select
                  className={`${inputClass} appearance-none`}
                  name="teacherId"
                  required
                >
                  <option value="">Select teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className={`${buttonClass} mt-6 w-full`}
                disabled={isPending || !teachers.length}
              >
                Save Course
              </button>
              <Notice notice={courseNotice} />
            </form>
          ) : null}

          <form
            className="min-w-0 rounded-[22px] border border-[#2b3c4b] bg-[#101b2a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-5"
            onSubmit={(event) =>
              submitAction(event, createSectionAction, setSectionNotice, true)
            }
          >
            <h3 className="break-words text-xl font-bold text-white sm:text-2xl">Add Section</h3>
            <label className={labelClass}>
              Section name
              <input className={inputClass} name="name" placeholder="e.g. BSCS-3A" required />
            </label>
            <label className={labelClass}>
              Department
              <input className={inputClass} name="department" placeholder="e.g. Computer Science" required />
            </label>
            <label className={labelClass}>
              Program
              <select className={inputClass} defaultValue="" name="program" required>
                <option value="">Select program</option>
                <option value="BSSW">Software Engineering (BSSW)</option>
                <option value="BSIT">Information Technology (BSIT)</option>
                <option value="BSDS">Data Science (BSDS)</option>
              </select>
            </label>
            <label className={labelClass}>
              Batch / Part
              <select className={inputClass} defaultValue="" name="batchPart" required>
                <option value="">Select part</option>
                <option value="Part-I">Part-I</option>
                <option value="Part-II">Part-II</option>
                <option value="Part-III">Part-III</option>
                <option value="Part-IV">Part-IV</option>
              </select>
            </label>
            <label className={labelClass}>
              Semester
              <input
                className={inputClass}
                min="1"
                name="semester"
                placeholder="1 to 8"
                required
                type="number"
              />
            </label>
            <button className={`${buttonClass} mt-6 w-full`} disabled={isPending}>
              Save Section
            </button>
            <Notice notice={sectionNotice} />
          </form>

          <form
            className="min-w-0 rounded-[22px] border border-[#2b3c4b] bg-[#101b2a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-5"
            onSubmit={(event) =>
              submitAction(event, createRoomAction, setRoomNotice, true)
            }
          >
            <h3 className="break-words text-xl font-bold text-white sm:text-2xl">Add Room</h3>
            <label className={labelClass}>
              Room name
              <input className={inputClass} name="name" placeholder="e.g. Lab 3 / Hall A" required />
            </label>
            <label className={labelClass}>
              Capacity
              <input
                className={inputClass}
                min="1"
                name="capacity"
                placeholder="e.g. 50"
                required
                type="number"
              />
            </label>
            <button className={`${buttonClass} mt-6 w-full`} disabled={isPending}>
              Save Room
            </button>
            <Notice notice={roomNotice} />
          </form>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[#233246] pt-5 sm:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-xl border border-[#233246] bg-[#0d1727]/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#3acbd4]">Existing Courses</h3>
            {courses.length ? (
              <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto text-xs text-slate-300">
                {courses.map((course) => (
                  <li className="flex items-center justify-between rounded-lg bg-[#0c1422] p-2" key={course.id}>
                    <span className="font-bold text-white">{course.code}</span>
                    <span className="text-slate-400">{course.name} ({course.teacherName})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No courses yet.</p>
            )}
          </div>
          <div className="rounded-xl border border-[#233246] bg-[#0d1727]/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#4ee7b8]">Existing Sections</h3>
            {sections.length ? (
              <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto text-xs text-slate-300">
                {sections.map((section) => (
                  <li className="flex items-center justify-between rounded-lg bg-[#0c1422] p-2" key={section.id}>
                    <span className="font-bold text-white">{section.name}</span>
                    <span className="text-slate-400">{section.program} · {section.batchPart} · {section.department} (Sem {section.semester})</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No sections yet.</p>
            )}
          </div>
          <div className="rounded-xl border border-[#233246] bg-[#0d1727]/80 p-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-[#66d3ff]">Existing Rooms</h3>
            {rooms.length ? (
              <ul className="mt-3 max-h-48 space-y-1.5 overflow-y-auto text-xs text-slate-300">
                {rooms.map((room) => (
                  <li className="flex items-center justify-between rounded-lg bg-[#0c1422] p-2" key={room.id}>
                    <span className="font-bold text-white">{room.name}</span>
                    <span className="text-slate-400">Cap: {room.capacity} seats</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No rooms yet.</p>
            )}
          </div>
        </div>
        </div>
      </details>

      <section className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:grid-cols-3" aria-label="Timetable summary">
        <article className="flex min-w-0 items-center gap-2 rounded-lg border border-[#243244] bg-[#101b2a]/90 px-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#42c5c755] bg-[#37c5c71d] text-xs text-[#40d2d1]">
            ▦
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[9px] text-slate-400">Scheduled classes</span>
            <strong className="block text-sm leading-tight text-white">{slots.length}</strong>
          </span>
        </article>
        <article className="flex min-w-0 items-center gap-2 rounded-lg border border-[#243244] bg-[#101b2a]/90 px-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#65a9ed55] bg-[#65a9ed1d] text-xs text-[#75b7f1]">
            ◷
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[9px] text-slate-400">
              {days.find((day) => day.value === todayValue)?.label ?? "Today"}
            </span>
            <strong className="block text-sm leading-tight text-white">
              {slots.filter((slot) => slot.dayOfWeek === todayValue).length}
            </strong>
          </span>
        </article>
        <article className="flex min-w-0 items-center gap-2 rounded-lg border border-[#243244] bg-[#101b2a]/90 px-3 py-2">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#aa75dc55] bg-[#aa75dc1d] text-xs text-[#c19aef]">
            ⌂
          </span>
          <span className="min-w-0">
            <span className="block truncate text-[9px] text-slate-400">Rooms in use</span>
            <strong className="block text-sm leading-tight text-white">
              {new Set(slots.map((slot) => slot.roomName)).size}
            </strong>
          </span>
        </article>
      </section>

      <section
        className="overflow-hidden rounded-xl border border-[#243244] bg-[#101b2a]/95 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.25)] sm:p-5"
        id="schedule-form"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
        <h2 className="text-base font-bold text-white">
          {editingSlot ? "Edit Scheduled Class" : "Schedule a New Class"}
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Room, teacher, and section time conflicts are automatically checked on save.
        </p>
          </div>
          <span className="rounded-md border border-[#4bc9c42e] px-2 py-1 text-[9px] font-bold tracking-wide text-[#75d8d3]">
            {editingSlot ? "EDITING" : "NEW CLASS"}
          </span>
        </div>

        {!courses.length ||
        !sections.length ||
        !rooms.length ||
        !teachers.length ? (
          <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/40 p-3 text-xs text-amber-300">
            At least one course, section, room, and teacher must be added first.
          </p>
        ) : null}

        <form
          className="mt-4 grid grid-cols-1 gap-x-3 gap-y-2 min-[360px]:grid-cols-2 sm:grid-cols-4 xl:grid-cols-8"
          key={editingSlot?.id ?? "new-slot"}
          onSubmit={(event) =>
            submitAction(event, saveTimetableSlotAction, setSlotNotice, true)
          }
        >
          {editingSlot ? (
            <input name="id" type="hidden" value={editingSlot.id} />
          ) : null}
          <label className={timetableLabelClass}>
            Course
            <select
              className={timetableInputClass}
              defaultValue={editingSlot?.courseId ?? ""}
              name="courseId"
              required
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} · {course.name}
                </option>
              ))}
            </select>
          </label>
          <label className={timetableLabelClass}>
            Section
            <select
              className={timetableInputClass}
              defaultValue={editingSlot?.sectionId ?? ""}
              name="sectionId"
              required
            >
              <option value="">Select section</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name} · {section.department}
                </option>
              ))}
            </select>
          </label>
          <label className={timetableLabelClass}>
            Room
            <select
              className={timetableInputClass}
              defaultValue={editingSlot?.roomId ?? ""}
              name="roomId"
              required
            >
              <option value="">Select room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <label className={timetableLabelClass}>
            Teacher
            <select
              className={timetableInputClass}
              defaultValue={editingSlot?.teacherId ?? ""}
              name="teacherId"
              required
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </label>
          <label className={timetableLabelClass}>
            Day
            <select
              className={timetableInputClass}
              defaultValue={editingSlot?.dayOfWeek ?? ""}
              name="dayOfWeek"
              required
            >
              <option value="">Select day</option>
              {days.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
          <label className={timetableLabelClass}>
            Period
            <input
              className={timetableInputClass}
              defaultValue={editingSlot?.slotNumber ?? 1}
              max="7"
              min="1"
              name="slotNumber"
              required
              type="number"
            />
          </label>
          <label className={timetableLabelClass}>
            Start Time
            <input
              className={timetableInputClass}
              defaultValue={editingSlot?.startTime ?? ""}
              name="startTime"
              required
              type="time"
            />
          </label>
          <label className={timetableLabelClass}>
            End Time
            <input
              className={timetableInputClass}
              defaultValue={editingSlot?.endTime ?? ""}
              name="endTime"
              required
              type="time"
            />
          </label>
          <div className="col-span-1 flex flex-wrap items-end gap-2 min-[360px]:col-span-2 sm:col-span-4 xl:col-span-1">
            <button
              className={timetableButtonClass}
              disabled={
                isPending ||
                !courses.length ||
                !sections.length ||
                !rooms.length ||
                !teachers.length
              }
            >
              {isPending ? "Saving..." : "Save Class"}
            </button>
            {editingSlot ? (
              <button
                className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
                onClick={() => setEditingSlot(null)}
                type="button"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        <Notice notice={slotNotice} />
      </section>

      <section className="min-w-0 overflow-hidden rounded-xl border border-[#233246] bg-[#111c2d]/95 p-4 shadow-[0_12px_32px_rgba(15,23,42,0.25)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="flex flex-wrap items-center gap-2 text-base font-bold text-white">
              Scheduled Classes
              <span className="rounded-full border border-[#1fdbb1]/30 bg-[#1fdbb1]/10 px-2 py-0.5 text-[10px] font-bold text-[#4de5bd]">
                {slots.length}
              </span>
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Search and filter the full class schedule.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <input
              type="text"
              placeholder="Search classes..."
              value={adminSlotSearch}
              onChange={(e) => setAdminSlotSearch(e.target.value)}
              aria-label="Search classes"
              className="w-full rounded-lg border border-[#2b3c4b] bg-[#0d1727] py-2 pl-8 pr-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#4ed0d8]"
            />
            <span className="absolute left-2.5 top-2.5 text-slate-500 text-xs">🔍</span>
            {adminSlotSearch && (
              <button
                type="button"
                onClick={() => setAdminSlotSearch("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-1.5 overflow-x-auto border-b border-[#223246] pb-2">
          <button
            type="button"
            aria-pressed={adminSelectedDay === "ALL"}
            onClick={() => setAdminSelectedDay("ALL")}
            className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
              adminSelectedDay === "ALL"
                ? "border border-[#31d9b7]/30 bg-[#18d0b0]/15 text-[#64f0cc]"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All days
          </button>
          {days.map((day) => (
            <button
              key={day.value}
              type="button"
              aria-pressed={adminSelectedDay === day.value}
              onClick={() => setAdminSelectedDay(day.value)}
              className={`shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition ${
                adminSelectedDay === day.value
                  ? "border border-[#31d9b7]/30 bg-[#18d0b0]/15 text-[#64f0cc]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {day.label.slice(0, 3)}
            </button>
          ))}
          <label className="ml-auto shrink-0">
            <span className="sr-only">Filter by department</span>
            <select
              aria-label="Filter by department"
              className="max-w-40 rounded-md border border-[#2b3c4b] bg-[#0d1727] px-2 py-1.5 text-[11px] text-slate-300 outline-none focus:border-[#4ed0d8]"
              onChange={(event) => setAdminSelectedDept(event.target.value)}
              value={adminSelectedDept}
            >
              <option value="ALL">All departments</option>
              {adminDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </label>
          <span className="shrink-0 pl-1 text-[10px] text-slate-500">
            {filteredAdminSlots.length} shown
          </span>
        </div>

        {filteredAdminSlots.length ? (
          <div className="mt-1">
            {filteredAdminSlots.map((slot, index) => {
              const status = getSlotStatus(slot);
              const accentClasses = [
                "bg-[#61e1ac] text-[#082f23]",
                "bg-[#69d9ff] text-[#062639]",
                "bg-[#7c9eff] text-[#0a163a]",
                "bg-[#c286ff] text-[#1d1238]",
                "bg-[#f3b473] text-[#2a1c0a]",
              ];

              return (
                <article
                  key={slot.id}
                  className="grid grid-cols-[3px_58px_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1.5 border-b border-[#233246]/70 py-3 last:border-b-0 sm:grid-cols-[3px_68px_minmax(0,1fr)_minmax(100px,.65fr)_auto_auto] sm:gap-x-3"
                >
                  <span
                    aria-hidden="true"
                    className={`h-8 w-[3px] rounded-full ${accentClasses[index % accentClasses.length].split(" ")[0]}`}
                  />
                  <div className="grid gap-1">
                    <strong className="text-[11px] font-bold tabular-nums text-slate-100">
                      {slot.startTime}
                    </strong>
                    <span className="text-[10px] tabular-nums text-slate-500">
                      {slot.endTime}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <h3 className="truncate text-xs font-semibold text-white">
                      {slot.courseLabel.split(" · ")[1] || slot.courseLabel}
                    </h3>
                    <p className="mt-1 truncate text-[10px] text-slate-400">
                      {slot.courseLabel.split(" · ")[0]} <span className="text-[#4fc8c5]">·</span>{" "}
                      {slot.sectionLabel}
                    </p>
                    <p className="mt-1 truncate text-[10px] text-slate-500 sm:hidden">
                      {slot.roomName} <span className="text-[#4fc8c5]">·</span> {slot.teacherName}
                    </p>
                  </div>

                  <div className="hidden min-w-0 sm:grid sm:gap-1">
                    <span className="truncate text-[10px] text-slate-300">{slot.roomName}</span>
                    <span className="truncate text-[10px] text-slate-500">{slot.teacherName}</span>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 justify-self-end rounded-full border px-2 py-1 text-[9px] font-semibold capitalize ${
                    status === "ongoing"
                      ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                      : "border-slate-400/15 bg-slate-400/5 text-slate-400"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${status === "ongoing" ? "bg-emerald-300" : "bg-slate-500"}`} />
                    {status}
                  </span>

                  <div className="col-span-2 col-start-3 flex items-center gap-1 sm:col-span-1 sm:col-start-auto sm:justify-end">
                    <button
                      className="rounded-md border border-slate-700/80 bg-slate-800/80 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-cyan-950/30 hover:text-cyan-300"
                      onClick={() => {
                        setEditingSlot(slot);
                        setSlotNotice(null);
                        document
                          .getElementById("schedule-form")
                          ?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      type="button"
                    >
                      Edit
                    </button>
                    <button
                      className="rounded-md border border-rose-500/30 bg-rose-950/30 px-2 py-1 text-[10px] font-semibold text-rose-300 transition hover:bg-rose-900/50 disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => deleteSlot(slot.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-dashed border-slate-800 bg-slate-900/30 p-6 text-center text-xs text-slate-500">
            No classes match your active filters.
          </div>
        )}
      </section>
    </div>
  );
}
