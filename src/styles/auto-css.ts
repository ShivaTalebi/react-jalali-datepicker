// src/styles/auto-css.ts

// ۱) فونت‌ها را فایل‌محور ایمپورت کن تا tsup آدرس final بدهد و به dist/fonts کپی کند
import IR_UltraLight from "../fonts/IRANSansFaNum-UltraLight.ttf";
import IR_Light from "../fonts/IRANSansFaNum-Light.ttf";
import IR_Regular from "../fonts/IRANSansFaNum-Regular.ttf";
import IR_Medium from "../fonts/IRANSansFaNum-Medium.ttf";
import IR_Bold from "../fonts/IRANSansFaNum-Bold.ttf";
import IR_Black from "../fonts/IRANSansFaNum-Black.ttf";

// مقدار این ثابت در زمان build توسط tsup با محتوای styles.css جایگزین می‌شود.
declare const __RJD_BASE_CSS__: string;
const baseCss = __RJD_BASE_CSS__;

const fontsCss = `
@font-face { font-family:"IRANSansFaNum"; src:url("${IR_UltraLight}") format("truetype"); font-weight:200; font-style:normal; font-display:swap; }
@font-face { font-family:"IRANSansFaNum"; src:url("${IR_Light}")      format("truetype"); font-weight:300; font-style:normal; font-display:swap; }
@font-face { font-family:"IRANSansFaNum"; src:url("${IR_Regular}")    format("truetype"); font-weight:400; font-style:normal; font-display:swap; }
@font-face { font-family:"IRANSansFaNum"; src:url("${IR_Medium}")     format("truetype"); font-weight:500; font-style:normal; font-display:swap; }
@font-face { font-family:"IRANSansFaNum"; src:url("${IR_Bold}")       format("truetype"); font-weight:700; font-style:normal; font-display:swap; }
@font-face { font-family:"IRANSansFaNum"; src:url("${IR_Black}")      format("truetype"); font-weight:900; font-style:normal; font-display:swap; }
`;

let injected = false;

/** یک‌بار CSS پایه + @font-face را در <head> تزریق می‌کند */
export function ensureStylesInjected(): void {
  if (injected || typeof document === "undefined") return;

  // اگر قبلاً تزریق شده بود (به‌هر دلیل) حذف و دوباره بسازیم تا تکراری نشود
  document
    .querySelectorAll('style[data-rjd="styles"]')
    .forEach((n) => n.remove());

  const styleEl = document.createElement("style");
  styleEl.setAttribute("data-rjd", "styles");
  // حتماً CSS پایه را هم اضافه کن
  styleEl.textContent = `${fontsCss}\n${baseCss}`;
  document.head.appendChild(styleEl);

  injected = true;
}
