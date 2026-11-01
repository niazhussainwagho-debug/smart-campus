import Link from "next/link";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata = {
  title: "Forgot Password · Smart Campus",
  description: "Reset your Smart Campus account password.",
};

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#f8fafc] px-4 py-12 text-slate-800 antialiased selection:bg-blue-500/20 selection:text-blue-600 sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9">
          {/* Logo Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563eb] text-2xl text-white shadow-md shadow-blue-500/20">
              🎓
            </div>
            <h1 className="mt-3.5 text-2xl font-black tracking-tight text-slate-900">
              Forgot Password
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Enter your registered email address to receive a secure password reset link.
            </p>
          </div>

          <ForgotPasswordForm />

          <p className="mt-6 text-center text-xs font-semibold">
            <Link
              className="text-[#2563eb] transition hover:text-blue-700 hover:underline"
              href="/login"
            >
              ← Back to Login
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          © 2026 Smart Campus Management System
        </p>
      </div>
    </main>
  );
}
