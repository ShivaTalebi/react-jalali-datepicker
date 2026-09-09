import * as React from "react";
import { useMemo } from "react";
import {
  WEEKDAYS,
  ISLAMIC_WEEKDAYS_AR,
  addLocalDays,
  fromCalendarParts,
  toCalendarObject,
  type CalendarLocale,
  type CalendarSystem,
  type IslamicDateAdjustment,
} from "../utils/calendar";

type CalendarGridProps = {
  calendar: CalendarSystem;
  locale: CalendarLocale;
  islamicDateAdjustment: IslamicDateAdjustment;
  year: number;
  month: number;
  selected: Date | null;
  today: Date;
  isDisabled: (date: Date | null) => boolean;
  onSelect: (date: Date) => void;
};

const sameLocalDay = (a: Date | null, b: Date | null) =>
  !!a && !!b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const digits = (value: number, calendar: CalendarSystem, locale: CalendarLocale) =>
  calendar === "islamic" && locale === "fa"
    ? value.toLocaleString("ar-EG-u-nu-arab", { useGrouping: false })
    : locale === "fa"
      ? value.toLocaleString("fa-IR", { useGrouping: false })
      : String(value);

export function CalendarGrid({
  calendar,
  locale,
  islamicDateAdjustment,
  year,
  month,
  selected,
  today,
  isDisabled,
  onSelect,
}: CalendarGridProps) {
  const cells = useMemo(() => {
    const first = fromCalendarParts(
      year,
      month,
      1,
      calendar,
      locale,
      islamicDateAdjustment
    );
    if (!first) return [];
    const saturdayBasedOffset = (first.getDay() + 1) % 7;
    const gridStart = addLocalDays(first, -saturdayBasedOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = addLocalDays(gridStart, index);
      const object = toCalendarObject(date, calendar, locale, islamicDateAdjustment);
      return {
        date,
        day: object.day,
        currentMonth: object.year === year && object.month.number === month,
      };
    });
  }, [calendar, locale, islamicDateAdjustment, year, month]);

  return (
    <div className="rjd-calendar-grid" role="grid" aria-label="calendar">
      <div className="rjd-weekdays" role="row">
        {(calendar === "islamic" && locale === "fa"
          ? ISLAMIC_WEEKDAYS_AR
          : WEEKDAYS[locale]
        ).map((weekday) => (
          <span key={weekday} role="columnheader">{weekday}</span>
        ))}
      </div>
      <div className="rjd-days" role="rowgroup">
        {cells.map(({ date, day, currentMonth }) => {
          const disabled = isDisabled(date);
          const selectedDay = sameLocalDay(date, selected);
          return (
            <button
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
              type="button"
              className="rjd-day"
              role="gridcell"
              aria-selected={selectedDay}
              aria-disabled={disabled}
              data-outside-month={!currentMonth || undefined}
              data-today={sameLocalDay(date, today) || undefined}
              data-rjd-disabled={disabled || undefined}
              disabled={disabled}
              tabIndex={selectedDay ? 0 : -1}
              onClick={() => onSelect(date)}
              onKeyDown={(event) => {
                const delta =
                  event.key === "ArrowRight" ? (locale === "fa" ? -1 : 1) :
                  event.key === "ArrowLeft" ? (locale === "fa" ? 1 : -1) :
                  event.key === "ArrowDown" ? 7 :
                  event.key === "ArrowUp" ? -7 : 0;
                if (!delta) return;
                event.preventDefault();
                const target = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(".rjd-day");
                const index = target ? Array.from(target).indexOf(event.currentTarget) : -1;
                target?.[index + delta]?.focus();
              }}
            >
              {digits(day, calendar, locale)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
