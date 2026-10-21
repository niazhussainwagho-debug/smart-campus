"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { UserRole } from "@/generated/prisma/enums";
import { LogoutButton } from "@/components/logout-button";

export type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
  badge?: string;
};

interface DashboardShellProps {
  role: UserRole;
  user: {
    name?: string | null;
    email?: string | null;
  };
  title?: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
}

// ── Icons ────────────────────────────────────────────────────────────────────
function IconDashboard({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#00D37F]" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconCalendar({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#00D37F]" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
    </svg>
  );
}
function IconClock({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#00D37F]" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconUsers({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#00D37F]" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}
function IconSettings({ active }: { active: boolean }) {
  return (
    <svg className={`h-[18px] w-[18px] ${active ? "text-[#00D37F]" : "text-slate-400"}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}
function IconBell() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}
function IconSearch() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" x2="16.65" y1="21" y2="16.65" />
    </svg>
  );
}
function IconChevronDown() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function DashboardShell({
  role,
  user,
  title,
  subtitle,
  badge,
  action,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    function closeOnDesktop() {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [mobileMenuOpen]);

  const roleMeta = {
    ADMIN: { portalName: "Admin Portal", statusColor: "text-[#00D37F]" },
    TEACHER: { portalName: "Faculty Portal", statusColor: "text-[#00D37F]" },
    STUDENT: { portalName: "Student Portal", statusColor: "text-[#00D37F]" },
  }[role];

  const dashHref = role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student";

  const navItems: NavItem[] = [
    {
      href: dashHref,
      label: "Dashboard",
      icon: (active) => <IconDashboard active={active} />,
    },
    {
      href: role === "ADMIN" ? "/admin/timetable" : role === "TEACHER" ? "/teacher/timetable" : "/student/timetable",
      label: role === "ADMIN" ? "Timetable" : "My Schedule",
      icon: (active) => <IconCalendar active={active} />,
    },
    ...(role === "TEACHER"
      ? [
          {
            href: "/teacher/availability",
            label: "Office Hours",
            icon: (active: boolean) => <IconClock active={active} />,
          },
          {
            href: "/teacher/appointments",
            label: "Student Requests",
            badge: "Live",
            icon: (active: boolean) => <IconUsers active={active} />,
          },
        ]
      : []),
    ...(role === "STUDENT"
      ? [
          {
            href: "/student/appointments",
            label: "Appointments",
            icon: (active: boolean) => <IconUsers active={active} />,
          },
        ]
      : []),

  ];

  const initials = (user.name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="flex min-h-screen max-w-full text-slate-100"
      style={{ background: "#161b27" }}
    >
      {/* ── Mobile Backdrop ── */}
      {mobileMenuOpen && (
        <button
          aria-hidden="true"
          className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          tabIndex={-1}
          type="button"
        />
      )}

      {/* ══════════════════ SIDEBAR ══════════════════ */}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(84vw,280px)] shrink-0 flex-col transition-transform duration-300 ease-in-out lg:static lg:w-[220px] lg:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ background: "#1a2030", borderRight: "1px solid rgba(255,255,255,0.06)" }}
      >
        {/* Brand */}
        <div className="flex h-[70px] items-center gap-3 px-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {/* Logo mark — CAMPUS.OS "M"-style icon */}
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-black text-sm"
            style={{ background: "linear-gradient(135deg,#00D37F,#00b36b)", color: "#0d1117" }}
          >
            C
          </div>
          <div>
            <p className="text-sm font-extrabold tracking-widest text-white">
              CAMPUS<span style={{ color: "#00D37F" }}>.OS</span>
            </p>
            <p className="text-[10px] text-slate-500 -mt-0.5">v2.6</p>
          </div>
          <button
            aria-label="Close navigation menu"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:text-white lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="18" x2="6" y1="6" y2="18" />
              <line x1="6" x2="18" y1="6" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-0.5">
          <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-600">
            Main Navigation
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== dashHref && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150"
                style={
                  isActive
                    ? {
                        background: "rgba(0,211,127,0.08)",
                        color: "#ffffff",
                      }
                    : {
                        color: "#94a3b8",
                      }
                }
              >
                {/* Active left indicator bar */}
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 rounded-r-full"
                    style={{ width: 3, height: 20, background: "#00D37F" }}
                  />
                )}
                <div className="flex items-center gap-3">
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge !== "●" && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ background: "rgba(0,211,127,0.15)", color: "#00D37F" }}
                  >
                    {item.badge}
                  </span>
                )}
                {item.badge === "●" && (
                  <span className="h-2 w-2 rounded-full" style={{ background: "#00D37F" }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom user */}
        <div className="p-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div
            className="flex items-center gap-2.5 rounded-xl p-2.5"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white relative"
              style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}
            >
              {initials}
              <span
                className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                style={{ background: "#00D37F", borderColor: "#1a2030" }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user.name ?? "Campus User"}
              </p>
              <p className="text-[10px] truncate" style={{ color: "#00D37F" }}>
                Status: Active
              </p>
            </div>
            <LogoutButton className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:text-rose-400" />
          </div>
        </div>
      </aside>

      {/* ══════════════════ MAIN ══════════════════ */}
      <div className="relative flex min-w-0 flex-1 flex-col overflow-x-clip">

        {/* ── Top Header ── */}
        <header
          className="sticky top-0 z-30 flex min-h-[64px] items-center justify-between gap-2 px-3 sm:min-h-[70px] sm:px-5 lg:px-6"
          style={{
            background: "rgba(22,27,39,0.95)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(12px)",
          }}
        >
          {/* Hamburger (mobile) */}
          <button
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            type="button"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <line x1="3" x2="21" y1="12" y2="12" /><line x1="3" x2="21" y1="6" y2="6" /><line x1="3" x2="21" y1="18" y2="18" />
            </svg>
          </button>

          {/* Search */}
          <div className="relative hidden sm:block sm:w-72 md:w-80">
            <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-slate-500">
              <IconSearch />
            </span>
            <input
              className="w-full rounded-xl py-2 pl-10 pr-4 text-xs text-slate-200 outline-none placeholder:text-slate-500 transition"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${roleMeta.portalName.toLowerCase()} records…`}
              type="text"
              value={searchQuery}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,211,127,0.4)";
                e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,211,127,0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          {/* Right: action + bell + avatar */}
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            {action}

            {/* Bell */}
            <button
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              title="Notifications"
              type="button"
            >
              <IconBell />
              <span
                className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full"
                style={{ background: "#00D37F" }}
              />
            </button>

            {/* Avatar + name */}
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white relative"
                style={{ background: "linear-gradient(135deg,#06b6d4,#6366f1)" }}
              >
                {initials}
                <span
                  className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                  style={{ background: "#00D37F", borderColor: "#161b27" }}
                />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white leading-none">
                  {user.name ?? "Campus User"}
                </p>
                <p className="text-[10px] leading-none mt-0.5" style={{ color: "#00D37F" }}>
                  Status: Active
                </p>
              </div>
              <IconChevronDown />
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="w-full min-w-0 flex-1 overflow-x-clip p-3 sm:p-5 lg:p-6">
          <div className="mx-auto w-full max-w-7xl min-w-0 space-y-4 sm:space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
