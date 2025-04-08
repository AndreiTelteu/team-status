import React from 'react';

function StatusTable({ statuses, employees, dates }) {
  // Ensure dates are sorted chronologically (newest first, which getPastDates provides)
  const sortedDates = [...dates].sort((a, b) => new Date(b) - new Date(a)); // Sort descending (newest first)

  return (
    <div className="table-container">
      <table className="status-table">
        <thead>
          <tr>
            <th>Date</th>
            {employees.map(emp => (
              <th key={emp.id}>{emp.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedDates.map(date => (
            <tr key={date}>
              <td><strong>{date}</strong></td>
              {employees.map(emp => (
                <td key={`${date}-${emp.id}`}>
                  {statuses[emp.id]?.[date] || <i>-</i>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default StatusTable;
