import { ensureStylesInjected } from "./styles/auto-css";
ensureStylesInjected(); // یک‌بار تزریق خودکار استایل‌ها

export { default as JalaliDatepicker } from "./components/JalaliDatepicker";
export type {
  JalaliDatepickerProps,
  JalaliDisabledDateRange,
} from "./components/JalaliDatepicker";

export { default as ComboSelect } from "./components/ComboSelect";
export type {
  ComboSelectProps,
  Option as ComboSelectOption,
  SingleChange as ComboSelectSingleChange,
  MultiChange as ComboSelectMultiChange,
} from "./components/ComboSelect";

export { ArrowDownCombo, TickCircle } from "./components/icons";

export { formatJalaliDate, parseJalaliDate } from "./utils/format";
export type {
  JalaliDisplayFormat,
  JalaliFormatLocale,
} from "./utils/format";
