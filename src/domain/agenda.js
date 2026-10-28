import { AGENDA_MONTHS_SHOWN } from "../config.js";
import agenda from "../data/agenda.json";

/** "2026-11" for a date in November 2026. This is how months are keyed in data/agenda.json. */
export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/**
 * The months the visitor can pick: those registered in agenda.json, from the current month on (at most
 * `limit`), as dates on day 1. With none registered, just the current month.
 */
export function visibleMonths(today, appointments = agenda.appointments, limit = AGENDA_MONTHS_SHOWN) {
  const current = monthKey(today);
  const months = Object.keys(appointments)
    .filter((key) => key >= current)
    .sort()
    .slice(0, limit)
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return new Date(year, month - 1, 1);
    });
  return months.length ? months : [new Date(today.getFullYear(), today.getMonth(), 1)];
}

/** { day: [city codes] } for the month. A day absent from the object has no service. */
export function citiesByDay(month, appointments = agenda.appointments) {
  const days = {};
  for (const [city, list] of Object.entries(appointments[monthKey(month)] || {})) {
    for (const day of list) (days[day] ||= []).push(city);
  }
  return days;
}

export const daysInMonth = (month) => new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

/** Days of the month still bookable: with service, inside the month and not already past (current month). */
export function upcomingServiceDays(month, today, days) {
  const isCurrentMonth = monthKey(month) === monthKey(today);
  return Object.keys(days)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((day) => day <= daysInMonth(month) && !(isCurrentMonth && day < today.getDate()));
}
