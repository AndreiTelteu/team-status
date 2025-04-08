import React from 'react';
import StatusTable from './StatusTable';
import { getPastDates } from '../utils/dateUtils';

function StatusTableView({ statuses, employees }) {
  const dates = getPastDates(5); // Today + past 5 days

  return (
    <div>
      <h2>Team Status Table</h2>
      <StatusTable statuses={statuses} employees={employees} dates={dates} />
    </div>
  );
}

export default StatusTableView;
