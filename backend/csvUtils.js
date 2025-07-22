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
 * Converts an array of team status objects to CSV format with dates as rows and employees as columns
 * @param {Array} statusData - Array of objects with date, status, employeeName, and employeeId properties
 * @returns {Object} - Object with csv content and filename
 */
export function generateTeamStatusCSV(statusData) {
  // Get unique dates and employees
  const uniqueDates = [...new Set(statusData.map(item => item.date))];
  const uniqueEmployees = [...new Set(statusData.map(item => item.employeeName))];
  
  // Create a lookup map for quick access to status data
  const statusMap = new Map();
  statusData.forEach(item => {
    const key = `${item.date}-${item.employeeName}`;
    statusMap.set(key, item.status);
  });
  
  // Create CSV headers: Date followed by employee names
  const headers = ['Date', ...uniqueEmployees];
  
  // Create CSV rows
  const csvRows = [
    headers.map(header => escapeCsvField(header)).join(',') // Header row
  ];
  
  // Add data rows - one for each date
  uniqueDates.forEach(date => {
    const row = [escapeCsvField(date)]; // Start with the date
    
    // Add status for each employee on this date
    uniqueEmployees.forEach(employeeName => {
      const key = `${date}-${employeeName}`;
      const status = statusMap.get(key) || ''; // Empty string if no status found
      row.push(escapeCsvField(status));
    });
    
    csvRows.push(row.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  
  // Generate filename with current date
  const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  const filename = `team-status-export-${currentDate}.csv`;
  
  return {
    content: csvContent,
    filename: filename
  };
}