import React from 'react';
import StatusTable from './StatusTable';
import { getPastDates } from '../utils/dateUtils';

function StatusTableView({ statuses, employees }) {
  // Ensure employees is always an array to prevent errors during loading/initial state
  const validEmployees = Array.isArray(employees) ? employees : [];
  const dates = getPastDates(5); // Today + past 4 days

  return (
    <div className="status-table-view">
      <h2>Team Status Table</h2>
       {validEmployees.length === 0 ? (
           <p>No employees found. Add employees in the 'Manage Employees' tab.</p>
       ) : Object.keys(statuses).length === 0 ? (
            <p>Waiting for status updates...</p>
       ) : (
           <StatusTable statuses={statuses} employees={validEmployees} dates={dates} />
       )}
    </div>
  );
}

export default StatusTableView;
