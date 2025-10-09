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
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import "../styles/styles.css";

/* ---------------- types ---------------- */
type AnchorRef =
  | React.RefObject<HTMLElement>
  | React.MutableRefObject<HTMLElement | null>;

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

  // helpers
  beginDate?: Date | string;
  beginAutoConfirm?: boolean;
  beginCalendar?: "jalali" | "gregorian";

  // UI
  label?: "از تاریخ" | "تا تاریخ";
  locale?: "fa" | "en";
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
function toEnDigits(s: string) {
  const fa = "۰۱۲۳۴۵۶۷۸۹";
  const ar = "٠١٢٣٤٥٦٧٨٩";
  return s
    .replace(/[۰-۹]/g, (d) => String(fa.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ar.indexOf(d)));
}
function splitYMD(s: string): [number, number, number] | null {
  const p = s.split(/[^0-9]/g).filter(Boolean);
  if (p.length < 3) return null;
  const [y, m, d] = p.map((x) => parseInt(x, 10));
  return !y || !m || !d ? null : [y, m, d];
}
function inferCalendar(y: number): "jalali" | "gregorian" {
  return y >= 1200 && y < 1700 ? "jalali" : "gregorian";
}
function parseInputToDate(
  input?: Date | string,
  prefer?: "jalali" | "gregorian"
): Date | null {
  if (!input) return null;
  if (input instanceof Date) return input;

  const norm = toEnDigits(String(input).trim());
  const ymd = splitYMD(norm);
  if (!ymd) {
    const d = new Date(norm);
    return isNaN(d.getTime()) ? null : d;
  }
  const [y, m, d] = ymd;
  const cal = prefer ?? inferCalendar(y);
  if (cal === "jalali") {
    const jo = new DateObject({ calendar: persian, year: y, month: m, day: d });
    return jo.toDate();
  }
  return new Date(y, (m || 1) - 1, d || 1);
}
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
    // options
    beginDate,
    beginAutoConfirm = true,
    beginCalendar,
    // ui
    label,
    locale = "fa",
    className,
    style,
    labels: L = {},
  } = props;

  const t = {
    titleFrom: L.titleFrom ?? "از تاریخ",
    titleTo: L.titleTo ?? "تا تاریخ",
    today: L.today ?? "امروز",
    fromBeginning: L.fromBeginning ?? "از ابتدا",
    confirm: L.confirm ?? "تایید",
    cancel: L.cancel ?? "انصراف",
    chooseDate: L.chooseDate ?? "انتخاب تاریخ",
  };

  const [draft, setDraft] = useState<Date | null>(value ?? defaultValue);

  // sync controlled value
  useEffect(() => {
    if (value !== undefined) setDraft(value);
  }, [value]);

  // visible year/month
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

  const calendarDefault = useMemo(
    () => (draft ? draft : viewAnchorDate),
    [draft, viewAnchorDate]
  );
  const selectedLabel = useMemo(() => formatSelectedHeader(draft), [draft]);

  /* portal host */
  useLayoutEffect(() => {
    if (!open) return;
    const anchorEl = (anchorRef as any)?.current as HTMLElement | null;
    const inner = anchorEl?.closest('[data-portal-root="inner"]');
    const anyHost = anchorEl?.closest("[data-portal-root]");
    const host = (inner || anyHost || document.body) as HTMLElement;
    setPortalEl(host);

    if (lastPosRef.current) setPos(lastPosRef.current);
    setFit(null);
  }, [open, anchorRef]);

  /* sync on open */
  useEffect(() => {
    if (!open) return;
    const cur = new DateObject({
      date: value ?? defaultValue ?? new Date(),
      calendar: persian,
      locale: persian_fa,
    });
    setDraft(value ?? defaultValue ?? null);
    setViewYear(cur.year as number);
    setViewMonth(cur.month.number);
  }, [open, value, defaultValue]);

  /* calc position + fit  */
  const recalcPosition = useCallback(
    (forceRecomputePlacement: boolean = false) => {
      if (!open) return;
      const anchorEl = (anchorRef as any)?.current as HTMLElement | null;
      const popEl = popRef.current;
      const hostEl = portalEl;
      if (!anchorEl || !hostEl) return;

      const spacing = 10;
      const isBodyHost = hostEl === document.body;

      const hostRect = hostEl.getBoundingClientRect();
      const aRect = anchorEl.getBoundingClientRect();
      const scrollTop = isBodyHost ? window.pageYOffset : hostEl.scrollTop;
      const scrollLeft = isBodyHost ? window.pageXOffset : hostEl.scrollLeft;

      const a = {
        left: aRect.left + scrollLeft - hostRect.left,
        top: aRect.top + scrollTop - hostRect.top,
        width: aRect.width,
        height: aRect.height,
      };

      const hostW = isBodyHost ? window.innerWidth : hostEl.clientWidth;
      const hostH = isBodyHost ? window.innerHeight : hostEl.clientHeight;

      const nextWidth = Math.max(a.width, 320);
      if (popupWidth !== nextWidth) setPopupWidth(nextWidth);

      const rect = popEl?.getBoundingClientRect();
      const approxWidth =
        rect?.width && rect.width > 50 ? rect.width : lastSizeRef.current.w;
      const approxHeight =
        rect?.height && rect.height > 100 ? rect.height : lastSizeRef.current.h;

      const canBottom = hostH - (a.top + a.height) - spacing >= approxHeight;
      const canTop = a.top - spacing >= approxHeight;
      const canRight = hostW - (a.left + a.width) - spacing >= approxWidth;
      const canLeft = a.left - spacing >= approxWidth;

      if (
        forceRecomputePlacement ||
        !placementRef.current ||
        placementRef.current === "fit"
      ) {
        if (canBottom) placementRef.current = "bottom";
        else if (canTop) placementRef.current = "top";
        else if (canRight) placementRef.current = "right";
        else if (canLeft) placementRef.current = "left";
        else placementRef.current = "fit";
      }

      let left = a.left;
      let top = a.top + a.height + spacing;
      let fitState: { enabled: boolean; scale: number } | null = null;

      switch (placementRef.current) {
        case "bottom":
          left = clamp(left, spacing, hostW - spacing - approxWidth);
          top = a.top + a.height + spacing;
          break;
        case "top":
          left = clamp(left, spacing, hostW - spacing - approxWidth);
          top = a.top - spacing - approxHeight;
          break;
        case "right":
          left = a.left + a.width + spacing;
          top = clamp(a.top, spacing, hostH - spacing - approxHeight);
          break;
        case "left":
          left = a.left - spacing - approxWidth;
          top = clamp(a.top, spacing, hostH - spacing - approxHeight);
          break;
        case "fit":
        default: {
          const availW = hostW - 2 * spacing;
          const availH = hostH - 2 * spacing;
          const scaleW = availW / approxWidth;
          const scaleH = availH / approxHeight;
          const scale = Math.max(0.72, Math.min(1, Math.min(scaleW, scaleH)));
          const fitW = approxWidth * scale;
          const fitH = approxHeight * scale;
          left = Math.round((hostW - fitW) / 2);
          top = Math.round((hostH - fitH) / 2);
          fitState = { enabled: true, scale };
          break;
        }
      }

      const np = { top: Math.round(top), left: Math.round(left) };
      if (!pos || pos.top !== np.top || pos.left !== np.left) setPos(np);
      lastPosRef.current = np;

      if (fitState) setFit(fitState);
      else if (fit?.enabled) setFit({ enabled: false, scale: 1 });

      if (rect && rect.height > 100 && rect.width > 50) {
        lastSizeRef.current = {
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        };
      }

      function clamp(v: number, min: number, max: number) {
        return Math.min(Math.max(v, min), max);
      }
    },
    // ✅ فقط وابستگی‌های لازم؛ stateهایی که داخلش setState می‌شوند اینجا نیستند
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
    // ✅ عمداً recalcPosition در deps نیست تا لوپ نشود
  }, [open, portalEl]);

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
    // ✅ recalcPosition را عمداً در deps نمی‌گذاریم
  }, [open]);

  /* global scroll/resize/orientation */
  useEffect(() => {
    if (!open) return;

    const schedule = () => {
      if (rafPos.current != null) return;
      rafPos.current = requestAnimationFrame(() => {
        rafPos.current = null;
        recalcPosition(false);
      });
    };

    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("orientationchange", schedule);
      if (rafPos.current) cancelAnimationFrame(rafPos.current);
      rafPos.current = null;
    };
    // ✅ recalcPosition را عمداً در deps نمی‌گذاریم
  }, [open]);

  /* outside close + ESC */
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      const anchorEl = (anchorRef as any)?.current as HTMLElement | null;
      if (
        popRef.current &&
        !popRef.current.contains(t) &&
        anchorEl &&
        !anchorEl.contains(t)
      )
        onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
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

  const handleSetToday = useCallback(() => {
    const now = new Date();
    const jNow = new DateObject({
      date: now,
      calendar: persian,
      locale: persian_fa,
    });
    setDraft(now);
    setViewYear(jNow.year as number);
    setViewMonth(jNow.month.number);
    onChange?.(now);
  }, [onChange]);

  const handleSetBeginning = useCallback(() => {
    const d =
      parseInputToDate(beginDate, beginCalendar) ?? new Date(1970, 0, 1);
    const j = new DateObject({
      date: d,
      calendar: persian,
      locale: persian_fa,
    });
    setDraft(d);
    setViewYear(j.year as number);
    setViewMonth(j.month.number);
    onChange?.(d);
    if (beginAutoConfirm) {
      onConfirm(d);
      onClose();
    }
  }, [
    beginDate,
    beginCalendar,
    beginAutoConfirm,
    onConfirm,
    onClose,
    onChange,
  ]);

  if (!open || !portalEl) return null;
  const isBody = portalEl === document.body;
  const showTodayButton = label === "تا تاریخ";
  const showBeginningButton = label === "از تاریخ";

  return createPortal(
    <div
      ref={popRef}
      dir={locale === "fa" ? "rtl" : "ltr"}
      className={`calendar-header zcal-custom${
        !defaultValue && !draft ? " no-initial-select" : ""
      }${className ? ` ${className}` : ""}`}
      style={{
        position: isBody ? "fixed" : "absolute",
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: popupWidth,
        zIndex: isBody ? 100001 : 1000,
        transform: fit?.enabled ? `scale(${fit.scale})` : "none",
        transformOrigin: "top center",
        ...style,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="header-main-div">
        {label && (
          <div className="header-label">
            {label === "از تاریخ" ? t.titleFrom : t.titleTo}
          </div>
        )}
        <div className="selected-info-div">
          <div className="selected-info-pill">
            {selectedLabel || t.chooseDate}
          </div>
          {showTodayButton && (
            <button type="button" onClick={handleSetToday} className="blue-btn">
              {t.today}
            </button>
          )}
          {showBeginningButton && (
            <button
              type="button"
              onClick={handleSetBeginning}
              className="blue-btn"
            >
              {t.fromBeginning}
            </button>
          )}
        </div>
      </div>

      {/* Month / Year */}
      <div className="header-select-div">
        <select
          value={viewMonth}
          onChange={(e) => setViewMonth(parseInt(e.target.value))}
          className="select-elm select-month"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={viewYear}
          onChange={(e) => setViewYear(parseInt(e.target.value))}
          className="select-elm select-year"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <CalendarProvider locale="fa" direction="rtl">
        <div className="zcal-body" ref={bodyRef}>
          <Calendar
            key={`${viewYear}-${viewMonth}`}
            defaultValue={calendarDefault}
            onChange={(e: any) => {
              const next = e?.value ? new Date(e.value) : null;
              setDraft(next);
              onChange?.(next);
            }}
          />
        </div>
      </CalendarProvider>

      {/* Footer */}
      <div className="footer-div">
        <button
          type="button"
          className="footer-btn"
          onClick={() => {
            onConfirm(draft ?? null);
            onClose();
          }}
        >
          {t.confirm}
        </button>
        <button type="button" className="footer-btn" onClick={onClose}>
          {t.cancel}
        </button>
      </div>
    </div>,
    portalEl
  );
}

export default memo(JalaliDatepicker);
export { JalaliDatepicker };
