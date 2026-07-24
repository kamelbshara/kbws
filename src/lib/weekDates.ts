import type { DayOfWeek } from "@/generated/prisma/enums";

const DAY_OFFSET: Record<DayOfWeek, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

/** Midnight of the Sunday that starts the week containing `date`. */
export function startOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

/** The actual calendar date for `day` within the week that `weekStart` (a Sunday) begins. */
export function dateForDayInWeek(weekStart: Date, day: DayOfWeek): Date {
  const result = new Date(weekStart);
  result.setDate(result.getDate() + DAY_OFFSET[day]);
  return result;
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
