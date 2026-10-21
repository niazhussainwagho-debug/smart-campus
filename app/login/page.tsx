import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/roles";

export const metadata = {
  title: "Sign In · CAMPUS.OS",
  description: "Sign in to CAMPUS.OS next-gen university portal.",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    redirect(getDashboardPath(session.user.role));
  }

  return (
    <main className="relative flex min-h-screen max-w-full overflow-x-clip bg-[#0B0F19] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* ── Background Cyber Glow Blobs ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 opacity-40" />
        <div
          className="absolute -top-32 left-1/4 h-[min(32rem,85vw)] w-[min(32rem,85vw)] rounded-full blur-[150px]"
          style={{ background: "rgba(6, 182, 212, 0.14)" }}
        />
        <div
          className="absolute -bottom-20 right-10 h-[min(28rem,75vw)] w-[min(28rem,75vw)] rounded-full blur-[140px]"
          style={{ background: "rgba(16, 185, 129, 0.1)" }}
        />
        <div
          className="absolute top-1/2 left-1/3 h-[min(20rem,65vw)] w-[min(20rem,65vw)] -translate-y-1/2 rounded-full blur-[160px]"
          style={{ background: "rgba(99, 102, 241, 0.08)" }}
        />
      </div>

      {/* ── LEFT SHOWCASE PANEL (Desktop) ── */}
      <section className="relative hidden w-[52%] flex-col justify-between border-r border-slate-800/80 p-12 lg:flex xl:p-16">
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 shadow-lg shadow-cyan-500/25">
            <svg
              className="h-6 w-6 text-slate-950"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0B0F19] bg-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white">
                CAMPUS<span className="text-cyan-400">.OS</span>
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                v2.6
              </span>
            </div>
            <p className="text-xs text-slate-400">Academic Operating System</p>
          </div>
        </div>

        {/* Center Hero */}
        <div className="relative z-10 my-auto py-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-300 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Next-Gen University Intelligence
          </div>

          <h1 className="mt-6 text-5xl font-black leading-tight tracking-tight text-white xl:text-6xl">
            Smarter schedule.<br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Zero conflict.
            </span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-400">
            Automated conflict-free academic timetables, seamless faculty appointments,
            and real-time room capacity tracking in a unified workspace.
          </p>

          {/* Feature Bullets */}
          <div className="mt-8 grid max-w-lg gap-3">
            {[
              "Real-time teacher, room & section clash detection",
              "Instant faculty office hours booking & rescheduling",
              "Role-based control for Students, Teachers & Administrators",
            ].map((feat) => (
              <div
                className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-900/40 px-4 py-2.5 text-xs font-medium text-slate-300"
                key={feat}
              >
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* System Stats Footer */}
        <div className="relative z-10 grid grid-cols-3 gap-3 border-t border-slate-800/80 pt-8">
          <div>
            <p className="text-2xl font-black text-white">98%</p>
            <p className="text-xs text-slate-400">Room Utilization</p>
          </div>
          <div>
            <p className="text-2xl font-black text-cyan-400">2,400+</p>
            <p className="text-xs text-slate-400">Active Students</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400">120</p>
            <p className="text-xs text-slate-400">Faculty Online</p>
          </div>
        </div>
      </section>

      {/* ── RIGHT FORM PANEL ── */}
      <section className="relative z-10 flex min-w-0 flex-1 items-center justify-center p-4 py-8 sm:p-8 lg:p-12 xl:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo Header */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-teal-500 to-blue-600 shadow-md">
              <svg className="h-6 w-6 text-slate-950" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <div>
              <span className="text-base font-extrabold tracking-wider text-white">
                CAMPUS<span className="text-cyan-400">.OS</span>
              </span>
              <p className="text-xs text-slate-400">Next-Gen University System</p>
            </div>
          </div>

          {/* Form Glass Card */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:rounded-3xl sm:p-8 lg:p-10">
            {/* Top decorative cyan line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

            <div className="mb-6 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                University SSO
              </span>
              <span className="text-xs text-slate-500">Live Secure Access</span>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                Sign In
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Enter your credentials to access your CAMPUS.OS portal
              </p>
            </div>

            <LoginForm />

            {/* Role Pills */}
            <div className="mt-8 border-t border-slate-800/80 pt-6">
              <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                Supported Roles
              </p>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {[
                  { role: "Student", icon: "🎓" },
                  { role: "Teacher", icon: "📋" },
                  { role: "Admin", icon: "🛡️" },
                ].map(({ role, icon }) => (
                  <div
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-800/80 bg-slate-900/60 py-2 text-center text-xs font-medium text-slate-300"
                    key={role}
                  >
                    <span>{icon}</span>
                    <span>{role}</span>
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              Need access?{" "}
              <span className="font-semibold text-slate-300">
                Contact your campus administrator
              </span>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
