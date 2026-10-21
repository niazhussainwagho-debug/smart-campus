import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen max-w-full items-center justify-center overflow-x-clip bg-[#0B0F19] px-3 py-8 text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200 sm:px-5 sm:py-12">
      <div className="bg-dot-grid pointer-events-none fixed inset-0 opacity-40" />
      <div
        className="pointer-events-none fixed -top-24 left-1/3 h-96 w-96 rounded-full blur-[140px]"
        style={{ background: "rgba(6, 182, 212, 0.12)" }}
      />
      <section className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#111827]/90 p-5 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl sm:rounded-3xl sm:p-8 lg:p-10">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold tracking-wider text-white">
            CAMPUS<span className="text-cyan-400">.OS</span>
          </span>
          <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
            Account Recovery
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Forgot Password?
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Enter your registered email address. If an account exists, a secure password reset link will be sent to your inbox.
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
        <p className="mt-6 text-center text-sm">
          <Link
            className="font-semibold text-cyan-400 transition hover:text-cyan-300"
            href="/login"
          >
            ← Back to Sign In
          </Link>
        </p>
      </section>
    </main>
  );
}
