import React, { useState, useEffect } from 'react';

// Removed onTriggerConfetti from props
function StatusInput({ userId, today, onSubmit, initialStatus }) {
  const [statusText, setStatusText] = useState(initialStatus || '');

  useEffect(() => {
    setStatusText(initialStatus || '');
  }, [initialStatus]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedStatus = statusText.trim();
    if (trimmedStatus) {
      onSubmit(userId, today, trimmedStatus); // Call the handler passed from App
      // Confetti is triggered within the onSubmit handler in App.jsx
    } else {
       // Allow clearing status by submitting empty
       onSubmit(userId, today, ''); // Submit empty string
       // Optionally trigger confetti even when clearing? If so, call onSubmit anyway.
       // If not, only call onSubmit if trimmedStatus is truthy.
       // Current implementation calls onSubmit (and thus confetti) even for clearing.
       // alert('Please enter a status.'); // Alert removed to allow clearing
    }
  };

  return (
    <form onSubmit={handleSubmit} className="status-input-form">
      <label htmlFor="status">Today's Status ({today}):</label>
      <textarea
        id="status"
        value={statusText}
        onChange={(e) => setStatusText(e.target.value)}
        rows="4"
        placeholder="What did you work on today? Any blockers?"
      />
      <button type="submit">Save Status</button>
    </form>
  );
}

export default StatusInput;
