import { DateTime } from 'luxon';

export const now = () => DateTime.now();
export const today = () => DateTime.now().toISODate(); // e.g. "2026-03-09"
export const isSameDay = (a, b) =>
    a.hasSame(b, 'day') && a.hasSame(b, 'month') && a.hasSame(b, 'year');
export const currentHour = () => DateTime.now().hour;
export const currentMinute = () => DateTime.now().minute;
export const fromISO = (isoString) => {
    if (!isoString) return null;
    const dt = DateTime.fromISO(String(isoString));
    return dt.isValid ? dt : null;
};
export const daysBetween = (from, to) => Math.ceil(to.diff(from, 'days').days);
export const daysFromNow = (isoString) => {
    const target = fromISO(isoString);
    if (!target) return null;
    return daysBetween(DateTime.now(), target);
};
export const formatDisplay = (dt, fmt = 'dd MMM yyyy, hh:mm a') => {
    if (!dt || !dt.isValid) return '';
    return dt.toFormat(fmt);
};
