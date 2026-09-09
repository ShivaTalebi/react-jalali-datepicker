import DateObject from "react-date-object";
import arabic from "react-date-object/calendars/arabic.js";
import gregorian from "react-date-object/calendars/gregorian.js";
import persian from "react-date-object/calendars/persian.js";
import arabic_en from "react-date-object/locales/arabic_en.js";
import arabic_fa from "react-date-object/locales/arabic_fa.js";
import gregorian_en from "react-date-object/locales/gregorian_en.js";
import gregorian_fa from "react-date-object/locales/gregorian_fa.js";
import persian_en from "react-date-object/locales/persian_en.js";
import persian_fa from "react-date-object/locales/persian_fa.js";

export type CalendarSystem = "jalali" | "islamic" | "gregorian";
export type CalendarLocale = "fa" | "en";
export type IslamicDateAdjustment = -2 | -1 | 0 | 1 | 2;

const DAY_MS = 86_400_000;

export const CALENDAR_MONTHS: Record<
  CalendarSystem,
  Record<CalendarLocale, readonly string[]>
> = {
  jalali: {
    fa: [
      "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
      "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند",
    ],
    en: [
      "Farvardin", "Ordibehesht", "Khordad", "Tir", "Mordad", "Shahrivar",
      "Mehr", "Aban", "Azar", "Dey", "Bahman", "Esfand",
    ],
  },
  islamic: {
    fa: [
      "محرم", "صفر", "ربيع الأول", "ربيع الآخر", "جمادى الأولى", "جمادى الآخرة",
      "رجب", "شعبان", "رمضان", "شوال", "ذو القعدة", "ذو الحجة",
    ],
    en: [
      "Muharram", "Safar", "Rabi al-Awwal", "Rabi al-Thani", "Jumada al-Awwal",
      "Jumada al-Thani", "Rajab", "Shaban", "Ramadan", "Shawwal",
      "Dhu al-Qadah", "Dhu al-Hijjah",
    ],
  },
  gregorian: {
    fa: [
      "ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن",
      "ژوئیه", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر",
    ],
    en: [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ],
  },
};

export const WEEKDAYS: Record<CalendarLocale, readonly string[]> = {
  fa: ["ش", "ی", "د", "س", "چ", "پ", "ج"],
  en: ["Sa", "Su", "Mo", "Tu", "We", "Th", "Fr"],
};

/** Meaningful Arabic weekday initials in Saturday-first calendar order. */
export const ISLAMIC_WEEKDAYS_AR = ["س", "ح", "ن", "ث", "ر", "خ", "ج"] as const;

export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 12);
}

export function normalizeDate(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
}

export function getCalendarEngine(system: CalendarSystem) {
  if (system === "islamic") return arabic;
  if (system === "gregorian") return gregorian;
  return persian;
}

export function getCalendarLocale(system: CalendarSystem, locale: CalendarLocale) {
  if (system === "islamic") return locale === "fa" ? arabic_fa : arabic_en;
  if (system === "gregorian") return locale === "fa" ? gregorian_fa : gregorian_en;
  return locale === "fa" ? persian_fa : persian_en;
}

export function toCalendarObject(
  date: Date,
  system: CalendarSystem,
  locale: CalendarLocale = "fa",
  islamicDateAdjustment: IslamicDateAdjustment = 0
) {
  const adjusted = system === "islamic"
    ? addLocalDays(date, islamicDateAdjustment)
    : normalizeDate(date);
  return new DateObject({
    date: adjusted,
    calendar: getCalendarEngine(system),
    locale: getCalendarLocale(system, locale),
  });
}

export function fromCalendarParts(
  year: number,
  month: number,
  day: number,
  system: CalendarSystem,
  locale: CalendarLocale = "fa",
  islamicDateAdjustment: IslamicDateAdjustment = 0
): Date | null {
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const object = new DateObject({
    calendar: getCalendarEngine(system),
    locale: getCalendarLocale(system, locale),
    year,
    month,
    day,
  });
  if (object.year !== year || object.month.number !== month || object.day !== day) return null;
  const date = normalizeDate(object.toDate());
  return system === "islamic"
    ? addLocalDays(date, -islamicDateAdjustment)
    : date;
}

export function calendarMonthLength(
  year: number,
  month: number,
  system: CalendarSystem,
  locale: CalendarLocale = "fa"
): number {
  const object = new DateObject({
    calendar: getCalendarEngine(system),
    locale: getCalendarLocale(system, locale),
    year,
    month,
    day: 1,
  });
  return object.month.length;
}

export function localDayKey(date: Date): number {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}
