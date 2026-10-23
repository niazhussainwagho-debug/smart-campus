"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { toPng } from "html-to-image";
import type { UserRole } from "@/generated/prisma/enums";
import { useDashboardUserImage } from "@/components/dashboard-shell";
import {
  updateProfileAction,
  type ProfileActionResult,
} from "@/app/profile/actions";

type ProfileData = {
  name: string;
  email: string;
  role: UserRole;
  department: string;
  semester: number | null;
  phone: string;
  bloodGroup: string;
  emergencyContact: string;
  linkedinUrl: string;
  githubUrl: string;
  image: string | null;
};

type ProfileTarget = {
  department: string;
  semester: number;
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2.5 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 sm:text-sm";

const barcodeBars = [
  2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2, 1,
  1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 2,
];

export function ProfileManager({
  profile,
  targets,
}: {
  profile: ProfileData;
  targets: ProfileTarget[];
}) {
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<ProfileActionResult | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.image);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [isExportingId, setIsExportingId] = useState(false);
  const [idCardError, setIdCardError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const idCardRef = useRef<HTMLElement>(null);
  const { setImage } = useDashboardUserImage();
  const [name, setName] = useState(profile.name);
  const [department, setDepartment] = useState(profile.department);
  const [semester, setSemester] = useState(
    profile.semester === null ? "" : String(profile.semester),
  );
  const departments = [...new Set(targets.map((target) => target.department))];
  const semesters = [
    ...new Set(
      targets
        .filter((target) => target.department === department)
        .map((target) => target.semester),
    ),
  ].sort((first, second) => first - second);

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith("blob:")) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  function onAvatarChange(file: File | undefined) {
    if (!file) {
      setAvatarPreview(profile.image);
      setRemoveAvatar(false);
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setRemoveAvatar(false);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("removeAvatar", String(removeAvatar));
    startTransition(async () => {
      const result = await updateProfileAction(data);
      setNotice(result);
      if (result.ok) {
        const updatedImage = result.image ?? null;
        setImage(updatedImage);
        setAvatarPreview(updatedImage);
        setRemoveAvatar(false);
        if (avatarInput.current) avatarInput.current.value = "";
        const passwordInput = form.elements.namedItem("password");
        if (passwordInput instanceof HTMLInputElement) passwordInput.value = "";
      }
    });
  }

  async function downloadIdCard() {
    const card = idCardRef.current;
    if (!card) {
      setIdCardError("The campus ID card is not available to download.");
      return;
    }

    setIsExportingId(true);
    setIdCardError(null);
    try {
      await document.fonts.ready;
      const dataUrl = await toPng(card, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: getComputedStyle(card).backgroundColor,
      });
      const anchor = document.createElement("a");
      anchor.download = "campus-id-card.png";
      anchor.href = dataUrl;
      anchor.click();
    } catch (error) {
      console.error("Unable to render the campus ID card.", error);
      setIdCardError(
        "Unable to render the ID card image. Please try again or use Print ID.",
      );
    } finally {
      setIsExportingId(false);
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-[#111827]/90 p-4 shadow-xl sm:p-6">
      <form className="grid min-w-0 gap-5 sm:grid-cols-2" onSubmit={submit}>
        <aside
          ref={idCardRef}
          aria-label="Digital campus ID card preview"
          className="campusIdCardPrint relative isolate overflow-hidden rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-slate-900 via-[#102b3a] to-cyan-950/80 p-5 shadow-lg shadow-cyan-950/30 transition-colors hover:border-cyan-400/40 sm:col-span-2"
        >
          <div className="absolute -right-12 -top-16 -z-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                CAMPUS.OS
              </p>
              <h2 className="mt-1 text-sm font-semibold text-white">
                Digital Campus ID
              </h2>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
              Active
            </span>
          </div>
          <div className="mt-5 flex min-w-0 items-center gap-4">
            {avatarPreview ? (
              // Uploaded images are validated as raster images before persistence.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="h-16 w-16 shrink-0 rounded-xl border border-cyan-300/30 object-cover shadow-md"
                src={avatarPreview}
              />
            ) : (
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-400/10 text-xl font-bold text-cyan-200">
                {name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-bold text-white">
                {name || "Full Name"}
              </p>
              <p className="mt-1 text-xs font-medium text-cyan-100/70">
                {profile.role === "STUDENT" ? "STUDENT" : "FACULTY"}
              </p>
              <p className="mt-2 truncate text-xs text-slate-300">
                {department || "Department not selected"}
                {profile.role === "STUDENT" && semester
                  ? ` · Semester ${semester}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/10 pt-3">
            <span className="text-[9px] uppercase tracking-[0.18em] text-slate-400">
              Smart Campus Identity
            </span>
            <svg
              aria-label="Simulated campus identification barcode"
              className="h-8 w-28 rounded bg-white p-1"
              role="img"
              viewBox={`0 0 ${barcodeBars.reduce((sum, width) => sum + width + 1, 0)} 24`}
            >
              {barcodeBars.map((width, index) => (
                <rect
                  fill="#102431"
                  height={index % 5 === 0 ? 24 : 20}
                  key={index}
                  width={width}
                  x={barcodeBars
                    .slice(0, index)
                    .reduce((sum, previousWidth) => sum + previousWidth + 1, 0)}
                  y={index % 5 === 0 ? 0 : 2}
                />
              ))}
            </svg>
          </div>
        </aside>
        <div className="campusIdCardActions flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 disabled:cursor-wait disabled:opacity-60"
            disabled={isExportingId}
            onClick={downloadIdCard}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
              <path d="M5 17v3h14v-3" />
            </svg>
            {isExportingId ? "Preparing image…" : "Download ID Card"}
          </button>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border bg-muted px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
            onClick={() => window.print()}
            type="button"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M6 9V3h12v6" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <path d="M6 14h12v7H6z" />
              <path d="M18 12h.01" />
            </svg>
            Print ID
          </button>
          {idCardError ? (
            <p className="basis-full text-sm text-rose-600 dark:text-rose-300" role="alert">
              {idCardError}
            </p>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-5 sm:col-span-2 sm:flex-row">
          {avatarPreview ? (
            // Uploaded images are validated as raster images before persistence.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt="Profile avatar preview"
              className="h-20 w-20 rounded-full border border-cyan-500/30 object-cover"
              src={avatarPreview}
            />
          ) : (
            <span className="grid h-20 w-20 place-items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 text-2xl font-bold text-cyan-300">
              {name
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="font-semibold text-white">Profile picture</p>
            <p className="mt-1 text-xs text-slate-400">
              PNG, JPEG, or WebP · maximum 2 MB
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
              <label className="cursor-pointer rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-cyan-500/40">
                Upload image
                <input
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  name="avatar"
                  onChange={(event) => onAvatarChange(event.target.files?.[0])}
                  ref={avatarInput}
                  type="file"
                />
              </label>
              {avatarPreview && (
                <button
                  className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-300"
                  onClick={() => {
                    setAvatarPreview(null);
                    setRemoveAvatar(true);
                    if (avatarInput.current) avatarInput.current.value = "";
                  }}
                  type="button"
                >
                  Remove image
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:col-span-2 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-white sm:col-span-2">
            Personal details
          </h2>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Full name
            <input
              autoComplete="name"
              className={inputClass}
              maxLength={120}
              name="name"
              onChange={(event) => setName(event.target.value)}
              required
              value={name}
            />
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Email
            <input
              className={`${inputClass} opacity-70`}
              readOnly
              value={profile.email}
            />
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Phone number
            <input
              autoComplete="tel"
              className={inputClass}
              maxLength={32}
              name="phone"
              placeholder="+1 555 123 4567"
              type="tel"
              defaultValue={profile.phone}
            />
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Blood group
            <select
              className={inputClass}
              defaultValue={profile.bloodGroup}
              name="bloodGroup"
            >
              <option value="">Select blood group</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(
                (bloodGroup) => (
                  <option key={bloodGroup} value={bloodGroup}>
                    {bloodGroup}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Emergency contact number
            <input
              autoComplete="tel"
              className={inputClass}
              maxLength={32}
              name="emergencyContact"
              placeholder="+1 555 987 6543"
              type="tel"
              defaultValue={profile.emergencyContact}
            />
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Department
            <select
              className={inputClass}
              onChange={(event) => {
                setDepartment(event.target.value);
                setSemester("");
              }}
              name="department"
              required
              value={department}
            >
              <option value="">Select department</option>
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department}
                </option>
              ))}
            </select>
          </label>
          {profile.role === "STUDENT" ? (
            <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Semester
              <select
                className={inputClass}
                onChange={(event) => setSemester(event.target.value)}
                name="semester"
                required
                value={semester}
              >
                <option value="">Select semester</option>
                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="self-center text-sm text-slate-400">
              Teacher profiles do not have a semester.
            </p>
          )}
        </div>
        <div className="grid min-w-0 gap-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4 sm:col-span-2 sm:grid-cols-2">
          <h2 className="text-sm font-semibold text-white sm:col-span-2">
            Social links
          </h2>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            LinkedIn profile URL
            <input
              autoComplete="url"
              className={inputClass}
              maxLength={2048}
              name="linkedinUrl"
              placeholder="https://www.linkedin.com/in/your-profile"
              type="url"
              defaultValue={profile.linkedinUrl}
            />
          </label>
          <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
            GitHub profile URL
            <input
              autoComplete="url"
              className={inputClass}
              maxLength={2048}
              name="githubUrl"
              placeholder="https://github.com/username"
              type="url"
              defaultValue={profile.githubUrl}
            />
          </label>
        </div>
        <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400 sm:col-span-2">
          New password (leave blank to keep current)
          <input
            autoComplete="new-password"
            className={inputClass}
            maxLength={72}
            minLength={12}
            name="password"
            type="password"
          />
        </label>
        {notice && (
          <p
            aria-live="polite"
            className={`rounded-xl border p-3 text-sm sm:col-span-2 ${
              notice.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            }`}
            role={notice.ok ? "status" : "alert"}
          >
            {notice.message}
          </p>
        )}
        <button
          className="min-h-11 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-500 px-5 py-2.5 text-sm font-bold text-slate-950 disabled:opacity-60 sm:col-span-2"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </section>
  );
}
