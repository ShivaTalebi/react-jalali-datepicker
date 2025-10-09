# react-jalali-datepicker

A reusable **Jalali/Persian datepicker** for React (popup anchored to any element), built on top of [`zaman`](https://www.npmjs.com/package/zaman) and `react-date-object`.

## Install

```bash
npm i react-jalali-datepicker
# (React 18+ required)


Quick Start:

import React, { useRef, useState } from "react";
import { JalaliDatepicker } from "react-jalali-datepicker";

export default function Demo() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<Date | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div style={{ padding: 24 }}>
      <button ref={anchorRef} onClick={() => setOpen(true)}>
        Pick date {value ? "✓" : ""}
      </button>

      <JalaliDatepicker
        open={open}
        anchorRef={anchorRef}
        value={value}                 // controlled (or use defaultValue)
        onChange={setValue}           // fires on each selection
        onConfirm={(d) => { setValue(d); setOpen(false); }}
        onClose={() => setOpen(false)}
        label="تا تاریخ"              // shows “Today” button (optional)
        locale="fa"                    // "fa" | "en"
        labels={{                      // i18n (all optional)
          today: "امروز",
          fromBeginning: "از ابتدا",
          confirm: "تایید",
          cancel: "انصراف",
          chooseDate: "انتخاب تاریخ"
        }}
      />
    </div>
  );
}


Uncontrolled usage:

<JalaliDatepicker
  open={open}
  anchorRef={anchorRef}
  defaultValue={new Date()}
  onConfirm={(d) => { console.log(d); setOpen(false); }}
  onClose={() => setOpen(false)}
/>


Props:

export type JalaliDatepickerProps = {
  open: boolean;
  anchorRef:
    | React.RefObject<HTMLElement>
    | React.MutableRefObject<HTMLElement | null>;

  // controlled / uncontrolled
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (d: Date | null) => void;

  // actions
  onConfirm: (d: Date | null) => void;
  onClose: () => void;

  // starting helpers
  beginDate?: Date | string;
  beginAutoConfirm?: boolean;
  beginCalendar?: "jalali" | "gregorian";

  // UI
  label?: "از تاریخ" | "تا تاریخ"; // toggles header quick buttons
  locale?: "fa" | "en";             // sets dir="rtl"/"ltr"
  className?: string;
  style?: React.CSSProperties;

  // i18n
  labels?: {
    titleFrom?: string;
    titleTo?: string;
    today?: string;
    fromBeginning?: string;
    confirm?: string;
    cancel?: string;
    chooseDate?: string;
  };
};


Styling

Base styles are included automatically when you import the component.

import { JalaliDatepicker } from "react-jalali-datepicker";
// CSS is bundled; no extra import required

If you want to override styles, provide a className and add your CSS with higher specificity.

Accessibility:

Press Esc to close.

Click outside the popup to close.

Anchors can live anywhere; the popup positions relative to the closest ancestor with [data-portal-root] (or falls back to document.body).

MIT © SHIVATALEBI
```
