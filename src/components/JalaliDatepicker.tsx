import * as React from "react";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Calendar, CalendarProvider } from "zaman";
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian.js";
import persian_fa from "react-date-object/locales/persian_fa.js";
import { ComboSelect, Option as CSOption } from "./ComboSelect";
import "../styles/styles.css";

/* ---------------- types ---------------- */
type AnchorRef =
  | React.RefObject<HTMLElement>
  | React.MutableRefObject<HTMLElement | null>;

export type JalaliDisabledDateRange = {
  /** First disabled day (inclusive). */
  from: Date;
  /** Last disabled day (inclusive). */
  to: Date;
};

export type JalaliDatepickerProps = {
  open: boolean;
  anchorRef: AnchorRef;

  // controlled / uncontrolled
  value?: Date | null;
  defaultValue?: Date | null;
  onChange?: (d: Date | null) => void;

  // actions
  onConfirm: (d: Date | null) => void;
  onClose: () => void;

  // UI
  /** Optional per-instance label. Pass an empty string or null to hide it. */
  label?: React.ReactNode;
  locale?: "fa" | "en";
  className?: string;
  style?: React.CSSProperties;
  /** محل اختیاری Portal؛ پیش‌فرض document.body است. */
  portalContainer?: HTMLElement | null;

  /**
   * نمایش دکمه‌های تأیید و انصراف.
   * false: انتخاب روز فوراً مقدار را ارسال می‌کند و تقویم بسته می‌شود.
   * true: مقدار فقط با تأیید ارسال می‌شود و انصراف state مقصد را تغییر نمی‌دهد.
   * @default false
   */
  showActionButtons?: boolean;

  /** Date ranges that cannot be selected. Both boundaries are included. */
  disabledDateRanges?: readonly JalaliDisabledDateRange[];

  // i18n
  labels?: {
    titleFrom?: string;
    titleTo?: string;
    confirm?: string;
    cancel?: string;
    chooseDate?: string;
    today?: string;
  };
};

/* ---------------- constants ---------------- */
const MONTHS = [
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

type Placement = "bottom" | "top" | "left" | "right" | "fit";

/* ---------------- helpers ---------------- */
function formatSelectedHeader(d: Date | null) {
  if (!d) return "";
  const weekdayFull = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
  }).format(d);
  const weekdayFirst = weekdayFull.trim().charAt(0);
  const monthName = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    month: "long",
  }).format(d);
  const j = new DateObject({ date: d, calendar: persian, locale: persian_fa });
  return `${weekdayFirst}، ${j.day} ${monthName}`;
}

function isSameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ---------------- component ---------------- */
function JalaliDatepicker(props: JalaliDatepickerProps) {
  const {
    open,
    anchorRef,
    onConfirm,
    onClose,
    // controlled/uncontrolled
    value,
    defaultValue = null,
    onChange,
    // ui
    label,
    locale = "fa",
    className,
    style,
    portalContainer,
    labels: L = {},
    showActionButtons = false,
    disabledDateRanges = [],
  } = props;

  const t = {
    titleFrom: L.titleFrom ?? "از تاریخ",
    titleTo: L.titleTo ?? "تا تاریخ",
    confirm: L.confirm ?? "تایید",
    cancel: L.cancel ?? "انصراف",
    chooseDate: L.chooseDate ?? "انتخاب تاریخ",
    today: L.today ?? "امروز",
  };
  const resolvedLabel =
    typeof label === "string" && label === "از تاریخ"
      ? t.titleFrom
      : typeof label === "string" && label === "تا تاریخ"
        ? t.titleTo
        : label;

  // مقدار «کامیت‌شده» (نمایش بیرونی) و درفت (نمایش داخل پاپ‌آپ)
  const [draft, setDraft] = useState<Date | null>(
    value ?? defaultValue ?? new Date()
  );

  // هر بار والد value را عوض کند، درفت را هم با آن همگام کنیم (چون آن مقدارِ کامیت‌شده است)
  useLayoutEffect(() => {
    if (value !== undefined) setDraft(value ?? null);
  }, [value]);

  // وقتی پاپ‌آپ باز می‌شود، مقدار کامیت‌شده فعلی را ذخیره کنیم تا بتوانیم روی Cancel/Close برگردانیم
  const committedOnOpenRef = useRef<Date | null>(null);
  const wasOpenRef = useRef(false);
  useLayoutEffect(() => {
    if (open && !wasOpenRef.current) {
      committedOnOpenRef.current = value ?? defaultValue ?? null;
    }
    wasOpenRef.current = open;
  }, [open, value, defaultValue]);

  // visible year/month (بر اساس value/defaultValue یا تاریخ جاری)
  const initDO = useMemo(
    () =>
      new DateObject({
        date: value ?? defaultValue ?? new Date(),
        calendar: persian,
        locale: persian_fa,
      }),
    [value, defaultValue]
  );
  const [viewYear, setViewYear] = useState<number>(initDO.year as number);
  const [viewMonth, setViewMonth] = useState<number>(initDO.month.number);

  const popRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const calendarKeyboardSelectionRef = useRef(false);

  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [popupWidth, setPopupWidth] = useState<number | undefined>(undefined);

  // cache between opens
  const lastSizeRef = useRef<{ w: number; h: number }>({ w: 360, h: 440 });
  const lastPosRef = useRef<{ top: number; left: number } | null>(null);
  const placementRef = useRef<Placement | null>(null);

  // raf throttles
  const rafPos = useRef<number | null>(null);
  const rafInit1 = useRef<number | null>(null);

  // fit-to-viewport
  const [fit, setFit] = useState<{ enabled: boolean; scale: number } | null>(
    null
  );

  const years = useMemo(() => {
    const s = 1350,
      e = 1450;
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }, []);

  const monthOptions: CSOption[] = useMemo(
    () => MONTHS.map((m, i) => ({ id: i + 1, label: m, value: String(i + 1) })),
    []
  );
  const yearOptions: CSOption[] = useMemo(
    () => years.map((y) => ({ id: y, label: String(y), value: String(y) })),
    [years]
  );

  const viewAnchorDate = useMemo(
    () =>
      new DateObject({
        calendar: persian,
        locale: persian_fa,
        year: viewYear,
        month: viewMonth,
        day: 1,
      }).toDate(),
    [viewYear, viewMonth]
  );

  const draftMatchesView = useMemo(() => {
    if (!draft) return false;
    const draftDate = new DateObject({
      date: draft,
      calendar: persian,
      locale: persian_fa,
    });
    return draftDate.year === viewYear && draftDate.month.number === viewMonth;
  }, [draft, viewYear, viewMonth]);

  // The month/year controls own the visible grid. Keep the committed draft
  // selected only while it belongs to that grid; otherwise use the first day
  // merely as Zaman's view anchor and hide its implicit selection.
  const calendarDefault = useMemo(
    () => (draftMatchesView && draft ? draft : viewAnchorDate),
    [draftMatchesView, draft, viewAnchorDate]
  );
  const selectedLabel = useMemo(() => formatSelectedHeader(draft), [draft]);
  const today = useMemo(() => new Date(), [open]);
  const todayObject = useMemo(
    () =>
      new DateObject({
        date: today,
        calendar: persian,
        locale: persian_fa,
      }),
    [today]
  );
  const showTodayShortcut =
    !isSameDay(draft, today) ||
    viewYear !== todayObject.year ||
    viewMonth !== todayObject.month.number;
  const normalizedDisabledRanges = useMemo(
    () =>
      disabledDateRanges.flatMap(({ from, to }) => {
        const fromTime = new Date(from).setHours(0, 0, 0, 0);
        const toTime = new Date(to).setHours(23, 59, 59, 999);
        if (!Number.isFinite(fromTime) || !Number.isFinite(toTime)) return [];
        return [
          {
            from: Math.min(fromTime, toTime),
            to: Math.max(fromTime, toTime),
          },
        ];
      }),
    [disabledDateRanges]
  );
  const isDateDisabled = useCallback(
    (date: Date | null) => {
      if (!date) return false;
      const time = new Date(date).setHours(12, 0, 0, 0);
      return normalizedDisabledRanges.some(
        (range) => time >= range.from && time <= range.to
      );
    },
    [normalizedDisabledRanges]
  );
  const selectDay = useCallback(
    (next: Date | null) => {
      if (isDateDisabled(next)) return;
      if (next) {
        const selectedDate = new DateObject({
          date: next,
          calendar: persian,
          locale: persian_fa,
        });
        setViewYear(selectedDate.year as number);
        setViewMonth(selectedDate.month.number);
      }
      setDraft(next);
      if (!showActionButtons) {
        onChange?.(next);
        onConfirm(next);
        committedOnOpenRef.current = next;
        onClose();
      }
    },
    [isDateDisabled, showActionButtons, onChange, onConfirm, onClose]
  );

  /* portal host */
  useLayoutEffect(() => {
    if (!open) return;
    const host = portalContainer ?? document.body;
    setPortalEl(host);

    if (lastPosRef.current) setPos(lastPosRef.current);
    placementRef.current = null;
    setFit(null);
  }, [open, portalContainer]);

  /* Sync the initial open separately from later controlled value changes. */
  const openInitializedRef = useRef(false);
  const implicitSelectionRef = useRef<Date | null>(null);
  useLayoutEffect(() => {
    if (!open) {
      openInitializedRef.current = false;
      implicitSelectionRef.current = null;
      return;
    }

    const isInitialOpen = !openInitializedRef.current;
    openInitializedRef.current = true;
    if (!isInitialOpen && value === undefined) return;

    const useImplicitToday =
      isInitialOpen && value == null && defaultValue == null;
    const next = isInitialOpen
      ? value ?? defaultValue ?? new Date()
      : value ?? null;
    implicitSelectionRef.current = useImplicitToday ? next : null;
    setDraft(next);
    if (next || isInitialOpen) {
      const cur = new DateObject({
        date: next ?? new Date(),
        calendar: persian,
        locale: persian_fa,
      });
      setViewYear(cur.year as number);
      setViewMonth(cur.month.number);
    }
  }, [open, value, defaultValue]);

  /* calc position + fit  */
  const recalcPosition = useCallback(
    (forceRecomputePlacement: boolean = false) => {
      if (!open) return;
      const anchorEl = (anchorRef as any)?.current as HTMLElement | null;
      const popEl = popRef.current;
      const hostEl = portalEl;
      if (!anchorEl || !hostEl) return;

      const rootRem =
        Number.parseFloat(
          window.getComputedStyle(document.documentElement).fontSize
        ) || 16;
      const spacing = 0.75 * rootRem;
      const isBodyHost = hostEl === document.body;

      const aRect = anchorEl.getBoundingClientRect();

      const vv = (window as any).visualViewport as VisualViewport | undefined;
      const vw = (vv?.width ?? window.innerWidth) | 0;
      const vh = (vv?.height ?? window.innerHeight) | 0;
      const vOffLeft = (vv?.offsetLeft ?? 0) | 0;
      const vOffTop = (vv?.offsetTop ?? 0) | 0;

      let aLeft: number, aTop: number, aRight: number, aBottom: number;
      if (isBodyHost) {
        aLeft = Math.round(vOffLeft + aRect.left);
        aTop = Math.round(vOffTop + aRect.top);
        aRight = Math.round(vOffLeft + aRect.right);
        aBottom = Math.round(vOffTop + aRect.bottom);
      } else {
        const hostRect = hostEl.getBoundingClientRect();
        const hScrollL = (hostEl as HTMLElement).scrollLeft;
        const hScrollT = (hostEl as HTMLElement).scrollTop;
        aLeft = Math.round(aRect.left - hostRect.left + hScrollL);
        aTop = Math.round(aRect.top - hostRect.top + hScrollT);
        aRight = Math.round(aRect.right - hostRect.left + hScrollL);
        aBottom = Math.round(aRect.bottom - hostRect.top + hScrollT);
      }

      const hostW = isBodyHost ? vw : (hostEl as HTMLElement).clientWidth;
      const hostH = isBodyHost ? vh : (hostEl as HTMLElement).clientHeight;

      // Keep the calendar visually identical at every breakpoint. The Zaman
      // The grid is designed around 20rem, so wider anchors must not stretch only
      // the popup shell and create an extra empty strip on the left.
      const availableWidth = Math.max(0, hostW - 2 * spacing);
      const nextWidth = 20 * rootRem;
      setPopupWidth((current) =>
        current === nextWidth ? current : nextWidth
      );

      const rect = popEl?.getBoundingClientRect();
      const approxWidth =
        popEl?.offsetWidth && popEl.offsetWidth > 50
          ? popEl.offsetWidth
          : 20 * rootRem;
      const approxHeight =
        popEl?.offsetHeight && popEl.offsetHeight > 80
          ? popEl.offsetHeight
          : 27.5 * rootRem;

      const spaceBottom =
        hostH - (isBodyHost ? aBottom - vOffTop : aBottom) - spacing;
      const spaceTop = (isBodyHost ? aTop - vOffTop : aTop) - spacing;
      const spaceRight =
        hostW - (isBodyHost ? aRight - vOffLeft : aRight) - spacing;
      const spaceLeft = (isBodyHost ? aLeft - vOffLeft : aLeft) - spacing;

      const canBottom = spaceBottom >= approxHeight;
      const canTop = spaceTop >= approxHeight;
      const canRight = spaceRight >= approxWidth;
      const canLeft = spaceLeft >= approxWidth;
      const widthFits = availableWidth >= approxWidth;

      if (
        forceRecomputePlacement ||
        !placementRef.current ||
        placementRef.current === "fit"
      ) {
        const candidates: Array<{
          dir: Placement;
          space: number;
          ok: boolean;
        }> = [
          { dir: "bottom", space: spaceBottom, ok: canBottom && widthFits },
          { dir: "top", space: spaceTop, ok: canTop && widthFits },
          { dir: "right", space: spaceRight, ok: canRight },
          { dir: "left", space: spaceLeft, ok: canLeft },
        ];
        const okOnes = candidates
          .filter((c) => c.ok)
          .sort((a, b) => b.space - a.space);
        placementRef.current = okOnes.length ? okOnes[0].dir : "fit";
      }

      const clamp = (v: number, min: number, max: number) =>
        Math.min(Math.max(v, min), max);
      const baseLeft = isBodyHost ? vOffLeft : 0;
      const baseTop = isBodyHost ? vOffTop : 0;
      const minLeft = baseLeft + spacing;
      const maxLeft = baseLeft + hostW - spacing - approxWidth;
      const minTop = baseTop + spacing;
      const maxTop = baseTop + hostH - spacing - approxHeight;

      let left = aLeft;
      let top = aBottom + spacing;
      let fitState: { enabled: boolean; scale: number } | null = null;

      switch (placementRef.current) {
        case "bottom":
          left = clamp(aLeft, minLeft, maxLeft);
          top = clamp(aBottom + spacing, minTop, maxTop);
          break;
        case "top":
          left = clamp(aLeft, minLeft, maxLeft);
          top = clamp(aTop - spacing - approxHeight, minTop, maxTop);
          break;
        case "right":
          left = clamp(aRight + spacing, minLeft, maxLeft);
          top = clamp(aTop, minTop, maxTop);
          break;
        case "left":
          left = clamp(aLeft - spacing - approxWidth, minLeft, maxLeft);
          top = clamp(aTop, minTop, maxTop);
          break;
        case "fit":
        default: {
          const availW = hostW - 2 * spacing;
          const availH = Math.max(spaceBottom, spaceTop);
          const scaleW = availW / approxWidth;
          const scaleH = availH / approxHeight;
          const scale = Math.max(0.1, Math.min(1, Math.min(scaleW, scaleH)));
          const fitH = approxHeight * scale;
          // With a top-center transform origin, center the unscaled box; the
          // scaled visual box then remains centered in the viewport.
          left = Math.round(baseLeft + (hostW - approxWidth) / 2);
          const placeBelow = spaceBottom >= spaceTop;
          top = placeBelow
            ? Math.round(aBottom + spacing)
            : Math.round(aTop - spacing - fitH);
          fitState = { enabled: true, scale };
          break;
        }
      }

      const np = { top: Math.round(top), left: Math.round(left) };
      setPos((current) =>
        current?.top === np.top && current?.left === np.left ? current : np
      );
      lastPosRef.current = np;

      setFit((current) => {
        const next = fitState ?? { enabled: false, scale: 1 };
        return current?.enabled === next.enabled && current?.scale === next.scale
          ? current
          : next;
      });

      if (popEl && popEl.offsetHeight > 80 && popEl.offsetWidth > 50) {
        lastSizeRef.current = {
          w: Math.round(popEl.offsetWidth),
          h: Math.round(popEl.offsetHeight),
        };
      }
    },
    [open, anchorRef, portalEl]
  );

  /* initial positioning */
  useLayoutEffect(() => {
    if (!open || !portalEl) return;
    recalcPosition(true);
    if (rafInit1.current) cancelAnimationFrame(rafInit1.current);
    rafInit1.current = requestAnimationFrame(() => recalcPosition(false));
    return () => {
      if (rafInit1.current) cancelAnimationFrame(rafInit1.current);
    };
  }, [open, portalEl, recalcPosition]);

  /* ResizeObserver */
  useLayoutEffect(() => {
    if (!open) return;
    const el = popRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (rafPos.current != null) return;
      rafPos.current = requestAnimationFrame(() => {
        rafPos.current = null;
        recalcPosition(false);
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, recalcPosition]);

  /* global scroll/resize/orientation */
  useEffect(() => {
    if (!open) return;
    const schedule = () => {
      if (rafPos.current != null) return;
      rafPos.current = requestAnimationFrame(() => {
        rafPos.current = null;
        // Viewport changes can invalidate the previous placement entirely.
        recalcPosition(true);
      });
    };
    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", schedule);
    return () => {
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", schedule);
      if (rafPos.current) cancelAnimationFrame(rafPos.current);
      rafPos.current = null;
    };
  }, [open, recalcPosition]);

  /* outside close + ESC => مثل Cancel عمل کند */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      const t = e.target as Node;
      const targetElement =
        t.nodeType === Node.ELEMENT_NODE
          ? (t as Element)
          : t.parentElement;
      // ComboSelect options may be repositioned outside the popup's painted
      // containment box. They are still internal calendar interactions.
      const insideCombo = e
        .composedPath()
        .some(
          (node) =>
            node instanceof Element &&
            (node.matches(".rjd-combo-select") ||
              node.matches(".cs-trigger, .cs-panel, .cs-option"))
        );
      if (insideCombo || targetElement?.closest(".rjd-combo-select")) return;
      const anchorEl = (anchorRef as any)?.current as HTMLElement | null;
      if (
        popRef.current &&
        !popRef.current.contains(t) &&
        anchorEl &&
        !anchorEl.contains(t)
      ) {
        // بازگشت درفت به مقدار کامیت‌شده
        setDraft(committedOnOpenRef.current ?? null);
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDraft(committedOnOpenRef.current ?? null);
        onClose();
      }
    };
    document.addEventListener("pointerdown", onDoc, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onDoc, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, anchorRef]);

  /* hide inner header of Zaman */
  useEffect(() => {
    if (!open || !bodyRef.current) return;
    const root = bodyRef.current;
    const hideHeader = () => {
      const headers: HTMLElement[] = [];
      const cand1 = root.querySelector(
        ":scope > div > div:first-child"
      ) as HTMLElement | null;
      if (cand1) headers.push(cand1);
      root
        .querySelectorAll<HTMLElement>('[class*="header"],[class*="Header"]')
        .forEach((el) => headers.push(el));
      const cand3 = root.querySelector(
        '[role="toolbar"]'
      ) as HTMLElement | null;
      if (cand3) headers.push(cand3);
      headers.forEach((h) =>
        Object.assign(h.style, {
          display: "none",
          height: "0",
          padding: "0",
          margin: "0",
          border: "0",
          opacity: "0",
          pointerEvents: "none",
        })
      );
    };
    hideHeader();
    const mo = new MutationObserver(hideHeader);
    mo.observe(root, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [open]);

  /* Mark consumer-defined disabled ranges in Zaman's generated day buttons. */
  useLayoutEffect(() => {
    if (!open || !bodyRef.current) return;
    const root = bodyRef.current;

    const applyDisabledRanges = () => {
      root
        .querySelectorAll<HTMLButtonElement>("button.zm-DaysButton[data-value]")
        .forEach((button) => {
          const customDisabled = button.dataset.value
            ? isDateDisabled(new Date(button.dataset.value))
            : false;

          if (customDisabled) {
            if (button.dataset.rjdDisabled !== "true")
              button.dataset.rjdDisabled = "true";
            if (button.dataset.disabled !== "true")
              button.dataset.disabled = "true";
            if (button.getAttribute("aria-disabled") !== "true")
              button.setAttribute("aria-disabled", "true");
            if (!button.disabled) button.disabled = true;
          } else if (button.dataset.rjdDisabled === "true") {
            delete button.dataset.rjdDisabled;
            button.dataset.disabled = "false";
            button.removeAttribute("aria-disabled");
            button.disabled = false;
          }
        });
    };

    applyDisabledRanges();
    const observer = new MutationObserver(applyDisabledRanges);
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-value", "data-disabled", "disabled"],
    });
    return () => observer.disconnect();
  }, [open, portalEl, viewYear, viewMonth, calendarDefault, isDateDisabled]);

  if (!open || !portalEl) return null;
  const isBody = portalEl === document.body;

  return createPortal(
    <div
      ref={popRef}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={`rjd-root calendar-header zcal-custom${
        className ? ` ${className}` : ""
      }`}
      data-rjd-empty-selection={!draftMatchesView ? "true" : undefined}
      style={{
        position: isBody ? "fixed" : "absolute",
        top: pos ? pos.top : -99999,
        left: pos ? pos.left : -99999,
        width: popupWidth,
        zIndex: isBody ? 100001 : 1000,
        transform: fit?.enabled ? `scale(${fit.scale})` : "none",
        transformOrigin: "top center",
        opacity: pos ? 1 : 0,
        pointerEvents: pos ? "auto" : "none",
        ...style,
      }}
      onClickCapture={(event) => {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
          "button.zm-DaysButton[data-value]"
        );
        if (!button?.dataset.value) return;

        event.preventDefault();
        event.stopPropagation();
        const next = new Date(button.dataset.value);
        if (!isDateDisabled(next)) selectDay(next);
      }}
      onKeyDownCapture={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>(
          "button.zm-DaysButton[data-value]"
        );
        if (button && !button.disabled) {
          calendarKeyboardSelectionRef.current = true;
          requestAnimationFrame(() => {
            calendarKeyboardSelectionRef.current = false;
          });
        }
      }}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="header-main-div">
        {resolvedLabel != null && resolvedLabel !== "" && (
          <div className="header-label">
            {resolvedLabel}
          </div>
        )}
        <div className="selected-info-div">
          <div className="selected-info-pill">
            {selectedLabel || t.chooseDate}
          </div>
          {showTodayShortcut && (
            <button
              type="button"
              className="today-btn"
              disabled={isDateDisabled(today)}
              onClick={() => selectDay(new Date())}
            >
              {t.today}
            </button>
          )}
        </div>
      </div>

      {/* Month / Year */}
      <div className="header-select-div">
        <ComboSelect
          options={monthOptions}
          dir="rtl"
          placeholderLabel="ماه"
          hasPlaceholder={false}
          selectedId={viewMonth}
          onChange={(e) => setViewMonth(Number(e.id))}
          placement="auto"
          panelOffset={8}
          className="select-month"
        />

        <ComboSelect
          options={yearOptions}
          dir="rtl"
          placeholderLabel="سال"
          hasPlaceholder={false}
          selectedId={viewYear}
          onChange={(e) => setViewYear(Number(e.id))}
          placement="auto"
          panelOffset={8}
          className="select-year"
        />
      </div>

      {/* Calendar */}
      <CalendarProvider locale="fa" direction="rtl">
        <div className="zcal-body" ref={bodyRef}>
          <Calendar
            key={`${viewYear}-${viewMonth}-${
              draft ? new Date(draft).toDateString() : "none"
            }`}
            defaultValue={calendarDefault}
            onChange={(e: any) => {
              // Pointer selections are handled by the root capture listener.
              // Zaman also emits changes while remounting after navigation, so
              // only accept its callback for an explicit keyboard selection.
              if (!calendarKeyboardSelectionRef.current || !e?.value) return;
              calendarKeyboardSelectionRef.current = false;
              selectDay(new Date(e.value));
            }}
          />
        </div>
      </CalendarProvider>

      {/* Footer */}
      {showActionButtons && <div className="footer-div">
        <button
          type="button"
          className="footer-btn"
          onClick={() => {
            // Confirm = انتشار مقدار درفت به بیرون
            const selectedButton = bodyRef.current?.querySelector<HTMLElement>(
              '.zm-DaysButton[aria-selected="true"][data-value]'
            );
            const selectedValue = selectedButton?.dataset.value
              ? new Date(selectedButton.dataset.value)
              : null;
            const visuallyEmpty =
              popRef.current?.dataset.rjdEmptySelection === "true";
            const confirmed =
              draft ??
              (!visuallyEmpty && selectedValue ? selectedValue : null) ??
              implicitSelectionRef.current ??
              null;
            onConfirm(confirmed);
            onChange?.(confirmed);
            // مقدار کامیت‌شده جدید، همان draft است
            committedOnOpenRef.current = confirmed;
            // Let the consumer commit the confirmed value before its close
            // restoration logic runs (important after clearing an input).
            window.setTimeout(onClose, 0);
          }}
        >
          {t.confirm}
        </button>

        <button
          type="button"
          className="footer-btn"
          onClick={() => {
            // Cancel = برگرداندن درفت به مقدار کامیت‌شده و عدم انتشار
            setDraft(committedOnOpenRef.current ?? null);
            onClose();
          }}
        >
          {t.cancel}
        </button>
      </div>}
    </div>,
    portalEl
  );
}

export default memo(JalaliDatepicker);
export { JalaliDatepicker };
