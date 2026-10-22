"use client";

import { useEffect, useMemo, useState } from "react";
import type { DayOfWeek } from "@/generated/prisma/enums";
import {
  getCampusStatus,
  type CampusStatusResource,
  type CampusStatusSlot,
} from "@/lib/campus-status";
import styles from "./campus-status-tracker.module.css";

const dayCodes: DayOfWeek[] = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type CampusStatusTrackerProps = {
  teachers: CampusStatusResource[];
  rooms: CampusStatusResource[];
  slots: CampusStatusSlot[];
};

function minutesSinceMidnight(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function CampusStatusTracker({
  teachers,
  rooms,
  slots,
}: CampusStatusTrackerProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [department, setDepartment] = useState("ALL");

  useEffect(() => {
    const refresh = () => setNow(new Date());
    refresh();
    const interval = window.setInterval(refresh, 30_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const departments = useMemo(
    () => [...new Set(slots.map((slot) => slot.department))].sort(),
    [slots],
  );
  const status = useMemo(() => {
    if (!now) return null;
    return getCampusStatus(
      teachers,
      rooms,
      slots,
      dayCodes[now.getDay()] ?? "MON",
      minutesSinceMidnight(now),
    );
  }, [now, rooms, slots, teachers]);
  const query = searchQuery.trim().toLocaleLowerCase();

  const visibleTeachers = status?.teachers.filter((teacher) => {
    const matchesDepartment =
      department === "ALL" || teacher.departments.includes(department);
    const matchesSearch =
      !query ||
      teacher.name.toLocaleLowerCase().includes(query) ||
      teacher.departments.some((item) => item.toLocaleLowerCase().includes(query)) ||
      teacher.activeSlots.some((slot) =>
        [slot.courseName, slot.courseCode, slot.roomName, slot.sectionName]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query),
      );
    return matchesDepartment && matchesSearch;
  });

  const visibleRooms = status?.rooms.filter((room) => {
    const matchesDepartment =
      department === "ALL" || room.departments.includes(department);
    const matchesSearch =
      !query ||
      room.name.toLocaleLowerCase().includes(query) ||
      room.departments.some((item) => item.toLocaleLowerCase().includes(query)) ||
      room.activeSlots.some((slot) =>
        [slot.courseName, slot.courseCode, ...slot.teacherNames]
          .join(" ")
          .toLocaleLowerCase()
          .includes(query),
      );
    return matchesDepartment && matchesSearch;
  });

  return (
    <div className={styles.tracker}>
      <div className={styles.controls}>
        <input
          aria-label="Search teachers, rooms, or classes"
          className={styles.search}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search teachers, rooms, or classes"
          type="search"
          value={searchQuery}
        />
        <select
          aria-label="Filter by department"
          className={styles.departmentSelect}
          onChange={(event) => setDepartment(event.target.value)}
          value={department}
        >
          <option value="ALL">All departments</option>
          {departments.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <section aria-labelledby="teacher-status-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="teacher-status-heading">Teacher availability</h2>
            <p>Current teaching status from the weekly timetable.</p>
          </div>
          <span className={styles.updated} aria-live="polite">
            {now
              ? `Updated ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Checking current status…"}
          </span>
        </div>
        <div className={styles.resourceGrid}>
          {visibleTeachers?.length ? (
            visibleTeachers.map((teacher) => (
              <article className={styles.resourceCard} key={teacher.id}>
                <div className={styles.resourceHeader}>
                  <h3>{teacher.name}</h3>
                  <span
                    className={
                      teacher.activeSlots.length
                        ? styles.busyStatus
                        : styles.freeStatus
                    }
                  >
                    {teacher.activeSlots.length ? "Busy" : "Available / Free"}
                  </span>
                </div>
                {teacher.departments.length > 0 && (
                  <div className={styles.departments}>
                    {teacher.departments.map((item) => (
                      <span className={styles.departmentTag} key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {teacher.activeSlots.length > 0 ? (
                  <div className={styles.slotList}>
                    {teacher.activeSlots.map((slot) => (
                      <div className={styles.slot} key={slot.id}>
                        <strong>
                          Busy in {slot.roomName} - {slot.courseName}
                        </strong>
                        <span>
                          {slot.startTime}–{slot.endTime} · {slot.sectionName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className={styles.empty}>
              {status ? "No teachers match your search and department." : "Loading teacher status…"}
            </p>
          )}
        </div>
      </section>

      <section aria-labelledby="room-status-heading" className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="room-status-heading">Classroom status</h2>
            <p>Rooms are marked in use while a scheduled class is active.</p>
          </div>
        </div>
        <div className={styles.resourceGrid}>
          {visibleRooms?.length ? (
            visibleRooms.map((room) => (
              <article className={styles.resourceCard} key={room.id}>
                <div className={styles.resourceHeader}>
                  <h3>{room.name}</h3>
                  <span
                    className={
                      room.activeSlots.length
                        ? styles.busyStatus
                        : styles.freeStatus
                    }
                  >
                    {room.activeSlots.length ? "In use" : "Available / Free"}
                  </span>
                </div>
                {room.departments.length > 0 && (
                  <div className={styles.departments}>
                    {room.departments.map((item) => (
                      <span className={styles.departmentTag} key={item}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                {room.activeSlots.length > 0 ? (
                  <div className={styles.slotList}>
                    {room.activeSlots.map((slot) => (
                      <div className={styles.slot} key={slot.id}>
                        <strong>
                          {slot.courseCode} - {slot.courseName}
                        </strong>
                        <span>
                          {slot.startTime}–{slot.endTime} ·{" "}
                          {slot.teacherNames.join(", ")} · {slot.sectionName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className={styles.empty}>
              {status ? "No rooms match your search and department." : "Loading room status…"}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
