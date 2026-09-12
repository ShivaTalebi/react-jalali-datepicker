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
import { ComboSelect, Option as CSOption } from "./ComboSelect";
import { CalendarGrid } from "./CalendarGrid";
import { formatCalendarDate } from "../utils/format";
import {
  CALENDAR_MONTHS,
  toCalendarObject,
  type CalendarSystem,
  type IslamicDateAdjustment,
} from "../utils/calendar";
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
  /** Calendar system. Existing integrations default to Jalali. */
  calendar?: CalendarSystem;
  /**
   * Moves calculated Islamic dates by -2..+2 days to match a local or
   * officially announced lunar calendar. Only used with calendar="islamic".
   */
  islamicDateAdjustment?: IslamicDateAdjustment;
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

type Placement = "bottom" | "top" | "left" | "right" | "fit";

/* ---------------- helpers ---------------- */
function formatSelectedHeader(
  d: Date | null,
  calendar: CalendarSystem,
  locale: "fa" | "en",
  islamicDateAdjustment: IslamicDateAdjustment
) {
  if (!d) return "";
  const full = formatCalendarDate(d, "dddd DD MMMM YYYY", {
    calendar,
    locale,
    islamicDateAdjustment,
  });
  const firstSpace = full.indexOf(" ");
  const weekday = firstSpace >= 0 ? full.slice(0, firstSpace) : full;
  let datePart = firstSpace >= 0 ? full.slice(firstSpace + 1).replace(/\s+\d{4}$/, "") : "";
  const islamicInitials = ["ح", "ن", "ث", "ر", "خ", "ج", "س"] as const;
  const initial =
    calendar === "islamic" && locale === "fa"
      ? islamicInitials[d.getDay()]
      : weekday.trim().charAt(0);
  if (calendar === "islamic" && locale === "fa") {
    datePart = datePart.replace(/[0-9]/g, (digit) => "٠١٢٣٤٥٦٧٨٩"[Number(digit)]);
  }
  return `${initial}${locale === "fa" ? "،" : ","} ${datePart}`;
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
    calendar = "jalali",
    islamicDateAdjustment = 1,
    className,
    style,
    portalContainer,
    labels: L = {},
    showActionButtons = false,
    disabledDateRanges = [],
  } = props;

  // Gregorian calendars are intentionally English-only so their direction,
  // numerals and calendar vocabulary stay consistent in every host project.
  const effectiveLocale: "fa" | "en" =
    calendar === "gregorian" ? "en" : locale;
  const englishUi = effectiveLocale === "en";
  const arabicUi = calendar === "islamic" && effectiveLocale === "fa";

  const t = {
    titleFrom: L.titleFrom ?? (englishUi ? "From date" : arabicUi ? "من تاريخ" : "از تاریخ"),
    titleTo: L.titleTo ?? (englishUi ? "To date" : arabicUi ? "إلى تاريخ" : "تا تاریخ"),
    confirm: L.confirm ?? (englishUi ? "Confirm" : arabicUi ? "تأكيد" : "تایید"),
    cancel: L.cancel ?? (englishUi ? "Cancel" : arabicUi ? "إلغاء" : "انصراف"),
    chooseDate: L.chooseDate ?? (englishUi ? "Choose date" : arabicUi ? "اختر التاريخ" : "انتخاب تاریخ"),
    today: L.today ?? (englishUi ? "Today" : arabicUi ? "اليوم" : "امروز"),
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
    () => toCalendarObject(
      value ?? defaultValue ?? new Date(),
      calendar,
      effectiveLocale,
      islamicDateAdjustment
    ),
    [value, defaultValue, calendar, effectiveLocale, islamicDateAdjustment]
  );
  const [viewYear, setViewYear] = useState<number>(initDO.year as number);
  const [viewMonth, setViewMonth] = useState<number>(initDO.month.number);

  const popRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

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
  const forceNextPositionRecalcRef = useRef(false);

  // fit-to-viewport
  const [fit, setFit] = useState<{ enabled: boolean; scale: number } | null>(
    null
  );

  const years = useMemo(() => {
    const current = toCalendarObject(new Date(), calendar, effectiveLocale, islamicDateAdjustment).year as number;
    const s = calendar === "jalali" ? 1350 : current - 100;
    const e = calendar === "jalali" ? 1450 : current + 100;
    return Array.from({ length: e - s + 1 }, (_, i) => s + i);
  }, [calendar, effectiveLocale, islamicDateAdjustment]);

  const monthOptions: CSOption[] = useMemo(
    () => CALENDAR_MONTHS[calendar][effectiveLocale].map((m, i) => ({
      id: i + 1,
      label: m,
      value: String(i + 1),
    })),
    [calendar, effectiveLocale]
  );
  const yearOptions: CSOption[] = useMemo(
    () => years.map((y) => ({
      id: y,
      label: arabicUi
        ? y.toLocaleString("ar-EG-u-nu-arab", { useGrouping: false })
        : String(y),
      value: String(y),
    })),
    [years, arabicUi]
  );

  const draftMatchesView = useMemo(() => {
    if (!draft) return false;
    const draftDate = toCalendarObject(draft, calendar, effectiveLocale, islamicDateAdjustment);
    return draftDate.year === viewYear && draftDate.month.number === viewMonth;
  }, [draft, viewYear, viewMonth, calendar, effectiveLocale, islamicDateAdjustment]);

  const selectedLabel = useMemo(
    () => formatSelectedHeader(draft, calendar, effectiveLocale, islamicDateAdjustment),
    [draft, calendar, effectiveLocale, islamicDateAdjustment]
  );
  const today = useMemo(() => new Date(), [open]);
  const todayObject = useMemo(
    () => toCalendarObject(today, calendar, effectiveLocale, islamicDateAdjustment),
    [today, calendar, effectiveLocale, islamicDateAdjustment]
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
        const selectedDate = toCalendarObject(next, calendar, effectiveLocale, islamicDateAdjustment);
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
    [isDateDisabled, showActionButtons, onChange, onConfirm, onClose, calendar, effectiveLocale, islamicDateAdjustment]
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
      const cur = toCalendarObject(next ?? new Date(), calendar, effectiveLocale, islamicDateAdjustment);
      setViewYear(cur.year as number);
      setViewMonth(cur.month.number);
    }
  }, [open, value, defaultValue, calendar, effectiveLocale, islamicDateAdjustment]);

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

      // Scrolling or opening a mobile keyboard can move the trigger outside
      // the visual viewport for a moment. Keep the picker logically open but
      // move its popup off-screen until the trigger is visible again. Calling
      // onClose here made ordinary page/keyboard scrolling cancel the picker.
      const anchorOutsideViewport =
        aRect.bottom <= vOffTop ||
        aRect.top >= vOffTop + vh ||
        aRect.right <= vOffLeft ||
        aRect.left >= vOffLeft + vw;
      if (isBodyHost && anchorOutsideViewport) {
        setPos(null);
        lastPosRef.current = null;
        return;
      }

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

      const anchorTopInHost = isBodyHost ? aTop - vOffTop : aTop;
      const anchorBottomInHost = isBodyHost ? aBottom - vOffTop : aBottom;
      const anchorLeftInHost = isBodyHost ? aLeft - vOffLeft : aLeft;
      const anchorRightInHost = isBodyHost ? aRight - vOffLeft : aRight;

      // Reserve one gap between anchor/popup and another gap at the viewport
      // edge. These values use the visual viewport, so opening a mobile
      // keyboard immediately reduces the real room available to the picker.
      const spaceBottom = Math.max(
        0,
        hostH - anchorBottomInHost - 2 * spacing
      );
      const spaceTop = Math.max(0, anchorTopInHost - 2 * spacing);
      const spaceRight = Math.max(
        0,
        hostW - anchorRightInHost - 2 * spacing
      );
      const spaceLeft = Math.max(0, anchorLeftInHost - 2 * spacing);

      // Scale against both width and the larger vertical side of the anchor.
      // This keeps an editable input visible while the software keyboard is
      // open, and lets placement flip above/below without covering the input.
      const availableHeight = Math.max(spaceTop, spaceBottom);
      const viewportScale = Math.max(
        0.05,
        Math.min(
          1,
          availableWidth / approxWidth,
          availableHeight / approxHeight
        )
      );
      const visualWidth = approxWidth * viewportScale;
      const visualHeight = approxHeight * viewportScale;

      const canBottom = spaceBottom >= visualHeight;
      const canTop = spaceTop >= visualHeight;
      const canRight = spaceRight >= visualWidth;
      const canLeft = spaceLeft >= visualWidth;
      const heightFits = hostH - 2 * spacing >= visualHeight;

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
          { dir: "bottom", space: spaceBottom, ok: canBottom },
          { dir: "top", space: spaceTop, ok: canTop },
          { dir: "right", space: spaceRight, ok: canRight && heightFits },
          { dir: "left", space: spaceLeft, ok: canLeft && heightFits },
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
      const minVisualLeft = baseLeft + spacing;
      const maxVisualLeft = Math.max(
        minVisualLeft,
        baseLeft + hostW - spacing - visualWidth
      );
      const minTop = baseTop + spacing;
      const maxTop = Math.max(
        minTop,
        baseTop + hostH - spacing - visualHeight
      );
      // transform-origin is top center, so convert a desired visual left edge
      // back to the unscaled element's CSS `left` value.
      const layoutLeftForVisual = (visualLeft: number) =>
        visualLeft - (approxWidth - visualWidth) / 2;

      let left = aLeft;
      let top = aBottom + spacing;
      const fitState = {
        enabled: viewportScale < 0.9999,
        scale: viewportScale,
      };

      switch (placementRef.current) {
        case "bottom":
          left = layoutLeftForVisual(
            clamp(aLeft, minVisualLeft, maxVisualLeft)
          );
          top = clamp(aBottom + spacing, minTop, maxTop);
          break;
        case "top":
          left = layoutLeftForVisual(
            clamp(aLeft, minVisualLeft, maxVisualLeft)
          );
          top = clamp(aTop - spacing - visualHeight, minTop, maxTop);
          break;
        case "right":
          left = layoutLeftForVisual(
            clamp(aRight + spacing, minVisualLeft, maxVisualLeft)
          );
          top = clamp(aTop, minTop, maxTop);
          break;
        case "left":
          left = layoutLeftForVisual(
            clamp(
              aLeft - spacing - visualWidth,
              minVisualLeft,
              maxVisualLeft
            )
          );
          top = clamp(aTop, minTop, maxTop);
          break;
        case "fit":
        default: {
          // With a top-center transform origin, center the unscaled box; the
          // scaled visual box then remains centered in the viewport.
          left = Math.round(baseLeft + (hostW - approxWidth) / 2);
          const placeBelow = spaceBottom >= spaceTop;
          top = placeBelow
            ? Math.round(aBottom + spacing)
            : Math.round(aTop - spacing - visualHeight);
          // Reflow during a resize can move the anchor while the popup is
          // open. Clamp the final *visual* box after scaling, rather than the
          // unscaled element, so it always remains inside the viewport.
          const safeMinTop = baseTop + spacing;
          const safeMaxTop = Math.max(
            safeMinTop,
            baseTop + hostH - spacing - visualHeight
          );
          top = clamp(top, safeMinTop, safeMaxTop);
          break;
        }
      }

      const np = { top: Math.round(top), left: Math.round(left) };
      setPos((current) =>
        current?.top === np.top && current?.left === np.left ? current : np
      );
      lastPosRef.current = np;

      setFit((current) => {
        return current?.enabled === fitState.enabled &&
          current?.scale === fitState.scale
          ? current
          : fitState;
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

  /* Coalesce observer + viewport events without losing a forced placement
     recomputation. During a live resize, ResizeObserver can schedule first;
     the old implementation then discarded the window resize request and kept
     a stale scale/placement until another event happened. */
  const schedulePositionRecalc = useCallback(
    (forceRecomputePlacement: boolean) => {
      forceNextPositionRecalcRef.current =
        forceNextPositionRecalcRef.current || forceRecomputePlacement;
      if (rafPos.current != null) return;
      rafPos.current = requestAnimationFrame(() => {
        rafPos.current = null;
        const force = forceNextPositionRecalcRef.current;
        forceNextPositionRecalcRef.current = false;
        recalcPosition(force);
      });
    },
    [recalcPosition]
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
    const ro = new ResizeObserver(() => schedulePositionRecalc(false));
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, schedulePositionRecalc]);

  /* global scroll/resize/orientation */
  useEffect(() => {
    if (!open) return;
    const schedule = () => schedulePositionRecalc(true);
    const onViewportScroll = (event: Event) => {
      const target = event.target;
      // Internal combobox scrolling does not change the trigger's placement.
      // Page, ancestor and visual-viewport scrolling keep the picker open and
      // recompute its position against the same anchor instead of closing it.
      if (target instanceof Node && popRef.current?.contains(target)) {
        schedulePositionRecalc(false);
        return;
      }
      schedulePositionRecalc(true);
    };
    window.addEventListener("scroll", onViewportScroll, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);
    window.visualViewport?.addEventListener("resize", schedule);
    window.visualViewport?.addEventListener("scroll", onViewportScroll);
    return () => {
      window.removeEventListener("scroll", onViewportScroll, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      window.visualViewport?.removeEventListener("resize", schedule);
      window.visualViewport?.removeEventListener("scroll", onViewportScroll);
      if (rafPos.current) cancelAnimationFrame(rafPos.current);
      rafPos.current = null;
      forceNextPositionRecalcRef.current = false;
    };
  }, [open, schedulePositionRecalc]);

  /* outside close + ESC => مثل Cancel عمل کند */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
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
    // Close only after a genuine click/tap has completed. On touch screens a
    // swipe begins with `pointerdown`; closing at that point incorrectly
    // dismissed the picker before the browser could recognise page scrolling.
    document.addEventListener("click", onDoc, true);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("click", onDoc, true);
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !portalEl) return null;
  const isBody = portalEl === document.body;

  return createPortal(
    <div
      ref={popRef}
      dir={effectiveLocale === "fa" ? "rtl" : "ltr"}
      lang={arabicUi ? "ar" : effectiveLocale === "fa" ? "fa" : "en"}
      data-locale={arabicUi ? "ar" : effectiveLocale}
      className={`rjd-root calendar-header zcal-custom${
        className ? ` ${className}` : ""
      }`}
      data-rjd-has-footer={showActionButtons ? "true" : "false"}
      data-rjd-empty-selection={!draftMatchesView ? "true" : undefined}
      data-rjd-calendar={calendar}
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
          dir={effectiveLocale === "fa" ? "rtl" : "ltr"}
          placeholderLabel={effectiveLocale === "fa" ? (arabicUi ? "الشهر" : "ماه") : "Month"}
          hasPlaceholder={false}
          selectedId={viewMonth}
          onChange={(e) => setViewMonth(Number(e.id))}
          placement="auto"
          panelOffset={8}
          className="select-month"
        />

        <ComboSelect
          options={yearOptions}
          dir="ltr"
          placeholderLabel={effectiveLocale === "fa" ? (arabicUi ? "السنة" : "سال") : "Year"}
          hasPlaceholder={false}
          selectedId={viewYear}
          onChange={(e) => setViewYear(Number(e.id))}
          placement="auto"
          panelOffset={8}
          className="select-year"
        />
      </div>

      {/* Calendar */}
      <div className="zcal-body rjd-native-body" ref={bodyRef}>
        <CalendarGrid
          calendar={calendar}
          locale={effectiveLocale}
          islamicDateAdjustment={islamicDateAdjustment}
          year={viewYear}
          month={viewMonth}
          selected={draftMatchesView ? draft : null}
          today={today}
          isDisabled={isDateDisabled}
          onSelect={selectDay}
        />
      </div>

      {/* Footer */}
      {showActionButtons && <div className="footer-div">
        <button
          type="button"
          className="footer-btn"
          onClick={() => {
            // Confirm = انتشار مقدار درفت به بیرون
            const visuallyEmpty =
              popRef.current?.dataset.rjdEmptySelection === "true";
            const confirmed =
              draft ??
              (!visuallyEmpty ? implicitSelectionRef.current : null) ??
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
