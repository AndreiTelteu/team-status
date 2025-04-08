/**
 * Generates an array of date strings (YYYY-MM-DD) for today and the past 'days' days.
 * @param {number} days - Number of past days to include (excluding today).
 * @returns {string[]} - Array of date strings, starting with today and going back.
 */
export function getPastDates(days) {
  const dates = [];
  const today = new Date();

  for (let i = 0; i <= days; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    dates.push(format(date));
  }
  // Sort dates chronologically (newest first) before returning
  return dates.sort((a, b) => new Date(b) - new Date(a));
}

/**
 * Gets today's date string in YYYY-MM-DD format.
 * @returns {string}
 */
export function getTodayDateString() {
  const date = new Date();
  return format(date);
}

/**
 * Format: YYYY-MM-DD
 * @returns {string}
 */
export function format(date) {
  return [
    date.toLocaleString('en-US', { year: 'numeric' }),
    date.toLocaleString('en-US', { month: '2-digit' }),
    date.toLocaleString('en-US', { day: '2-digit' }),
  ].join('-');
}
