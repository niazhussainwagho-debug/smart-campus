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
  tone: "rose" | "orange" | "teal" | "blue";
};

type ActivityItem = {
  category: string;
  title: string;
  detail: string;
  time: string;
  state: string;
  tone: "teal" | "orange" | "blue";
};

const heatmapValues = [
  [2, 4, 7, 6, 3],
  [3, 6, 8, 7, 4],
  [1, 3, 5, 7, 6],
  [2, 5, 6, 8, 4],
  [1, 2, 4, 5, 3],
];

const heatmapDays = ["MON", "TUE", "WED", "THU", "FRI"];
const heatmapTimes = ["08 AM", "10 AM", "12 PM", "02 PM", "04 PM"];
const trendPoints = "4,78 45,72 84,76 124,60 164,65 204,48 244,54 284,35 324,43 364,28 404,33 456,14";

const roleStats: Record<UserRole, DashboardStat[]> = {
  STUDENT: [
    { label: "Enrolled Courses", value: "6", note: "+1 this semester", icon: "▤", tone: "teal" },
    { label: "Classes Today", value: "4", note: "Next class at 10:00", icon: "▦", tone: "blue" },
    { label: "Assignments Due", value: "7", note: "This week", icon: "!", tone: "orange" },
    { label: "Appointments", value: "2", note: "1 confirmed", icon: "◷", tone: "rose" },
  ],
  TEACHER: [
    { label: "Total Students", value: "128", note: "Across your courses", icon: "♧", tone: "teal" },
    { label: "Classes Today", value: "5", note: "Next class at 10:00", icon: "▦", tone: "blue" },
    { label: "Pending Requests", value: "12", note: "Awaiting your review", icon: "!", tone: "orange" },
    { label: "Office Hours", value: "3", note: "Availability slots", icon: "◷", tone: "rose" },
  ],
  ADMIN: [
    { label: "Total Students", value: "1,482", note: "+4.1% this semester", icon: "♧", tone: "teal" },
    { label: "Classes Today", value: "42", note: "Across 5 departments", icon: "▦", tone: "blue" },
    { label: "Active Teachers", value: "19", note: "Faculty members", icon: "♙", tone: "orange" },
    { label: "Timetable Conflicts", value: "3", note: "Needs review", icon: "!", tone: "rose" },
  ],
};

const activityByRole: Record<UserRole, ActivityItem[]> = {
  STUDENT: [
    { category: "CLASS", title: "Data Structures · Room 201", detail: "CS Department · Upcoming class", time: "10:00 AM", state: "Upcoming", tone: "teal" },
    { category: "TASK", title: "Database assignment due", detail: "Database Systems · Submit this week", time: "Today", state: "Due soon", tone: "orange" },
    { category: "MEETING", title: "Faculty appointment confirmed", detail: "Dr. Khan · Academic advising", time: "Yesterday", state: "Confirmed", tone: "blue" },
  ],
  TEACHER: [
    { category: "CLASS", title: "Software Engineering · Room 110", detail: "CS-405 · Class on today's timetable", time: "10:00 AM", state: "Upcoming", tone: "teal" },
    { category: "REQUEST", title: "Appointment request from Ayesha Malik", detail: "Academic advising · Review request", time: "09:42 AM", state: "Pending", tone: "orange" },
    { category: "OFFICE", title: "Office hours availability", detail: "3 upcoming consultation slots", time: "Today", state: "Available", tone: "blue" },
  ],
  ADMIN: [
    { category: "CLASS", title: "Data Structures · Room 204", detail: "CS Department · Class started", time: "09:00 AM", state: "In progress", tone: "teal" },
    { category: "REVIEW", title: "Timetable conflict needs attention", detail: "Room schedule · Review in admin timetable", time: "09:42 AM", state: "Needs review", tone: "orange" },
    { category: "CAMPUS", title: "Fall semester timetable is active", detail: "Campus scheduling · All departments", time: "Today", state: "Published", tone: "blue" },
  ],
};

const enrollmentByDepartment = [
  { label: "Computer Science", value: "482", width: "100%", tone: "barBlue" },
  { label: "Information Technology", value: "326", width: "68%", tone: "barTeal" },
  { label: "Engineering", value: "294", width: "61%", tone: "barGreen" },
  { label: "Business", value: "218", width: "45%", tone: "barViolet" },
  { label: "Other programs", value: "162", width: "34%", tone: "barPink" },
];

const roleBreakdown: Record<UserRole, { title: string; subtitle: string; total: string; rows: typeof enrollmentByDepartment }> = {
  ADMIN: {
    title: "Students by Department",
    subtitle: "Enrollment distribution",
    total: "1,482 STUDENTS",
    rows: enrollmentByDepartment,
  },
  TEACHER: {
    title: "My Course Enrollment",
    subtitle: "Students across assigned courses",
    total: "128 STUDENTS",
    rows: [
      { label: "Data Structures", value: "36", width: "100%", tone: "barBlue" },
      { label: "Software Engineering", value: "32", width: "89%", tone: "barTeal" },
      { label: "Database Systems", value: "25", width: "69%", tone: "barGreen" },
      { label: "Web Technologies", value: "20", width: "56%", tone: "barViolet" },
      { label: "Other", value: "15", width: "42%", tone: "barPink" },
    ],
  },
  STUDENT: {
    title: "Weekly Study Plan",
    subtitle: "Your enrolled courses",
    total: "6 COURSES",
    rows: [
      { label: "Data Structures", value: "4x", width: "100%", tone: "barBlue" },
      { label: "Software Engineering", value: "3x", width: "78%", tone: "barTeal" },
      { label: "Database Systems", value: "3x", width: "70%", tone: "barGreen" },
      { label: "Web Technologies", value: "2x", width: "56%", tone: "barViolet" },
      { label: "Other courses", value: "2x", width: "48%", tone: "barPink" },
    ],
  },
};

const portalTitles: Record<UserRole, string> = {
  STUDENT: "Student Dashboard",
  TEACHER: "Faculty Dashboard",
  ADMIN: "Campus Management Center",
};

const portalSubtitles: Record<UserRole, string> = {
  STUDENT: "Your classes, study plan and faculty appointments at a glance.",
  TEACHER: "Your teaching schedule, students and appointment requests at a glance.",
  ADMIN: "Monitor classes, student services and activity across your campus.",
};

function HeatmapPanel() {
  return (
    <article className={`${styles.panel} ${styles.heatPanel}`}>
      <div className={styles.panelHeader}>
        <div><h2>Weekly Class Schedule</h2><p>Class activity by weekday and time</p></div>
        <span className={styles.panelPill}>THIS WEEK <b>⌄</b></span>
      </div>
      <div className={styles.heatmap} role="img" aria-label="Sample weekly class schedule intensity">
        <span className={styles.heatCorner}>TIME</span>
        {heatmapDays.map((day) => <span className={styles.heatDay} key={day}>{day}</span>)}
        {heatmapValues.map((row, rowIndex) => (
          <div className={styles.heatRow} key={heatmapTimes[rowIndex]}>
            <span className={styles.heatTime}>{heatmapTimes[rowIndex]}</span>
            {row.map((intensity, columnIndex) => (
              <span
                aria-label={`${heatmapDays[columnIndex]} ${heatmapTimes[rowIndex]}: ${intensity} scheduled classes`}
                className={`${styles.heatCell} ${styles[`heat${intensity}`]}`}
                key={`${rowIndex}-${columnIndex}`}
                title={`${intensity} scheduled classes`}
              >
                {intensity}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className={styles.heatLegend}><span>Class load</span><i className={styles.heat2} /> Low <i className={styles.heat5} /> Moderate <i className={styles.heat8} /> Busy</div>
    </article>
  );
}

function TrendPanel({ role }: { role: UserRole }) {
  const trendTitle = role === "STUDENT" ? "Weekly Attendance" : role === "TEACHER" ? "Class Attendance Trend" : "Campus Attendance Trend";
  return (
    <article className={`${styles.panel} ${styles.trendPanel}`}>
      <div className={styles.panelHeader}>
        <div><h2>{trendTitle}</h2><p>Attendance over the last 30 days</p></div>
        <span className={styles.trendDelta}>↗ 12.4%</span>
      </div>
      <div className={styles.trendWrap}>
        <div className={styles.trendYAxis}><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div>
        <svg className={styles.trendChart} viewBox="0 0 460 110" preserveAspectRatio="none" role="img" aria-label="Sample attendance trend trending upwards">
          <defs><linearGradient id="attendanceFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#23c1cb" stopOpacity=".3" /><stop offset="100%" stopColor="#23c1cb" stopOpacity="0" /></linearGradient></defs>
          <path className={styles.chartGridLines} d="M0 18H460 M0 45H460 M0 72H460 M0 99H460" />
          <path className={styles.trendFill} d={`M${trendPoints.replaceAll(" ", " L")} L456 104 L4 104 Z`} />
          <polyline className={styles.trendLine} points={trendPoints} />
          <circle cx="456" cy="14" r="4" className={styles.trendPoint} />
        </svg>
      </div>
      <div className={styles.weekLabels}><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
    </article>
  );
}

function BreakdownPanel({ role }: { role: UserRole }) {
  const breakdown = roleBreakdown[role];
  return (
    <article className={`${styles.panel} ${styles.breakdownPanel}`}>
      <div className={styles.panelHeader}><div><h2>{breakdown.title}</h2><p>{breakdown.subtitle}</p></div><span className={styles.totalTag}>{breakdown.total}</span></div>
      <div className={styles.breakdownRows}>
        {breakdown.rows.map((row) => (
          <div className={styles.breakdownRow} key={row.label}>
            <span>{row.label}</span>
            <div className={styles.breakdownTrack}><i className={styles[row.tone]} style={{ width: row.width }} /></div>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function ActivityPanel({ role }: { role: UserRole }) {
  const link = role === "STUDENT" ? "/student/appointments" : role === "TEACHER" ? "/teacher/appointments" : "/admin/timetable";
  return (
    <article className={`${styles.panel} ${styles.activityPanel}`}>
      <div className={styles.panelHeader}><div><h2>Recent Campus Activity</h2><p>Latest schedule and service updates</p></div><Link className={styles.panelLink} href={link}>Open details <span>→</span></Link></div>
      <div className={styles.activityList}>
        {activityByRole[role].map((item) => (
          <div className={styles.activityRow} key={item.title}>
            <span className={`${styles.activityBadge} ${styles[item.tone]}`}>{item.category}</span>
            <div className={styles.activityCopy}><strong>{item.title}</strong><small>{item.detail}</small></div>
            <time>{item.time}</time>
            <span className={`${styles.activityState} ${styles[`state${item.state.replaceAll(" ", "")}`]}`}>{item.state}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function QuickLinks({ role }: { role: UserRole }) {
  const timetablePath = role === "ADMIN" ? "/admin/timetable" : role === "TEACHER" ? "/teacher/timetable" : "/student/timetable";
  const links = [
    { href: timetablePath, title: role === "ADMIN" ? "Manage timetable" : "Open my timetable", detail: "View classes and schedule", icon: "▦" },
    ...(role === "STUDENT"
      ? [{ href: "/student/appointments", title: "Book an appointment", detail: "Meet with a faculty member", icon: "◷" }]
      : role === "TEACHER"
      ? [
          { href: "/teacher/appointments", title: "Review requests", detail: "Manage student appointments", icon: "♧" },
          { href: "/teacher/availability", title: "Office hours", detail: "Manage your availability", icon: "◷" },
        ]
      : [{ href: "/admin/timetable", title: "Review schedule", detail: "Resolve timetable conflicts", icon: "!" }]),
    ...(role === "ADMIN"
      ? [
          {
            href: "/admin/requests",
            title: "Teacher requests",
            detail: "Approve pending teacher registrations",
            icon: "♙",
          },
        ]
      : []),
    ...(role !== "TEACHER"
      ? [{
          href: "/campus-status",
          title: "Live campus status",
          detail: "Check teacher and room availability",
          icon: "◉",
        }]
      : []),
  ];
  return (
    <section className={styles.quickLinks} aria-label="Quick links">
      {links.map((link) => (
        <Link className={styles.quickLink} href={link.href} key={link.title}>
          <span>{link.icon}</span><span><strong>{link.title}</strong><small>{link.detail}</small></span><b>→</b>
        </Link>
      ))}
    </section>
  );
}

export async function RoleDashboard({ role }: { role: UserRole }) {
  const user = await requireRole(role);
  const timetablePath = role === "ADMIN" ? "/admin/timetable" : role === "TEACHER" ? "/teacher/timetable" : "/student/timetable";

  return (
    <DashboardShell role={role} title={portalTitles[role]} subtitle={portalSubtitles[role]} user={user}>
      <section className={styles.statGrid} aria-label="Dashboard summary">
        {roleStats[role].map((stat) => (
          <article className={styles.statCard} key={stat.label}>
            <span className={`${styles.statIcon} ${styles[stat.tone]}`}>{stat.icon}</span>
            <div className={styles.statCopy}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div>
          </article>
        ))}
      </section>

      <section className={styles.analyticsGrid} aria-label="Academic analytics">
        <HeatmapPanel />
        <div className={styles.chartColumn}>
          <TrendPanel role={role} />
          <BreakdownPanel role={role} />
        </div>
      </section>

      <ActivityPanel role={role} />

      <div className={styles.bottomRow}>
        <QuickLinks role={role} />
        <Link className={styles.viewSchedule} href={timetablePath}>View full timetable <span>→</span></Link>
      </div>
    </DashboardShell>
  );
}
