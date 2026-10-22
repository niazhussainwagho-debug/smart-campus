"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { UserRole } from "@/generated/prisma/enums";
import { LogoutButton } from "@/components/logout-button";
import styles from "./dashboard-shell.module.css";

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

function IconDashboard({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function IconCalendar({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><rect height="18" rx="2" width="18" x="3" y="4" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
}

function IconClock({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function IconUsers({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
}

function IconSearch() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>;
}

function IconBell({ active = false }: { active?: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M10 21h4" /></svg>;
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
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    function closeOnDesktop() {
      if (window.matchMedia("(min-width: 1024px)").matches) setMobileMenuOpen(false);
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
    ADMIN: { portalName: "Admin Portal", defaultTitle: "Campus Overview" },
    TEACHER: { portalName: "Faculty Portal", defaultTitle: "Faculty Overview" },
    STUDENT: { portalName: "Student Portal", defaultTitle: "Student Overview" },
  }[role];
  const dashHref = role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student";
  const navItems: NavItem[] = [
    { href: dashHref, label: "Dashboard", icon: (active) => <IconDashboard active={active} /> },
    {
      href: role === "ADMIN" ? "/admin/timetable" : role === "TEACHER" ? "/teacher/timetable" : "/student/timetable",
      label: role === "ADMIN" ? "Timetable" : "My Schedule",
      icon: (active) => <IconCalendar active={active} />,
    },
    {
      href: "/announcements",
      label: "Announcements",
      icon: (active) => <IconBell active={active} />,
    },
    ...(role === "TEACHER"
      ? [
          {
            href: "/admin/timetable",
            label: "Manage Timetable",
            icon: (active: boolean) => <IconCalendar active={active} />,
          },
        ]
      : []),
    ...(role === "TEACHER"
      ? [
          { href: "/teacher/availability", label: "Office Hours", icon: (active: boolean) => <IconClock active={active} /> },
          { href: "/teacher/appointments", label: "Student Requests", badge: "Live", icon: (active: boolean) => <IconUsers active={active} /> },
        ]
      : []),
    ...(role === "STUDENT"
      ? [{ href: "/student/appointments", label: "Appointments", icon: (active: boolean) => <IconUsers active={active} /> }]
      : []),
    ...(role !== "TEACHER"
      ? [{
          href: "/campus-status",
          label: "Live Campus Status",
          icon: (active: boolean) => <IconClock active={active} />,
        }]
      : []),
  ];
  const initials = (user.name ?? "U").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const filteredNavItems = navItems.filter((item) => item.label.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  return (
    <div className={styles.shell}>
      <button
        aria-hidden={!mobileMenuOpen}
        aria-label="Close navigation menu"
        className={`${styles.backdrop} ${mobileMenuOpen ? styles.backdropVisible : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        tabIndex={mobileMenuOpen ? 0 : -1}
        type="button"
      />

      <aside
        aria-label="Main navigation"
        className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brandRow}>
          <Link className={styles.brand} href={dashHref} onClick={() => setMobileMenuOpen(false)}>
            <span className={styles.brandMark}>C</span>
            <span><strong>CAMPUS<span>.OS</span></strong><small>{roleMeta.portalName.toUpperCase()}</small></span>
          </Link>
          <button aria-label="Close navigation menu" className={styles.closeMenu} onClick={() => setMobileMenuOpen(false)} type="button">×</button>
        </div>

        <nav className={styles.navigation}>
          <p className={styles.navLabel}>YOUR WORKSPACE</p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== dashHref && pathname.startsWith(item.href));
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon(isActive)}
                <span>{item.label}</span>
                {item.badge && <i>{item.badge}</i>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarNote}><span>✦</span><strong>Campus, connected</strong><small>Your classes and campus services, all in one place.</small></div>
          <div className={styles.sidebarUser}>
            <span className={styles.avatar}>{initials}<i /></span>
            <span className={styles.userMeta}><strong>{user.name ?? "Campus User"}</strong><small>{roleMeta.portalName}</small></span>
            <LogoutButton className={styles.logout} />
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button aria-label="Open navigation menu" aria-expanded={mobileMenuOpen} className={styles.menuButton} onClick={() => setMobileMenuOpen(true)} type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>

          <div className={styles.searchWrap}>
            <IconSearch />
            <input
              aria-label="Search dashboard pages"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${roleMeta.portalName.toLowerCase()} pages`}
              type="search"
              value={searchQuery}
            />
            {searchQuery && (
              <div className={styles.searchResults}>
                {filteredNavItems.length ? filteredNavItems.map((item) => (
                  <Link href={item.href} key={item.href} onClick={() => setSearchQuery("")}>{item.label}<span>→</span></Link>
                )) : <p>No matching pages</p>}
              </div>
            )}
          </div>

          <div className={styles.headerActions}>
            {action}
            <div className={styles.notificationWrap}>
              <button aria-expanded={notificationsOpen} aria-label="Notifications" className={styles.notificationButton} onClick={() => setNotificationsOpen(!notificationsOpen)} type="button">
                <IconBell /><i />
              </button>
              {notificationsOpen && (
                <div className={styles.notificationPanel}>
                  <strong>Campus updates</strong>
                  <p>{role === "STUDENT" ? "Check your appointment requests and timetable for the latest updates." : "Review your schedule and appointment requests for the latest updates."}</p>
                  {role === "STUDENT" ? <Link href="/student/appointments" onClick={() => setNotificationsOpen(false)}>Open appointments <span>→</span></Link> : role === "TEACHER" ? <Link href="/teacher/appointments" onClick={() => setNotificationsOpen(false)}>Review requests <span>→</span></Link> : <Link href="/admin/timetable" onClick={() => setNotificationsOpen(false)}>Open timetable <span>→</span></Link>}
                </div>
              )}
            </div>
            <div className={styles.headerUser}>
              <span className={styles.avatar}>{initials}<i /></span>
              <span className={styles.headerUserMeta}><strong>{user.name ?? "Campus User"}</strong><small>{roleMeta.portalName}</small></span>
            </div>
          </div>
        </header>

        <main className={styles.pageContent}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.eyebrow}>{badge ?? roleMeta.portalName}</div>
              <h1>{title ?? roleMeta.defaultTitle}</h1>
              {(subtitle ?? (!title ? "Your classes, appointments and campus updates at a glance." : undefined)) && (
                <p>{subtitle ?? "Your classes, appointments and campus updates at a glance."}</p>
              )}
            </div>
            {role === "ADMIN" && <span className={styles.statusBadge}><i /> Campus active</span>}
          </div>
          <div className={styles.pageChildren}>{children}</div>
        </main>
      </div>
    </div>
  );
}
