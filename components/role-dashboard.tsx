import type { UserRole } from "@/generated/prisma/enums";
import Link from "next/link";
import { requireRole } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/dashboard-shell";

const roleLabels = {
  STUDENT: "Student",
  TEACHER: "Faculty Member",
  ADMIN: "System Administrator",
} satisfies Record<UserRole, string>;

const timetablePaths = {
  STUDENT: "/student/timetable",
  TEACHER: "/teacher/timetable",
  ADMIN: "/admin/timetable",
} satisfies Record<UserRole, string>;

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-w-0 flex-col gap-3 rounded-2xl p-4 transition hover:scale-[1.02] sm:p-5"
      style={{
        background: "#1e2535",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 tracking-wide">{label}</span>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: `${accent}22`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-black text-white tracking-tight leading-none">{value}</p>
        <p className="mt-1 text-xs text-slate-500">{sub}</p>
      </div>
      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
      />
    </div>
  );
}

// ── Schedule Row ─────────────────────────────────────────────────────────────
function ScheduleRow({
  time,
  name,
  detail,
  status,
  initials,
  color,
}: {
  time: string;
  name: string;
  detail: string;
  status: "Confirmed" | "Pending";
  initials: string;
  color: string;
}) {
  const isConfirmed = status === "Confirmed";
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: color }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{time} – {name}</p>
        <p className="text-[11px] text-slate-500">{detail}</p>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={
          isConfirmed
            ? { background: "rgba(0,211,127,0.15)", color: "#00D37F" }
            : { background: "rgba(251,191,36,0.15)", color: "#fbbf24" }
        }
      >
        {status}
      </span>
    </div>
  );
}

// ── Mini Chart (SVG sparkline) ────────────────────────────────────────────────
function MiniSparkline({ color, points }: { color: string; points: string }) {
  return (
    <svg height="30" width="60" viewBox="0 0 60 30">
      <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const PlusIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <line x1="12" x2="12" y1="5" y2="19" /><line x1="5" x2="19" y1="12" y2="12" />
  </svg>
);
const RefreshIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);
const AlertIcon = () => (
  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" />
  </svg>
);
const ArrowIcon = () => (
  <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

import React from "react";

export async function RoleDashboard({ role }: { role: UserRole }) {
  const user = await requireRole(role);

  // Role-specific stat data
  const stats =
    role === "STUDENT"
      ? [
          { label: "Enrolled Courses", value: "6", sub: "(+1 this semester)", accent: "#00D37F", icon: <PlusIcon /> },
          { label: "Classes Today", value: "4", sub: "(1 Pending)", accent: "#06b6d4", icon: <RefreshIcon /> },
          { label: "Assignments Due", value: "7", sub: "This week", accent: "#f59e0b", icon: <AlertIcon /> },
          { label: "Appointments", value: "2", sub: "(Dr. Confirmed)", accent: "#a78bfa", icon: <PlusIcon /> },
        ]
      : role === "TEACHER"
      ? [
          { label: "Total Students", value: "128", sub: "(+4.1%)", accent: "#00D37F", icon: <PlusIcon /> },
          { label: "Classes Today", value: "5", sub: "(Pending 1)", accent: "#06b6d4", icon: <RefreshIcon /> },
          { label: "Pending Requests", value: "12", sub: "Student appointments", accent: "#f59e0b", icon: <AlertIcon /> },
          { label: "Office Hours", value: "3", sub: "Slots available", accent: "#a78bfa", icon: <PlusIcon /> },
        ]
      : [
          { label: "Total Students", value: "1,482", sub: "(+4.1%)", accent: "#00D37F", icon: <PlusIcon /> },
          { label: "Classes Today", value: "42", sub: "(Pending 5)", accent: "#06b6d4", icon: <RefreshIcon /> },
          { label: "Active Teachers", value: "19", sub: "Online now", accent: "#f59e0b", icon: <RefreshIcon /> },
          { label: "Conflicts", value: "3", sub: "(Admin review)", accent: "#f87171", icon: <AlertIcon /> },
        ];

  const scheduleRows = [
    { time: "08:00 AM", name: "Data Structures", detail: "Room 201 · CS Dept", status: "Confirmed" as const, initials: "DS", color: "#00D37F55" },
    { time: "10:00 AM", name: "Algorithms Lab", detail: "Lab 3 · Prof. Khan", status: "Confirmed" as const, initials: "AL", color: "#06b6d455" },
    { time: "12:00 PM", name: "OOP Lecture", detail: "Room 105 · Ms. Sana", status: "Pending" as const, initials: "OO", color: "#f59e0b55" },
    { time: "02:30 PM", name: "Database Systems", detail: "Room 301 · Mr. Ali", status: "Pending" as const, initials: "DB", color: "#a78bfa55" },
  ];

  return (
    <DashboardShell role={role} user={user}>

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* ── Main Grid: Chart + Upcoming ── */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">

        {/* Analytics Panel */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#1e2535", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                {role === "ADMIN" ? "Campus Analytics" : role === "TEACHER" ? "Class Analytics" : "Academic Overview"}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">Weekly performance metrics</p>
            </div>
            <div
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Today
              <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* SVG area chart */}
          <div className="relative w-full h-[180px]">
            <svg className="w-full h-full" viewBox="0 0 600 180" preserveAspectRatio="none">
              {/* Grid lines */}
              {[0,1,2,3,4].map((i) => (
                <line key={i} x1="0" y1={i * 36} x2="600" y2={i * 36}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}
              {/* Green area */}
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D37F" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#00D37F" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                fill="url(#greenGrad)"
                points="0,180 0,140 80,110 160,70 240,90 320,50 400,75 480,120 600,95 600,180"
              />
              <polyline
                fill="none" stroke="#00D37F" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
                points="0,140 80,110 160,70 240,90 320,50 400,75 480,120 600,95"
              />
              {/* Cyan line */}
              <polygon
                fill="url(#cyanGrad)"
                points="0,180 0,155 80,145 160,130 240,120 320,100 400,115 480,140 600,125 600,180"
              />
              <polyline
                fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"
                points="0,155 80,145 160,130 240,120 320,100 400,115 480,140 600,125"
              />
            </svg>
            {/* Day labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => (
                <span key={d} className="text-[10px] text-slate-600">{d}</span>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <MiniSparkline color="#00D37F" points="0,25 15,15 30,5 45,10 60,2" />
              Attendance
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <MiniSparkline color="#06b6d4" points="0,28 15,22 30,18 45,12 60,15" />
              Courses
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <MiniSparkline color="#f87171" points="0,28 15,25 30,22 45,26 60,20" />
              Conflicts
            </div>
          </div>
        </div>

        {/* Upcoming Schedule Panel */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: "#1e2535", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Upcoming Schedule</h2>
            <button className="text-slate-500 hover:text-slate-300 transition">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-2.5 flex-1">
            {scheduleRows.map((row) => (
              <ScheduleRow key={row.time + row.name} {...row} />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <Link
              href={timetablePaths[role]}
              className="flex-1 rounded-xl py-2 text-center text-xs font-semibold text-slate-300 transition hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              View All
            </Link>
            <Link
              href={timetablePaths[role]}
              className="flex-1 rounded-xl py-2 text-center text-xs font-bold transition"
              style={{ background: "rgba(0,211,127,0.15)", border: "1px solid rgba(0,211,127,0.3)", color: "#00D37F" }}
            >
              Open Schedule
            </Link>
            {role !== "STUDENT" && (
              <button
                className="flex-1 rounded-xl py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                type="button"
              >
                Contact
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Grid: Quick Actions + User Card ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">

        {/* Quick Links */}
        <div
          className="rounded-2xl p-5 lg:col-span-2"
          style={{ background: "#1e2535", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Quick Actions</h2>
            <button className="text-slate-500 hover:text-slate-300 transition">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              href={timetablePaths[role]}
              className="flex items-center gap-3 rounded-xl p-4 transition hover:scale-[1.02]"
              style={{ background: "rgba(0,211,127,0.07)", border: "1px solid rgba(0,211,127,0.2)" }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(0,211,127,0.15)", color: "#00D37F" }}>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <rect height="18" rx="2" width="18" x="3" y="4" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{role === "ADMIN" ? "Manage Schedule" : "My Timetable"}</p>
                <p className="text-[11px] text-slate-500">View & manage classes</p>
              </div>
            </Link>

            {role === "STUDENT" && (
              <Link
                href="/student/appointments"
                className="flex items-center gap-3 rounded-xl p-4 transition hover:scale-[1.02]"
                style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Book Appointment</p>
                  <p className="text-[11px] text-slate-500">Faculty consultation</p>
                </div>
              </Link>
            )}

            {role === "TEACHER" && (
              <Link
                href="/teacher/availability"
                className="flex items-center gap-3 rounded-xl p-4 transition hover:scale-[1.02]"
                style={{ background: "rgba(6,182,212,0.07)", border: "1px solid rgba(6,182,212,0.2)" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(6,182,212,0.15)", color: "#06b6d4" }}>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Office Hours</p>
                  <p className="text-[11px] text-slate-500">Manage availability</p>
                </div>
              </Link>
            )}

            {role === "ADMIN" && (
              <div
                className="flex items-center gap-3 rounded-xl p-4 transition hover:scale-[1.02]"
                style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "rgba(248,113,113,0.15)", color: "#f87171" }}>
                  <AlertIcon />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Resolve Conflicts</p>
                  <p className="text-[11px] text-slate-500">3 pending issues</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Identity Card */}
        <div
          className="rounded-2xl p-5"
          style={{ background: "#1e2535", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Identity Card</span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
              style={{ background: "rgba(0,211,127,0.15)", color: "#00D37F" }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#00D37F]" />
              Verified
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-black text-white"
              style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}
            >
              {(user.name?.[0] ?? "U").toUpperCase()}
            </div>
            <div>
              <p className="text-base font-bold text-white">{user.name ?? "Campus User"}</p>
              <p className="text-[11px] text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="mt-5 space-y-2.5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Role</span>
              <span className="font-semibold text-slate-200">{roleLabels[role]}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Status</span>
              <span className="font-semibold" style={{ color: "#00D37F" }}>Active</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-500">Auth</span>
              <span className="font-semibold text-slate-200">SSO</span>
            </div>
          </div>
        </div>
      </div>

    </DashboardShell>
  );
}
