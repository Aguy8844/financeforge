const MONTH_NAMES = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];

export const isoToday = () => new Date().toISOString().slice(0, 10);

export const toMonthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const currentMonthKey = () => toMonthKey(new Date());

export const monthKeyFromDate = (date: string) => date.slice(0, 7);

export const dateFromMonthKey = (monthKey: string, day = 1) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const monthStartDate = (monthKey: string) => `${monthKey}-01`;

export const addMonths = (monthKey: string, offset: number) => {
  const date = dateFromMonthKey(monthKey);
  date.setMonth(date.getMonth() + offset);
  return toMonthKey(date);
};

export const monthDiff = (fromMonth: string, toMonth: string) => {
  const [fromYear, fromIndex] = fromMonth.split('-').map(Number);
  const [toYear, toIndex] = toMonth.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toIndex - fromIndex);
};

export const daysInMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
};

export const elapsedDaysInMonth = (monthKey: string, reference = new Date()) => {
  const current = toMonthKey(reference);
  if (monthKey < current) return daysInMonth(monthKey);
  if (monthKey > current) return 0;
  return reference.getDate();
};

export const remainingDaysInMonth = (monthKey: string, reference = new Date()) => {
  const current = toMonthKey(reference);
  if (monthKey < current) return 0;
  if (monthKey > current) return daysInMonth(monthKey);
  return Math.max(1, daysInMonth(monthKey) - reference.getDate() + 1);
};

export const formatDate = (dateString: string) =>
  new Intl.DateTimeFormat('de-DE').format(new Date(`${dateString}T12:00:00`));

export const formatMonth = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

export const backupDateStamp = () => isoToday();

export const isSameMonth = (dateString: string, monthKey: string) =>
  monthKeyFromDate(dateString) === monthKey;
