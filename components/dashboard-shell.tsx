"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { NotificationType, type UserRole } from "@/generated/prisma/enums";
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
  type DashboardNotification,
} from "@/app/notifications/actions";
import { LogoutButton } from "@/components/logout-button";
import { useTheme } from "@/components/theme-provider";
import styles from "./dashboard-shell.module.css";

export type NavItem = {
  href: string;
  label: string;
  icon: (active: boolean) => ReactNode;
  badge?: string;
};

interface DashboardShellProps {
  role: UserRole;
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  title?: string;
  subtitle?: string;
  badge?: string;
  action?: ReactNode;
  children: ReactNode;
}

const DashboardUserImageContext = createContext<{
  setImage: (image: string | null) => void;
} | null>(null);

export function useDashboardUserImage() {
  const context = useContext(DashboardUserImageContext);
  if (!context) {
    throw new Error("useDashboardUserImage must be used inside DashboardShell.");
  }
  return context;
}

function IconDashboard({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}

function IconCalendar({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><rect height="18" rx="2" width="18" x="3" y="4" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>;
}

function IconClock({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}

function IconUsers({ active }: { active: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>;
}

function IconSearch() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" x2="16.65" y1="21" y2="16.65" /></svg>;
}

function IconBell({ active = false }: { active?: boolean }) {
  return <svg className={active ? styles.activeIcon : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M10 21h4" /></svg>;
}

function ThemeSwitch() {
  const { theme, resolvedTheme, cycleTheme } = useTheme();
  const label = `Switch theme. Current mode: ${theme}`;

  return (
    <button
      aria-label={label}
      className={styles.themeButton}
      onClick={cycleTheme}
      title={`${label}. Click to cycle through dark, light, and system modes.`}
      type="button"
    >
      {resolvedTheme === "light" ? (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M20.5 14.3A8.5 8.5 0 0 1 9.7 3.5 8.5 8.5 0 1 0 20.5 14.3Z" />
        </svg>
      )}
    </button>
  );
}

function notificationHref(
  notification: DashboardNotification,
  role: UserRole,
): string {
  if (
    notification.link &&
    notification.link.startsWith("/") &&
    !notification.link.startsWith("//")
  ) {
    return notification.link;
  }
  return notification.type === NotificationType.ANNOUNCEMENT
    ? "/announcements"
    : role === "TEACHER"
      ? "/teacher/appointments"
      : "/student/appointments";
}

function notificationTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardShell({
  role,
  user,
  title,
  subtitle,
  badge,
  action,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [image, setImage] = useState(user.image ?? null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationError, setNotificationError] = useState("");
  const notificationWrap = useRef<HTMLDivElement>(null);
  const fetchingNotifications = useRef(false);

  const refreshNotifications = useCallback(async () => {
    if (fetchingNotifications.current) return;
    fetchingNotifications.current = true;
    try {
      const result = await getNotificationsAction();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
      setNotificationError("");
    } catch {
      setNotificationError("Could not load notifications. Please try again.");
    } finally {
      fetchingNotifications.current = false;
    }
  }, []);

  async function openNotification(notification: DashboardNotification) {
    setNotificationsOpen(false);
    if (!notification.isRead) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      try {
        await markNotificationReadAction(notification.id);
      } catch {
        setNotificationError("Could not update notification status.");
        void refreshNotifications();
      }
    }
    router.push(notificationHref(notification, role));
  }

  function markAllAsRead() {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);
    void markAllNotificationsReadAction().catch(() => {
      setNotificationError("Could not update notification status.");
      void refreshNotifications();
    });
  }

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => {
      void refreshNotifications();
    }, 0);
    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, 30_000);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") void refreshNotifications();
    };
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [refreshNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;
    function closePopover(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !notificationWrap.current?.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }
    document.addEventListener("pointerdown", closePopover);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closePopover);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileMenuOpen(false);
    }
    function closeOnDesktop() {
      if (window.matchMedia("(min-width: 1024px)").matches) setMobileMenuOpen(false);
    }

    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [mobileMenuOpen]);

  const roleMeta = {
    ADMIN: { portalName: "Admin Portal", defaultTitle: "Campus Overview" },
    TEACHER: { portalName: "Faculty Portal", defaultTitle: "Faculty Overview" },
    STUDENT: { portalName: "Student Portal", defaultTitle: "Student Overview" },
  }[role];
  const dashHref = role === "ADMIN" ? "/admin" : role === "TEACHER" ? "/teacher" : "/student";
  const navItems: NavItem[] = [
    { href: dashHref, label: "Dashboard", icon: (active) => <IconDashboard active={active} /> },
    {
      href: role === "ADMIN" ? "/admin/timetable" : role === "TEACHER" ? "/teacher/timetable" : "/student/timetable",
      label: role === "ADMIN" ? "Timetable" : "My Schedule",
      icon: (active) => <IconCalendar active={active} />,
    },
    {
      href: "/announcements",
      label: "Announcements",
      icon: (active) => <IconBell active={active} />,
    },
    ...(role === "STUDENT" || role === "TEACHER"
      ? [
          {
            href: "/profile",
            label: "My Profile",
            icon: (active: boolean) => <IconUsers active={active} />,
          },
        ]
      : []),
    ...(role === "TEACHER"
      ? [
          {
            href: "/admin/timetable",
            label: "Manage Timetable",
            icon: (active: boolean) => <IconCalendar active={active} />,
          },
        ]
      : []),
    ...(role === "ADMIN"
      ? [
          {
            href: "/admin/requests",
            label: "Verification Requests",
            icon: (active: boolean) => <IconUsers active={active} />,
          },
          {
            href: "/admin/requests",
            label: "Admin Requests",
            icon: (active: boolean) => <IconUsers active={active} />,
          },
        ]
      : []),
    ...(role === "TEACHER"
      ? [
          { href: "/teacher/attendance", label: "Attendance", icon: (active: boolean) => <IconUsers active={active} /> },
          { href: "/teacher/availability", label: "Office Hours", icon: (active: boolean) => <IconClock active={active} /> },
          { href: "/teacher/appointments", label: "Student Requests", badge: "Live", icon: (active: boolean) => <IconUsers active={active} /> },
        ]
      : []),
    ...(role === "STUDENT"
      ? [
          { href: "/student/attendance", label: "Attendance", icon: (active: boolean) => <IconUsers active={active} /> },
          { href: "/student/appointments", label: "Appointments", icon: (active: boolean) => <IconUsers active={active} /> },
        ]
      : []),
    ...(role !== "TEACHER"
      ? [{
          href: "/campus-status",
          label: "Live Campus Status",
          icon: (active: boolean) => <IconClock active={active} />,
        }]
      : []),
  ];
  const initials = (user.name ?? "U").split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const filteredNavItems = navItems.filter((item) => item.label.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  return (
    <DashboardUserImageContext.Provider value={{ setImage }}>
    <div className={styles.shell}>
      <button
        aria-hidden={!mobileMenuOpen}
        aria-label="Close navigation menu"
        className={`${styles.backdrop} ${mobileMenuOpen ? styles.backdropVisible : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        tabIndex={mobileMenuOpen ? 0 : -1}
        type="button"
      />

      <aside
        aria-label="Main navigation"
        className={`${styles.sidebar} ${mobileMenuOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.brandRow}>
          <Link className={styles.brand} href={dashHref} onClick={() => setMobileMenuOpen(false)}>
            <span className={styles.brandMark}>C</span>
            <span><strong>CAMPUS<span>.OS</span></strong><small>{roleMeta.portalName.toUpperCase()}</small></span>
          </Link>
          <button aria-label="Close navigation menu" className={styles.closeMenu} onClick={() => setMobileMenuOpen(false)} type="button">×</button>
        </div>

        <nav className={styles.navigation}>
          <p className={styles.navLabel}>YOUR WORKSPACE</p>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== dashHref && pathname.startsWith(item.href)) ||
              (pathname === "/timetable" && item.href === "/student/timetable");
            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                href={item.href}
                key={item.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.icon(isActive)}
                <span>{item.label}</span>
                {item.badge && <i>{item.badge}</i>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.sidebarNote}><span>✦</span><strong>Campus, connected</strong><small>Your classes and campus services, all in one place.</small></div>
          <div className={styles.sidebarUser}>
            <Link
              className={styles.sidebarProfileLink}
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className={styles.avatar}>
                {image ? (
                  // Images are validated as raster files before they are persisted.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={image} />
                ) : initials}
                <i />
              </span>
              <span className={styles.userMeta}><strong>{user.name ?? "Campus User"}</strong><small>{roleMeta.portalName}</small></span>
            </Link>
            <LogoutButton className={styles.logout} />
          </div>
        </div>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button aria-label="Open navigation menu" aria-expanded={mobileMenuOpen} className={styles.menuButton} onClick={() => setMobileMenuOpen(true)} type="button">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          </button>

          <div className={styles.searchWrap}>
            <IconSearch />
            <input
              aria-label="Search dashboard pages"
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={`Search ${roleMeta.portalName.toLowerCase()} pages`}
              type="search"
              value={searchQuery}
            />
            {searchQuery && (
              <div className={styles.searchResults}>
                {filteredNavItems.length ? filteredNavItems.map((item) => (
                  <Link href={item.href} key={item.href} onClick={() => setSearchQuery("")}>{item.label}<span>→</span></Link>
                )) : <p>No matching pages</p>}
              </div>
            )}
          </div>

          <div className={styles.headerActions}>
            {action}
            <ThemeSwitch />
            <div className={styles.notificationWrap} ref={notificationWrap}>
              <button
                aria-expanded={notificationsOpen}
                aria-label={
                  unreadCount
                    ? `Notifications, ${unreadCount} unread`
                    : "Notifications"
                }
                className={styles.notificationButton}
                onClick={() => {
                  const opening = !notificationsOpen;
                  setNotificationsOpen(opening);
                  if (opening) void refreshNotifications();
                }}
                type="button"
              >
                <IconBell />
                {unreadCount > 0 && (
                  <span aria-hidden="true" className={styles.notificationBadge}>
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
              {notificationsOpen && (
                <div
                  aria-label="Notifications"
                  className={styles.notificationPanel}
                  role="region"
                >
                  <div className={styles.notificationPanelHeader}>
                    <strong>Notifications</strong>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} type="button">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  {notificationError && (
                    <p className={styles.notificationError} role="alert">
                      {notificationError}
                    </p>
                  )}
                  {notifications.length ? (
                    <ul className={styles.notificationList}>
                      {notifications.map((notification) => (
                        <li key={notification.id}>
                          <Link
                            aria-label={`${notification.isRead ? "Read" : "Unread"} notification: ${notification.title}`}
                            className={`${styles.notificationItem} ${notification.isRead ? styles.notificationRead : styles.notificationUnread}`}
                            href={notificationHref(notification, role)}
                            onClick={(event) => {
                              event.preventDefault();
                              void openNotification(notification);
                            }}
                          >
                            <span
                              aria-hidden="true"
                              className={styles.notificationIndicator}
                            />
                            <span className={styles.notificationContent}>
                              <strong>{notification.title}</strong>
                              <span>{notification.message}</span>
                              <time dateTime={notification.createdAt}>
                                {notificationTimestamp(notification.createdAt)}
                              </time>
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.notificationEmpty}>
                      You&apos;re all caught up.
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className={styles.headerUser}>
              <span className={styles.avatar}>
                {image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" src={image} />
                ) : initials}
                <i />
              </span>
              <span className={styles.headerUserMeta}><strong>{user.name ?? "Campus User"}</strong><small>{roleMeta.portalName}</small></span>
            </div>
          </div>
        </header>

        <main className={styles.pageContent}>
          <div className={styles.pageHeading}>
            <div>
              <div className={styles.eyebrow}>{badge ?? roleMeta.portalName}</div>
              <h1>{title ?? roleMeta.defaultTitle}</h1>
              {(subtitle ?? (!title ? "Your classes, appointments and campus updates at a glance." : undefined)) && (
                <p>{subtitle ?? "Your classes, appointments and campus updates at a glance."}</p>
              )}
            </div>
            {role === "ADMIN" && <span className={styles.statusBadge}><i /> Campus active</span>}
          </div>
          <div className={styles.pageChildren}>{children}</div>
        </main>
      </div>
    </div>
    </DashboardUserImageContext.Provider>
  );
}
