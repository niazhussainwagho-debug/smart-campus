"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
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
  image: string | null;
};

type ProfileTarget = {
  department: string;
  semester: number;
};

const inputClass =
  "mt-1.5 min-h-11 w-full rounded-xl border border-slate-700/80 bg-slate-900/80 px-3.5 py-2.5 text-base text-white outline-none transition focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 sm:text-sm";

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
  const avatarInput = useRef<HTMLInputElement>(null);
  const { setImage } = useDashboardUserImage();
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

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-[#111827]/90 p-4 shadow-xl sm:p-6">
      <form className="grid min-w-0 gap-5 sm:grid-cols-2" onSubmit={submit}>
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
              {profile.name
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

        <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Full name
          <input
            autoComplete="name"
            className={inputClass}
            defaultValue={profile.name}
            maxLength={120}
            name="name"
            required
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
