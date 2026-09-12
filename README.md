# Flexible Persian DatePicker — React Multi-Calendar DatePicker

[![npm version](https://img.shields.io/npm/v/flexible-multi-calendar-datepicker.svg)](https://www.npmjs.com/package/flexible-multi-calendar-datepicker)
[![npm downloads](https://img.shields.io/npm/dm/flexible-multi-calendar-datepicker.svg)](https://www.npmjs.com/package/flexible-multi-calendar-datepicker)
[![license](https://img.shields.io/npm/l/flexible-multi-calendar-datepicker.svg)](./LICENSE)

**Flexible Persian DatePicker** is a responsive, self-contained datepicker for React 18+. One component supports **Jalali (Shamsi / Solar Hijri)**, **Islamic Hijri** and **Gregorian** calendars and includes complete TypeScript declarations.

Use it as a **Shamsi Calendar** on an editable `input`, `button`, `span`, or any custom HTML element. The package includes its own Persian font and isolated styles, supports multiple Solar Hijri date formats, and does not depend on the host application's UI framework.

## Package links

- [Open the interactive Jalali, Islamic Hijri and Gregorian demo](https://shivatalebi.github.io/react-jalali-datepicker-test/)
- [Install Flexible Multi-Calendar DatePicker from npm](https://www.npmjs.com/package/flexible-multi-calendar-datepicker)
- [Source code and documentation on GitHub](https://github.com/shivatalebi/react-jalali-datepicker)
- [Report an issue or request a feature](https://github.com/shivatalebi/react-jalali-datepicker/issues)

## Preview

| Jalali / Shamsi | Islamic Hijri | Gregorian |
| --- | --- | --- |
| ![Jalali Shamsi calendar](https://raw.githubusercontent.com/ShivaTalebi/react-jalali-datepicker/feature/flexible-multi-calendar-datepicker/docs/assets/calendar-jalali.png) | ![Islamic Hijri calendar](https://raw.githubusercontent.com/ShivaTalebi/react-jalali-datepicker/feature/flexible-multi-calendar-datepicker/docs/assets/calendar-islamic.png) | ![Gregorian calendar](https://raw.githubusercontent.com/ShivaTalebi/react-jalali-datepicker/feature/flexible-multi-calendar-datepicker/docs/assets/calendar-gregorian.png) |

All screenshots above come directly from the test project. The UI, direction,
digits, month names, weekday names and default action labels are selected
automatically for the active calendar.

## Features and benefits

- Jalali / Persian / Solar Hijri calendar
- Islamic Hijri calendar with Persian and English month names
- Gregorian calendar
- Conversion and parsing between Jalali, Islamic and Gregorian dates
- Configurable Islamic date adjustment for official or locally observed dates
- React JavaScript and React TypeScript support
- Controlled and uncontrolled standard JavaScript `Date` values
- Immediate selection or optional Confirm/Cancel workflow
- Editable input with live calendar synchronization
- Editable mobile inputs with simultaneous keyboard and calendar access
- Reliable first-click selection after clearing an input
- Seven display and parse formats
- Persian, Arabic and Latin digit parsing
- Different optional labels and UI texts for every calendar instance
- Contextual **Today** shortcut after navigating to another day, month or year
- Multiple inclusive disabled date ranges
- Width- and height-aware responsive sizing on mobile, tablet and desktop
- Consistent `rem`-based typography, spacing and corner radius
- Responsive placement without covering the trigger element
- Automatic repositioning on resize and orientation changes
- Stable calendar scale while scrolling, with bottom-first and automatic top placement
- Stays open and tracks its trigger during page, container and mobile visual-viewport scrolling
- Portal rendering to avoid clipping by parent containers
- Outside-click and Escape-key closing
- Seven-column day alignment with or without the optional action footer
- Left-to-right year values inside the year combobox
- Bundled `IRANSansFaNum` font and automatically injected styles
- Per-instance custom font through a CSS variable
- RTL Persian UI and optional English direction/labels
- ESM, CommonJS and TypeScript declarations
- No manual CSS import required

## Installation

```bash
npm install flexible-multi-calendar-datepicker
```

React and React DOM 18 or newer are peer dependencies.

## Quick start

The value exchanged with your application is always a standard JavaScript
`Date | null`. Set `calendar` to choose how that value is displayed and edited:

| Calendar | `calendar` value | Default UI |
| --- | --- | --- |
| Jalali / Shamsi | `"jalali"` | Persian, RTL and Persian digits |
| Islamic Hijri | `"islamic"` | Arabic, RTL and Arabic-Indic digits |
| Gregorian | `"gregorian"` | English, LTR and Latin digits |

This reusable input works with every supported calendar:

```tsx
import { useRef, useState } from "react";
import {
  JalaliDatepicker,
  formatCalendarDate,
  parseCalendarDate,
  type CalendarDisplayFormat,
  type CalendarSystem,
} from "flexible-multi-calendar-datepicker";

type CalendarInputProps = {
  calendar: CalendarSystem;
  format?: CalendarDisplayFormat;
  label?: string;
  showActionButtons?: boolean;
};

export function CalendarInput({
  calendar,
  format = "YYYY/MM/DD",
  label,
  showActionButtons = true,
}: CalendarInputProps) {
  const anchorRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [text, setText] = useState("");

  const commit = (next: Date | null) => {
    setDate(next);
    setText(formatCalendarDate(next, format, { calendar }));
  };

  return (
    <>
      <input
        ref={anchorRef}
        value={text}
        placeholder={format}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);
          setDate(parseCalendarDate(nextText, format, { calendar }));
        }}
      />

      <JalaliDatepicker
        calendar={calendar}
        open={open}
        anchorRef={anchorRef}
        value={date}
        label={label}
        showActionButtons={showActionButtons}
        onConfirm={commit}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

Use it for each calendar as follows:

```tsx
// Jalali / Shamsi — Persian UI and 1405/05/24 output
<CalendarInput
  calendar="jalali"
  format="YYYY/MM/DD"
  label="تاریخ شروع"
/>

// Islamic Hijri — Arabic UI and textual month name
<CalendarInput
  calendar="islamic"
  format="DD MMM YYYY"
  label="تاريخ العقد"
/>

// Gregorian — English UI, Latin digits and Confirm/Cancel footer
<CalendarInput
  calendar="gregorian"
  format="dddd, DD MMMM YYYY"
  label="Start date"
  showActionButtons
/>
```

`onConfirm` receives a normal JavaScript `Date | null`, regardless of the
selected calendar. This makes it safe to store one value in state, send it to
an API, and display it in any supported calendar system.

## Jalali, Islamic and Gregorian calendars

`calendar` defaults to `"jalali"`, so existing integrations remain unchanged. Use the same component and JavaScript `Date` value for all supported calendar systems:

```tsx
import {
  PersianDatepicker,
  formatCalendarDate,
  parseCalendarDate,
  type CalendarSystem,
} from "flexible-multi-calendar-datepicker";

const calendar: CalendarSystem = "islamic"; // jalali | islamic | gregorian

const text = formatCalendarDate(date, "YYYY/MM/DD", {
  calendar,
  locale: "fa",
});

const dateObject = parseCalendarDate(text, "YYYY/MM/DD", {
  calendar,
  locale: "fa",
});

// Islamic: both numeric and textual output are supported.
const islamicNumeric = formatCalendarDate(date, "YYYY/MM/DD", {
  calendar: "islamic",
  locale: "fa",
}); // 1446/02/10

const islamicText = formatCalendarDate(date, "DD MMM YYYY", {
  calendar: "islamic",
  locale: "fa",
}); // 10 صفر 1446

// Gregorian mode is automatically English, LTR and uses Latin digits.
const gregorianText = formatCalendarDate(date, "dddd, DD MMMM YYYY", {
  calendar: "gregorian",
}); // Thursday, 15 August 2024

<PersianDatepicker
  calendar={calendar}
  open={open}
  anchorRef={anchorRef}
  value={dateObject}
  onConfirm={setDate}
  onClose={() => setOpen(false)}
/>;
```

Gregorian mode consistently renders English weekday/month names, Latin digits,
LTR dropdowns and English default action labels. The `labels` prop can still
override action texts for a specific instance.

It also ignores the bundled Persian digit font and uses an isolated system
Latin font stack. A consumer can customize that stack without affecting other
calendar modes:

```tsx
<PersianDatepicker
  calendar="gregorian"
  style={{
    "--rjd-gregorian-font-family": 'Inter, "Segoe UI", sans-serif',
  } as React.CSSProperties}
  {...props}
/>
```

Islamic mode uses a deterministic Civil Hijri calculation and applies a default `+1` day adjustment to match commonly announced dates. Lunar calendars can differ by country, timezone and moon sighting. Override the adjustment per instance when required:

With the default `locale="fa"`, Islamic mode presents an Arabic RTL interface:
Arabic month and weekday names, meaningful single-letter weekday headings
(`س، ح، ن، ث، ر، خ، ج`), Arabic-Indic calendar digits and Arabic default action
texts. Pass `locale="en"` for the English Islamic interface. Per-instance
`labels` still override all default action texts.

```tsx
<PersianDatepicker
  calendar="islamic"
  islamicDateAdjustment={0} // -2 | -1 | 0 | 1 | 2
  {...props}
/>
```

The same adjustment must be passed to `formatCalendarDate` and `parseCalendarDate` when a non-default value is used. This keeps display, parsing and selection fully reversible without an accidental one-day drift.

## Selection modes

The default mode commits and closes immediately after selecting a valid day:

```tsx
<JalaliDatepicker
  open={open}
  anchorRef={anchorRef}
  value={date}
  showActionButtons={false}
  onConfirm={setDate}
  onClose={() => setOpen(false)}
/>
```

With `showActionButtons`, a selection remains internal until Confirm is clicked. Cancel, Escape and outside close preserve the previous consumer value.

```tsx
<JalaliDatepicker
  open={open}
  anchorRef={anchorRef}
  value={date}
  showActionButtons
  labels={{ confirm: "ثبت", cancel: "بازگشت" }}
  onConfirm={setDate}
  onClose={() => setOpen(false)}
/>
```

When neither `value` nor `defaultValue` is supplied, today is selected visually on open. It is emitted only after the user selects a date or confirms it.

## Editable input with live synchronization

The input belongs to the consumer and remains fully editable. Parse its text and pass the result back as `value`; changing the day, month or year updates an open calendar immediately.

```tsx
import { useRef, useState } from "react";
import {
  JalaliDatepicker,
  formatJalaliDate,
  parseJalaliDate,
  type JalaliDisplayFormat,
} from "flexible-multi-calendar-datepicker";

const format: JalaliDisplayFormat = "YYYY/MM/DD";

export function EditableDateInput() {
  const anchorRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [date, setDate] = useState<Date | null>(null);

  const commit = (next: Date | null) => {
    setDate(next);
    setText(formatJalaliDate(next, format, "fa"));
  };

  return (
    <>
      <input
        ref={anchorRef}
        value={text}
        placeholder={format}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const nextText = event.target.value;
          setText(nextText);
          setDate(parseJalaliDate(nextText, format, "fa"));
        }}
      />
      <button type="button" onClick={() => commit(null)}>پاک‌کردن</button>

      <JalaliDatepicker
        open={open}
        anchorRef={anchorRef}
        value={date}
        showActionButtons
        onConfirm={commit}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

`parseJalaliDate` accepts Latin (`1405`), Persian (`۱۴۰۵`) and Arabic (`١٤٠٥`) digits. Empty, incomplete or invalid input returns `null`, removing the visible selection until a valid date is entered.

## Button, span or custom trigger

Any HTMLElement can anchor the popup:

```tsx
const anchorRef = useRef<HTMLSpanElement | null>(null);

<span
  ref={anchorRef}
  role="button"
  tabIndex={0}
  onClick={() => setOpen(true)}
>
  {date ? formatJalaliDate(date, "dddd, DD MMMM YYYY", "fa") : "انتخاب تاریخ"}
</span>

<JalaliDatepicker
  open={open}
  anchorRef={anchorRef}
  value={date}
  onConfirm={setDate}
  onClose={() => setOpen(false)}
/>
```

## Supported formats

Both formatting and parsing support:

| Format | Example |
| --- | --- |
| `YYYY-MM-DD` | `1405-05-24` |
| `YYYY/MM/DD` | `1405/05/24` |
| `DD/MM/YYYY` | `24/05/1405` |
| `DD MMM YYYY` | `24 مرداد 1405` |
| `MMMM DD, YYYY` | `مرداد 24، 1405` |
| `dddd DD MMMM YYYY` | `شنبه 24 مرداد 1405` |
| `dddd, DD MMMM YYYY` | `شنبه، 24 مرداد 1405` |

```tsx
const apiText = formatJalaliDate(date, "YYYY-MM-DD", "en");
const faText = formatJalaliDate(date, "dddd, DD MMMM YYYY", "fa");
const dateObject = parseJalaliDate("1405/05/24", "YYYY/MM/DD", "fa");
```

## Custom label per instance

`label` accepts any React node. Omit it, pass `null`, or pass an empty string to hide it.

```tsx
<JalaliDatepicker label="تاریخ شروع قرارداد" {...startProps} />
<JalaliDatepicker label={<strong>تاریخ تحویل</strong>} {...deliveryProps} />
<JalaliDatepicker label={null} {...compactProps} />
```

## Today shortcut

When the selected date or visible month/year differs from today, a blue `امروز` action appears beside the date heading. It returns from any month or year to today and selects it.

```tsx
<JalaliDatepicker labels={{ today: "برو به امروز" }} {...props} />
```

It waits for Confirm in confirmation mode and commits immediately in immediate mode. If today is disabled, the action is disabled.

## Disabled date ranges

Pass any number of inclusive ranges. Disabled dates remain visible in light purple/gray, cannot be selected, and do not close the popup. Reversed boundaries are normalized automatically.

```tsx
import {
  parseJalaliDate,
  type JalaliDisabledDateRange,
} from "flexible-multi-calendar-datepicker";

const disabledDateRanges: JalaliDisabledDateRange[] = [
  {
    from: parseJalaliDate("1405/05/26", "YYYY/MM/DD", "fa")!,
    to: parseJalaliDate("1405/06/03", "YYYY/MM/DD", "fa")!,
  },
  {
    from: parseJalaliDate("1405/07/10", "YYYY/MM/DD", "fa")!,
    to: parseJalaliDate("1405/07/12", "YYYY/MM/DD", "fa")!,
  },
];

<JalaliDatepicker disabledDateRanges={disabledDateRanges} {...props} />
```

## Controlled and default values

```tsx
// Controlled
<JalaliDatepicker value={date} onChange={setDate} {...props} />

// Initial uncontrolled value
<JalaliDatepicker defaultValue={new Date(2026, 7, 15)} {...props} />
```

`onChange` is optional. It runs when a value is committed: immediately in immediate mode, or with Confirm in confirmation mode.

## Built-in and custom fonts

`IRANSansFaNum` and the required CSS are bundled and injected automatically. The calendar keeps its own font even when the host application uses another font; no CSS import or asset copy is required.

Override one instance with `--rjd-font-family`:

```tsx
<JalaliDatepicker className="product-datepicker" {...props} />
```

```css
@font-face {
  font-family: "MyProductFont";
  src: url("/fonts/my-product-font.woff2") format("woff2");
}

.product-datepicker {
  --rjd-font-family: "MyProductFont", sans-serif;
}
```

Or inline:

```tsx
<JalaliDatepicker
  style={{
    "--rjd-font-family": '"MyProductFont", sans-serif',
  } as React.CSSProperties}
  {...props}
/>
```

## Custom texts and locale

```tsx
<JalaliDatepicker
  locale="fa"
  labels={{
    confirm: "تایید",
    cancel: "انصراف",
    chooseDate: "انتخاب تاریخ",
    today: "امروز",
    titleFrom: "از تاریخ",
    titleTo: "تا تاریخ",
  }}
  {...props}
/>
```

`locale="fa"` uses RTL and `locale="en"` uses LTR. `titleFrom` and `titleTo` are retained for compatibility when `label` is exactly `از تاریخ` or `تا تاریخ`; new code should pass the final text directly through `label`.

## Portal and responsive behavior

The popup renders in `document.body` by default, avoiding clipping by cards, modals and `overflow` containers. It measures the anchor and viewport, chooses a suitable side, and recalculates on scrolling, resizing and orientation changes.

```tsx
const portalHost = document.getElementById("calendar-layer");
<JalaliDatepicker portalContainer={portalHost} {...props} />
```

All dimensions use `rem`; changing the root font size scales the calendar consistently:

```css
html { font-size: 16px; }
@media (max-width: 480px) {
  html { font-size: 14px; }
}
```

## Complete API

### `JalaliDatepickerProps`

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | required | Controls popup visibility. |
| `anchorRef` | `RefObject<HTMLElement>` | required | Element used for popup positioning. |
| `value` | `Date \| null` | — | Controlled selected value. |
| `defaultValue` | `Date \| null` | `null` | Initial uncontrolled value. |
| `onConfirm` | `(date: Date \| null) => void` | required | Receives a committed date. |
| `onClose` | `() => void` | required | Requests that the consumer close the popup. |
| `onChange` | `(date: Date \| null) => void` | — | Optional committed-value notification. |
| `showActionButtons` | `boolean` | `false` | Shows Confirm/Cancel instead of immediate commit. |
| `label` | `ReactNode` | — | Per-instance heading; empty values render nothing. |
| `locale` | `"fa" \| "en"` | `"fa"` | Direction and localized output. Gregorian mode always resolves to English/LTR. |
| `calendar` | `"jalali" \| "islamic" \| "gregorian"` | `"jalali"` | Selects the calendar system. |
| `islamicDateAdjustment` | `-2 \| -1 \| 0 \| 1 \| 2` | `1` | Aligns Islamic dates with an official or locally observed calendar. |
| `labels` | `object` | Persian texts | Overrides Today, Confirm, Cancel and helper texts. |
| `disabledDateRanges` | `readonly { from: Date; to: Date }[]` | `[]` | Inclusive non-selectable ranges. |
| `className` | `string` | — | Extra class on the popup root. |
| `style` | `React.CSSProperties` | — | Extra inline styles and CSS variables. |
| `portalContainer` | `HTMLElement \| null` | `document.body` | Optional portal host. |

### Utility API

```ts
formatCalendarDate(
  date: Date | null | undefined,
  format?: CalendarDisplayFormat,
  options?: CalendarFormatOptions
): string;

parseCalendarDate(
  input: string,
  format: CalendarDisplayFormat,
  options?: CalendarFormatOptions
): Date | null;

formatJalaliDate(
  date: Date | null | undefined,
  format?: JalaliDisplayFormat,
  locale?: "fa" | "en"
): string;

parseJalaliDate(
  input: string,
  format: JalaliDisplayFormat,
  locale?: "fa" | "en"
): Date | null;
```

Exported types include `CalendarSystem`, `CalendarLocale`, `IslamicDateAdjustment`, `CalendarDisplayFormat`, `CalendarFormatOptions`, `JalaliDatepickerProps`, `JalaliDisabledDateRange`, `JalaliDisplayFormat`, and `JalaliFormatLocale`.

## Accessibility and closing

- Escape and outside pointer interactions close the popup.
- For a custom trigger such as `span`, add `role`, `tabIndex`, keyboard handlers and an accessible name.
- Disabled dates expose disabled state and cannot commit a value.
- Month and year controls support keyboard interaction.

## License

[MIT](./LICENSE) © SHIVATALEBI
