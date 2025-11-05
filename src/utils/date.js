const KST_OFFSET_MINUTES = 9 * 60;

function getTimezoneOffset(date, timeZone) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    hourCycle: 'h23',
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = dtf.formatToParts(date);
  const map = {};
  for (const { type, value } of parts) {
    if (type !== 'literal') {
      map[type] = value;
    }
  }

  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  return (asUTC - date.getTime()) / 60000;
}

export function parseBirthDate(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hour) ||
    Number.isNaN(minute)
  ) {
    throw new Error('Invalid date or time input');
  }
  return { year, month, day, hour, minute };
}

export function toUtc({ year, month, day, hour, minute }, timeZone) {
  const naive = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimezoneOffset(naive, timeZone);
  return new Date(naive.getTime() - offset * 60000);
}

export function toKst(date) {
  const utcMs = date.getTime();
  return new Date(utcMs + KST_OFFSET_MINUTES * 60000);
}

export function formatDateParts(date) {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate()
  };
}

export function formatIso(date) {
  return date.toISOString();
}
