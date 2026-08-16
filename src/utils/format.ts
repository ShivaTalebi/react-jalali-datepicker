import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian.js";

export type JalaliDisplayFormat =
  | "YYYY-MM-DD"
  | "YYYY/MM/DD"
  | "DD/MM/YYYY"
  | "DD MMM YYYY"
  | "MMMM DD, YYYY"
  | "dddd, DD MMMM YYYY"
  | "dddd DD MMMM YYYY";

export type JalaliFormatLocale = "fa" | "en";

const pad2 = (value: number) => String(value).padStart(2, "0");

const PERSIAN_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

const normalizeDigits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));

function createJalaliDate(year: number, month: number, day: number) {
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const result = new DateObject({ calendar: persian, year, month, day });
  if (
    result.year !== year ||
    result.month.number !== month ||
    result.day !== day
  ) {
    return null;
  }
  return result.toDate();
}

/**
 * Formats a JavaScript Date using the Jalali calendar.
 *
 * Supported tokens: YYYY, MM, DD, MMM, MMMM and dddd.
 * Numeric output intentionally uses Latin digits so it can be sent to APIs
 * and displayed consistently. Month and weekday labels follow `locale`.
 */
export function formatJalaliDate(
  date: Date | null | undefined,
  format: JalaliDisplayFormat = "YYYY-MM-DD",
  locale: JalaliFormatLocale = "fa"
): string {
  if (!date || Number.isNaN(date.getTime())) return "";

  const jalali = new DateObject({ date, calendar: persian });
  const monthName = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-US-u-ca-persian",
    { month: "long" }
  ).format(date);
  const weekdayName = new Intl.DateTimeFormat(
    locale === "fa" ? "fa-IR-u-ca-persian" : "en-US-u-ca-persian",
    { weekday: "long" }
  ).format(date);

  const tokens: Record<string, string> = {
    YYYY: String(jalali.year),
    MMMM: monthName,
    MMM: monthName,
    MM: pad2(jalali.month.number),
    DD: pad2(jalali.day),
    dddd: weekdayName,
  };

  const output = format.replace(
    /dddd|MMMM|YYYY|MMM|MM|DD/g,
    (token) => tokens[token]
  );

  return locale === "fa" ? output.replace(/,/g, "،") : output;
}

/** Parses a formatted Jalali date back into a JavaScript Date. */
export function parseJalaliDate(
  input: string,
  format: JalaliDisplayFormat,
  locale: JalaliFormatLocale = "fa"
): Date | null {
  const value = normalizeDigits(input).trim();
  if (!value) return null;

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
    if (format.startsWith("dddd")) {
      text = text.replace(/^\S+[,]?\s+/, "");
    }

    const monthFirst = format === "MMMM DD, YYYY";
    match = monthFirst
      ? text.match(/^(\S+)\s+(\d{1,2})[,]?\s+(\d{4})$/)
      : text.match(/^(\d{1,2})\s+(\S+)\s+(\d{4})$/);

    if (match) {
      const monthLabel = monthFirst ? match[1] : match[2];
      day = Number(monthFirst ? match[2] : match[1]);
      year = Number(match[3]);

      if (locale === "fa") {
        month = PERSIAN_MONTHS.indexOf(
          monthLabel as (typeof PERSIAN_MONTHS)[number]
        ) + 1;
      } else {
        const englishMonths = PERSIAN_MONTHS.map((_, index) => {
          const sample = new DateObject({
            calendar: persian,
            year: 1400,
            month: index + 1,
            day: 1,
          }).toDate();
          return new Intl.DateTimeFormat("en-US-u-ca-persian", {
            month: "long",
          }).format(sample);
        });
        month = englishMonths.findIndex(
          (name) => name.toLowerCase() === monthLabel.toLowerCase()
        ) + 1;
      }
    }
  }

  return match ? createJalaliDate(year, month, day) : null;
}
