import React from 'react';
import StatusInput from './StatusInput';
import { getPastDates } from '../utils/dateUtils';

// Removed onTriggerConfetti from props as it's handled in App.jsx's handleStatusSubmit
function MyStatusView({ userId, userName, statuses, onSubmit }) {
  const today = new Date().toISOString().split('T')[0];
  const pastDates = getPastDates(5); // Get past 5 days + today

  const userStatuses = statuses[userId] || {};

  return (
    <div className="my-status-view">
      <h2>My Status - {userName}</h2>

      <StatusInput
        userId={userId}
        today={today}
        onSubmit={onSubmit} // Pass the handler directly
        initialStatus={userStatuses[today]}
      />

      <div className="past-statuses">
        <h3>Past 5 Days</h3>
        <ul className="status-list">
          {pastDates.slice(1).map(date => (
            <li key={date}>
              <strong>{date}:</strong>
              {userStatuses[date] ? userStatuses[date] : <i>No status entered</i>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default MyStatusView;
