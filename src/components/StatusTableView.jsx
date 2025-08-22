import React from 'react';
import StatusTable from './StatusTable';
import { getPastDates } from '../utils/dateUtils';
import { downloadTeamCSV } from '../dataService';
import { downloadBlob } from '../utils/csvUtils';
import { showNotification } from '../utils/notification';

function StatusTableView({ statuses, employees, leavePeriods, selectedUserId }) {
  // Ensure employees is always an array to prevent errors during loading/initial state
  const validEmployees = Array.isArray(employees) ? employees : [];
  const dates = getPastDates(5); // Today + past 4 days

  const handleExportCSV = async () => {
    try {
      showNotification('Preparing team CSV export...', 'info', 'Export');
      
      // Download CSV directly from server
      const { blob, filename } = await downloadTeamCSV();
      
      // Trigger download
      downloadBlob(blob, filename);
      
      showNotification('Successfully exported team status data!', 'success', 'Export Complete');
    } catch (error) {
      console.error('Error exporting team CSV:', error);
      showNotification('Failed to export team status data. Please try again.', 'error', 'Export Error');
    }
  };

  return (
    <div className="status-table-view">
      <h2>
        Team Status Table
        <small className='logout'>
          <a href="#" onClick={handleExportCSV}>Export CSV</a>
        </small>
      </h2>
       {validEmployees.length === 0 ? (
           <p>No employees found. Add employees in the 'Manage Employees' tab.</p>
       ) : Object.keys(statuses).length === 0 ? (
            <p>Waiting for status updates...</p>
       ) : (
           <StatusTable statuses={statuses} employees={validEmployees} leavePeriods={leavePeriods} dates={dates} selectedUserId={selectedUserId} />
       )}
    </div>
  );
}

export default StatusTableView;
