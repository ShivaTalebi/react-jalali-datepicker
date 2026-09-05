import React from "react";
import "../styles/styles.css";
import { ArrowDownCombo, TickCircle } from "./icons";

/* ---------- option ---------- */
export type Option = {
  id: string | number;
  label: React.ReactNode;
  value?: string;
  disabled?: boolean;
};

/* ---------- change payloads ---------- */
export type SingleChange = {
  id: string | number | null;
  value: string | null;
  label?: string | null;
};

export type MultiChange = {
  ids: Array<string | number>;
  values: string[];
  labels: string[];
};

/* ---------- base props ---------- */
type BaseProps = {
  name?: string;
  options: ReadonlyArray<Option>;
  dir?: "rtl" | "ltr";
  disabled?: boolean;
  placeholderLabel?: string;
  hasPlaceholder?: boolean;
  showCheckIcon?: boolean;
  colorVar?: string;
  required?: boolean;
  containerStyle?: React.CSSProperties;
  className?: string;
  listClassName?: string;
  style?: React.CSSProperties;
  placement?: "down" | "up" | "auto";
  panelOffset?: number; // فاصله پنل از تریگر
};

/* ---------- variants ---------- */
type SingleProps = {
  multi?: false;
  defaultSelectedId?: string | number | null;
  selectedId?: string | number | null;
  onChange?: (sel: SingleChange) => void;
};

type MultiProps = {
  multi: true;
  defaultSelectedIds?: Array<string | number> | null;
  selectedIds?: Array<string | number> | null;
  onChange?: (sel: MultiChange) => void;
};

export type ComboSelectProps = BaseProps & (SingleProps | MultiProps);

/* ---------- helpers ---------- */
const norm = (v: string | number) => String(v);
function areOptionsEqual(a: ReadonlyArray<Option>, b: ReadonlyArray<Option>) {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const x = a[i],
      y = b[i];
    if (
      x.id !== y.id ||
      x.label !== y.label ||
      x.value !== y.value ||
      x.disabled !== y.disabled
    ) {
      return false;
    }
  }
  return true;
}
const useResolvedColor = (colorVar?: string) =>
  React.useMemo<string | undefined>(
    () =>
      colorVar
        ? colorVar.startsWith("--")
          ? `var(${colorVar})`
          : colorVar
        : undefined,
    [colorVar]
  );

/* ====================================================== */
function ComboSelectImpl(props: ComboSelectProps) {
  const {
    name,
    options,
    dir = "rtl",
    disabled = false,
    placeholderLabel = "انتخاب کنید",
    hasPlaceholder = true,
    showCheckIcon = false,
    colorVar,
    required = false,
    containerStyle,
    className,
    listClassName,
    style,
    placement = "down",
    panelOffset = 8,
  } = props;

  const resolvedColor = useResolvedColor(colorVar);
  const isMulti = props.multi === true;

  // initial states
  const computeInitialSingle = React.useCallback(() => {
    if (isMulti) return "";
    const { selectedId, defaultSelectedId } = props as SingleProps;
    const controlled = selectedId !== undefined;
    if (controlled) return selectedId == null ? "" : norm(selectedId!);
    if (defaultSelectedId != null) {
      const idStr = norm(defaultSelectedId);
      if (options.some((o) => norm(o.id) === idStr)) return idStr;
    }
    return hasPlaceholder ? "" : options[0] ? norm(options[0].id) : "";
  }, [isMulti, props, options, hasPlaceholder]);

  const computeInitialMulti = React.useCallback((): string[] => {
    if (!isMulti) return [];
    const { selectedIds, defaultSelectedIds } = props as MultiProps;
    const toIds = (arr?: Array<string | number> | null) =>
      (arr ?? []).map(norm);
    const controlled = selectedIds !== undefined;
    if (controlled) return toIds(selectedIds!);
    if (defaultSelectedIds != null)
      return toIds(defaultSelectedIds).filter((id) =>
        options.some((o) => norm(o.id) === id)
      );
    return [];
  }, [isMulti, props, options]);

  const [selectedId, setSelectedId] =
    React.useState<string>(computeInitialSingle);
  const [selectedIds, setSelectedIds] =
    React.useState<string[]>(computeInitialMulti);

  // sync controlled
  React.useEffect(() => {
    if (isMulti) return;
    const { selectedId } = props as SingleProps;
    if (selectedId !== undefined)
      setSelectedId(selectedId == null ? "" : norm(selectedId));
  }, [isMulti, props]);

  React.useEffect(() => {
    if (!isMulti) return;
    const { selectedIds } = props as MultiProps;
    if (selectedIds !== undefined)
      setSelectedIds((selectedIds ?? []).map(norm));
  }, [isMulti, props]);

  // panel
  const [open, setOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState<number>(-1);
  const [panelDir, setPanelDir] = React.useState<"down" | "up">(
    placement === "up" ? "up" : "down"
  );
  const [touched, setTouched] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null); // NEW: ظرف لیست برای اسکرول

  const selectedOpt = React.useMemo(
    () =>
      !isMulti ? options.find((o) => norm(o.id) === selectedId) ?? null : null,
    [isMulti, options, selectedId]
  );

  const toggleOpen = React.useCallback(() => {
    if (!disabled) setOpen((o) => !o);
  }, [disabled]);
  const close = React.useCallback(() => setOpen(false), []);
  const openList = React.useCallback(
    () => !disabled && setOpen(true),
    [disabled]
  );

  // Close on every pointer interaction outside this combobox. Pointer events
  // cover mouse, touch and pen, and capture mode makes this reliable even when
  // a host component stops propagation during its own click handling.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      const target = event.target;
      if (!root || !(target instanceof Node)) return;

      const interactionIsInside =
        root.contains(target) || event.composedPath().includes(root);
      if (!interactionIsInside) close();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, close]);

  // placement auto
  React.useEffect(() => {
    if (!open) return;
    if (placement === "down" || placement === "up") {
      setPanelDir(placement);
      return;
    }
    const decide = () => {
      const el = rootRef.current;
      if (!el) return setPanelDir("down");
      const rect = el.getBoundingClientRect();
      const viewportH =
        window.innerHeight || document.documentElement.clientHeight;
      const spaceAbove = rect.top;
      const spaceBelow = viewportH - rect.bottom;
      const estimated = Math.min(options.length, 8) * 40 + 16 + panelOffset;
      if (spaceBelow < estimated && spaceAbove > spaceBelow) setPanelDir("up");
      else setPanelDir("down");
    };
    decide();
    const onResize = () => decide();
    const onScroll = () => decide();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open, placement, options.length, panelOffset]);

  const isRTL = dir === "rtl";
  const isEmptySingle = hasPlaceholder && selectedId === "";
  const isEmptyMulti = hasPlaceholder && selectedIds.length === 0;
  const showInvalid = !!(
    required &&
    (isMulti ? isEmptyMulti : isEmptySingle) &&
    touched
  );

  // texts
  const multiSelectedLabels = React.useMemo(() => {
    if (!isMulti) return [];
    const map = new Map(options.map((o) => [norm(o.id), o]));
    return selectedIds.map((id) => {
      const o = map.get(id);
      const raw = o?.label;
      return typeof raw === "string" ? raw : raw ? String(raw) : id;
    });
  }, [isMulti, selectedIds, options]);

  const triggerText: React.ReactNode = React.useMemo(() => {
    if (!isMulti)
      return selectedOpt
        ? selectedOpt.label
        : hasPlaceholder
        ? placeholderLabel
        : "";
    if (!multiSelectedLabels.length)
      return hasPlaceholder ? placeholderLabel : "";
    if (multiSelectedLabels.length <= 2) return multiSelectedLabels.join("، ");
    return `${multiSelectedLabels.slice(0, 2).join("، ")} …`;
  }, [
    isMulti,
    selectedOpt,
    hasPlaceholder,
    placeholderLabel,
    multiSelectedLabels,
  ]);

  // form hidden input
  const hiddenInputRef = React.useRef<HTMLInputElement | null>(null);
  const formValue = React.useMemo(() => {
    if (!name) return "";
    if (!isMulti) {
      if (selectedId === "") return "";
      const v =
        selectedOpt?.value ??
        (typeof selectedOpt?.label === "string"
          ? selectedOpt.label
          : String(selectedOpt?.id));
      return v ?? "";
    }
    if (selectedIds.length === 0) return "";
    const map = new Map(options.map((o) => [norm(o.id), o]));
    const vals = selectedIds.map((id) => {
      const o = map.get(id);
      if (!o) return id;
      return o.value ?? (typeof o.label === "string" ? o.label : String(o.id));
    });
    return vals.join(",");
  }, [name, isMulti, selectedId, selectedOpt, selectedIds, options]);

  const onHiddenInvalid = React.useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      e.preventDefault();
      setTouched(true);
    },
    []
  );
  const onTriggerBlur = React.useCallback(() => {
    setTimeout(() => {
      if (required) {
        const val = hiddenInputRef.current?.value ?? "";
        if (hasPlaceholder && val === "") setTouched(true);
      }
    }, 0);
  }, [required, hasPlaceholder]);

  // emitters
  const emitSingle = React.useCallback(
    (o: Option | null) => {
      if (isMulti) return;
      (props as SingleProps).onChange?.({
        id: o?.id ?? null,
        value: o
          ? o.value ?? (typeof o.label === "string" ? o.label : null)
          : null,
        label: o && typeof o.label === "string" ? o.label : null,
      });
    },
    [isMulti, props]
  );

  const emitMulti = React.useCallback(
    (ids: string[]) => {
      if (!isMulti) return;
      const map = new Map(options.map((o) => [norm(o.id), o]));
      const labels: string[] = [];
      const values: string[] = [];
      ids.forEach((id) => {
        const o = map.get(id);
        const labelStr =
          typeof o?.label === "string" ? o!.label : o ? String(o.id) : id;
        const valStr =
          o?.value ??
          (typeof o?.label === "string" ? o!.label : String(o?.id ?? id));
        labels.push(labelStr);
        values.push(valStr);
      });
      (props as MultiProps).onChange?.({
        ids: ids.map((x) => x),
        labels,
        values,
      });
    },
    [isMulti, options, props]
  );

  const onSelectSingle = React.useCallback(
    (o: Option) => {
      if (isMulti || o.disabled) return;
      setSelectedId(norm(o.id));
      emitSingle(o);
      close();
    },
    [isMulti, emitSingle, close]
  );

  const onToggleMulti = React.useCallback(
    (o: Option) => {
      if (!isMulti || o.disabled) return;
      setSelectedIds((prev) => {
        const idStr = norm(o.id);
        const exists = prev.includes(idStr);
        const next = exists
          ? prev.filter((x) => x !== idStr)
          : [...prev, idStr];
        emitMulti(next);
        return next;
      });
    },
    [isMulti, emitMulti]
  );

  const onKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const count = options.length;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        openList();
        setHighlight((h) => (h + 1) % Math.max(1, count));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        openList();
        setHighlight((h) => (h <= 0 ? count - 1 : h - 1));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (
          open &&
          highlight >= 0 &&
          options[highlight] &&
          !options[highlight].disabled
        ) {
          isMulti
            ? onToggleMulti(options[highlight])
            : onSelectSingle(options[highlight]);
        } else {
          openList();
        }
        if (!isMulti) close();
      } else if (e.key === "Escape") {
        close();
      }
    },
    [
      disabled,
      options,
      highlight,
      open,
      openList,
      close,
      isMulti,
      onToggleMulti,
      onSelectSingle,
    ]
  );

  /* --------- NEW: اسکرول خودکار به گزینهٔ انتخاب‌شده پس از بازشدن --------- */
  React.useEffect(() => {
    if (!open) return;

    // انتخاب ایندکس هدف برای هایلایت/اسکرول
    const targetIndex = (() => {
      if (!options.length) return -1;
      if (!isMulti) {
        if (selectedId === "") return -1;
        return options.findIndex((o) => norm(o.id) === selectedId);
      }
      if (selectedIds.length === 0) return -1;
      const first = selectedIds[0];
      return options.findIndex((o) => norm(o.id) === first);
    })();

    // هایلایت اولیه
    if (targetIndex >= 0) setHighlight(targetIndex);

    // پس از رندر، اسکرول پنل به آیتم منتخب
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;

      // اگر DOM آیتم منتخب را پیدا کنیم، به مرکز پنل اسکرول می‌کنیم
      const selectedEl =
        panel.querySelector<HTMLElement>('[aria-selected="true"]') ??
        (targetIndex >= 0
          ? (panel.querySelector(
              `[data-cs-index="${targetIndex}"]`
            ) as HTMLElement | null)
          : null);

      if (selectedEl) {
        // روش مطمئن: محاسبه دستی برای قرارگیری وسط
        const elTop = selectedEl.offsetTop;
        const elH = selectedEl.offsetHeight;
        const desiredTop = elTop - panel.clientHeight / 2 + elH / 2;
        panel.scrollTop = Math.max(0, desiredTop);
        // یا می‌توانستیم از scrollIntoView استفاده کنیم:
        // selectedEl.scrollIntoView({ block: "center" });
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [open, isMulti, selectedId, selectedIds, options]);

  return (
    <div
      ref={rootRef}
      className={`rjd-combo-select cs-wrapper ${className ?? ""}`}
      dir={dir}
      style={containerStyle}
    >
      {name && (
        <input
          ref={hiddenInputRef}
          tabIndex={-1}
          name={name}
          value={formValue}
          readOnly
          required={required}
          aria-hidden="true"
          onInvalid={onHiddenInvalid}
          style={{
            position: "absolute",
            opacity: 0,
            width: 0,
            height: 0,
            pointerEvents: "none",
          }}
        />
      )}

      <button
        type="button"
        className={`cs-trigger${showInvalid ? " cs-trigger--invalid" : ""}`}
        onClick={toggleOpen}
        onKeyDown={onKeyDown}
        onBlur={onTriggerBlur}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required || undefined}
        aria-invalid={showInvalid || undefined}
        disabled={disabled}
        style={{
          ...style,
          ...(resolvedColor ? { color: resolvedColor } : null),
        }}
      >
        <span className="cs-trigger-text">{triggerText}</span>
        <span className="cs-arrow" aria-hidden>
          <ArrowDownCombo />
        </span>
      </button>

      <div
        ref={panelRef}
        className={[
          "cs-panel",
          open ? "" : "cs-hidden",
          panelDir === "up" ? "cs-panel--up" : "cs-panel--down",
          listClassName ?? "",
        ].join(" ")}
        role="listbox"
        style={{
          marginTop: panelDir === "down" ? panelOffset : 0,
          marginBottom: panelDir === "up" ? panelOffset : 0,
          ...(resolvedColor ? { color: resolvedColor } : null),
        }}
      >
        {options.map((o, idx) => {
          const idStr = norm(o.id);
          const selected = isMulti
            ? selectedIds.includes(idStr)
            : idStr === selectedId;
          const toggle = isMulti
            ? () => onToggleMulti(o)
            : () => onSelectSingle(o);

          return (
            <div
              key={o.id}
              data-cs-index={idx} // کمک برای fallback اسکرول
              role="option"
              aria-selected={selected}
              aria-disabled={o.disabled ? "true" : undefined}
              className={`cs-option${selected ? " cs-option--selected" : ""}`}
              onMouseEnter={() => setHighlight(idx)}
              onMouseLeave={() => setHighlight(-1)}
              onClick={toggle}
            >
              {isMulti && (
                <label
                  className="cs-checkbox"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => onToggleMulti(o)}
                    disabled={o.disabled}
                  />
                  <span className="cs-checkbox-box" aria-hidden />
                </label>
              )}

              {showCheckIcon && (
                <span
                  className="cs-check"
                  aria-hidden
                  style={{
                    visibility: selected ? "visible" : "hidden",
                    order: isRTL ? 2 : 0,
                  }}
                >
                  <TickCircle />
                </span>
              )}

              <span style={{ flex: 1, textAlign: isRTL ? "right" : "left" }}>
                {o.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ComboSelect = React.memo(ComboSelectImpl, (prev, next) => {
  if (prev.name !== next.name) return false;
  if (prev.multi !== next.multi) return false;

  if (!prev.multi && !next.multi) {
    if (prev.defaultSelectedId !== next.defaultSelectedId) return false;
    if (prev.selectedId !== next.selectedId) return false;
  }

  if (prev.multi && next.multi) {
    const a = prev.selectedIds ?? null,
      b = next.selectedIds ?? null;
    if ((a === null) !== (b === null)) return false;
    if (a && b) {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    }
    const da = prev.defaultSelectedIds ?? null,
      db = next.defaultSelectedIds ?? null;
    if ((da === null) !== (db === null)) return false;
    if (da && db) {
      if (da.length !== db.length) return false;
      for (let i = 0; i < da.length; i++) if (da[i] !== db[i]) return false;
    }
  }

  if (prev.dir !== next.dir) return false;
  if (prev.disabled !== next.disabled) return false;
  if (prev.placeholderLabel !== next.placeholderLabel) return false;
  if (prev.hasPlaceholder !== next.hasPlaceholder) return false;
  if (prev.showCheckIcon !== next.showCheckIcon) return false;
  if (prev.colorVar !== next.colorVar) return false;
  if (prev.required !== next.required) return false;
  if (prev.className !== next.className) return false;
  if (prev.listClassName !== next.listClassName) return false;
  if (prev.style !== next.style) return false;
  if (prev.containerStyle !== next.containerStyle) return false;
  if (prev.onChange !== next.onChange) return false;
  if (prev.placement !== next.placement) return false;
  if (prev.panelOffset !== next.panelOffset) return false;

  return areOptionsEqual(prev.options, next.options);
});

export default ComboSelect;
export { ComboSelect };
