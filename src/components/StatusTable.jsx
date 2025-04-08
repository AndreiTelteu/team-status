import React, { Fragment } from 'react';

function StatusTable({ statuses, employees, dates }) {
  // Ensure employees is an array
  const validEmployees = Array.isArray(employees) ? employees : [];

  return (
    <div className="status-table-container">
      <table className="status-table">
        <thead>
          <tr>
            <th>Employee</th>
            {dates.map(date => (
              <th key={date}>{date}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {validEmployees.map(employee => (
            <tr key={employee.id}>
              <td className="employee-name">{employee.name}</td>
              {dates.map(date => {
                // Get status text safely, checking if user and date exist
                const statusText = statuses[employee.id]?.[date];
                const hasStatus = typeof statusText === 'string' && statusText !== ''; // Check if status exists and is not empty

                return (
                  <td
                    key={`${employee.id}-${date}`}
                    className={`status-cell ${!hasStatus ? 'no-status' : ''}`}
                  >
                    {hasStatus ? parseStatusText(statusText) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper function to parse status text and make text inside star marks bold
function parseStatusText(text) {
  if (!text.includes('*')) {
    return text;
  }

  const parts = text.split('*');
  const result = [];
  
  // If the text starts with a star, the first element will be an empty string
  // and the first actual content should be bold
  let isBold = text.startsWith('*');
  
  parts.forEach((part, index) => {
    if (part === '') {
      // Skip empty parts, but toggle the bold state if we encounter consecutive stars
      if (index > 0 && index < parts.length - 1) {
        isBold = !isBold;
      }
      return;
    }
    
    result.push(
      <Fragment key={index}>
        {isBold ? <strong>{part}</strong> : part}
      </Fragment>
    );
    
    isBold = !isBold;
  });
  
  return result;
}

export default StatusTable;
