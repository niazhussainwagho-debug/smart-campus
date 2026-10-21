import Link from "next/link";
import { ResetPasswordForm } from "@/components/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

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
            Security Credential
          </span>
        </div>
        <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
          Set New Password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Password must be between 12 and 72 characters long.
        </p>
        <div className="mt-8">
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300" role="alert">
              Reset token is missing or invalid. Please request a new link from the sign-in page.
            </p>
          )}
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
