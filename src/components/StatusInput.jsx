import React, { useState, useEffect, useCallback, useRef } from 'react';
import throttle from 'lodash.throttle';

function StatusInput({ userId, today, onStatusChange, initialStatus }) {
  const [statusText, setStatusText] = useState(initialStatus || '');
  const initialStatusRef = useRef(initialStatus);
  const onStatusChangeRef = useRef(onStatusChange);
  const mainEditor = useRef(false);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  // Update local state ONLY if the initialStatus prop *actually changes* from outside
  // This prevents resetting the input while the user is typing if the parent re-renders
  useEffect(() => {
    // Check if the prop is different from the current state AND different from the last known initial value
    if (initialStatusRef.current !== initialStatus && mainEditor.current == false) {
        // console.log(`StatusInput (${userId}, ${today}): initialStatus prop changed to:`, initialStatus);
        setStatusText(initialStatus || '');
        initialStatusRef.current = initialStatus; // Update ref to the new initial value
    }
  }, [initialStatus, userId, today, statusText]); // Include statusText here

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSendUpdate = useCallback(
    throttle((text) => {
      // console.log(`Debounced: Sending update for ${userId} on ${today}:`, text);
      // Call the function from the ref
      if (onStatusChangeRef.current) {
          onStatusChangeRef.current(userId, today, text);
      }
    }, 500), // 500ms debounce delay
    [userId, today] // Dependencies: only userId and today, as the callback is now from a ref
  );

  useEffect(() => {
    // Only send update if the text has actually changed from the initial state received via props
    // This prevents sending the initial value on mount
    if (statusText !== initialStatusRef.current) {
        // console.log(`StatusInput (${userId}, ${today}): statusText changed, debouncing send:`, statusText);
        debouncedSendUpdate(statusText);
    } else {
        // console.log(`StatusInput (${userId}, ${today}): statusText matches initial, not sending.`);
    }

    // Cleanup function to cancel any pending debounced calls
    return () => {
      debouncedSendUpdate.cancel();
    };
    // statusText is the main trigger, debouncedSendUpdate is stable due to useCallback deps
  }, [statusText, debouncedSendUpdate]);

  const handleChange = (e) => {
    mainEditor.current = true;
    setStatusText(e.target.value);
  };

  // console.log(`StatusInput (${userId}, ${today}) rendering. Value:`, statusText, `Initial:`, initialStatus);


  return (
    <div className="status-input-live">
      <label htmlFor={`status-${userId}-${today}`}>Today's Status ({today}):</label>
      <textarea
        id={`status-${userId}-${today}`}
        value={statusText}
        onChange={handleChange}
        rows="4"
        placeholder="What did you work on today? Any blockers? (Updates live)"
      />
       <p className="live-update-notice">Status updates automatically as you type.</p>
    </div>
  );
}

export default StatusInput;
