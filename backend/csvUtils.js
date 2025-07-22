// CSV utility functions for server-side generation

/**
 * Escapes a CSV field value by wrapping it in quotes if it contains special characters
 * @param {string} value - The value to escape
 * @returns {string} - The escaped value
 */
function escapeCsvField(value) {
  if (value == null) return '';
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape existing quotes by doubling them
    const escapedValue = stringValue.replace(/"/g, '""');
    return `"${escapedValue}"`;
  }
  
  return stringValue;
}

/**
 * Converts an array of status objects to CSV format
 * @param {Array} statusData - Array of objects with date, status, and employeeName properties
 * @param {string} userName - User name for the filename
 * @returns {Object} - Object with csv content and filename
 */
export function generateStatusCSV(statusData, userName) {
  // CSV headers
  const headers = ['Employee Name', 'Date', 'Status'];
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...statusData.map(item => [
      escapeCsvField(item.employeeName || ''),
      escapeCsvField(item.date),
      escapeCsvField(item.status)
    ].join(','))
  ];
  
  const csvContent = csvRows.join('\n');
  
  // Generate filename with current date
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const sanitizedUserName = userName.replace(/[^a-zA-Z0-9]/g, '-'); // Replace special chars with dashes
  const filename = `status-export-${sanitizedUserName}-${currentDate}.csv`;
  
  return {
    content: csvContent,
    filename: filename
  };
}

/**
 * Converts an array of team status objects to CSV format
 * @param {Array} statusData - Array of objects with date, status, employeeName, and employeeId properties
 * @returns {Object} - Object with csv content and filename
 */
export function generateTeamStatusCSV(statusData) {
  // CSV headers
  const headers = ['Employee Name', 'Date', 'Status'];
  
  // Create CSV content
  const csvRows = [
    headers.join(','), // Header row
    ...statusData.map(item => [
      escapeCsvField(item.employeeName || ''),
      escapeCsvField(item.date),
      escapeCsvField(item.status)
    ].join(','))
  ];
  
  const csvContent = csvRows.join('\n');
  
  // Generate filename with current date
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const filename = `team-status-export-${currentDate}.csv`;
  
  return {
    content: csvContent,
    filename: filename
  };
}