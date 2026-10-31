import type { Metadata } from "next";
import Link from "next/link";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "CAMPUS.OS — Smart University Portal | University of Sindh",
  description:
    "Next-generation smart campus management system for University of Sindh. Conflict-free timetables, faculty appointments, real-time room tracking, and more.",
};

const features = [
  {
    icon: "🗓️",
    title: "Conflict-Free Timetables",
    desc: "AI-powered scheduling that automatically detects and resolves teacher, room and section clashes in real-time.",
    color: "cyan",
  },
  {
    icon: "📅",
    title: "Faculty Appointments",
    desc: "Students book office hours directly with professors. Instant confirmations, reminders and rescheduling.",
    color: "emerald",
  },
  {
    icon: "🏛️",
    title: "Room Management",
    desc: "Live occupancy tracking across every lecture hall, lab and seminar room on campus.",
    color: "violet",
  },
  {
    icon: "🎓",
    title: "Student Portal",
    desc: "Personal timetable, attendance records, course registration and academic progress — all in one place.",
    color: "amber",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    desc: "Department heads get real-time enrollment stats, attendance trends and resource utilization insights.",
    color: "rose",
  },
  {
    icon: "🔔",
    title: "Smart Notifications",
    desc: "Automated alerts for schedule changes, new appointments, announcements and exam results.",
    color: "blue",
  },
];

const stats = [
  { value: "2,400+", label: "Active Students", icon: "👨‍🎓" },
  { value: "120+", label: "Faculty Members", icon: "👩‍🏫" },
  { value: "98%", label: "Room Utilization", icon: "🏛️" },
  { value: "0", label: "Schedule Conflicts", icon: "✅" },
];

const roles = [
  {
    role: "Students",
    icon: "🎓",
    color: "cyan",
    perks: [
      "View personal timetable",
      "Book faculty appointments",
      "Track attendance",
      "Get instant notifications",
    ],
  },
  {
    role: "Teachers",
    icon: "📋",
    color: "emerald",
    perks: [
      "Manage availability slots",
      "View class schedule",
      "Approve/reject meetings",
      "Publish announcements",
    ],
  },
  {
    role: "Administrators",
    icon: "🛡️",
    color: "violet",
    perks: [
      "Build conflict-free timetables",
      "Manage rooms & departments",
      "Full campus analytics",
      "Control user access",
    ],
  },
];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* ── Animated Background ── */}
      <div className={styles.bgCanvas} aria-hidden="true">
        <div className={styles.bgOrb1} />
        <div className={styles.bgOrb2} />
        <div className={styles.bgOrb3} />
        <div className={styles.bgGrid} />
      </div>

      {/* ── Navigation ── */}
      <nav className={styles.nav} role="navigation" aria-label="Main navigation">
        <div className={styles.navInner}>
          <Link href="/landing" className={styles.logo} aria-label="CAMPUS.OS home">
            <span className={styles.logoMark}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <div>
              <span className={styles.logoText}>CAMPUS<span className={styles.logoAccent}>.OS</span></span>
              <span className={styles.logoSub}>University of Sindh</span>
            </div>
          </Link>

          <ul className={styles.navLinks} role="list">
            <li><a href="#features" className={styles.navLink}>Features</a></li>
            <li><a href="#stats" className={styles.navLink}>About</a></li>
            <li><a href="#roles" className={styles.navLink}>Portals</a></li>
            <li><Link href="/demo" className={styles.navLink}>Live Demo</Link></li>
          </ul>

          <div className={styles.navActions}>
            <Link href="/login" className={styles.navSignIn} id="nav-signin-btn">Sign In</Link>
            <Link href="/demo" className={styles.navDemo} id="nav-demo-btn">
              View Demo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <header className={styles.hero} id="hero">
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} aria-hidden="true" />
            Next-Gen University Intelligence Platform
          </div>

          <h1 className={styles.heroTitle}>
            Smarter Campus.<br />
            <span className={styles.heroGradient}>Zero Conflicts.</span>
          </h1>

          <p className={styles.heroDesc}>
            CAMPUS.OS automates conflict-free academic timetables, streamlines faculty
            appointments, and gives every student, teacher and administrator a
            personalized intelligent portal.
          </p>

          <div className={styles.heroCtas}>
            <Link href="/login" className={styles.ctaPrimary} id="hero-get-started-btn">
              <span aria-hidden="true">🚀</span> Get Started Free
            </Link>
            <Link href="/demo" className={styles.ctaSecondary} id="hero-demo-btn">
              <span aria-hidden="true">▶</span> Watch Demo
            </Link>
          </div>

          <div className={styles.trustRow}>
            <span className={styles.trustBadge}>✓ University of Sindh</span>
            <span className={styles.trustBadge}>✓ 2,400+ Students</span>
            <span className={styles.trustBadge}>✓ Real-time Sync</span>
          </div>
        </div>

        {/* Hero Dashboard Mockup */}
        <div className={styles.heroDashboard} aria-label="Dashboard preview" role="img">
          <div className={styles.dashHeader}>
            <div className={styles.dashDots}>
              <span className={styles.dot} style={{ background: "#f87171" }} />
              <span className={styles.dot} style={{ background: "#fbbf24" }} />
              <span className={styles.dot} style={{ background: "#34d399" }} />
            </div>
            <span className={styles.dashTitle}>CAMPUS.OS · Dashboard</span>
            <span className={styles.dashLiveBadge}>● LIVE</span>
          </div>
          <div className={styles.dashBody}>
            <div className={styles.mockStats}>
              {[
                { label: "Students", val: "2,400", color: "#22d3ee" },
                { label: "Classes Today", val: "42", color: "#a78bfa" },
                { label: "Faculty Online", val: "19", color: "#34d399" },
                { label: "Conflicts", val: "0", color: "#fb923c" },
              ].map((s) => (
                <div className={styles.mockStat} key={s.label}>
                  <strong style={{ color: s.color }}>{s.val}</strong>
                  <small>{s.label}</small>
                </div>
              ))}
            </div>

            <div className={styles.mockGrid}>
              <div className={styles.mockGridLabel}>Timetable · Fall 2026</div>
              <div className={styles.mockCells}>
                {["MON", "TUE", "WED", "THU", "FRI"].map((day, di) => (
                  <div className={styles.mockCol} key={day}>
                    <div className={styles.mockDay}>{day}</div>
                    {[0, 1, 2, 3].map((slot) => {
                      const filled = (di + slot) % 3 !== 0;
                      const colors = ["#22d3ee33", "#a78bfa33", "#34d39933", "#fb923c33"];
                      return (
                        <div
                          key={slot}
                          className={styles.mockCell}
                          style={filled ? { background: colors[(di + slot) % 4], borderColor: colors[(di + slot) % 4].replace("33", "88") } : {}}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.mockActivity}>
              {[
                { label: "Class started · Data Structures · Room 204", dot: "#22d3ee" },
                { label: "Appointment request by Ayesha Malik", dot: "#a78bfa" },
                { label: "Timetable published · CS Dept.", dot: "#34d399" },
              ].map((a) => (
                <div className={styles.mockActivityRow} key={a.label}>
                  <span className={styles.mockDot} style={{ background: a.dot }} />
                  <span>{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats Strip ── */}
      <section className={styles.statsStrip} id="stats" aria-label="Campus statistics">
        <div className={styles.statsInner}>
          {stats.map((s) => (
            <div className={styles.statItem} key={s.label}>
              <span className={styles.statEmoji} aria-hidden="true">{s.icon}</span>
              <strong className={styles.statValue}>{s.value}</strong>
              <span className={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className={styles.features} id="features" aria-labelledby="features-heading">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Everything you need</div>
            <h2 id="features-heading" className={styles.sectionTitle}>
              Built for the modern university
            </h2>
            <p className={styles.sectionDesc}>
              One platform that connects students, teachers and administrators with
              intelligent automation and real-time data.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((f) => (
              <article className={`${styles.featureCard} ${styles[`feat_${f.color}`]}`} key={f.title}>
                <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles Section ── */}
      <section className={styles.roles} id="roles" aria-labelledby="roles-heading">
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Role-Based Access</div>
            <h2 id="roles-heading" className={styles.sectionTitle}>
              A portal for everyone
            </h2>
            <p className={styles.sectionDesc}>
              Whether you are a student, professor or campus administrator — CAMPUS.OS
              gives you exactly what you need.
            </p>
          </div>

          <div className={styles.rolesGrid}>
            {roles.map((r) => (
              <article className={`${styles.roleCard} ${styles[`role_${r.color}`]}`} key={r.role}>
                <div className={styles.roleIconWrap}>
                  <span className={styles.roleIcon} aria-hidden="true">{r.icon}</span>
                </div>
                <h3 className={styles.roleTitle}>{r.role}</h3>
                <ul className={styles.rolePerks} role="list">
                  {r.perks.map((perk) => (
                    <li key={perk} className={styles.rolePerk}>
                      <span className={styles.rolePerkCheck} aria-hidden="true">✓</span>
                      {perk}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className={styles.roleBtn}
                  id={`role-${r.role.toLowerCase()}-btn`}
                >
                  Access {r.role} Portal →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className={styles.ctaBanner} aria-labelledby="cta-heading">
        <div className={styles.ctaBannerInner}>
          <div className={styles.ctaGlow} aria-hidden="true" />
          <h2 id="cta-heading" className={styles.ctaTitle}>
            Ready to transform your campus?
          </h2>
          <p className={styles.ctaDesc}>
            Join thousands of students and faculty already using CAMPUS.OS at
            University of Sindh.
          </p>
          <div className={styles.ctaBtns}>
            <Link href="/login" className={styles.ctaPrimary} id="cta-signin-btn">
              Sign In to Your Portal
            </Link>
            <Link href="/demo" className={styles.ctaSecondary} id="cta-explore-btn">
              Explore Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer} role="contentinfo">
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogoText}>CAMPUS<span>.OS</span></span>
            <p>Smart Campus Management · University of Sindh · ITSC</p>
          </div>
          <div className={styles.footerLinks}>
            <Link href="/login">Sign In</Link>
            <Link href="/demo">Demo</Link>
            <a href="mailto:admin@usindh.edu.pk">Contact</a>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 CAMPUS.OS · University of Sindh · All rights reserved
        </div>
      </footer>
    </div>
  );
}
