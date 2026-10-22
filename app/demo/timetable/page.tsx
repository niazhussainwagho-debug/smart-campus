"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./timetable.module.css";

const classes = [
  { code: "CS-201", name: "Data Structures", department: "Computer Science", section: "BSCS · Semester 3", room: "Room 204", teacher: "Dr. A. Khan", day: "MON", start: "08:00", end: "09:30", status: "Scheduled", tone: "teal" },
  { code: "SE-405", name: "Software Engineering", department: "Computer Science", section: "BSCS · Semester 5", room: "Room 110", teacher: "Ms. Sana", day: "MON", start: "10:00", end: "11:30", status: "Ongoing", tone: "blue" },
  { code: "IT-210", name: "Web Technologies", department: "Information Technology", section: "BSIT · Semester 3", room: "Lab 3", teacher: "Mr. Ali", day: "TUE", start: "09:00", end: "10:30", status: "Scheduled", tone: "violet" },
  { code: "DB-302", name: "Database Systems", department: "Computer Science", section: "BSCS · Semester 4", room: "Room 301", teacher: "Dr. Ahmed", day: "WED", start: "12:00", end: "13:30", status: "Scheduled", tone: "amber" },
  { code: "EE-220", name: "Digital Systems", department: "Engineering", section: "BSEE · Semester 2", room: "Lab 2", teacher: "Engr. Raza", day: "THU", start: "14:00", end: "15:30", status: "Scheduled", tone: "rose" },
];

const weekdays = [
  { code: "ALL", label: "All days" },
  { code: "MON", label: "Mon" },
  { code: "TUE", label: "Tue" },
  { code: "WED", label: "Wed" },
  { code: "THU", label: "Thu" },
  { code: "FRI", label: "Fri" },
];

export default function TimetablePreviewPage() {
  const [selectedDay, setSelectedDay] = useState("ALL");
  const [query, setQuery] = useState("");

  const filteredClasses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return classes.filter((item) => {
      const matchesDay = selectedDay === "ALL" || item.day === selectedDay;
      const matchesQuery = !normalizedQuery || [
        item.code,
        item.name,
        item.department,
        item.section,
        item.room,
        item.teacher,
      ].some((field) => field.toLowerCase().includes(normalizedQuery));
      return matchesDay && matchesQuery;
    });
  }, [query, selectedDay]);

  return (
    <main className={styles.preview}>
      <aside className={styles.sidebar}>
        <Link className={styles.brand} href="/demo">
          <span className={styles.brandMark}>C</span>
          <span><strong>CAMPUS<span>.OS</span></strong><small>SMART CAMPUS PORTAL</small></span>
        </Link>
        <p className={styles.navLabel}>CAMPUS</p>
        <nav className={styles.nav} aria-label="Demo navigation">
          <Link href="/demo"><span>▦</span> Dashboard</Link>
          <a className={styles.navActive} href="#scheduled"><span>▣</span> Timetable</a>
          <a href="#schedule-form"><span>◷</span> Appointments</a>
          <a href="#scheduled"><span>♧</span> Students</a>
          <a href="#scheduled"><span>♙</span> Faculty</a>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarNote}><span>✦</span><strong>Keep campus in sync</strong><small>One clear view for every class.</small></div>
          <Link className={styles.account} href="/login"><span>AD</span><strong>Campus Admin</strong><small>Sign in ↗</small></Link>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>Campus <span>/</span> <strong>Timetable</strong></div>
          <div className={styles.topRight}><span className={styles.demoTag}><i /> DEMO PREVIEW</span><Link href="/login">Sign in <span>↗</span></Link></div>
        </header>

        <div className={styles.content}>
          <div className={styles.pageHeading}>
            <div><span className={styles.eyebrow}>ADMIN OPERATIONS</span><h1>Academic Timetable</h1><p>Schedule classes and manage the campus week at a glance.</p></div>
            <a className={styles.primaryButton} href="#schedule-form"><span>＋</span> Schedule a class</a>
          </div>

          <section className={styles.summary} aria-label="Timetable summary">
            <article><span className={`${styles.summaryIcon} ${styles.teal}`}>▦</span><div><small>Scheduled classes</small><strong>48</strong></div><span className={styles.summaryHint}>This semester</span></article>
            <article><span className={`${styles.summaryIcon} ${styles.blue}`}>◷</span><div><small>Classes today</small><strong>8</strong></div><span className={styles.summaryHint}>Across campus</span></article>
            <article><span className={`${styles.summaryIcon} ${styles.violet}`}>⌂</span><div><small>Rooms in use</small><strong>12</strong></div><span className={styles.summaryHint}>of 16 available</span></article>
          </section>

          <section className={`${styles.panel} ${styles.formPanel}`} id="schedule-form">
            <div className={styles.panelHeading}>
              <div><h2>Schedule a class</h2><p>A short, focused form. Conflicts are checked when saved.</p></div>
              <span className={styles.optionalTag}>NEW CLASS</span>
            </div>
            <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
              <label>Course<select defaultValue=""><option value="" disabled>Select course</option><option>CS-201 · Data Structures</option><option>SE-405 · Software Engineering</option><option>IT-210 · Web Technologies</option></select></label>
              <label>Section<select defaultValue=""><option value="" disabled>Select section</option><option>BSCS · Semester 3</option><option>BSIT · Semester 3</option></select></label>
              <label>Day<select defaultValue=""><option value="" disabled>Select day</option><option>Monday</option><option>Tuesday</option><option>Wednesday</option></select></label>
              <label>Room<select defaultValue=""><option value="" disabled>Select room</option><option>Room 204</option><option>Lab 3</option></select></label>
              <label>Start<input type="time" defaultValue="09:00" /></label>
              <label>End<input type="time" defaultValue="10:30" /></label>
              <div className={styles.formActions}><span>Demo preview · changes are not saved</span><button type="button">Save class <span>→</span></button></div>
            </form>
          </section>

          <section className={`${styles.panel} ${styles.scheduledPanel}`} id="scheduled">
            <div className={styles.panelHeading}>
              <div><h2>Scheduled Classes <span className={styles.count}>48</span></h2><p>Find and review classes without a long page of oversized cards.</p></div>
              <label className={styles.search}><span>⌕</span><input aria-label="Search classes" onChange={(event) => setQuery(event.target.value)} placeholder="Search classes" value={query} /></label>
            </div>
            <div className={styles.filterBar} role="group" aria-label="Filter classes by weekday">
              {weekdays.map((day) => <button aria-pressed={selectedDay === day.code} className={selectedDay === day.code ? styles.filterActive : ""} key={day.code} onClick={() => setSelectedDay(day.code)} type="button">{day.label}</button>)}
              <span className={styles.filterResult}>{filteredClasses.length} shown</span>
            </div>
            {filteredClasses.length ? (
              <div className={styles.classList}>
                {filteredClasses.map((item) => (
                  <article className={styles.classRow} key={item.code}>
                    <span className={`${styles.classAccent} ${styles[item.tone]}`} />
                    <div className={styles.classTime}><strong>{item.start}</strong><span>{item.end}</span></div>
                    <div className={styles.classDetails}><div className={styles.courseTitle}><span>{item.code}</span><strong>{item.name}</strong></div><p>{item.section} <i>·</i> {item.department}</p></div>
                    <div className={styles.classMeta}><span>⌂ {item.room}</span><span>♙ {item.teacher}</span></div>
                    <span className={`${styles.status} ${item.status === "Ongoing" ? styles.statusLive : ""}`}><i />{item.status}</span>
                    <button className={styles.moreButton} aria-label={`More options for ${item.name}`} type="button">···</button>
                  </article>
                ))}
              </div>
            ) : <p className={styles.empty}>No classes match these filters.</p>}
            <div className={styles.listFooter}><span>Showing {filteredClasses.length} sample classes</span><Link href="/login">Manage full timetable <span>→</span></Link></div>
          </section>

          <footer className={styles.footer}>CAMPUS.OS <span>Preview only · no schedule changes are saved</span></footer>
        </div>
      </section>
    </main>
  );
}
