import type { Metadata } from "next";
import Link from "next/link";
import styles from "./demo.module.css";

export const metadata: Metadata = {
  title: "Smart Campus Dashboard Preview",
  description: "A sample Smart Campus dashboard inspired by the reference design.",
};

const stats = [
  { title: "Total Students", value: "1,482", delta: "+4.1% this semester", icon: "♧", tone: "rose" },
  { title: "Classes Today", value: "42", delta: "5 departments active", icon: "▦", tone: "orange" },
  { title: "Appointments", value: "18", delta: "6 awaiting response", icon: "◷", tone: "teal" },
  { title: "Faculty Online", value: "19", delta: "Across 4 departments", icon: "♙", tone: "blue" },
] as const;

const heatmap = [
  [2, 4, 7, 8, 5],
  [3, 6, 8, 6, 4],
  [1, 3, 5, 7, 6],
  [2, 5, 6, 8, 4],
  [1, 2, 4, 5, 3],
];

const activity = [
  { badge: "Class", tone: "teal", title: "Data Structures · Room 204", detail: "CS Department · Class started", time: "09:00 AM", state: "In progress" },
  { badge: "New", tone: "orange", title: "Appointment requested by Ayesha Malik", detail: "Meeting with Dr. Khan · Academic advising", time: "09:42 AM", state: "Pending" },
  { badge: "Done", tone: "blue", title: "Software Engineering timetable published", detail: "CS Department · Fall semester", time: "08:15 AM", state: "Published" },
];

const departments = [
  { label: "Computer Science", value: "482", width: "100%", tone: "barBlue" },
  { label: "Information Tech.", value: "326", width: "68%", tone: "barTeal" },
  { label: "Engineering", value: "294", width: "61%", tone: "barGreen" },
  { label: "Business Admin.", value: "218", width: "45%", tone: "barViolet" },
  { label: "Social Sciences", value: "162", width: "34%", tone: "barPink" },
];

function TrendChart() {
  return (
    <svg className={styles.trendChart} viewBox="0 0 460 110" preserveAspectRatio="none" role="img" aria-label="Class attendance trending upwards during the last 30 days">
      <defs>
        <linearGradient id="campusTrendFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#23c1cb" stopOpacity=".32" />
          <stop offset="100%" stopColor="#23c1cb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className={styles.chartGridLines} d="M0 18H460 M0 45H460 M0 72H460 M0 99H460" />
      <path className={styles.trendFill} d="M4 78 45 72 84 76 124 60 164 65 204 48 244 54 284 35 324 43 364 28 404 33 456 14V103H4Z" />
      <path className={styles.trendLine} d="M4 78 45 72 84 76 124 60 164 65 204 48 244 54 284 35 324 43 364 28 404 33 456 14" />
      <circle cx="456" cy="14" r="4" className={styles.trendPoint} />
    </svg>
  );
}

export default function DemoPage() {
  return (
    <main className={styles.preview}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/demo" aria-label="Campus OS preview home">
          <span className={styles.brandMark}>C</span>
          <span><strong>CAMPUS<span>.OS</span></strong><small>SMART CAMPUS PORTAL</small></span>
        </Link>

        <div className={styles.navLabel}>CAMPUS</div>
        <nav className={styles.navigation} aria-label="Dashboard preview navigation">
          <a className={`${styles.navItem} ${styles.navActive}`} href="#overview"><span>▦</span> Dashboard</a>
          <a className={styles.navItem} href="#class-load"><span>▧</span> Class Schedule</a>
          <a className={styles.navItem} href="#activity"><span>◷</span> Appointments <i>6</i></a>
          <a className={styles.navItem} href="#departments"><span>♧</span> Departments</a>
          <a className={styles.navItem} href="#activity"><span>♙</span> Faculty &amp; Students</a>
          <a className={styles.navItem} href="#activity"><span>▤</span> Announcements</a>
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.helpCard}>
            <span className={styles.helpIcon}>✦</span>
            <strong>Your campus, connected</strong>
            <p>Keep classes, appointments and campus updates in sync.</p>
            <Link href="/login">Open your portal <span>↗</span></Link>
          </div>
          <div className={styles.profile}>
            <span className={styles.avatar}>AD</span>
            <span><strong>Campus Admin</strong><small>Administrator</small></span>
            <span className={styles.more}>···</span>
          </div>
        </div>
      </aside>

      <section className={styles.workspace} id="overview">
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>Campus <span>/</span> <strong>Dashboard</strong></div>
          <div className={styles.topActions}>
            <span className={styles.previewBadge}><i /> DEMO · SAMPLE DATA</span>
            <span className={styles.headerAction}>♧<i>3</i></span>
            <span className={styles.headerAction}>▽ Filter</span>
            <span className={styles.headerAction}>⇧ Export</span>
            <Link className={styles.signIn} href="/login"><span className={styles.miniAvatar}>AD</span> Sign in <b>↗</b></Link>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.dateLabel}>WEDNESDAY, OCTOBER 22, 2026 <span>·</span> FALL SEMESTER</div>
              <h1>Campus Management Center</h1>
              <p>Monitor classes, student services and activity across your campus.</p>
            </div>
            <Link className={styles.primaryButton} href="/login"><span>＋</span> Open Campus Portal</Link>
          </div>

          <section className={styles.statGrid} aria-label="Campus summary">
            {stats.map((stat) => (
              <article className={styles.statCard} key={stat.title}>
                <span className={`${styles.statIcon} ${styles[stat.tone]}`}>{stat.icon}</span>
                <div className={styles.statCopy}><span>{stat.title}</span><strong>{stat.value}</strong><small>{stat.delta}</small></div>
              </article>
            ))}
          </section>

          <section className={styles.analyticsGrid}>
            <article className={`${styles.panel} ${styles.heatPanel}`} id="class-load">
              <div className={styles.panelHeader}>
                <div><h2>Class Schedule Overview</h2><p>Classes by day and time block</p></div>
                <span className={styles.panelPill}>THIS WEEK <b>⌄</b></span>
              </div>
              <div className={styles.heatmap}>
                <div className={styles.heatCorner}>TIME</div>
                {["MON", "TUE", "WED", "THU", "FRI"].map((day) => <span className={styles.heatDay} key={day}>{day}</span>)}
                {["08 AM", "10 AM", "12 PM", "02 PM", "04 PM"].map((time, row) => (
                  <div className={styles.heatRow} key={time}>
                    <span className={styles.heatTime}>{time}</span>
                    {heatmap[row].map((count, col) => <span className={`${styles.heatCell} ${styles[`heat${count}`]}`} key={`${row}-${col}`} title={`${count} scheduled classes`}>{count}</span>)}
                  </div>
                ))}
              </div>
              <div className={styles.heatLegend}><span>Class load</span><i className={styles.heat2} /> Low <i className={styles.heat5} /> Moderate <i className={styles.heat8} /> Busy</div>
            </article>

            <div className={styles.chartColumn}>
              <article className={`${styles.panel} ${styles.trendPanel}`}>
                <div className={styles.panelHeader}><div><h2>Attendance Trend (Last 30 Days)</h2><p>Daily student check-ins</p></div><span className={styles.trendDelta}>↗ 12.4%</span></div>
                <div className={styles.trendWrap}><div className={styles.trendYAxis}><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div><TrendChart /></div>
                <div className={styles.weekLabels}><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
              </article>

              <article className={`${styles.panel} ${styles.departmentPanel}`} id="departments">
                <div className={styles.panelHeader}><div><h2>Students by Department</h2><p>Enrollment distribution</p></div><span className={styles.totalTag}>1,482 TOTAL</span></div>
                <div className={styles.departmentRows}>
                  {departments.map((department) => (
                    <div className={styles.departmentRow} key={department.label}>
                      <span>{department.label}</span><div className={styles.departmentTrack}><i className={styles[department.tone]} style={{ width: department.width }} /></div><strong>{department.value}</strong>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className={`${styles.panel} ${styles.activityPanel}`} id="activity">
            <div className={styles.panelHeader}><div><h2>Recent Campus Activity</h2><p>Latest class, appointment and portal updates</p></div><Link className={styles.panelLink} href="/login">View all activity <span>→</span></Link></div>
            <div className={styles.activityList}>
              {activity.map((item) => (
                <div className={styles.activityRow} key={item.title}>
                  <span className={`${styles.activityBadge} ${styles[item.tone]}`}>{item.badge}</span>
                  <div className={styles.activityCopy}><strong>{item.title}</strong><small>{item.detail}</small></div>
                  <time>{item.time}</time>
                  <span className={`${styles.activityState} ${styles[`state${item.state.replace(" ", "")}`]}`}>{item.state}</span>
                </div>
              ))}
            </div>
          </section>

          <footer className={styles.footer}>CAMPUS.OS <span>Demo preview · Sample data only</span></footer>
        </div>
      </section>
    </main>
  );
}
