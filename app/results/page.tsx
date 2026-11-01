"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./results.module.css";

type ScreenId = "all" | "login" | "dashboard" | "timetable" | "appointments";

export default function ResultsAndOutcomesPage() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("all");
  const [loginEmail, setLoginEmail] = useState("student@campus.edu");
  const [loginPass, setLoginPass] = useState("••••••••");
  const [showPass, setShowPass] = useState(false);
  const [bookedStatus, setBookedStatus] = useState<Record<string, boolean>>({});

  const handleBook = (teacherName: string) => {
    setBookedStatus((prev) => ({ ...prev, [teacherName]: true }));
    setTimeout(() => {
      setBookedStatus((prev) => ({ ...prev, [teacherName]: false }));
    }, 3000);
  };

  return (
    <main className={styles.pageContainer}>
      {/* ── Top Header Section (matching Design 5 Report Header) ── */}
      <header className={styles.headerSection}>
        <div className={styles.reportKicker}>
          <span className={styles.reportKickerDot} />
          Professional University Project Report
        </div>
        <h1 className={styles.reportTitle}>
          Results &amp; Outcomes — Smart Campus Management System
        </h1>
        <p className={styles.reportSubtitle}>
          Complete software verification, real-time timetable integration (FET Second Semester 2026),
          and interactive demonstration screens verified across all device viewports.
        </p>
      </header>

      {/* ── Controls Bar ── */}
      <section className={styles.controlsBar} aria-label="Device and view controls">
        <div className={styles.deviceTabs}>
          <button
            type="button"
            className={`${styles.deviceTabBtn} ${activeScreen === "all" ? styles.deviceTabBtnActive : ""}`}
            onClick={() => setActiveScreen("all")}
          >
            💻 All 4 MacBook Screens
          </button>
          <button
            type="button"
            className={`${styles.deviceTabBtn} ${activeScreen === "login" ? styles.deviceTabBtnActive : ""}`}
            onClick={() => setActiveScreen("login")}
          >
            🔐 1. Login Page
          </button>
          <button
            type="button"
            className={`${styles.deviceTabBtn} ${activeScreen === "dashboard" ? styles.deviceTabBtnActive : ""}`}
            onClick={() => setActiveScreen("dashboard")}
          >
            📊 2. Student Dashboard
          </button>
          <button
            type="button"
            className={`${styles.deviceTabBtn} ${activeScreen === "timetable" ? styles.deviceTabBtnActive : ""}`}
            onClick={() => setActiveScreen("timetable")}
          >
            📅 3. Timetable View
          </button>
          <button
            type="button"
            className={`${styles.deviceTabBtn} ${activeScreen === "appointments" ? styles.deviceTabBtnActive : ""}`}
            onClick={() => setActiveScreen("appointments")}
          >
            👨‍🏫 4. Appointments
          </button>
        </div>

        <div className={styles.quickActions}>
          <button
            type="button"
            onClick={() => window.print()}
            className={styles.actionBtn}
            title="Print or save as PDF for report"
          >
            🖨️ Print / Save Report
          </button>
          <Link href="/student" className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}>
            Go to Live Portal →
          </Link>
        </div>
      </section>

      {/* ── Mobile Screen Quick Switcher ── */}
      <div className={styles.screenSelectorMobile}>
        <div className={styles.screenSelectorList}>
          <button
            type="button"
            className={`${styles.screenSelectorItem} ${activeScreen === "all" ? styles.screenSelectorItemActive : ""}`}
            onClick={() => setActiveScreen("all")}
          >
            Overview (All 4)
          </button>
          <button
            type="button"
            className={`${styles.screenSelectorItem} ${activeScreen === "login" ? styles.screenSelectorItemActive : ""}`}
            onClick={() => setActiveScreen("login")}
          >
            Login Page
          </button>
          <button
            type="button"
            className={`${styles.screenSelectorItem} ${activeScreen === "dashboard" ? styles.screenSelectorItemActive : ""}`}
            onClick={() => setActiveScreen("dashboard")}
          >
            Student Dashboard
          </button>
          <button
            type="button"
            className={`${styles.screenSelectorItem} ${activeScreen === "timetable" ? styles.screenSelectorItemActive : ""}`}
            onClick={() => setActiveScreen("timetable")}
          >
            Timetable View
          </button>
          <button
            type="button"
            className={`${styles.screenSelectorItem} ${activeScreen === "appointments" ? styles.screenSelectorItemActive : ""}`}
            onClick={() => setActiveScreen("appointments")}
          >
            Appointments
          </button>
        </div>
      </div>

      {/* ── 4 MacBook Screens Grid ── */}
      <section
        className={`${styles.screensGrid} ${activeScreen !== "all" ? styles.singleScreenView : ""}`}
      >
        {/* ========================================================
            SCREEN 1: LOGIN PAGE
           ======================================================== */}
        {(activeScreen === "all" || activeScreen === "login") && (
          <article className={styles.screenCard}>
            <div className={styles.macbookShell}>
              <div className={styles.macbookCameraBar}>
                <div className={styles.cameraLens} />
              </div>
              <div className={styles.macbookScreen}>
                <div className={styles.browserChrome}>
                  <div className={styles.windowDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <div className={styles.browserAddress}>🔒 campus.edu/login</div>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>100%</span>
                </div>
                <div className={styles.screenBody}>
                  <div className={styles.loginScreen}>
                    <div className={styles.loginCard}>
                      <div className={styles.loginLogoRow}>
                        <div className={styles.loginLogoIcon}>🎓</div>
                        <div className={styles.loginLogoText}>
                          Smart Campus
                          <small>University Portal</small>
                        </div>
                      </div>

                      <div className={styles.loginForm}>
                        <div className={styles.loginFieldGroup}>
                          <label htmlFor="res-email">Email</label>
                          <input
                            id="res-email"
                            type="email"
                            className={styles.loginInput}
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="email@campus.edu"
                          />
                        </div>

                        <div className={styles.loginFieldGroup}>
                          <label htmlFor="res-pass">Password</label>
                          <div className={styles.loginInputWrap}>
                            <input
                              id="res-pass"
                              type={showPass ? "text" : "password"}
                              className={styles.loginInput}
                              value={loginPass}
                              onChange={(e) => setLoginPass(e.target.value)}
                            />
                            <span
                              className={styles.loginEyeIcon}
                              onClick={() => setShowPass(!showPass)}
                              role="button"
                              tabIndex={0}
                            >
                              {showPass ? "👁️" : "👁️‍🗨️"}
                            </span>
                          </div>
                        </div>

                        <Link href="/login" className={styles.loginSubmitBtn} style={{ textAlign: "center", textDecoration: "none" }}>
                          Login
                        </Link>

                        <a href="#forgot" className={styles.loginForgotLink}>
                          Forgot Password?
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.macbookBase}>
              <div className={styles.macbookBaseNotch} />
            </div>
            <h2 className={styles.screenLabel}>Login Page</h2>
            <p className={styles.screenDescription}>
              Clean centralized authentication card with role verification and university branding.
            </p>
          </article>
        )}

        {/* ========================================================
            SCREEN 2: STUDENT DASHBOARD
           ======================================================== */}
        {(activeScreen === "all" || activeScreen === "dashboard") && (
          <article className={styles.screenCard}>
            <div className={styles.macbookShell}>
              <div className={styles.macbookCameraBar}>
                <div className={styles.cameraLens} />
              </div>
              <div className={styles.macbookScreen}>
                <div className={styles.browserChrome}>
                  <div className={styles.windowDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <div className={styles.browserAddress}>🔒 campus.edu/student</div>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>Live</span>
                </div>
                <div className={styles.screenBody}>
                  <div className={styles.dashboardScreen}>
                    {/* Left Sidebar */}
                    <aside className={styles.dashSidebar}>
                      <div className={styles.dashSidebarBrand}>
                        <div className={styles.dashSidebarBrandIcon}>🎓</div>
                        <div className={styles.dashSidebarBrandName}>Smart Campus</div>
                      </div>
                      <a href="#dash" className={`${styles.dashNavItem} ${styles.dashNavItemActive}`}>
                        <span>▦</span>
                        <span>Dashboard</span>
                      </a>
                      <a href="#classes" className={styles.dashNavItem}>
                        <span>📚</span>
                        <span>Classes</span>
                      </a>
                      <a href="#att" className={styles.dashNavItem}>
                        <span>📊</span>
                        <span>Attendance</span>
                      </a>
                      <a href="#sched" className={styles.dashNavItem}>
                        <span>📅</span>
                        <span>Timetable</span>
                      </a>
                      <a href="#apts" className={styles.dashNavItem}>
                        <span>👥</span>
                        <span>Teachers</span>
                      </a>
                    </aside>

                    {/* Main Content Area */}
                    <div className={styles.dashMainArea}>
                      <div className={styles.dashTopRow}>
                        <div className={styles.dashTitle}>Student Dashboard</div>
                        <div className={styles.dashAvatar}>BS</div>
                      </div>

                      {/* 4 Stat Cards */}
                      <div className={styles.miniStatGrid}>
                        <div className={styles.miniStatCard}>
                          <span className={styles.miniStatTitle}>Classes</span>
                          <span className={styles.miniStatVal}>4</span>
                        </div>
                        <div className={styles.miniStatCard}>
                          <span className={styles.miniStatTitle}>Attendance</span>
                          <span className={styles.miniStatVal} style={{ color: "#16a34a" }}>
                            92%
                          </span>
                        </div>
                        <div className={styles.miniStatCard}>
                          <span className={styles.miniStatTitle}>Assignments</span>
                          <span className={styles.miniStatVal} style={{ color: "#d97706" }}>
                            3
                          </span>
                        </div>
                        <div className={styles.miniStatCard}>
                          <span className={styles.miniStatTitle}>Appointments</span>
                          <span className={styles.miniStatVal} style={{ color: "#2563eb" }}>
                            2
                          </span>
                        </div>
                      </div>

                      {/* Today's Timetable List with Chevrons */}
                      <div className={styles.todayListSection}>
                        <div className={styles.todayListHeader}>Today&apos;s Timetable</div>
                        <div className={styles.todayListItem}>
                          <div className={styles.todayListInfo}>
                            <span className={styles.todayCourseName}>GICP-302 Ideology &amp; Constitution</span>
                            <span className={styles.todayCourseMeta}>Room No 22 · 08:30 – 10:00 AM · Mr. Ahmed Hussain</span>
                          </div>
                          <span className={styles.todayListChevron}>›</span>
                        </div>
                        <div className={styles.todayListItem}>
                          <div className={styles.todayListInfo}>
                            <span className={styles.todayCourseName}>IT26-321 Object Oriented Programming</span>
                            <span className={styles.todayCourseMeta}>Comp Lab II · 10:00 – 11:30 AM · Dr. Bilal Shaikh</span>
                          </div>
                          <span className={styles.todayListChevron}>›</span>
                        </div>
                        <div className={styles.todayListItem}>
                          <div className={styles.todayListInfo}>
                            <span className={styles.todayCourseName}>GQUR-322 Calculus &amp; Geometry</span>
                            <span className={styles.todayCourseMeta}>Lecture Hall @ Hitech · 11:30 – 12:15 PM · Engr. Noorulain</span>
                          </div>
                          <span className={styles.todayListChevron}>›</span>
                        </div>
                        <div className={styles.todayListItem}>
                          <div className={styles.todayListInfo}>
                            <span className={styles.todayCourseName}>IT26-326 Digital Logic Design</span>
                            <span className={styles.todayCourseMeta}>Room No 10 · 12:15 – 01:45 PM · Dr. Fauzia Talpur</span>
                          </div>
                          <span className={styles.todayListChevron}>›</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.macbookBase}>
              <div className={styles.macbookBaseNotch} />
            </div>
            <h2 className={styles.screenLabel}>Student Dashboard</h2>
            <p className={styles.screenDescription}>
              Key metrics, real-time attendance rate, and today&apos;s scheduled class routine.
            </p>
          </article>
        )}

        {/* ========================================================
            SCREEN 3: TIMETABLE VIEW
           ======================================================== */}
        {(activeScreen === "all" || activeScreen === "timetable") && (
          <article className={styles.screenCard}>
            <div className={styles.macbookShell}>
              <div className={styles.macbookCameraBar}>
                <div className={styles.cameraLens} />
              </div>
              <div className={styles.macbookScreen}>
                <div className={styles.browserChrome}>
                  <div className={styles.windowDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <div className={styles.browserAddress}>🔒 campus.edu/timetable</div>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>FET-2026</span>
                </div>
                <div className={styles.screenBody}>
                  <div className={styles.timetableScreen}>
                    <div className={styles.timetableHeaderRow}>
                      <div>
                        <div className={styles.ttTitle}>Timetable View</div>
                        <div style={{ fontSize: 8, color: "#64748b" }}>
                          FET Second Semester 2026 · BSIT P-I (Morning)
                        </div>
                      </div>
                      <span className={styles.ttBadge}>w.e.f 17-08-2026</span>
                    </div>

                    <div style={{ overflowX: "auto" }}>
                      <table className={styles.ttGridTable}>
                        <thead>
                          <tr>
                            <th className={styles.ttSlotTime}>Time</th>
                            <th>Monday</th>
                            <th>Tuesday</th>
                            <th>Wednesday</th>
                            <th>Thursday</th>
                            <th>Friday</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className={styles.ttSlotTime}>08:30 – 10:00</td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipBlue}`}>
                                GICP-302 Ideology
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Room 22 · Ahmed H.</div>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipPurple}`}>
                                IT26-326 DLD
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Room 10 · Dr. Fauzia</div>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipOrange}`}>
                                GENG-312 Writing
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Hitech · Asmat F.</div>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipPurple}`}>
                                IT26-327 DLD Lab
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Micro Lab · Fauzia</div>
                              </div>
                            </td>
                            <td>
                              <div style={{ color: "#94a3b8", fontSize: 8 }}>—</div>
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.ttSlotTime}>10:00 – 11:30</td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipGreen}`}>
                                IT26-321 OOP Lab
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Comp Lab II · Bilal S.</div>
                              </div>
                            </td>
                            <td>
                              <div style={{ color: "#94a3b8", fontSize: 8 }}>— Free Slot —</div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipBlue}`}>
                                GQUR-322 Calculus
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Hitech · Noorulain</div>
                              </div>
                            </td>
                            <td>
                              <div style={{ color: "#94a3b8", fontSize: 8 }}>—</div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipOrange}`}>
                                GENG-312 Writing
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Hitech · Asmat F.</div>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className={styles.ttSlotTime}>11:30 – 01:00</td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipOrange}`}>
                                GQUR-322 Calculus
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Hitech · Noorulain</div>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipGreen}`}>
                                GUHQ-303 Quran
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Hitech · Jamshed</div>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipGreen}`}>
                                IT26-321 OOP
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Comp Lab · Bilal S.</div>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipBlue}`}>
                                IT26-320 OOP Theory
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Room 22 · Bilal S.</div>
                              </div>
                            </td>
                            <td>
                              <div className={`${styles.ttCardChip} ${styles.chipPurple}`}>
                                GSOS-324 Mgmt
                                <div style={{ fontSize: 7, opacity: 0.8 }}>Hitech · Zulfiqar</div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.macbookBase}>
              <div className={styles.macbookBaseNotch} />
            </div>
            <h2 className={styles.screenLabel}>Timetable View</h2>
            <p className={styles.screenDescription}>
              Color-categorized weekly routine matrix with clash-free room &amp; faculty assignments.
            </p>
          </article>
        )}

        {/* ========================================================
            SCREEN 4: APPOINTMENT BOOKING
           ======================================================== */}
        {(activeScreen === "all" || activeScreen === "appointments") && (
          <article className={styles.screenCard}>
            <div className={styles.macbookShell}>
              <div className={styles.macbookCameraBar}>
                <div className={styles.cameraLens} />
              </div>
              <div className={styles.macbookScreen}>
                <div className={styles.browserChrome}>
                  <div className={styles.windowDots}>
                    <span className={styles.dotRed} />
                    <span className={styles.dotYellow} />
                    <span className={styles.dotGreen} />
                  </div>
                  <div className={styles.browserAddress}>🔒 campus.edu/appointments</div>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>Faculty</span>
                </div>
                <div className={styles.screenBody}>
                  <div className={styles.appointmentScreen}>
                    <div className={styles.dashTopRow}>
                      <div className={styles.aptTitle}>Teachers &amp; Office Hours</div>
                      <span style={{ fontSize: 9, color: "#64748b" }}>5 Faculty Online</span>
                    </div>

                    <table className={styles.teachersTable}>
                      <thead>
                        <tr>
                          <th>Teacher</th>
                          <th>Status</th>
                          <th>Time Slots</th>
                          <th style={{ textAlign: "right" }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: "Dr. Ahmad Khan", role: "HOD Computer Science", time: "10:00 AM – 01:30 PM", initial: "AK" },
                          { name: "Dr. Bilal Shaikh", role: "Associate Prof. IT", time: "11:30 AM – 02:00 PM", initial: "BS" },
                          { name: "Dr. Fauzia Talpur", role: "Assistant Prof. DLD", time: "09:30 AM – 12:00 PM", initial: "FT" },
                          { name: "Engr. Noorulain", role: "Lecturer Mathematics", time: "10:00 AM – 01:00 PM", initial: "NP" },
                          { name: "Dr. Zeeshan Bhatti", role: "Professor Software", time: "01:00 PM – 03:00 PM", initial: "ZB" },
                        ].map((teacher) => (
                          <tr key={teacher.name}>
                            <td>
                              <div className={styles.teacherProfileCell}>
                                <div className={styles.teacherAvatar}>{teacher.initial}</div>
                                <div>
                                  <strong style={{ fontSize: 9, color: "#0f172a", display: "block" }}>
                                    {teacher.name}
                                  </strong>
                                  <span style={{ fontSize: 8, color: "#64748b" }}>{teacher.role}</span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className={styles.statusAvailableBadge}>Available</span>
                            </td>
                            <td>
                              <span style={{ fontSize: 8, color: "#334155", fontWeight: 600 }}>
                                {teacher.time}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <button
                                type="button"
                                className={styles.bookAptBtn}
                                onClick={() => handleBook(teacher.name)}
                                style={{
                                  background: bookedStatus[teacher.name] ? "#16a34a" : "#2563eb",
                                }}
                              >
                                {bookedStatus[teacher.name] ? "✓ Booked" : "Book Appointment"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.macbookBase}>
              <div className={styles.macbookBaseNotch} />
            </div>
            <h2 className={styles.screenLabel}>Appointment Booking</h2>
            <p className={styles.screenDescription}>
              Instant faculty office hours scheduling with conflict-free slot reservation.
            </p>
          </article>
        )}
      </section>
    </main>
  );
}
