import React, { Fragment } from 'react';
import { getTodayDateString } from '../utils/dateUtils';

function StatusTable({ statuses, employees, leavePeriods, dates, selectedUserId }) {
  const todayDateString = getTodayDateString();
  // Ensure employees and leavePeriods are arrays
  const validEmployees = Array.isArray(employees) ? employees : [];
  const validLeavePeriods = Array.isArray(leavePeriods) ? leavePeriods : [];

  // Helper function to check if an employee is on leave for a specific date
  const isEmployeeOnLeave = (employeeId, date) => {
    return validLeavePeriods.some(leavePeriod => {
      return leavePeriod.employeeId === employeeId &&
             date >= leavePeriod.fromDate &&
             date <= leavePeriod.untilDate;
    });
  };

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
            <tr key={employee.id} className={selectedUserId === employee.id ? 'selected' : ''}>
              <td 
                className={`employee-name ${
                  typeof statuses[employee.id]?.[todayDateString] === 'string' && 
                  statuses[employee.id]?.[todayDateString] !== '' 
                    ? 'status-complete' 
                    : 'status-incomplete'
                }`}
                style={{
                  backgroundColor: typeof statuses[employee.id]?.[todayDateString] === 'string' && 
                                  statuses[employee.id]?.[todayDateString] !== '' 
                                    ? '#d4edda' // green background
                                    : '#f8d7da'  // red background
                }}
              >
                {employee.name}
              </td>
              {dates.map(date => {
                // Check if employee is on leave for this date
                const onLeave = isEmployeeOnLeave(employee.id, date);
                
                if (onLeave) {
                  return (
                    <td
                      key={`${employee.id}-${date}`}
                      className="status-cell on-leave"
                    >
                      <span>{`🏝️ 🍹 Vacanță ⛱️`}</span>
                    </td>
                  );
                }

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
