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
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  semester: number | null;
  rollNo: string;
  fatherName: string;
  surname: string;
  category: string;
  academicYear: string;
  validUpto: string;
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

function createBarcodeBars(value: string): number[] {
  const chars = Array.from(value || "CAMPUS");
  return Array.from({ length: 36 }, (_, index) => {
    const charCode = chars[index % chars.length].charCodeAt(0);
    return 1 + ((charCode + index * 7) % 3);
  });
}

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
  const [surname, setSurname] = useState(profile.surname);
  const [fatherName, setFatherName] = useState(profile.fatherName);
  const [rollNo, setRollNo] = useState(profile.rollNo);
  const [category, setCategory] = useState(profile.category);
  const [academicYear, setAcademicYear] = useState(profile.academicYear);
  const [validUpto, setValidUpto] = useState(profile.validUpto);
  const [bloodGroup, setBloodGroup] = useState(profile.bloodGroup);
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
  const barcodeBars = createBarcodeBars(`${profile.id}${rollNo}`);
  const studentName =
    surname && !name.trim().toLowerCase().endsWith(surname.toLowerCase())
      ? `${name} ${surname}`
      : name;

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
      await Promise.all(
        Array.from(card.querySelectorAll("img"), (image) => image.decode()),
      );
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
          aria-label="University of Sindh student identity card preview"
          className="campusIdCardPrint relative isolate overflow-hidden rounded-xl border border-slate-300 bg-white p-4 text-slate-900 shadow-lg sm:col-span-2 sm:p-5"
        >
          <div className="flex min-w-0 items-center gap-3 border-b-2 border-amber-500 pb-3">
            {/* The logo is a local asset so it also renders in PNG and print exports. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="University of Sindh emblem"
              className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16"
              src="/images/university-sindh-logo.png"
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black leading-tight tracking-wide text-[#12365a] sm:text-lg">
                UNIVERSITY OF SINDH
              </h2>
              <p className="mt-1 text-[8px] font-semibold leading-tight text-slate-700 sm:text-[10px]">
                JAMSHORO, SINDH, PAKISTAN • ALLAMA I.I. KAZI CAMPUS
              </p>
            </div>
            <p className="max-w-20 text-right text-[9px] font-extrabold uppercase leading-tight tracking-wide text-[#12365a] sm:max-w-32 sm:text-xs">
              Student Identity Card
            </p>
          </div>
          <div className="mt-4 flex min-w-0 items-start gap-4">
            {avatarPreview ? (
              // Uploaded images are validated as raster images before persistence.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Photo of ${studentName || "student"}`}
                className="h-24 w-20 shrink-0 rounded border border-slate-300 object-cover shadow-sm sm:h-28 sm:w-24"
                src={avatarPreview}
              />
            ) : (
              <span className="grid h-24 w-20 shrink-0 place-items-center rounded border border-slate-300 bg-slate-100 text-xl font-bold text-[#12365a] sm:h-28 sm:w-24">
                {name
                  .split(/\s+/)
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase() || "U"}
              </span>
            )}
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-3 gap-y-2 text-[10px] sm:gap-x-5 sm:text-xs">
              <div className="col-span-2 min-w-0 border-b border-slate-200 pb-1">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Student Name
                </p>
                <p className="truncate text-sm font-extrabold uppercase text-[#12365a] sm:text-base">
                  {studentName || "Full Name"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Father&apos;s Name
                </p>
                <p className="truncate font-semibold text-slate-900">
                  {fatherName || "Not provided"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Surname
                </p>
                <p className="truncate font-semibold text-slate-900">
                  {surname || "Not provided"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Roll No
                </p>
                <p className="truncate font-semibold text-slate-900">
                  {rollNo || "Not provided"}
                </p>
                <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Valid Upto : {validUpto || "Not provided"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Blood Group
                </p>
                <p className="truncate font-semibold text-slate-900">
                  {bloodGroup || "Not provided"}
                </p>
              </div>
              <div className="col-span-2 min-w-0">
                <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">
                  Department
                </p>
                <p className="truncate font-semibold text-slate-900">
                  {department || "Not provided"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3 rounded-b-md bg-[#12365a] px-3 py-2 text-white">
            <div className="min-w-0">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-amber-300">
                Academic Year
              </p>
              <p className="truncate text-xs font-extrabold uppercase tracking-wide sm:text-sm">
                {academicYear || "Not provided"}
              </p>
            </div>
            <div className="shrink-0 border-l border-white/30 pl-3 text-right">
              <p className="text-[8px] font-bold uppercase tracking-wider text-white/70">
                Category: {category || "Not provided"}
              </p>
              <svg
                aria-label="Simulated campus identification barcode"
                className="mt-1 h-6 w-24 rounded bg-white p-1"
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
            Personal and academic details
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
          {profile.role === "STUDENT" ? (
            <>
              <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Roll number
                <input
                  autoComplete="off"
                  className={inputClass}
                  maxLength={64}
                  name="rollNo"
                  onChange={(event) => setRollNo(event.target.value)}
                  placeholder="2K24/SWE/124"
                  value={rollNo}
                />
              </label>
              <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Father&apos;s name
                <input
                  autoComplete="off"
                  className={inputClass}
                  maxLength={120}
                  name="fatherName"
                  onChange={(event) => setFatherName(event.target.value)}
                  value={fatherName}
                />
              </label>
              <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Surname
                <input
                  autoComplete="family-name"
                  className={inputClass}
                  maxLength={120}
                  name="surname"
                  onChange={(event) => setSurname(event.target.value)}
                  value={surname}
                />
              </label>
              <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Category
                <input
                  autoComplete="off"
                  className={inputClass}
                  maxLength={40}
                  name="category"
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="MERIT"
                  value={category}
                />
              </label>
              <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Academic year / year of study
                <input
                  autoComplete="off"
                  className={inputClass}
                  list="academic-year-options"
                  maxLength={100}
                  name="academicYear"
                  onChange={(event) => setAcademicYear(event.target.value)}
                  placeholder="SECOND YEAR - ACADEMIC YEAR 2025"
                  value={academicYear}
                />
                <datalist id="academic-year-options">
                  <option value="FIRST YEAR" />
                  <option value="SECOND YEAR" />
                  <option value="SECOND YEAR - ACADEMIC YEAR 2025" />
                  <option value="THIRD YEAR" />
                  <option value="FINAL YEAR" />
                </datalist>
              </label>
              <label className="min-w-0 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Valid upto
                <input
                  autoComplete="off"
                  className={inputClass}
                  maxLength={40}
                  name="validUpto"
                  onChange={(event) => setValidUpto(event.target.value)}
                  placeholder="DECEMBER 2026"
                  value={validUpto}
                />
              </label>
            </>
          ) : null}
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
              onChange={(event) => setBloodGroup(event.target.value)}
              name="bloodGroup"
              value={bloodGroup}
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
              Semester (enrollment)
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
