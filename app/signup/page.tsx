import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { SignupForm } from "@/components/signup-form";
import { getDashboardPath } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Create Account · Smart Campus",
  description: "Create a student, teacher, or Admin account for Smart Campus.",
};

export default async function SignupPage() {
  const session = await auth();
  if (session?.user) {
    if (session.user.status === "PENDING_VERIFICATION") {
      redirect("/verification");
    }
    redirect(getDashboardPath(session.user.role));
  }

  const sections = await prisma.section.findMany({
    select: { department: true },
    distinct: ["department"],
    orderBy: { department: "asc" },
  });

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] px-4 py-12 text-slate-800 antialiased selection:bg-blue-500/20 selection:text-blue-600 sm:px-6">
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
          {/* Logo Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb] text-2xl text-white shadow-md shadow-blue-500/20">
              🎓
            </div>
            <h1 className="mt-3.5 text-2xl font-black tracking-tight text-slate-900">
              Create an Account
            </h1>
            <p className="mt-1 text-xs text-slate-500 max-w-sm">
              Register as Student or Teacher for Smart Campus portal access.
            </p>
          </div>

          <SignupForm targets={sections} />

          <p className="mt-6 text-center text-xs text-slate-500">
            Already registered?{" "}
            <Link
              className="font-bold text-[#2563eb] hover:text-blue-700 hover:underline"
              href="/login"
            >
              Sign in to Portal
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Smart Campus Management System · All rights reserved.
        </p>
      </div>
    </main>
  );
}
