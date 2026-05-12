export const formatMoney = (value: number, currency = 'EUR') =>
  new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export const formatPercent = (value: number, digits = 1) =>
  `${new Intl.NumberFormat('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0)} %`;

export const parseMoneyInput = (value: string | number | null | undefined) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;

  const cleaned = String(value ?? '')
    .trim()
    .replace(/[^\d,.-]/g, '');
  const commaIndex = cleaned.lastIndexOf(',');
  const dotIndex = cleaned.lastIndexOf('.');
  let normalized = cleaned;

  if (commaIndex >= 0 && dotIndex >= 0) {
    normalized =
      commaIndex > dotIndex
        ? cleaned.replace(/\./g, '').replace(',', '.')
        : cleaned.replace(/,/g, '');
  } else if (commaIndex >= 0) {
    normalized = cleaned.replace(',', '.');
  } else if (dotIndex >= 0) {
    const dotParts = cleaned.split('.');
    const looksLikeThousands =
      dotParts.length > 1 &&
      dotParts.slice(1).every((part) => part.length === 3) &&
      dotParts[0].length >= 1 &&
      dotParts[0].length <= 3;
    normalized = looksLikeThousands ? cleaned.replace(/\./g, '') : cleaned;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
