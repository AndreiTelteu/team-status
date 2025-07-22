import React, { useState } from 'react';
import StatusInput from './StatusInput';
import { getPastDates, getTodayDateString } from '../utils/dateUtils';
import { sendWebSocketMessage, exportUserStatuses } from '../dataService';
import { generateStatusCSV, downloadCSV } from '../utils/csvUtils';
import { showNotification } from '../utils/notification';

function MyStatusView({ userId, userName, statuses, onStatusChange, onLogout }) {
  const today = getTodayDateString();
  const pastDates = getPastDates(5); 
  const userStatuses = statuses[userId] || {};
  const [editingStatus, setEditingStatus] = useState(null);
  const [editText, setEditText] = useState('');

  const handleEditClick = (date, status) => {
    setEditingStatus(date);
    setEditText(status);
  };

  const handleSaveClick = (date) => {
    sendWebSocketMessage({
      type: 'status_update',
      payload: { userId, date, statusText: editText }
    });
    setEditingStatus(null);
  };

  const handleExportCSV = async () => {
    try {
      showNotification('Preparing CSV export...', 'info', 'Export');
      
      // Fetch all status data for the user
      const statusData = await exportUserStatuses(userId);
      
      if (!statusData || statusData.length === 0) {
        showNotification('No status data found to export.', 'warning', 'Export');
        return;
      }
      
      // Generate CSV content and filename
      const { content, filename } = generateStatusCSV(statusData, userName);
      
      // Trigger download
      downloadCSV(content, filename);
      
      showNotification(`Successfully exported ${statusData.length} status entries!`, 'success', 'Export Complete');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showNotification('Failed to export status data. Please try again.', 'error', 'Export Error');
    }
  };

  return (
    <div className="my-status-view">
      <h2>
        My Status - {userName}
        <small className='logout'>
          <a href="#" onClick={handleExportCSV}>Export CSV</a>
          &nbsp;|&nbsp;
          <a href="#" onClick={onLogout}>Logout</a>
        </small>
      </h2>
      <p>Your changes are saved and broadcast live as you type.</p>

      <StatusInput
        userId={userId}
        today={today}
        onStatusChange={onStatusChange}
        initialStatus={userStatuses[today]}
      />

      <div className="past-statuses">
        <h3>Past 5 Days</h3>
        <ul className="status-list">
          {pastDates.slice(1).map(date => (
            <li key={date}>
              <strong>{date}:</strong>&nbsp;&nbsp;
              {editingStatus === date ? (
                <div className="status-input-live">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={3}
                  />
                  <a className="save" href="#" onClick={() => handleSaveClick(date)}>Save</a>
                </div>
              ) : (
                <span>
                  {userStatuses?.[date] ? userStatuses[date] : <i>No status entered</i>}
                  <a className="edit" href="#" onClick={() => handleEditClick(date, userStatuses?.[date] || '')}>Edit</a>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MyStatusView;
