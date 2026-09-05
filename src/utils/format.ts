import {
  CALENDAR_MONTHS,
  fromCalendarParts,
  toCalendarObject,
  type CalendarLocale,
  type CalendarSystem,
  type IslamicDateAdjustment,
} from "./calendar";

export type CalendarDisplayFormat =
  | "YYYY-MM-DD"
  | "YYYY/MM/DD"
  | "DD/MM/YYYY"
  | "DD MMM YYYY"
  | "MMMM DD, YYYY"
  | "dddd, DD MMMM YYYY"
  | "dddd DD MMMM YYYY";

export type JalaliDisplayFormat = CalendarDisplayFormat;
export type JalaliFormatLocale = CalendarLocale;

export type CalendarFormatOptions = {
  calendar?: CalendarSystem;
  locale?: CalendarLocale;
  islamicDateAdjustment?: IslamicDateAdjustment;
};

const pad2 = (value: number) => String(value).padStart(2, "0");
const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

const WEEKDAY_NAMES: Record<CalendarLocale, readonly string[]> = {
  fa: ["یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه", "شنبه"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
};

export function formatCalendarDate(
  date: Date | null | undefined,
  format: CalendarDisplayFormat = "YYYY-MM-DD",
  options: CalendarFormatOptions = {}
): string {
  if (!date || Number.isNaN(date.getTime())) return "";
  const calendar = options.calendar ?? "jalali";
  const locale = calendar === "gregorian" ? "en" : (options.locale ?? "fa");
  const adjustment = options.islamicDateAdjustment ?? (calendar === "islamic" ? 1 : 0);
  const object = toCalendarObject(date, calendar, locale, adjustment);
  const monthName = CALENDAR_MONTHS[calendar][locale][object.month.number - 1];
  const tokens: Record<string, string> = {
    YYYY: String(object.year),
    MMMM: monthName,
    MMM: monthName,
    MM: pad2(object.month.number),
    DD: pad2(object.day),
    dddd: WEEKDAY_NAMES[locale][date.getDay()],
  };
  const output = format.replace(/dddd|MMMM|YYYY|MMM|MM|DD/g, (token) => tokens[token]);
  return locale === "fa" ? output.replace(/,/g, "،") : output;
}

export function parseCalendarDate(
  input: string,
  format: CalendarDisplayFormat,
  options: CalendarFormatOptions = {}
): Date | null {
  const value = normalizeDigits(input).trim();
  if (!value) return null;
  const calendar = options.calendar ?? "jalali";
  const locale = calendar === "gregorian" ? "en" : (options.locale ?? "fa");
  const adjustment = options.islamicDateAdjustment ?? (calendar === "islamic" ? 1 : 0);
  let year = 0;
  let month = 0;
  let day = 0;
  let match: RegExpMatchArray | null = null;

  if (format === "YYYY-MM-DD") {
    match = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) [, year, month, day] = match.map(Number);
  } else if (format === "YYYY/MM/DD") {
    match = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (match) [, year, month, day] = match.map(Number);
  } else if (format === "DD/MM/YYYY") {
    match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (match) [, day, month, year] = match.map(Number);
  } else {
    let text = value.replace(/،/g, ",");
    if (format.startsWith("dddd")) text = text.replace(/^\S+[,]?\s+/, "");
    const monthFirst = format === "MMMM DD, YYYY";
    match = monthFirst
      ? text.match(/^(.*?)\s+(\d{1,2})[,]?\s+(\d{4})$/)
      : text.match(/^(\d{1,2})\s+(.*?)\s+(\d{4})$/);
    if (match) {
      const monthLabel = (monthFirst ? match[1] : match[2]).trim().toLowerCase();
      day = Number(monthFirst ? match[2] : match[1]);
      year = Number(match[3]);
      month = CALENDAR_MONTHS[calendar][locale].findIndex(
        (name) => name.toLowerCase() === monthLabel
      ) + 1;
    }
  }

  return match
    ? fromCalendarParts(year, month, day, calendar, locale, adjustment)
    : null;
}

export function formatJalaliDate(
  date: Date | null | undefined,
  format: JalaliDisplayFormat = "YYYY-MM-DD",
  locale: JalaliFormatLocale = "fa"
): string {
  return formatCalendarDate(date, format, { calendar: "jalali", locale });
}

export function parseJalaliDate(
  input: string,
  format: JalaliDisplayFormat,
  locale: JalaliFormatLocale = "fa"
): Date | null {
  return parseCalendarDate(input, format, { calendar: "jalali", locale });
}
