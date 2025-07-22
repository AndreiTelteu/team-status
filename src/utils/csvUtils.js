// Download utility functions for CSV files

/**
 * Triggers a download of a blob file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the download
 */
export function downloadBlob(blob, filename) {
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element and trigger the download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  // Append to body, click, and remove
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  // URL.revokeObjectURL(url);
}

/**
 * Triggers a download of CSV content (legacy function - kept for compatibility)
 * @param {string} csvContent - The CSV content to download
 * @param {string} filename - The filename for the download
 */
export function downloadCSV(csvContent, filename) {
  // Create a blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}