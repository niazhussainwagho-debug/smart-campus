import Link from "next/link";
import type { UserRole } from "@/generated/prisma/enums";
import { requireRole } from "@/lib/auth-helpers";
import { DashboardShell } from "@/components/dashboard-shell";
import styles from "./role-dashboard.module.css";

type DashboardStat = {
  label: string;
  value: string;
  note: string;
  icon: string;
  badgeColor?: string;
};

type ScheduleClass = {
  code: string;
  name: string;
  room: string;
  teacher: string;
  time: string;
  icon: string;
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
  icon: string;
};

const roleStats: Record<UserRole, DashboardStat[]> = {
  STUDENT: [
    { label: "Classes",      value: "4",   note: "Scheduled today",  icon: "📚", badgeColor: "#eff6ff" },
    { label: "Attendance",   value: "92%", note: "Overall rate",     icon: "📊", badgeColor: "#f0fdf4" },
    { label: "Assignments",  value: "3",   note: "Pending review",   icon: "📝", badgeColor: "#fff7ed" },
    { label: "Appointments", value: "2",   note: "1 confirmed",      icon: "🕐", badgeColor: "#fef2f2" },
  ],
  TEACHER: [
    { label: "Total Students",   value: "128", note: "Active enrollments", icon: "👥", badgeColor: "#eff6ff" },
    { label: "Classes Today",    value: "5",   note: "Next at 10:00 AM",   icon: "📅", badgeColor: "#f0fdf4" },
    { label: "Pending Requests", value: "12",  note: "Student bookings",   icon: "📝", badgeColor: "#fff7ed" },
    { label: "Office Hours",     value: "3",   note: "Available slots",    icon: "🕐", badgeColor: "#fef2f2" },
  ],
  ADMIN: [
    { label: "Total Students",      value: "1,482", note: "+4.1% this semester",  icon: "👥", badgeColor: "#eff6ff" },
    { label: "Classes Today",       value: "42",    note: "Across 5 departments", icon: "📅", badgeColor: "#f0fdf4" },
    { label: "Active Teachers",     value: "19",    note: "Faculty instructors",  icon: "👨‍🏫", badgeColor: "#fff7ed" },
    { label: "Timetable Conflicts", value: "0",     note: "100% Conflict-free",   icon: "✓",  badgeColor: "#f0fdf4" },
  ],
};

const todaySchedule: Record<UserRole, ScheduleClass[]> = {
  STUDENT: [
    { code: "GICP-302", name: "Ideology and Constitution of Pakistan", room: "Room No 22", teacher: "Mr. Ahmed Hussain Shah", time: "08:30 – 10:00", icon: "📖" },
    { code: "IT26-321", name: "Object Oriented Programming (Lab)", room: "Comp Lab II", teacher: "Dr. Bilal Shaikh", time: "10:00 – 11:30", icon: "💻" },
    { code: "GQUR-322", name: "Calculus & Analytical Geometry", room: "Lecture Hall @ Hitech", teacher: "Engr. Noorulain Patoli", time: "11:30 – 12:15", icon: "📐" },
    { code: "IT26-326", name: "Digital Logic Design", room: "Room No 10", teacher: "Dr. Fauzia Talpur", time: "12:15 – 01:45", icon: "⚡" },
  ],
  TEACHER: [
    { code: "IT26-321", name: "Object Oriented Programming (Lab)", room: "Comp Lab II", teacher: "BSIT Section P-I", time: "10:00 – 11:30", icon: "💻" },
    { code: "IT26-320", name: "Object Oriented Programming (Theory)", room: "Room No 22", teacher: "BSIT Section P-I", time: "11:30 – 01:00", icon: "📖" },
    { code: "CS-401",   name: "Software Architecture & Design", room: "Room No 12", teacher: "BSCS Section A", time: "01:30 – 03:00", icon: "⚙️" },
  ],
  ADMIN: [
    { code: "FET-BSIT", name: "Morning Program Schedule Active", room: "Hitech Campus", teacher: "14 Sections Ongoing", time: "08:30 – 01:45", icon: "🏛️" },
    { code: "FET-BSSW", name: "Software Engineering Classes", room: "Computer Science Dept", teacher: "8 Faculty Assigned", time: "09:00 – 02:00", icon: "💻" },
    { code: "FET-BSDS", name: "Data Science Labs", room: "Lab I & II", teacher: "6 Lab Instructors", time: "10:00 – 03:00", icon: "📊" },
  ],
};

const activityByRole: Record<UserRole, ActivityItem[]> = {
  STUDENT: [
    { title: "Appointment confirmed with Dr. Bilal Shaikh", detail: "Consultation · Academic Advising", time: "10 min ago", icon: "✓" },
    { title: "Assignment #2 due this Friday", detail: "Object Oriented Programming Lab", time: "2 hrs ago", icon: "📝" },
    { title: "Timetable updated for Semester 2", detail: "FET BSIT Morning Program v4", time: "Yesterday", icon: "📅" },
  ],
  TEACHER: [
    { title: "New appointment requested", detail: "Student: Demo Student (BSIT P-I)", time: "30 min ago", icon: "🕐" },
    { title: "Class attendance recorded", detail: "IT26-321 · 32/34 students present", time: "2 hrs ago", icon: "✓" },
    { title: "Office hours updated", detail: "Available: Monday & Wednesday", time: "Yesterday", icon: "👥" },
  ],
  ADMIN: [
    { title: "Timetable published", detail: "FET Second Semester 2026 Morning (w.e.f 17-08-2026)", time: "1 hr ago", icon: "📅" },
    { title: "Zero conflicts detected", detail: "All faculty, room & section clashes resolved", time: "3 hrs ago", icon: "✓" },
    { title: "New teacher registration verified", detail: "Dr. Fauzia Talpur approved", time: "Today", icon: "👨‍🏫" },
  ],
};

const portalTitles: Record<UserRole, string> = {
  STUDENT: "Student Dashboard",
  TEACHER: "Faculty Dashboard",
  ADMIN:   "Campus Management Center",
};

const portalSubtitles: Record<UserRole, string> = {
  STUDENT: "Your classes, attendance and faculty appointments at a glance.",
  TEACHER: "Your teaching schedule, student requests and office hours at a glance.",
  ADMIN:   "Monitor classes, student services and campus activity.",
};

export async function RoleDashboard({ role }: { role: UserRole }) {
  const user = await requireRole(role);
  const timetablePath = role === "ADMIN" ? "/admin/timetable" : role === "TEACHER" ? "/teacher/timetable" : "/student/timetable";
  const appointmentsPath = role === "STUDENT" ? "/student/appointments" : role === "TEACHER" ? "/teacher/appointments" : "/admin/requests";

  const stats = roleStats[role];
  const schedule = todaySchedule[role];
  const activities = activityByRole[role];

  return (
    <DashboardShell role={role} title={portalTitles[role]} subtitle={portalSubtitles[role]} user={user}>
      {/* ── 1. Top Stat Cards Row (Design 5 Screen 2) ── */}
      <section className={styles.statCardsRow} aria-label="Key metrics">
        {stats.map((stat) => (
          <div className={styles.statCard} key={stat.label}>
            <div className={styles.statTop}>
              <span className={styles.statLabel}>{stat.label}</span>
              <span className={styles.statIconBadge} style={{ background: stat.badgeColor }}>
                {stat.icon}
              </span>
            </div>
            <div className={styles.statValue}>{stat.value}</div>
            <div className={styles.statNote}>{stat.note}</div>
          </div>
        ))}
      </section>

      {/* ── 2. Today's Timetable Section (Design 5 Screen 2) ── */}
      <section className={styles.dashboardMainGrid}>
        {/* Left Column: Today's Timetable */}
        <div className={styles.timetableCard}>
          <div className={styles.cardHeader}>
            <div>
              <h2 className={styles.cardTitle}>Today&apos;s timetable</h2>
              <p className={styles.cardSubtitle}>
                {new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <Link href={timetablePath} className={styles.cardActionLink} prefetch={true}>
              Full schedule →
            </Link>
          </div>

          <div className={styles.classesList}>
            {schedule.map((cls) => (
              <Link href={timetablePath} className={styles.classItem} key={cls.code + cls.time} prefetch={true}>
                <div className={styles.classItemIcon}>
                  {cls.icon}
                </div>
                <div className={styles.classItemDetails}>
                  <div className={styles.classItemTitle}>
                    <span className={styles.classCodeBadge}>{cls.code}</span>
                    <span className={styles.classNameText}>{cls.name}</span>
                  </div>
                  <div className={styles.classItemMeta}>
                    <span>📍 {cls.room}</span>
                    <span>•</span>
                    <span>👤 {cls.teacher}</span>
                  </div>
                </div>
                <div className={styles.classItemRight}>
                  <span className={styles.classTimeBadge}>{cls.time}</span>
                  <span className={styles.classChevron}>›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Attendance & Quick Actions */}
        <div className={styles.sideCardsCol}>
          {/* Quick Rate Card */}
          <div className={styles.rateCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitleSmall}>
                {role === "STUDENT" ? "Attendance Rate" : role === "TEACHER" ? "Teaching Hours" : "System Status"}
              </h3>
              <span className={styles.rateBadge}>Active</span>
            </div>
            <div className={styles.rateNumberRow}>
              <div className={styles.rateBigPercent}>
                {role === "STUDENT" ? "92%" : role === "TEACHER" ? "100%" : "99.8%"}
              </div>
              <div className={styles.rateDesc}>
                {role === "STUDENT"
                  ? "Great job! You meet the 75% university eligibility requirement."
                  : role === "TEACHER"
                  ? "All assigned lectures for this semester are on track."
                  : "All departments operating without schedule clashes."}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className={styles.activityCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitleSmall}>Recent Updates</h3>
            </div>
            <div className={styles.activityList}>
              {activities.map((act) => (
                <div className={styles.activityRow} key={act.title}>
                  <div className={styles.activityIcon}>{act.icon}</div>
                  <div className={styles.activityCopy}>
                    <strong>{act.title}</strong>
                    <small>{act.detail}</small>
                  </div>
                  <span className={styles.activityTime}>{act.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fast Link */}
          <Link href={appointmentsPath} className={styles.quickBookBtn} prefetch={true}>
            <span>{role === "STUDENT" ? "👨‍🏫 Book Faculty Appointment" : role === "TEACHER" ? "👥 Review Student Requests" : "🛡️ Verify Faculty Registrations"}</span>
            <span>→</span>
          </Link>
        </div>
      </section>
    </DashboardShell>
  );
}
