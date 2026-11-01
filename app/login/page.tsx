import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { auth } from "@/auth";
import { getDashboardPath } from "@/lib/roles";

export const metadata = {
  title: "Login · Smart Campus",
  description: "Sign in to Smart Campus University Portal.",
};

export default async function LoginPage() {
  const session = await auth();

  if (session?.user) {
    if (session.user.status === "PENDING_VERIFICATION") {
      redirect("/verification");
    }
    redirect(getDashboardPath(session.user.role));
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] px-4 py-12 text-slate-800 antialiased selection:bg-blue-500/20 selection:text-blue-600 sm:px-6 lg:px-8">
      <div className="w-full max-w-[420px]">
        {/* Design 5 Centered Login Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
          {/* Logo Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb] text-2xl text-white shadow-md shadow-blue-500/20">
              🎓
            </div>
            <h1 className="mt-3.5 text-2xl font-black tracking-tight text-slate-900">
              Smart Campus
            </h1>
            <p className="mt-0.5 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              University Portal
            </p>
          </div>

          <LoginForm />

          {/* Supported Roles */}
          <div className="mt-8 border-t border-slate-100 pt-5">
            <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Supported Portals
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              {[
                { role: "Student", icon: "🎓" },
                { role: "Teacher", icon: "👨‍🏫" },
                { role: "Admin", icon: "🛡️" },
              ].map(({ role, icon }) => (
                <div
                  key={role}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1.5 text-xs font-medium text-slate-600"
                >
                  <span>{icon}</span>
                  <span>{role}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Smart Campus Management System · All rights reserved.
        </p>
      </div>
    </main>
  );
}
