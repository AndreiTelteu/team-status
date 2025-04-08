// This component isn't strictly necessary for MyStatusView anymore,
// but could be useful if you want to format status display elsewhere.
// Keeping it simple for now. You can delete this file if unused.
import React from 'react';

function StatusDisplay({ date, status }) {
  return (
    <div>
      <strong>{date}:</strong> {status || <i>No status entered</i>}
    </div>
  );
}

export default StatusDisplay;
