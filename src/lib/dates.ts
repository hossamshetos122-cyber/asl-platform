/**
 * Single source of truth for every date/time shown in the app.
 * Every renderer uses the SAME timezone (UTC) so the same stored DateTime
 * always displays the same calendar date + time on every page — public or
 * admin, dev or production — no more server-local vs UTC drift.
 */

export const APP_TIME_ZONE = "UTC";

const AR = "ar-EG";

export function formatCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat(AR, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat(AR, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatMatchDateTime(date: Date): string {
  return new Intl.DateTimeFormat(AR, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatKickoffTime(date: Date): string {
  return new Intl.DateTimeFormat(AR, {
    timeZone: APP_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatYear(date: Date): string {
  return new Intl.DateTimeFormat(AR, {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
  }).format(date);
}

/** Simple Arabic relative time for notifications/feed ("منذ 5 دقائق"). */
export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return formatCalendarDate(date);
}