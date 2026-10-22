"use client";

import { useEffect, useMemo, useState } from "react";
import type { DayOfWeek } from "@/generated/prisma/enums";

export type DepartmentSectionInfo = {
  id: string;
  name: string;
  department: string;
  semester: number;
};

export type DepartmentTimetableSlot = {
  id: string;
  sectionId: string;
  department: string;
  semester: number;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseName: string;
  roomName: string;
  teacherName: string;
  teacherId?: string;
  sectionName: string;
};

const dayOrder: DayOfWeek[] = [
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
  "SUN",
];

const dayMeta: Record<
  DayOfWeek,
  { label: string; short: string; dayIndex: number }
> = {
  MON: { label: "Monday", short: "Mon", dayIndex: 1 },
  TUE: { label: "Tuesday", short: "Tue", dayIndex: 2 },
  WED: { label: "Wednesday", short: "Wed", dayIndex: 3 },
  THU: { label: "Thursday", short: "Thu", dayIndex: 4 },
  FRI: { label: "Friday", short: "Fri", dayIndex: 5 },
  SAT: { label: "Saturday", short: "Sat", dayIndex: 6 },
  SUN: { label: "Sunday", short: "Sun", dayIndex: 0 },
};

const departmentIcons: Record<string, string> = {
  BSIT: "💻",
  BSSW: "⚙️",
  BSDS: "📊",
  CS: "🖥️",
  EE: "⚡",
  AI: "🤖",
  BBA: "📈",
  ENG: "📝",
};

// Distinct color styling variants for Option 2 cards
const cardThemes = [
  {
    borderAccent: "border-l-[#00D37F]",
    glowBorder: "hover:border-[#00D37F]/50",
    bgGradient: "from-[#00D37F]/10 via-[#161f2e] to-[#121824]",
    tagBg: "bg-[#00D37F]/15 text-[#00D37F] border border-[#00D37F]/30",
    avatarBg: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    timeBadge: "text-[#00D37F]",
  },
  {
    borderAccent: "border-l-cyan-400",
    glowBorder: "hover:border-cyan-400/50",
    bgGradient: "from-cyan-500/10 via-[#161f2e] to-[#121824]",
    tagBg: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
    avatarBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    timeBadge: "text-cyan-400",
  },
  {
    borderAccent: "border-l-indigo-400",
    glowBorder: "hover:border-indigo-400/50",
    bgGradient: "from-indigo-500/10 via-[#161f2e] to-[#121824]",
    tagBg: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
    avatarBg: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    timeBadge: "text-indigo-400",
  },
  {
    borderAccent: "border-l-purple-400",
    glowBorder: "hover:border-purple-400/50",
    bgGradient: "from-purple-500/10 via-[#161f2e] to-[#121824]",
    tagBg: "bg-purple-500/15 text-purple-300 border border-purple-500/30",
    avatarBg: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    timeBadge: "text-purple-400",
  },
  {
    borderAccent: "border-l-amber-400",
    glowBorder: "hover:border-amber-400/50",
    bgGradient: "from-amber-500/10 via-[#161f2e] to-[#121824]",
    tagBg: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
    avatarBg: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    timeBadge: "text-amber-400",
  },
];

function calculateDuration(startTime: string, endTime: string): string {
  try {
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    if (isNaN(totalMinutes) || totalMinutes <= 0) return "1 hr";
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours} hr${hours > 1 ? "s" : ""}`;
    return `${mins} min`;
  } catch {
    return "1 hr";
  }
}

function getSlotStatus(startTime: string, endTime: string, slotDay: DayOfWeek): "LIVE" | "UPCOMING" | "COMPLETED" {
  const now = new Date();
  const currentDayIndex = now.getDay();
  const targetDayMeta = dayMeta[slotDay];

  if (currentDayIndex !== targetDayMeta.dayIndex) {
    if (targetDayMeta.dayIndex < currentDayIndex) return "COMPLETED";
    return "UPCOMING";
  }

  const currentH = now.getHours();
  const currentM = now.getMinutes();
  const currentTimeVal = currentH * 60 + currentM;

  const [sH, sM] = startTime.split(":").map(Number);
  const [eH, eM] = endTime.split(":").map(Number);
  const startVal = sH * 60 + sM;
  const endVal = eH * 60 + eM;

  if (currentTimeVal >= startVal && currentTimeVal <= endVal) {
    return "LIVE";
  }
  if (currentTimeVal < startVal) {
    return "UPCOMING";
  }
  return "COMPLETED";
}

export function DepartmentTimetableViewer({
  sections,
  slots,
  userEnrolledSectionIds = [],
  userRole,
  currentUserId,
}: {
  sections: DepartmentSectionInfo[];
  slots: DepartmentTimetableSlot[];
  userEnrolledSectionIds?: string[];
  userRole: "STUDENT" | "TEACHER" | "ADMIN";
  currentUserId?: string;
}) {
  // Find available departments
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    sections.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    slots.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return Array.from(set).sort();
  }, [sections, slots]);

  // Determine current day for initial active day tab
  const defaultDay: DayOfWeek = useMemo(() => {
    const currentDayNum = new Date().getDay();
    const entry = Object.entries(dayMeta).find(
      ([, meta]) => meta.dayIndex === currentDayNum
    );
    if (entry && (entry[0] === "SAT" || entry[0] === "SUN")) {
      return "MON";
    }
    return (entry ? entry[0] : "MON") as DayOfWeek;
  }, []);

  const [activeDay, setActiveDay] = useState<DayOfWeek>(defaultDay);
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedSemester, setSelectedSemester] = useState<number | "ALL">("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"department" | "personal">(
    userEnrolledSectionIds.length > 0 ? "personal" : "department"
  );
  const [viewType, setViewType] = useState<"dayList" | "weeklyGrid">("dayList");

  useEffect(() => {
    const mobileLayout = window.matchMedia("(max-width: 639px)");
    const showDayCards = () => {
      if (mobileLayout.matches) setViewType("dayList");
    };
    showDayCards();
    mobileLayout.addEventListener("change", showDayCards);
    return () => mobileLayout.removeEventListener("change", showDayCards);
  }, []);

  // Filter sections belonging to selected department
  const filteredSections = useMemo(() => {
    if (selectedDept === "ALL") return sections;
    return sections.filter((s) => s.department === selectedDept);
  }, [sections, selectedDept]);

  // Available semesters
  const availableSemesters = useMemo(() => {
    const sems = new Set<number>();
    filteredSections.forEach((s) => {
      if (s.semester) sems.add(s.semester);
    });
    return Array.from(sems).sort((a, b) => a - b);
  }, [filteredSections]);

  // Filtered slots according to Department, Semester, Section, Search & Mode
  const baseSlots = useMemo(() => {
    let result = [...slots];

    if (filterMode === "personal") {
      if (userRole === "STUDENT" && userEnrolledSectionIds.length > 0) {
        result = result.filter((s) => userEnrolledSectionIds.includes(s.sectionId));
      } else if (userRole === "TEACHER" && currentUserId) {
        result = result.filter((s) => s.teacherId === currentUserId);
      }
    } else {
      if (selectedDept !== "ALL") {
        result = result.filter((s) => s.department === selectedDept);
      }
      if (selectedSemester !== "ALL") {
        result = result.filter((s) => s.semester === selectedSemester);
      }
      if (selectedSectionId !== "ALL") {
        result = result.filter((s) => s.sectionId === selectedSectionId);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.courseCode.toLowerCase().includes(q) ||
          s.courseName.toLowerCase().includes(q) ||
          s.teacherName.toLowerCase().includes(q) ||
          s.roomName.toLowerCase().includes(q) ||
          s.sectionName.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
      );
    }

    return result;
  }, [
    slots,
    filterMode,
    userRole,
    userEnrolledSectionIds,
    currentUserId,
    selectedDept,
    selectedSemester,
    selectedSectionId,
    searchQuery,
  ]);

  // Slots specifically for active day (Option 2 focus)
  const activeDaySlots = useMemo(() => {
    return baseSlots
      .filter((s) => s.dayOfWeek === activeDay)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [baseSlots, activeDay]);

  // Counts per day for day tab badges
  const dayCounts = useMemo(() => {
    const map: Partial<Record<DayOfWeek, number>> = {};
    dayOrder.forEach((d) => {
      map[d] = baseSlots.filter((s) => s.dayOfWeek === d).length;
    });
    return map;
  }, [baseSlots]);

  // Calculate day stats (start time, end time, lab count, theory count)
  const dayStats = useMemo(() => {
    if (!activeDaySlots.length) {
      return { total: 0, timeSpan: "No classes scheduled", labs: 0, theory: 0 };
    }
    const labs = activeDaySlots.filter(
      (s) =>
        s.courseName.toLowerCase().includes("lab") ||
        s.roomName.toLowerCase().includes("lab")
    ).length;
    const theory = activeDaySlots.length - labs;
    const firstTime = activeDaySlots[0].startTime;
    const lastTime = activeDaySlots[activeDaySlots.length - 1].endTime;

    return {
      total: activeDaySlots.length,
      timeSpan: `${firstTime} — ${lastTime}`,
      labs,
      theory,
    };
  }, [activeDaySlots]);

  return (
    <div className="min-w-0 space-y-3 sm:space-y-6">
      {/* ── 1. TOP HEADER & VIEW CONTROLS ── */}
      <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-800/80 bg-[#161f2e]/90 p-3 shadow-2xl backdrop-blur-md sm:gap-4 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#00D37F]/15 text-base text-[#00D37F] border border-[#00D37F]/30 shadow-[0_0_12px_rgba(0,211,127,0.2)]">
              📅
            </span>
            <div className="min-w-0">
              <h2 className="flex min-w-0 flex-wrap items-center gap-2 text-base font-bold tracking-tight text-white sm:text-xl">
                Academic Timetable
                <span className="max-w-full break-words rounded-full bg-[#00D37F]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#00D37F] border border-[#00D37F]/20 sm:text-[11px]">
                  Option 2 • Day View
                </span>
              </h2>
              <p className="mt-0.5 break-words text-[11px] leading-relaxed text-slate-400 sm:text-xs">
                Browse day-wise scheduled classes with quick department & semester filters.
              </p>
            </div>
          </div>
        </div>

        {/* View toggle & Mode buttons */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {(userRole === "STUDENT" || userRole === "TEACHER") && (
            <div className="flex max-w-full flex-wrap items-center rounded-xl border border-slate-800 bg-[#0e141f] p-1">
              <button
                type="button"
                onClick={() => setFilterMode("personal")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterMode === "personal"
                    ? "bg-[#00D37F]/20 text-[#00D37F] border border-[#00D37F]/30 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {userRole === "STUDENT" ? "🎓 My Classes" : "👨‍🏫 My Routine"}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode("department")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  filterMode === "department"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🏛️ All Departments
              </button>
            </div>
          )}

          {/* Day List vs Weekly Grid Toggle */}
          <div className="flex max-w-full flex-wrap items-center rounded-xl border border-slate-800 bg-[#0e141f] p-1">
            <button
              type="button"
              onClick={() => setViewType("dayList")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                viewType === "dayList"
                  ? "bg-[#00D37F]/20 text-[#00D37F] border border-[#00D37F]/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="8" x2="21" y1="6" y2="6" />
                <line x1="8" x2="21" y1="12" y2="12" />
                <line x1="8" x2="21" y1="18" y2="18" />
                <line x1="3" x2="3.01" y1="6" y2="6" />
                <line x1="3" x2="3.01" y1="12" y2="12" />
                <line x1="3" x2="3.01" y1="18" y2="18" />
              </svg>
              Day Cards
            </button>
            <button
              type="button"
              onClick={() => setViewType("weeklyGrid")}
              className={`hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition sm:flex ${
                viewType === "weeklyGrid"
                  ? "bg-[#00D37F]/20 text-[#00D37F] border border-[#00D37F]/30 shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect height="7" width="7" x="3" y="3" />
                <rect height="7" width="7" x="14" y="3" />
                <rect height="7" width="7" x="14" y="14" />
                <rect height="7" width="7" x="3" y="14" />
              </svg>
              Weekly Grid
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. DAY NAVIGATION TABS (Option 2 Signature Feature) ── */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#161f2e]/90 p-2 shadow-xl backdrop-blur-md">
        <div className="grid grid-cols-2 gap-1.5 min-[420px]:grid-cols-3 md:grid-cols-6">
          {dayOrder.slice(0, 6).map((day) => {
            const meta = dayMeta[day];
            const isSelected = activeDay === day;
            const count = dayCounts[day] || 0;

            return (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`relative flex min-w-0 flex-col items-center justify-center rounded-xl px-1.5 py-2.5 text-center transition-all duration-200 sm:px-2 sm:py-3 ${
                  isSelected
                    ? "bg-[#111824] border border-[#00D37F]/40 shadow-[0_0_15px_rgba(0,211,127,0.18)]"
                    : "border border-transparent bg-transparent hover:bg-slate-800/40 hover:border-slate-700/60"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-xs font-bold uppercase tracking-wider ${
                      isSelected ? "text-[#00D37F]" : "text-slate-400"
                    }`}
                  >
                    {meta.short}
                  </span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                      isSelected
                        ? "bg-[#00D37F]/20 text-[#00D37F]"
                        : count > 0
                        ? "bg-slate-800 text-slate-300"
                        : "bg-slate-800/50 text-slate-500"
                    }`}
                  >
                    {count}
                  </span>
                </div>
                <span
                  className={`mt-0.5 text-xs font-semibold sm:text-sm ${
                    isSelected ? "text-white" : "text-slate-300"
                  }`}
                >
                  {meta.label}
                </span>

                {/* Active Underline Indicator */}
                {isSelected && (
                  <span className="absolute bottom-1 h-1 w-10 rounded-full bg-[#00D37F] shadow-[0_0_8px_#00D37F]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. HORIZONTAL FILTER PILLS (Departments, Semesters, Sections, Search) ── */}
      <div className="min-w-0 space-y-3 rounded-2xl border border-slate-800/80 bg-[#161f2e]/80 p-3 shadow-xl backdrop-blur-md sm:p-4">
        {/* Department Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
            🏛️ Dept:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedDept("ALL");
              setSelectedSemester("ALL");
              setSelectedSectionId("ALL");
            }}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
              selectedDept === "ALL"
                ? "bg-[#00D37F]/20 text-[#00D37F] border border-[#00D37F]/40 shadow-[0_0_10px_rgba(0,211,127,0.15)]"
                : "border border-slate-800 bg-[#0e141f]/80 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            All Departments
          </button>
          {availableDepartments.map((dept) => {
            const isSelected = selectedDept === dept;
            const icon = departmentIcons[dept] || "📁";
            const deptSlotCount = baseSlots.filter((s) => s.department === dept).length;

            return (
              <button
                key={dept}
                type="button"
                onClick={() => {
                  setSelectedDept(dept);
                  setSelectedSemester("ALL");
                  setSelectedSectionId("ALL");
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isSelected
                    ? "bg-[#00D37F]/20 text-[#00D37F] border border-[#00D37F]/40 shadow-[0_0_10px_rgba(0,211,127,0.15)]"
                    : "border border-slate-800 bg-[#0e141f]/80 text-slate-300 hover:text-white hover:border-slate-700"
                }`}
              >
                <span>{icon}</span>
                <span>{dept}</span>
                <span className="text-[10px] opacity-75 font-normal">({deptSlotCount})</span>
              </button>
            );
          })}
        </div>

        {/* Sub-Filters: Semester, Section & Search */}
        <div className="flex min-w-0 flex-col items-stretch justify-between gap-3 border-t border-slate-800/80 pt-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex flex-wrap items-center gap-2">
            {/* Semester Filter */}
            {availableSemesters.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-[#0e141f] p-1">
                <button
                  type="button"
                  onClick={() => setSelectedSemester("ALL")}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    selectedSemester === "ALL"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All Sem
                </button>
                {availableSemesters.map((sem) => (
                  <button
                    key={sem}
                    type="button"
                    onClick={() => setSelectedSemester(sem)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                      selectedSemester === sem
                        ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Sem {sem}
                  </button>
                ))}
              </div>
            )}

            {/* Section Dropdown */}
            {filteredSections.length > 0 && (
              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="max-w-full rounded-xl border border-slate-800 bg-[#0e141f] px-3 py-1.5 text-xs font-semibold text-slate-200 outline-none focus:border-[#00D37F]"
              >
                <option value="ALL">All Sections ({filteredSections.length})</option>
                {filteredSections
                  .filter(
                    (s) =>
                      selectedSemester === "ALL" || s.semester === selectedSemester
                  )
                  .map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.department} — Sec {section.name} (Sem {section.semester})
                    </option>
                  ))}
              </select>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full min-w-0 sm:w-auto sm:flex-1 sm:max-w-64">
            <input
              type="text"
              placeholder="Search course, teacher, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-[#0e141f] py-2 pl-8 pr-8 text-xs text-white placeholder-slate-500 outline-none transition focus:border-[#00D37F]"
            />
            <span className="absolute left-2.5 top-2 text-slate-500 text-xs">🔍</span>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. SUMMARY STRIP FOR ACTIVE DAY ── */}
      <div className="flex min-w-0 flex-col items-start justify-between gap-3 rounded-xl border border-slate-800/80 bg-[#111824]/90 px-3 py-3 shadow-md sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D37F] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00D37F]"></span>
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="flex flex-wrap items-center gap-2 text-sm font-bold text-white">
              <span>{dayMeta[activeDay].label} Schedule</span>
              {selectedDept !== "ALL" && (
                <span className="max-w-full break-words rounded-md bg-slate-800 px-2 py-0.5 text-[10px] text-cyan-300 sm:text-xs">
                  {selectedDept} Department
                </span>
              )}
            </h3>
            <p className="break-words text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">
              Total: {dayStats.total} {dayStats.total === 1 ? "lecture" : "lectures"} • Timing: {dayStats.timeSpan}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 text-[10px] sm:w-auto sm:text-xs">
          <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-400">
            📚 {dayStats.theory} Theory
          </span>
          <span className="rounded-lg bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 font-semibold text-teal-300">
            🔬 {dayStats.labs} Lab Sessions
          </span>
        </div>
      </div>

      {/* ── 5. OPTION 2 CLASS CARDS (Day List View) ── */}
      {viewType === "dayList" ? (
        activeDaySlots.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-[#161f2e]/50 p-6 text-center backdrop-blur-md sm:p-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 text-2xl">
              ☕
            </div>
            <h3 className="mt-4 text-base font-bold text-white">
              No Classes Scheduled for {dayMeta[activeDay].label}
            </h3>
            <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery || selectedDept !== "ALL" || selectedSemester !== "ALL"
                ? "No matching classes found with current filters. Try changing or clearing filters."
                : "Enjoy your free time or select another day from the top tabs to view schedule."}
            </p>
            {(searchQuery || selectedDept !== "ALL" || selectedSemester !== "ALL" || selectedSectionId !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDept("ALL");
                  setSelectedSemester("ALL");
                  setSelectedSectionId("ALL");
                  setSearchQuery("");
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-[#00D37F]/30 bg-[#00D37F]/10 px-4 py-2 text-xs font-bold text-[#00D37F] hover:bg-[#00D37F]/20"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {activeDaySlots.map((slot, index) => {
              const theme = cardThemes[index % cardThemes.length];
              const duration = calculateDuration(slot.startTime, slot.endTime);
              const status = getSlotStatus(slot.startTime, slot.endTime, slot.dayOfWeek);
              const isLab =
                slot.courseName.toLowerCase().includes("lab") ||
                slot.roomName.toLowerCase().includes("lab");
              const isEnrolled = userEnrolledSectionIds.includes(slot.sectionId);

              // Instructor initials
              const initials = slot.teacherName
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0].toUpperCase())
                .join("");

              return (
                <div
                  key={slot.id}
                  className={`group relative min-w-0 overflow-hidden rounded-2xl border border-slate-800/80 border-l-4 ${theme.borderAccent} bg-gradient-to-r ${theme.bgGradient} p-3 shadow-xl transition-all duration-200 hover:-translate-y-0.5 sm:p-5 ${theme.glowBorder}`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* LEFT COLUMN: Time badge & Status */}
                    <div className="flex min-w-0 items-start gap-3 lg:min-w-[200px] lg:items-center">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className={`break-words text-sm font-extrabold tracking-tight tabular-nums sm:text-base ${theme.timeBadge}`}>
                            {slot.startTime} – {slot.endTime}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold text-slate-400">
                            ⏱️ {duration}
                          </span>
                          {status === "LIVE" ? (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/40 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                              LIVE NOW
                            </span>
                          ) : status === "COMPLETED" ? (
                            <span className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                              Completed
                            </span>
                          ) : (
                            <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/20">
                              Upcoming
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CENTER COLUMN: Course Code, Title, Dept, Section & Teacher */}
                    <div className="flex-1 min-w-0">
                      {/* Top tags row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-md px-2 py-0.5 text-[11px] font-extrabold tracking-wide uppercase ${theme.tagBg}`}>
                          {slot.courseCode}
                        </span>
                        <span className="break-words rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-bold text-slate-300 border border-slate-700/60 sm:text-[11px]">
                          {slot.department} · {slot.sectionName}
                        </span>
                        {slot.semester && (
                          <span className="rounded-md bg-slate-800/50 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                            Sem {slot.semester}
                          </span>
                        )}
                        {isLab && (
                          <span className="rounded-md bg-teal-500/20 px-2 py-0.5 text-[10px] font-extrabold text-teal-300 border border-teal-500/30">
                            🔬 Practical Lab
                          </span>
                        )}
                        {isEnrolled && (
                          <span className="rounded-md bg-[#00D37F]/15 px-2 py-0.5 text-[10px] font-extrabold text-[#00D37F] border border-[#00D37F]/30">
                            ✓ Enrolled
                          </span>
                        )}
                      </div>

                      {/* Course Title */}
                      <h4 className="mt-2 break-words text-sm font-bold text-white transition group-hover:text-cyan-300 sm:text-base">
                        {slot.courseName}
                      </h4>

                      {/* Teacher info with avatar */}
                      <div className="mt-2.5 flex min-w-0 flex-wrap items-center gap-2.5">
                        <div
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${theme.avatarBg}`}
                        >
                          {initials || "👨‍🏫"}
                        </div>
                        <span className="min-w-0 break-words text-xs font-semibold text-slate-300">
                          {slot.teacherName}
                        </span>
                        <span className="text-[10px] text-slate-500 sm:text-[11px]">• Course Instructor</span>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Location & Room details */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-800/60 pt-3 lg:flex-col lg:items-end lg:justify-center lg:border-t-0 lg:pt-0">
                      <div className="flex max-w-full items-center gap-1.5 break-words rounded-xl border border-slate-700/80 bg-[#0e141f] px-3 py-1.5 text-xs font-bold text-white shadow-inner">
                        <span className="text-cyan-400">📍</span>
                        <span>{slot.roomName}</span>
                      </div>
                      <span className="mt-1 text-[11px] text-slate-400 hidden lg:inline">
                        Lecture Venue
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── WEEKLY GRID VIEW (Alternative overview) ── */
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-[#161f2e]/90 shadow-2xl backdrop-blur-md">
          <div className="min-w-[900px]">
            {/* Days Header */}
            <div className="grid grid-cols-5 border-b border-slate-800 bg-[#0e141f]">
              {dayOrder.slice(0, 5).map((day) => {
                const count = dayCounts[day] || 0;
                const isCurrent = activeDay === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setActiveDay(day);
                      setViewType("dayList");
                    }}
                    className={`border-r border-slate-800/80 p-3.5 text-center last:border-r-0 hover:bg-slate-800/30 transition ${
                      isCurrent ? "bg-[#00D37F]/10 border-b-2 border-b-[#00D37F]" : ""
                    }`}
                  >
                    <p className={`text-sm font-bold ${isCurrent ? "text-[#00D37F]" : "text-white"}`}>
                      {dayMeta[day].label}
                    </p>
                    <span className="mt-0.5 inline-block text-[11px] font-semibold text-cyan-400">
                      {count} {count === 1 ? "class" : "classes"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Days Columns */}
            <div className="grid grid-cols-5 divide-x divide-slate-800/80 p-3">
              {dayOrder.slice(0, 5).map((day) => {
                const daySlots = baseSlots
                  .filter((s) => s.dayOfWeek === day)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                return (
                  <div className="space-y-2.5 px-1.5 py-1" key={day}>
                    {daySlots.length ? (
                      daySlots.map((slot, index) => {
                        const theme = cardThemes[index % cardThemes.length];
                        return (
                          <div
                            key={slot.id}
                            className={`rounded-xl border border-slate-800/80 border-l-2 ${theme.borderAccent} bg-[#111824] p-3 shadow-sm hover:border-slate-700 transition`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-extrabold ${theme.timeBadge}`}>
                                {slot.startTime}–{slot.endTime}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                {slot.courseCode}
                              </span>
                            </div>
                            <h5 className="mt-1 text-xs font-bold text-white line-clamp-1">
                              {slot.courseName}
                            </h5>
                            <p className="mt-1 text-[10px] text-slate-400 truncate">
                              📍 {slot.roomName} • {slot.teacherName}
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-800/60 bg-slate-900/20 text-center">
                        <span className="text-[11px] text-slate-600">No classes</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
