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
  "mt-1 w-full rounded-xl border border-[#2e4258] bg-[#0d1727] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-[#4ed0d8] focus:bg-[#0d1727]";
const labelClass = "mt-3 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400";
const buttonClass =
  "rounded-xl bg-gradient-to-r from-[#49d5d8] via-[#6af0cc] to-[#47d9c7] px-4 py-2.5 text-sm font-bold text-[#06141d] shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50";

export function AdminTimetableManager({
  courses,
  sections,
  rooms,
  teachers,
  slots,
}: {
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

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl border border-[#243244] bg-[#101b2a]/95 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-md sm:rounded-[26px] sm:p-6 lg:p-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Courses, Sections &amp; Rooms
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Add the required academic records before scheduling classes.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          <form
            className="rounded-[22px] border border-[#2b3c4b] bg-[#101b2a] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            onSubmit={(event) =>
              submitAction(event, createCourseAction, setCourseNotice, true)
            }
          >
            <h3 className="text-2xl font-bold text-white">Add Course</h3>
            <label className={labelClass}>
              Course code
              <input className={inputClass} name="code" placeholder="e.g. CS-301" required />
            </label>
            <label className={labelClass}>
              Course name
              <input className={inputClass} name="name" placeholder="e.g. Data Structures" required />
            </label>
            <label className={labelClass}>
              Assigned Teacher
              <select className={`${inputClass} appearance-none`} name="teacherId" required>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </label>
            <button className={`${buttonClass} mt-6 w-full`} disabled={isPending || !teachers.length}>
              Save Course
            </button>
            <Notice notice={courseNotice} />
          </form>

          <form
            className="rounded-[22px] border border-[#2b3c4b] bg-[#101b2a] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            onSubmit={(event) =>
              submitAction(event, createSectionAction, setSectionNotice, true)
            }
          >
            <h3 className="text-2xl font-bold text-white">Add Section</h3>
            <label className={labelClass}>
              Section name
              <input className={inputClass} name="name" placeholder="e.g. BSCS-3A" required />
            </label>
            <label className={labelClass}>
              Department
              <input className={inputClass} name="department" placeholder="e.g. Computer Science" required />
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
            className="rounded-[22px] border border-[#2b3c4b] bg-[#101b2a] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            onSubmit={(event) =>
              submitAction(event, createRoomAction, setRoomNotice, true)
            }
          >
            <h3 className="text-2xl font-bold text-white">Add Room</h3>
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

        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#233246] pt-6 sm:grid-cols-2 xl:grid-cols-3">
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
                    <span className="text-slate-400">{section.department} (Sem {section.semester})</span>
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
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-4 shadow-xl backdrop-blur-md sm:p-6 lg:p-8">
        <h2 className="text-xl font-bold text-white">
          {editingSlot ? "Edit Scheduled Class" : "Schedule a New Class"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Room, teacher, and section time conflicts are automatically checked on save.
        </p>

        {!courses.length ||
        !sections.length ||
        !rooms.length ||
        !teachers.length ? (
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-sm text-amber-300">
            At least one course, section, room, and teacher must be added first.
          </p>
        ) : null}

        <form
          className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          key={editingSlot?.id ?? "new-slot"}
          onSubmit={(event) =>
            submitAction(event, saveTimetableSlotAction, setSlotNotice, true)
          }
        >
          {editingSlot ? (
            <input name="id" type="hidden" value={editingSlot.id} />
          ) : null}
          <label className={labelClass}>
            Course
            <select
              className={inputClass}
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
          <label className={labelClass}>
            Section
            <select
              className={inputClass}
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
          <label className={labelClass}>
            Room
            <select
              className={inputClass}
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
          <label className={labelClass}>
            Teacher
            <select
              className={inputClass}
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
          <label className={labelClass}>
            Day
            <select
              className={inputClass}
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
          <label className={labelClass}>
            Start Time
            <input
              className={inputClass}
              defaultValue={editingSlot?.startTime ?? ""}
              name="startTime"
              required
              type="time"
            />
          </label>
          <label className={labelClass}>
            End Time
            <input
              className={inputClass}
              defaultValue={editingSlot?.endTime ?? ""}
              name="endTime"
              required
              type="time"
            />
          </label>
          <div className="flex flex-wrap items-end gap-2 sm:flex-nowrap">
            <button
              className={buttonClass}
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
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white"
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

      <section className="min-w-0 overflow-hidden rounded-2xl border border-[#233246] bg-[#111c2d]/95 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.5)] backdrop-blur-md sm:rounded-[26px] sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#1f2d3d] text-sm text-[#41e0be] shadow-inner shadow-[#41e0be]/20">
              📅
            </div>
            <div>
              <h2 className="flex min-w-0 flex-wrap items-center gap-2 text-xl font-extrabold tracking-tight text-white sm:gap-3 sm:text-2xl">
                Scheduled Classes
                <span className="rounded-full border border-[#1fdbb1]/30 bg-[#1fdbb1]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#4de5bd]">
                  {slots.length} Total
                </span>
              </h2>
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search classes..."
              value={adminSlotSearch}
              onChange={(e) => setAdminSlotSearch(e.target.value)}
              className="w-full rounded-xl border border-[#2b3c4b] bg-[#0d1727] py-2 pl-8 pr-9 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#4ed0d8] sm:w-56"
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

        <div className="mt-5 overflow-hidden rounded-2xl border border-[#243244] bg-[#101b2a] p-2">
          <div className="flex flex-wrap gap-2">
            {days.slice(0, 5).map((day) => {
              const isActive = adminSelectedDay === day.value;
              return (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setAdminSelectedDay(isActive ? "ALL" : day.value)}
                  className={`flex-1 min-w-[110px] rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "border border-[#2fe3a6] bg-[#1d3c37] text-[#57f0c8]"
                      : "border border-transparent bg-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  {day.label.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-[#243244] bg-[#0d1727]/80 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Total Classes</div>
            <div className="mt-2 text-4xl font-black text-white">{slots.length}</div>
          </div>
          <div className="rounded-xl border border-[#243244] bg-[#0d1727]/80 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Today</div>
            <div className="mt-2 text-4xl font-black text-white">{slots.filter((s) => s.dayOfWeek === "MON").length}</div>
          </div>
          <div className="rounded-xl border border-[#243244] bg-[#0d1727]/80 p-4 text-center">
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Rooms</div>
            <div className="mt-2 text-4xl font-black text-white">{new Set(slots.map((s) => s.roomName)).size}</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#223246] pt-4">
          <button
            type="button"
            onClick={() => setAdminSelectedDept("ALL")}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              adminSelectedDept === "ALL"
                ? "bg-[#18d0b0]/15 text-[#64f0cc] border border-[#31d9b7]/30"
                : "border border-[#203047] bg-[#0d1727] text-slate-400 hover:text-white"
            }`}
          >
            All Departments
          </button>
          {adminDepartments.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setAdminSelectedDept(dept)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                adminSelectedDept === dept
                  ? "bg-[#18d0b0]/15 text-[#64f0cc] border border-[#31d9b7]/30"
                  : "border border-[#203047] bg-[#0d1727] text-slate-300 hover:text-white"
              }`}
            >
              {dept}
            </button>
          ))}
        </div>

        {filteredAdminSlots.length ? (
          <div className="mt-5 space-y-3">
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
                <div
                  key={slot.id}
                  className="flex flex-col gap-4 rounded-2xl border border-[#233246] bg-[#111b2a] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] lg:flex-row lg:items-center"
                >
                  <div className={`flex h-12 w-fit min-w-28 shrink-0 items-center justify-center rounded-full px-3 text-sm font-extrabold tracking-wide ${accentClasses[index % accentClasses.length]} sm:h-14`}>
                    {slot.startTime}–{slot.endTime}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="break-words text-xl font-extrabold text-white sm:text-2xl">{slot.courseLabel.split(" · ")[1] || slot.courseLabel}</h3>
                  </div>

                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm text-slate-300 lg:gap-3">
                    <span className="max-w-full break-words rounded-lg border border-[#2b3c4b] bg-[#0d1727] px-3 py-1.5 text-xs font-semibold text-slate-200">
                      {slot.roomName}
                    </span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c7b198] text-xs font-bold text-[#0d1727]">
                      {slot.teacherName
                        .split(" ")
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0].toUpperCase())
                        .join("") || "T"}
                    </span>
                    <span className="max-w-full break-words rounded-lg border border-[#2b3c4b] bg-[#0d1727] px-3 py-1.5 text-xs font-semibold text-slate-200">
                      {slot.sectionLabel}
                    </span>
                    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${status === "ongoing" ? "bg-[#1b3e35] text-[#69f5ce]" : "bg-[#253246] text-[#b8c7d9]"}`}>
                      <span className={`h-2.5 w-2.5 rounded-full ${status === "ongoing" ? "bg-[#34d399]" : "bg-[#7dd3fc]"}`} />
                      {status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <button
                      className="rounded-xl border border-slate-700/80 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-cyan-500/50 hover:bg-cyan-950/30 hover:text-cyan-300"
                      onClick={() => {
                        setEditingSlot(slot);
                        setSlotNotice(null);
                        window.scrollTo({ top: 300, behavior: "smooth" });
                      }}
                      type="button"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-900/50 disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => deleteSlot(slot.id)}
                      type="button"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center text-sm text-slate-500">
            No classes match your active filters.
          </div>
        )}
      </section>
    </div>
  );
}
