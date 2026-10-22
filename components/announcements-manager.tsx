"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import type { UserRole } from "@/generated/prisma/enums";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  type AnnouncementActionResult,
} from "@/app/announcements/actions";
import styles from "./announcements-manager.module.css";

type AnnouncementItem = {
  id: string;
  title: string;
  message: string;
  department: string | null;
  semester: number | null;
  createdById: string;
  createdByName: string;
  createdAt: string;
};

type AnnouncementTarget = {
  department: string;
  semester: number;
};

export function AnnouncementManager({
  announcements,
  role,
  targets,
  userId,
}: {
  announcements: AnnouncementItem[];
  role: UserRole;
  targets: AnnouncementTarget[];
  userId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<AnnouncementActionResult | null>(null);
  const canCreate = role === "ADMIN" || role === "TEACHER";
  const departments = [...new Set(targets.map((target) => target.department))];
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const semesters = [
    ...new Set(
      targets
        .filter((target) => !selectedDepartment || target.department === selectedDepartment)
        .map((target) => target.semester),
    ),
  ].sort((first, second) => first - second);

  function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createAnnouncementAction(formData);
      setNotice(result);
      if (result.ok) {
        form.reset();
        setSelectedDepartment("");
        router.refresh();
      }
    });
  }

  function deleteAnnouncement(id: string) {
    const formData = new FormData();
    formData.set("id", id);
    startTransition(async () => {
      const result = await deleteAnnouncementAction(formData);
      setNotice(result);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className={styles.manager}>
      {canCreate && (
        <section aria-labelledby="announcement-form-title" className={styles.panel}>
          <div className={styles.panelHeading}>
            <div>
              <h2 id="announcement-form-title">Publish a notice</h2>
              <p>Share important updates with the campus community.</p>
            </div>
          </div>
          <form className={styles.form} onSubmit={submitAnnouncement}>
            <label className={styles.field}>
              <span>Title</span>
              <input
                maxLength={160}
                name="title"
                placeholder="Announcement title"
                required
              />
            </label>
            <label className={styles.field}>
              <span>Message</span>
              <textarea
                maxLength={5000}
                name="message"
                placeholder="Write the notice details"
                required
                rows={5}
              />
            </label>
            <div className={styles.targetFields}>
              <label className={styles.field}>
                <span>Target department</span>
                <select
                  name="department"
                  onChange={(event) => setSelectedDepartment(event.target.value)}
                  value={selectedDepartment}
                >
                  <option value="">All departments</option>
                  {departments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Target semester</span>
                <select
                  disabled={!selectedDepartment}
                  name="semester"
                  defaultValue=""
                >
                  <option value="">
                    {selectedDepartment ? "All semesters" : "Choose a department first"}
                  </option>
                  {semesters.map((semester) => (
                    <option key={semester} value={semester}>
                      Semester {semester}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {notice && (
              <p
                aria-live="polite"
                className={notice.ok ? styles.successNotice : styles.errorNotice}
                role={notice.ok ? "status" : "alert"}
              >
                {notice.message}
              </p>
            )}
            <button className={styles.submit} disabled={isPending} type="submit">
              {isPending ? "Publishing…" : "Publish announcement"}
            </button>
          </form>
        </section>
      )}

      <section aria-labelledby="announcement-list-title" className={styles.panel}>
        <div className={styles.panelHeading}>
          <div>
            <h2 id="announcement-list-title">Campus circulars</h2>
            <p>
              {role === "STUDENT"
                ? "Notices for your enrolled department and semester."
                : "The latest notices published for campus."}
            </p>
          </div>
          <span className={styles.count}>{announcements.length} notices</span>
        </div>
        {announcements.length ? (
          <div className={styles.list}>
            {announcements.map((announcement) => {
              const canDelete =
                role === "ADMIN" || announcement.createdById === userId;
              return (
                <article className={styles.card} key={announcement.id}>
                  <div className={styles.cardHeading}>
                    <div className={styles.titleGroup}>
                      <h3>{announcement.title}</h3>
                      <div className={styles.audience}>
                        {announcement.department ?? "All departments"}
                        {announcement.semester
                          ? ` · Semester ${announcement.semester}`
                          : ""}
                      </div>
                    </div>
                    {canDelete && (
                      <button
                        className={styles.delete}
                        disabled={isPending}
                        onClick={() => deleteAnnouncement(announcement.id)}
                        type="button"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className={styles.message}>{announcement.message}</p>
                  <footer className={styles.metadata}>
                    <span>By {announcement.createdByName}</span>
                    <time dateTime={announcement.createdAt}>
                      {new Date(announcement.createdAt).toLocaleString([], {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </time>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>There are no announcements to display yet.</p>
        )}
      </section>
    </div>
  );
}
