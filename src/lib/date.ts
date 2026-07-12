const WEEKDAYS = [
  'Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba',
  'Payshanba', 'Juma', 'Shanba',
];

const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

/** "Chorshanba, 11-iyul" */
export function todayLabel(d: Date = new Date()): string {
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()}-${MONTHS[d.getMonth()]}`;
}

/** "2026-07-11" — DailyStat.date formati (lokal vaqt) */
export function dateKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Kun oxiri timestamp — SRS "bugungacha due" chegarasi */
export function endOfToday(d: Date = new Date()): number {
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);
  return end.getTime();
}
