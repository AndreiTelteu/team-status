/**
 * Time Parser Utility
 * Handles parsing of time estimation inputs in various formats (minutes, hours, days, weeks)
 * and conversion to a standardized format for calculations.
 */

// Conversion constants
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 8; // Standard workday
const DAYS_PER_WEEK = 5; // Standard workweek
const MINUTES_PER_DAY = HOURS_PER_DAY * MINUTES_PER_HOUR; // 480 minutes
const MINUTES_PER_WEEK = DAYS_PER_WEEK * MINUTES_PER_DAY; // 2400 minutes

/**
 * Parses a time string (e.g., "1d 4h", "48h", "1w") and converts to minutes
 * @param {string} input - Time string to parse
 * @returns {number} Total minutes, or 0 if invalid
 */
export function parseTimeString(input) {
  if (!input || typeof input !== 'string') {
    return 0;
  }

  // Remove extra whitespace and convert to lowercase
  const cleanInput = input.trim().toLowerCase();
  
  if (cleanInput === '') {
    return 0;
  }

  // Regex to match time components: 1w, 2d, 4h, 30m
  const timeRegex = /(\d+)\s*([wdhm])/g;
  let totalMinutes = 0;
  let match;
  let hasValidMatch = false;

  while ((match = timeRegex.exec(cleanInput)) !== null) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    hasValidMatch = true;

    switch (unit) {
      case 'w': // weeks
        totalMinutes += value * MINUTES_PER_WEEK;
        break;
      case 'd': // days
        totalMinutes += value * MINUTES_PER_DAY;
        break;
      case 'h': // hours
        totalMinutes += value * MINUTES_PER_HOUR;
        break;
      case 'm': // minutes
        totalMinutes += value;
        break;
      default:
        // Invalid unit, skip
        break;
    }
  }

  // If no valid matches found, try to parse as plain number (assume hours)
  if (!hasValidMatch) {
    const numericValue = parseFloat(cleanInput);
    if (!isNaN(numericValue) && numericValue > 0) {
      totalMinutes = numericValue * MINUTES_PER_HOUR;
    }
  }

  return totalMinutes;
}

/**
 * Converts minutes back to a readable time format
 * @param {number} minutes - Total minutes
 * @returns {string} Formatted time string (e.g., "1w 2d 4h")
 */
export function formatMinutesToReadable(minutes) {
  if (!minutes || minutes <= 0) {
    return '';
  }

  const parts = [];
  let remaining = Math.round(minutes);

  // Calculate weeks
  if (remaining >= MINUTES_PER_WEEK) {
    const weeks = Math.floor(remaining / MINUTES_PER_WEEK);
    parts.push(`${weeks}w`);
    remaining %= MINUTES_PER_WEEK;
  }

  // Calculate days
  if (remaining >= MINUTES_PER_DAY) {
    const days = Math.floor(remaining / MINUTES_PER_DAY);
    parts.push(`${days}d`);
    remaining %= MINUTES_PER_DAY;
  }

  // Calculate hours
  if (remaining >= MINUTES_PER_HOUR) {
    const hours = Math.floor(remaining / MINUTES_PER_HOUR);
    parts.push(`${hours}h`);
    remaining %= MINUTES_PER_HOUR;
  }

  // Calculate remaining minutes
  if (remaining > 0) {
    parts.push(`${remaining}m`);
  }

  return parts.join(' ');
}

/**
 * Validates if a time format string is valid
 * @param {string} input - Time string to validate
 * @returns {boolean} True if valid format
 */
export function validateTimeFormat(input) {
  if (!input || typeof input !== 'string') {
    return true; // Empty input is valid (optional field)
  }

  const cleanInput = input.trim().toLowerCase();
  
  if (cleanInput === '') {
    return true;
  }

  // Check if it matches our expected format
  const validPattern = /^(\d+\s*[wdhm]\s*)*\d*\s*[wdhm]?$/;
  
  // Also allow plain numbers (interpreted as hours)
  const numericPattern = /^\d*\.?\d+$/;
  
  return validPattern.test(cleanInput) || numericPattern.test(cleanInput);
}

/**
 * Calculates total estimation from a breakdown structure
 * @param {Array} breakdown - Array of modules with tasks
 * @returns {number} Total minutes across all modules and tasks
 */
export function calculateTotalEstimation(breakdown) {
  if (!Array.isArray(breakdown)) {
    return 0;
  }

  let totalMinutes = 0;

  breakdown.forEach(module => {
    // Only count task estimations since module estimations are now auto-calculated from tasks
    // This avoids double counting
    if (Array.isArray(module.tasks)) {
      module.tasks.forEach(task => {
        if (task.estimation) {
          totalMinutes += parseTimeString(task.estimation);
        }
      });
    }
  });

  return totalMinutes;
}

/**
 * Creates default modules for new offers
 * @returns {Array} Default breakdown structure with testing and bugfixing modules
 */
export function createDefaultModules() {
  return [
    {
      name: "Development",
      tasks: []
    },
    {
      name: "Testing",
      tasks: []
    },
    {
      name: "Bugfixing",
      tasks: []
    }
  ];
}

/**
 * Formats time for display in input placeholders and hints
 * @returns {string} Example time format string
 */
export function getTimeFormatHint() {
  return "e.g., 1d 4h, 48h, 2w, 30m";
}

/**
 * Gets validation error message for invalid time format
 * @param {string} input - The invalid input
 * @returns {string} Error message
 */
export function getValidationError(input) {
  if (!validateTimeFormat(input)) {
    return `Invalid time format. Use formats like: ${getTimeFormatHint()}`;
  }
  return '';
}