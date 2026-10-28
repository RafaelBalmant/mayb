import { describe, expect, it } from "vitest";
import { citiesByDay, daysInMonth, monthKey, upcomingServiceDays, visibleMonths } from "../src/domain/agenda.js";

const appointments = {
  "2026-10": { maringa: [1], siqueira_campos: [2] },
  "2026-11": { maringa: [3, 4, 30], siqueira_campos: [4, 11] },
  "2026-12": { maringa: [], siqueira_campos: [1] },
  "2027-01": { maringa: [19] },
  "2027-02": { maringa: [2] },
  "2027-03": { maringa: [2] },
};

describe("monthKey", () => {
  it("pads the month", () => {
    expect(monthKey(new Date(2026, 0, 15))).toBe("2026-01");
    expect(monthKey(new Date(2026, 10, 3))).toBe("2026-11");
  });
});

describe("visibleMonths", () => {
  it("starts at the current month, sorted, at most 4", () => {
    const months = visibleMonths(new Date(2026, 10, 10), appointments);
    expect(months.map(monthKey)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02"]);
  });

  it("hides months that already passed", () => {
    expect(visibleMonths(new Date(2026, 11, 20), appointments).map(monthKey)[0]).toBe("2026-12");
  });

  it("falls back to the current month when nothing is registered", () => {
    const months = visibleMonths(new Date(2030, 4, 9), appointments);
    expect(months.map(monthKey)).toEqual(["2030-05"]);
  });

  it("respects the limit", () => {
    expect(visibleMonths(new Date(2026, 10, 1), appointments, 2)).toHaveLength(2);
  });
});

describe("citiesByDay", () => {
  it("lists every city that serves each day, in the order of the data", () => {
    const days = citiesByDay(new Date(2026, 10, 1), appointments);
    expect(days[3]).toEqual(["maringa"]);
    expect(days[4]).toEqual(["maringa", "siqueira_campos"]);
    expect(days[11]).toEqual(["siqueira_campos"]);
    expect(days[5]).toBeUndefined();
  });

  it("is empty for an unregistered month", () => {
    expect(citiesByDay(new Date(2031, 0, 1), appointments)).toEqual({});
  });
});

describe("upcomingServiceDays", () => {
  const month = new Date(2026, 10, 1);
  const days = citiesByDay(month, appointments);

  it("in the current month it drops days already past", () => {
    expect(upcomingServiceDays(month, new Date(2026, 10, 10), days)).toEqual([11, 30]);
    expect(upcomingServiceDays(month, new Date(2026, 10, 4), days)).toEqual([4, 11, 30]);
  });

  it("in a future month it keeps every day", () => {
    expect(upcomingServiceDays(month, new Date(2026, 9, 28), days)).toEqual([3, 4, 11, 30]);
  });

  it("ignores days beyond the end of the month", () => {
    expect(upcomingServiceDays(month, new Date(2026, 9, 1), { 31: ["maringa"], 5: ["maringa"] })).toEqual([5]);
  });
});

describe("daysInMonth", () => {
  it("handles leap years", () => {
    expect(daysInMonth(new Date(2028, 1, 1))).toBe(29);
    expect(daysInMonth(new Date(2027, 1, 1))).toBe(28);
    expect(daysInMonth(new Date(2026, 10, 1))).toBe(30);
  });
});
