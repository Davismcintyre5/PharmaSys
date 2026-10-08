const TZ_OFFSET_MINUTES = 180;

function startOfDay(date = new Date()) {
  const shifted = new Date(date.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - TZ_OFFSET_MINUTES * 60 * 1000);
}

function endOfDay(date = new Date()) {
  return new Date(startOfDay(date).getTime() + 86400000 - 1);
}

function startOfWeek(date = new Date()) {
  const start = startOfDay(date);
  const shifted = new Date(start.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  const day = shifted.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  shifted.setUTCDate(shifted.getUTCDate() - diff);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - TZ_OFFSET_MINUTES * 60 * 1000);
}

function startOfMonth(date = new Date()) {
  const shifted = new Date(date.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  shifted.setUTCHours(0, 0, 0, 0);
  shifted.setUTCDate(1);
  return new Date(shifted.getTime() - TZ_OFFSET_MINUTES * 60 * 1000);
}

function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  const a = startOfDay(d).getTime();
  const b = startOfDay(now).getTime();
  return a === b;
}

module.exports = { startOfDay, endOfDay, startOfWeek, startOfMonth, isToday };