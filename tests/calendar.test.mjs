import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import {
  formatCalendarDate,
  parseCalendarDate,
  formatJalaliDate,
  parseJalaliDate,
} from "../dist/index.js";

const ymd = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()];
const require = createRequire(import.meta.url);

test("loads the CommonJS entry without runtime-only build dependencies", () => {
  const cjs = require("../dist/index.cjs");
  assert.equal(typeof cjs.formatCalendarDate, "function");
  assert.equal(typeof cjs.PersianDatepicker, "object");
});

test("keeps backward-compatible Jalali formatting and parsing", () => {
  const date = parseJalaliDate("1405/05/24", "YYYY/MM/DD", "fa");
  assert.ok(date);
  assert.equal(formatJalaliDate(date, "YYYY/MM/DD", "fa"), "1405/05/24");
});

test("handles Jalali leap-year boundaries", () => {
  assert.ok(parseJalaliDate("1399/12/30", "YYYY/MM/DD", "fa"));
  assert.equal(parseJalaliDate("1400/12/30", "YYYY/MM/DD", "fa"), null);
  const end = parseJalaliDate("1399/12/30", "YYYY/MM/DD", "fa");
  const next = new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1, 12);
  assert.equal(formatJalaliDate(next, "YYYY/MM/DD", "fa"), "1400/01/01");
});

test("formats and parses Islamic Civil dates without losing a day", () => {
  const date = new Date(2024, 6, 7, 12);
  assert.equal(
    formatCalendarDate(date, "YYYY/MM/DD", { calendar: "islamic", locale: "fa" }),
    "1446/01/01"
  );
  const parsed = parseCalendarDate("1446/01/01", "YYYY/MM/DD", {
    calendar: "islamic",
    locale: "fa",
  });
  assert.deepEqual(ymd(parsed), [2024, 7, 7]);
});

test("supports Arabic Islamic month names", () => {
  const date = parseCalendarDate("1 رمضان 1446", "DD MMM YYYY", {
    calendar: "islamic",
    locale: "fa",
  });
  assert.ok(date);
  assert.equal(
    formatCalendarDate(date, "DD MMM YYYY", { calendar: "islamic", locale: "fa" }),
    "01 رمضان 1446"
  );
});

test("renders the Persian-locale Islamic calendar with Arabic vocabulary", () => {
  const date = new Date(2024, 6, 7, 12);
  assert.equal(
    formatCalendarDate(date, "dddd, DD MMMM YYYY", {
      calendar: "islamic",
      locale: "fa",
    }),
    "الأحد، 01 محرم 1446"
  );
  assert.ok(
    parseCalendarDate("01 ربيع الأول 1446", "DD MMM YYYY", {
      calendar: "islamic",
      locale: "fa",
    })
  );
});

test("supports both numeric and textual Islamic output", () => {
  const date = parseCalendarDate("1446/01/01", "YYYY/MM/DD", {
    calendar: "islamic",
    locale: "fa",
  });
  assert.ok(date);
  assert.equal(
    formatCalendarDate(date, "YYYY/MM/DD", { calendar: "islamic", locale: "fa" }),
    "1446/01/01"
  );
  assert.equal(
    formatCalendarDate(date, "DD MMM YYYY", { calendar: "islamic", locale: "fa" }),
    "01 محرم 1446"
  );
});

test("forces English text and Latin output for Gregorian mode", () => {
  const date = new Date(2026, 7, 15, 12);
  assert.equal(
    formatCalendarDate(date, "dddd, DD MMMM YYYY", {
      calendar: "gregorian",
      locale: "fa",
    }),
    "Saturday, 15 August 2026"
  );
  assert.ok(
    parseCalendarDate("15 August 2026", "DD MMM YYYY", {
      calendar: "gregorian",
      locale: "fa",
    })
  );
});

test("supports English month names in all calendar systems", () => {
  const islamic = parseCalendarDate("01 Muharram 1446", "DD MMM YYYY", {
    calendar: "islamic",
    locale: "en",
  });
  assert.ok(islamic);
  assert.equal(
    formatCalendarDate(islamic, "DD MMM YYYY", { calendar: "islamic", locale: "en" }),
    "01 Muharram 1446"
  );
  const gregorian = parseCalendarDate("29 February 2024", "DD MMM YYYY", {
    calendar: "gregorian",
    locale: "en",
  });
  assert.ok(gregorian);
});

test("applies and reverses Islamic date adjustment consistently", () => {
  const date = new Date(2024, 6, 7, 12);
  const civil = formatCalendarDate(date, "YYYY/MM/DD", {
    calendar: "islamic",
    locale: "fa",
    islamicDateAdjustment: 0,
  });
  assert.equal(civil, "1445/12/30");
  const adjusted = formatCalendarDate(date, "YYYY/MM/DD", {
    calendar: "islamic",
    locale: "fa",
    islamicDateAdjustment: 1,
  });
  assert.equal(adjusted, "1446/01/01");
  const parsed = parseCalendarDate(adjusted, "YYYY/MM/DD", {
    calendar: "islamic",
    locale: "fa",
    islamicDateAdjustment: 1,
  });
  assert.deepEqual(ymd(parsed), [2024, 7, 7]);
});

test("handles Islamic Civil leap-year month length", () => {
  assert.ok(parseCalendarDate("1445/12/30", "YYYY/MM/DD", { calendar: "islamic" }));
  assert.equal(
    parseCalendarDate("1446/12/30", "YYYY/MM/DD", { calendar: "islamic" }),
    null
  );
});

test("formats, parses and validates Gregorian leap dates", () => {
  const leap = parseCalendarDate("2024-02-29", "YYYY-MM-DD", { calendar: "gregorian" });
  assert.ok(leap);
  assert.equal(
    formatCalendarDate(leap, "YYYY-MM-DD", { calendar: "gregorian", locale: "en" }),
    "2024-02-29"
  );
  assert.equal(
    parseCalendarDate("2023-02-29", "YYYY-MM-DD", { calendar: "gregorian" }),
    null
  );
});

test("parses Persian and Arabic digits in every calendar mode", () => {
  assert.ok(parseCalendarDate("۱۴۴۶/۰۱/۰۱", "YYYY/MM/DD", { calendar: "islamic" }));
  assert.ok(parseCalendarDate("١٤٤٦/٠١/٠١", "YYYY/MM/DD", { calendar: "islamic" }));
});
