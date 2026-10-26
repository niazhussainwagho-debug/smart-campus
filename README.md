This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Prisma database

The app uses Prisma ORM with PostgreSQL on Neon. Set `DATABASE_URL` in the local
`.env` file. For Neon, use the pooled URL at runtime; if migrations need a
direct connection, add the direct URL separately as `DIRECT_URL`. Do not commit
either value.

Useful commands:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run db:studio
```

Before seeding, set `SEED_ADMIN_PASSWORD`, `SEED_TEACHER_PASSWORD`, and
`SEED_STUDENT_PASSWORD` in `.env`. Seed passwords are stored as bcrypt hashes.
Seed accounts use `admin@smartcampus.test`, `teacher@smartcampus.test`, and
`student@smartcampus.test`.

## Login and roles

Auth.js uses JWT sessions, and `.env` must contain `AUTH_SECRET`. The login page
is `/login`; there is no public sign-up page. Sign in with one of the seed
emails above and the matching password you set in `.env`:

- `admin@smartcampus.test` opens `/admin`.
- `teacher@smartcampus.test` opens `/teacher`.
- `student@smartcampus.test` opens `/student`.

The login page links to `/forgot-password`. Password reset uses SMTP; configure
`APP_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and
`SMTP_FROM` in `.env`. Use an application-specific SMTP password and do not
commit these values. `APP_URL` must be the public base URL of the app, such as
`http://localhost:3000` for local development. Reset links expire after 30
minutes and can only be used once.

After adding the reset-token migration, apply it to the database with
`npx prisma migrate deploy`, then regenerate the Prisma client with
`npm run db:generate`.

Protected routes redirect signed-out visitors to `/login` and send users who
try another role's dashboard back to their own dashboard.

## Timetable

The admin timetable page is `/admin/timetable`. An admin can add courses,
sections, rooms, and timetable slots, and can edit or delete timetable slots.
Each server action checks the admin role and checks room, teacher, and section
time conflicts before saving.

Students can view weekly schedules by program and part at `/timetable` or
`/student/timetable`. Their first available enrolled program and part are
selected automatically; the filters can be changed to browse other schedules.
Teachers can see their own classes at `/teacher/timetable`. The seed script
adds the `SC101` demo course, enrolls the demo student in the demo section, and
adds three non-overlapping weekly slots.

Program and batch metadata live on `Section`; each `TimetableSlot` stores its
period number and references its related course, room, teacher, and section.
Apply the `program_batch_timetable` migration with `npx prisma migrate deploy`
and regenerate the Prisma client with `npm run db:generate` before deploying.
Admin timetable management requires a program and part when creating a section
and a period number from 1 to 7 when scheduling a class.

Run the clash tests with:

```bash
npm test
```

## Teacher appointments

Teachers can manage weekly free times at `/teacher/availability` and review,
approve, reject, or reschedule requests at `/teacher/appointments`. Students
can request a meeting and manage their own requests at `/student/appointments`.
Every mutation checks the signed-in role and record ownership on the server.
Bookings must be in a teacher's matching weekday free slot, cannot be in the
past, and cannot overlap an active appointment for the same teacher or student.
Back-to-back appointments are allowed. A timetable-class overlap is shown as a
warning, but does not block a request.

The repeatable seed adds Tuesday and Thursday 13:00–15:00 free slots for the
demo teacher only when they do not already exist or overlap an existing free
slot. Run `npm run db:seed` to apply the demo data.

The same seed also adds the 2026 morning timetables from the supplied PDF for
BSIT, BSSW, and BSDS sections P-I through P-IV. Each occupied 45-minute period
is stored separately, with its room and instructor assignments. When the PDF
does not list an instructor or room for a project period, clearly named
“Unassigned” records are used instead of inventing an assignment. PDF-listed
instructors receive teacher accounts with generated, undisclosed passwords;
set a usable password before those accounts can sign in. The demo student is
enrolled in BSIT P-I so this schedule is visible at `/student/timetable`.

Apply the additive co-teacher relation migration before seeding an existing
database with `npx prisma migrate deploy`. The seed does not delete timetable
data and skips an already occupied section/day/start-time period.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
