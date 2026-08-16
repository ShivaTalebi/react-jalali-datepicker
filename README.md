# flexible-persian-datepicker

A flexible, responsive and self-contained **Jalali (Solar Hijri / Shamsi) datepicker** for React 18+ and TypeScript.

Attach it to an `input`, `button`, `span`, or any custom element. The package includes its own Persian font and styles, supports typed dates and multiple output formats, and does not depend on the host application's UI framework.

## What's new in v1.2.4

- Unified width-driven responsive sizing for every calendar instance
- Fixed inconsistent popup sizes caused by trigger position and vertical space
- Fixed live-resize race conditions between viewport and element observers
- Fixed detached popups after responsive reflow moves the trigger off-screen
- Close safely on external page/container scroll while preserving combobox scroll
- Preserved a constant `20rem` width on larger screens and proportional scaling only when the viewport is narrower
- Removed duplicate mobile media-query scaling so typography, spacing and radius scale exactly once
- Fixed alignment between weekday headings and all seven day columns
- Fixed the missing bottom corner radius when Confirm/Cancel buttons are hidden

## Fixed in v1.2.3

- Fixed alignment between weekday headings and all seven day columns

## Fixed in v1.2.2

- Fixed a seven-column calendar grid regression in the footerless layout

## Fixed in v1.2.1

- Fixed the missing bottom corner radius when Confirm/Cancel buttons are hidden

## Added in v1.2.0

- Contextual **Today** shortcut after navigating away from today
- A different optional label for every instance, or no label at all
- Responsive positioning and scaling on mobile, tablet and desktop
- `rem`-based dimensions for consistent flexible scaling
- Improved month/year combobox and left-to-right year display
- Reliable selection after clearing an input and live synchronization while typing
- Inclusive disabled date ranges with built-in styling

## Features

- Jalali / Persian / Solar Hijri calendar
- React JavaScript and React TypeScript support
- Controlled and uncontrolled standard JavaScript `Date` values
- Immediate selection or optional Confirm/Cancel workflow
- Editable input with live calendar synchronization
- Seven display and parse formats
- Persian, Arabic and Latin digit parsing
- Custom label and UI texts per instance
- Multiple inclusive disabled date ranges
- Responsive placement without covering the trigger
- Automatic repositioning on resize, scroll and orientation changes
- Portal rendering to avoid clipping by parent containers
- Outside-click and Escape-key closing
- Bundled `IRANSansFaNum` font and automatically injected styles
- Per-instance custom font through a CSS variable
- RTL Persian UI and optional English direction/labels
- ESM, CommonJS and TypeScript declarations
- No manual CSS import required

## Installation

```bash
npm install flexible-persian-datepicker
```

React and React DOM 18 or newer are peer dependencies.

## Basic usage

```tsx
import { useRef, useState } from "react";
import {
  JalaliDatepicker,
  formatJalaliDate,
} from "flexible-persian-datepicker";

export default function BasicDatepicker() {
  const anchorRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | null>(null);

  return (
    <>
      <input
        ref={anchorRef}
        readOnly
        value={formatJalaliDate(date, "YYYY/MM/DD", "fa")}
        placeholder="انتخاب تاریخ"
        onClick={() => setOpen(true)}
      />

      <JalaliDatepicker
        open={open}
        anchorRef={anchorRef}
        value={date}
        label="تاریخ شروع"
        onConfirm={setDate}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

`onConfirm` receives a normal JavaScript `Date | null`. Use `formatJalaliDate` to display it as a Jalali date or send the `Date` to your API.

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
} from "flexible-persian-datepicker";

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
} from "flexible-persian-datepicker";

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
| `locale` | `"fa" \| "en"` | `"fa"` | Direction and localized calendar output. |
| `labels` | `object` | Persian texts | Overrides Today, Confirm, Cancel and helper texts. |
| `disabledDateRanges` | `readonly { from: Date; to: Date }[]` | `[]` | Inclusive non-selectable ranges. |
| `className` | `string` | — | Extra class on the popup root. |
| `style` | `React.CSSProperties` | — | Extra inline styles and CSS variables. |
| `portalContainer` | `HTMLElement \| null` | `document.body` | Optional portal host. |

### Utility API

```ts
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

Exported types include `JalaliDatepickerProps`, `JalaliDisabledDateRange`, `JalaliDisplayFormat`, and `JalaliFormatLocale`.

## Accessibility and closing

- Escape and outside pointer interactions close the popup.
- For a custom trigger such as `span`, add `role`, `tabIndex`, keyboard handlers and an accessible name.
- Disabled dates expose disabled state and cannot commit a value.
- Month and year controls support keyboard interaction.

## License

[MIT](./LICENSE) © SHIVATALEBI
