/** خروجی مثل 2025-9-2 (بدون صفر ابتدایی) */
export function fmtYMD(d: Date) {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/**
 * از روی یک تاریخ (پیش‌فرض: امروز) payload می‌سازد:
 * - toDate = همان تاریخ
 * - fromDate = یک ماه قبل با همان day؛ اگر وجود نداشت → آخر ماه قبل
 *
 * مثال‌ها:
 *  2025-03-31 → fromDate: 2025-2-28  (یا در سال کبیسه 29)
 *  2025-10-01 → fromDate: 2025-9-1
 */
export function oneMonthBackSameDayPayload(base: Date = new Date()) {
    // to: فقط بخش تاریخِ محلی (بدون زمان) را نگه داریم
    const to = new Date(base.getFullYear(), base.getMonth(), base.getDate());

    const day = to.getDate();

    // اولِ ماهِ قبل
    const prevMonthFirst = new Date(to.getFullYear(), to.getMonth() - 1, 1);

    // آخرین روزِ ماهِ قبل
    const lastDayPrevMonth = new Date(
        prevMonthFirst.getFullYear(),
        prevMonthFirst.getMonth() + 1,
        0
    ).getDate();

    // اگر روز مورد نظر وجود ندارد، به آخرِ ماه قبل کلمپ می‌کنیم
    const fromDay = Math.min(day, lastDayPrevMonth);

    const from = new Date(
        prevMonthFirst.getFullYear(),
        prevMonthFirst.getMonth(),
        fromDay
    );

    return {
        fromDate: fmtYMD(from),
        toDate: fmtYMD(to),
    };
}

