"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";
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
  cnic: string;
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
  const [exportingIdSide, setExportingIdSide] = useState<
    "front" | "back" | null
  >(null);
  const [shownIdSide, setShownIdSide] = useState<"front" | "back">("front");
  const [idCardError, setIdCardError] = useState<string | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const frontCardRef = useRef<HTMLElement>(null);
  const backCardRef = useRef<HTMLElement>(null);
  const { setImage } = useDashboardUserImage();
  const [name, setName] = useState(profile.name);
  const [surname, setSurname] = useState(profile.surname);
  const [fatherName, setFatherName] = useState(profile.fatherName);
  const [rollNo, setRollNo] = useState(profile.rollNo);
  const [cnic, setCnic] = useState(profile.cnic ?? "");
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
  const cardNumber = (rollNo || profile.id)
    .replace(/[^a-z0-9]/gi, "")
    .slice(-14)
    .padStart(14, "0")
    .toUpperCase();
  const formattedCnic =
    cnic.length === 13
      ? `${cnic.slice(0, 5)}-${cnic.slice(5, 12)}-${cnic.slice(12)}`
      : cnic || "Not provided";
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
    const side = shownIdSide;
    const card = side === "front" ? frontCardRef.current : backCardRef.current;
    if (!card) {
      setIdCardError("The campus ID card is not available to download.");
      return;
    }

    setExportingIdSide(side);
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
      anchor.download = `campus-id-card-${side}.png`;
      anchor.href = dataUrl;
      anchor.click();
    } catch (error) {
      console.error("Unable to render the campus ID card.", error);
      setIdCardError(
        "Unable to render the ID card image. Please try again or use Print ID.",
      );
    } finally {
      setExportingIdSide(null);
    }
  }

  return (
    <section className="min-w-0 rounded-2xl border border-slate-800 bg-[#111827]/90 p-4 shadow-xl sm:p-6">
      <form className="grid min-w-0 gap-5 sm:grid-cols-2" onSubmit={submit}>
        <div className="campusIdCardsPreview grid min-w-0 justify-items-center gap-5 sm:col-span-2">
          <article
            ref={frontCardRef}
            aria-label="Front of University of Sindh student identity card"
            aria-hidden={shownIdSide !== "front"}
            className={`campusIdCardPrint campusIdCardFront relative isolate flex w-full max-w-[680px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-lg${shownIdSide === "front" ? "" : " campusIdCardHidden"}`}
          >
            <header className="idCardFrontHeader flex shrink-0 items-center gap-[2%]">
              {/* The logo is a local asset so it also renders in PNG and print exports. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="University of Sindh emblem"
                className="idCardLogo shrink-0 object-contain"
                src="/images/university-sindh-logo.png"
              />
              <div className="min-w-0 flex-1">
                <h2 className="idCardUniversity font-black leading-tight tracking-wide">
                  UNIVERSITY OF SINDH
                </h2>
                <p className="idCardCampus mt-1 font-semibold leading-tight">
                  JAMSHORO, SINDH, PAKISTAN • ALLAMA I.I. KAZI CAMPUS
                </p>
              </div>
              <p className="idCardType max-w-[17%] text-right font-extrabold uppercase leading-tight tracking-wide">
                Student Identity Card
              </p>
            </header>
            <div className="idCardFrontBody flex min-h-0 flex-1 gap-[2.2%]">
              {avatarPreview ? (
                // Uploaded images are validated as raster images before persistence.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt={`Photo of ${studentName || "student"}`}
                  className="idCardPhoto shrink-0 rounded border border-slate-300 object-cover shadow-sm"
                  src={avatarPreview}
                />
              ) : (
                <span className="idCardPhoto grid shrink-0 place-items-center rounded border border-slate-300 bg-slate-100 font-bold text-[#12365a]">
                  {name
                    .split(/\s+/)
                    .map((part) => part[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
                </span>
              )}
              <div className="idCardFrontDetails grid min-w-0 flex-1 grid-cols-2">
                <div className="col-span-2 min-w-0 border-b border-slate-200 pr-[20%]">
                  <p className="idCardLabel font-bold uppercase tracking-wider text-slate-500">
                    Student Name
                  </p>
                  <p className="idCardStudentName truncate font-extrabold uppercase text-[#12365a]">
                    {studentName || "Full Name"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold uppercase tracking-wider text-slate-500">
                    Father&apos;s Name
                  </p>
                  <p className="idCardValue truncate font-semibold">
                    {fatherName || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold uppercase tracking-wider text-slate-500">
                    Surname
                  </p>
                  <p className="idCardValue truncate font-semibold">
                    {surname || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold uppercase tracking-wider text-slate-500">
                    Roll No
                  </p>
                  <p className="idCardValue truncate font-semibold">
                    {rollNo || "Not provided"}
                  </p>
                  <p className="idCardLabel mt-[1%] font-bold uppercase tracking-wider text-slate-500">
                    Valid Upto: {validUpto || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold uppercase tracking-wider text-slate-500">
                    Blood Group
                  </p>
                  <p className="idCardValue truncate font-semibold">
                    {bloodGroup || "Not provided"}
                  </p>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="idCardLabel font-bold uppercase tracking-wider text-slate-500">
                    Department
                  </p>
                  <p className="idCardValue truncate font-semibold">
                    {department || "Not provided"}
                  </p>
                </div>
              </div>
              <p className="idCardNumber shrink-0 text-right font-bold text-[#12365a]">
                ID # {profile.id.slice(-6).toUpperCase()}
              </p>
            </div>
            <footer className="idCardFrontFooter flex shrink-0 items-center justify-between gap-3 bg-[#087fbd] font-extrabold uppercase text-white">
              <div className="min-w-0">
                <p className="idCardLabel font-bold tracking-wider text-amber-300">
                  Academic Year
                </p>
                <p className="idCardAcademicYear truncate tracking-wide">
                  {academicYear || "Not provided"}
                </p>
              </div>
              <p className="idCardCategory shrink-0 border-l border-white/40 pl-3 text-right">
                {category || "Not provided"}
              </p>
            </footer>
          </article>
          <article
            ref={backCardRef}
            aria-label="Back of University of Sindh student identity card"
            aria-hidden={shownIdSide !== "back"}
            className={`campusIdCardPrint campusIdCardBack relative isolate flex w-full max-w-[680px] flex-col overflow-hidden rounded-xl border border-slate-300 bg-white text-slate-900 shadow-lg${shownIdSide === "back" ? "" : " campusIdCardHidden"}`}
          >
            <header className="idCardBackHeader relative flex shrink-0 items-center justify-center bg-[#087fbd] text-center text-white">
              <h2 className="idCardBackTitle max-w-[75%] font-black uppercase leading-tight tracking-wide">
                Department of {department || "University"}
              </h2>
              <div className="idCardQr absolute right-[2%] top-[8%] rounded bg-white p-[1%]">
                <QRCodeSVG
                  aria-label="Student roll number QR code"
                  bgColor="#ffffff"
                  fgColor="#102431"
                  level="M"
                  size={80}
                  value={rollNo || profile.id}
                />
              </div>
            </header>
            <div className="idCardBackBody relative grid min-h-0 flex-1 grid-cols-2">
              <div className="idCardWatermark pointer-events-none absolute inset-0 grid place-items-center opacity-[0.09]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="h-[78%] w-auto object-contain"
                  src="/images/university-sindh-logo.png"
                />
              </div>
              <div className="idCardBackDetails relative z-10 col-span-2 grid grid-cols-2">
                <div className="min-w-0">
                  <p className="idCardLabel font-bold tracking-wider text-sky-800">
                    Father&apos;s Name
                  </p>
                  <p className="idCardBackValue truncate font-bold uppercase italic">
                    {fatherName || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0 pr-[20%]">
                  <p className="idCardLabel font-bold tracking-wider text-sky-800">
                    Category
                  </p>
                  <p className="idCardBackValue truncate font-bold uppercase">
                    {category || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold tracking-wider text-sky-800">
                    Surname
                  </p>
                  <p className="idCardBackValue truncate font-bold uppercase italic">
                    {surname || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold tracking-wider text-sky-800">
                    CNIC
                  </p>
                  <p className="idCardBackValue truncate font-bold">
                    {formattedCnic}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold tracking-wider text-sky-800">
                    Emergency Contact
                  </p>
                  <p className="idCardBackValue truncate font-bold italic">
                    {profile.emergencyContact || "Not provided"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="idCardLabel font-bold tracking-wider text-sky-800">
                    Blood Group
                  </p>
                  <p className="idCardBackValue truncate font-bold uppercase italic">
                    {bloodGroup || "Not provided"}
                  </p>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="idCardLabel font-bold tracking-wider text-sky-800">
                    Campus Address
                  </p>
                  <p className="idCardBackValue truncate font-bold uppercase italic">
                    Allama I.I. Kazi Campus, Jamshoro, Sindh, Pakistan
                  </p>
                </div>
              </div>
            </div>
            <footer className="idCardBackFooter flex shrink-0 items-center justify-center gap-[1%] border-t-[3px] border-[#f39800] bg-[#087fbd] px-[2%]">
              {Array.from(cardNumber, (character, index) => (
                <span
                  className="idCardSerialCell grid min-w-0 flex-1 place-items-center bg-white font-extrabold text-rose-600"
                  key={`${character}-${index}`}
                >
                  {character}
                </span>
              ))}
            </footer>
          </article>
        </div>
        <div className="campusIdCardActions flex flex-wrap items-center gap-3 sm:col-span-2">
          <div
            aria-label="Choose ID card side"
            className="flex items-center gap-1 rounded-xl border border-slate-700 p-1"
            role="group"
          >
            <button
              aria-pressed={shownIdSide === "front"}
              className="min-h-9 rounded-lg px-3 text-sm font-semibold text-slate-200 aria-pressed:bg-cyan-500/15 aria-pressed:text-cyan-300"
              onClick={() => setShownIdSide("front")}
              type="button"
            >
              Front
            </button>
            <button
              aria-pressed={shownIdSide === "back"}
              className="min-h-9 rounded-lg px-3 text-sm font-semibold text-slate-200 aria-pressed:bg-cyan-500/15 aria-pressed:text-cyan-300"
              onClick={() => setShownIdSide("back")}
              type="button"
            >
              Back
            </button>
          </div>
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/15 disabled:cursor-wait disabled:opacity-60"
            disabled={exportingIdSide !== null}
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
            {exportingIdSide ? "Preparing image…" : `Download ${shownIdSide}`}
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
                CNIC
                <input
                  autoComplete="off"
                  className={inputClass}
                  inputMode="numeric"
                  maxLength={15}
                  name="cnic"
                  onChange={(event) => setCnic(event.target.value)}
                  placeholder="42101-1234567-1"
                  value={cnic}
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
