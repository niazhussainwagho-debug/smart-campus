import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { SignupForm } from "@/components/signup-form";
import { getDashboardPath } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Create Account · CAMPUS.OS",
  description: "Create a student, teacher, or Admin account for verification.",
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
    <main className="relative flex min-h-screen max-w-full items-center justify-center overflow-x-clip bg-[#0B0F19] px-4 py-8 text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="bg-dot-grid absolute inset-0 opacity-40" />
        <div
          className="absolute -top-32 left-1/4 h-[min(32rem,85vw)] w-[min(32rem,85vw)] rounded-full blur-[150px]"
          style={{ background: "rgba(6, 182, 212, 0.14)" }}
        />
      </div>
      <section className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/95 p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-8">
        <div className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <Link
          className="text-sm font-black tracking-wider text-white"
          href="/login"
        >
          CAMPUS<span className="text-cyan-400">.OS</span>
        </Link>
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Create your account
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Submit your official documents during registration. An administrator must verify your account before dashboard access.
        </p>
        <SignupForm targets={sections} />
        <p className="mt-6 text-center text-sm text-slate-400">
          Already registered?{" "}
          <Link
            className="font-semibold text-cyan-400 hover:text-cyan-300"
            href="/login"
          >
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
