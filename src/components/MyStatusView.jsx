import React from 'react';
import StatusInput from './StatusInput';
import { getPastDates } from '../utils/dateUtils';

// Changed onSubmit to onStatusChange to reflect live updates
function MyStatusView({ userId, userName, statuses, onStatusChange }) {
  const today = new Date().toISOString().split('T')[0];
  const pastDates = getPastDates(5); // Get past 5 days + today

  const userStatuses = statuses[userId] || {};

  return (
    <div className="my-status-view">
      <h2>My Status - {userName} (ID: {userId})</h2>
      <p>Your changes are saved and broadcast live as you type.</p>

      <StatusInput
        userId={userId}
        today={today}
        onStatusChange={onStatusChange} // Pass the live update handler
        initialStatus={userStatuses[today]} // Get today's status for initial value
      />

      <div className="past-statuses">
        <h3>Past 5 Days</h3>
        <ul className="status-list">
          {pastDates.slice(1).map(date => ( // Exclude today from this list
            <li key={date}>
              <strong>{date}:</strong>
              {/* Display status from the main statuses object */}
              {statuses[userId]?.[date] ? statuses[userId][date] : <i>No status entered</i>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MyStatusView;
