import React from 'react';

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
                    {hasStatus ? statusText : '-'}
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

export default StatusTable;
