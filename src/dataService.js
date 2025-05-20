import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE_URL = '/api';
const WS_BASE_URL = '/ws'; // WebSocket URL

// --- API Fetch Functions ---

async function handleFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errBody = await response.json();
        errorMsg += ` - ${errBody.error || JSON.stringify(errBody)}`;
      } catch (e) { /* ignore json parsing error */ }
      throw new Error(errorMsg);
    }
    // Return null for 204 No Content
    if (response.status === 204) {
        return null;
    }
    // Check content type before parsing JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return await response.json();
    } else {
        // Handle non-JSON responses if necessary, or return as text
        // For now, assume JSON or null/empty
        // console.warn(`Received non-JSON response from ${url}`);
        return null; // Or handle as text: await response.text();
    }
  } catch (error) {
    console.error(`Fetch error for ${url}:`, error);
    alert(`Error communicating with server: ${error.message}`);
    throw error; // Re-throw to allow caller to handle if needed
  }
}

// --- Employee

export async function getEmployees() {
  return handleFetch(`${API_BASE_URL}/employees`);
}

export async function addEmployee(name) {
  return handleFetch(`${API_BASE_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function deleteEmployee(id) {
  return handleFetch(`${API_BASE_URL}/employees/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

// --- Clients

export async function getClients() {
  return handleFetch(`${API_BASE_URL}/clients`);
}

export async function addClient(name) {
  return handleFetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

export async function deleteClient(id) {
  return handleFetch(`${API_BASE_URL}/clients/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
}

// --- Leave Periods

export async function getLeavePeriods() {
  return handleFetch(`${API_BASE_URL}/leave-periods`);
}

export async function addLeavePeriod(leavePeriod) {
  // leavePeriod should now include employeeId from the caller
  return handleFetch(`${API_BASE_URL}/leave-periods`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leavePeriod),
  });
}

export async function updateLeavePeriod(id, leavePeriod) {
  // leavePeriod should now include employeeId from the caller
  return handleFetch(`${API_BASE_URL}/leave-periods/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(leavePeriod),
  });
}

export async function deleteLeavePeriod(id, employeeId) {
  // Now includes employeeId parameter
  return handleFetch(`${API_BASE_URL}/leave-periods/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  });
}

// --- Statuses

// GET statuses is still useful for initial load before WS connects OR as fallback
export async function getStatuses() {
  return handleFetch(`${API_BASE_URL}/statuses`);
}

// POST /statuses is removed, use WebSocket send instead
// export async function saveStatus(userId, date, statusText) { ... }


// --- WebSocket Management ---

let socket = null;
let messageListeners = new Set(); // Use a Set for easier add/remove
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // ms
let reconnectTimeoutId = null; // Store timeout ID

function notifyListeners(message) {
    // console.log("Notifying WS listeners:", message);
    messageListeners.forEach(listener => {
        try {
            listener(message);
        } catch (error) {
            console.error("Error in WebSocket message listener:", error);
        }
    });
}


function connectWebSocketInternal() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    // console.log("WebSocket already open or connecting.");
    return;
  }

  // Clear any pending reconnect timeout
  if (reconnectTimeoutId) {
      clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = null;
  }


  console.log(`Attempting WebSocket connection to ${WS_BASE_URL} (Attempt ${reconnectAttempts + 1})...`);
  try {
      socket = new WebSocket(WS_BASE_URL);
  } catch (error) {
      console.error("Failed to create WebSocket:", error);
      // Attempt to reconnect if creation fails
      handleWebSocketClose();
      return;
  }


  socket.onopen = () => {
    console.log("WebSocket connection established.");
    reconnectAttempts = 0; // Reset attempts on successful connection
    notifyListeners({ type: 'connection_status', payload: 'open' });
  };

  socket.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      // console.log("WebSocket message received:", message);
      notifyListeners(message);
    } catch (error) {
      console.error("Failed to parse WebSocket message:", event.data, error);
      // Optionally notify listeners of a parse error
      // notifyListeners({ type: 'error', message: 'Failed to parse message from server' });
    }
  };

  socket.onerror = (error) => {
    // Browsers often log WebSocket errors to the console automatically.
    // This event often precedes the 'close' event.
    console.error("WebSocket error observed:", error);
    // Don't automatically try to reconnect here, rely on onclose for that logic.
    // notifyListeners({ type: 'connection_status', payload: 'error' }); // Maybe notify?
  };

  socket.onclose = (event) => {
    console.log(`WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}, Clean: ${event.wasClean}`);
    handleWebSocketClose(); // Centralize close handling
  };
}

function handleWebSocketClose() {
     // Ensure socket reference is cleared immediately
    if (socket) {
        // Remove listeners to prevent memory leaks if the socket object lingers
        socket.onopen = null;
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        socket = null;
    }

    notifyListeners({ type: 'connection_status', payload: 'closed' });

    // Attempt to reconnect if allowed
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Attempting to reconnect in ${RECONNECT_DELAY / 1000} seconds... (Attempt ${reconnectAttempts})`);
      // Clear previous timeout just in case
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      reconnectTimeoutId = setTimeout(connectWebSocketInternal, RECONNECT_DELAY);
    } else {
      console.error("Max WebSocket reconnect attempts reached. Giving up.");
      // Optionally alert the user after max attempts
      // alert("WebSocket connection lost and could not be re-established. Please refresh the page.");
    }
}


// Public function to initiate connection
export function connectWebSocket() {
    // Only connect if not already connected or connecting
    if (!socket || socket.readyState === WebSocket.CLOSED) {
        reconnectAttempts = 0; // Reset attempts when manually connecting
        connectWebSocketInternal();
    } else {
        // console.log("connectWebSocket called but socket exists and is not closed. State:", socket.readyState);
    }
}

// Public function to add a message listener
export function addWebSocketMessageListener(callback) {
    if (typeof callback === 'function') {
        messageListeners.add(callback);
        // console.log("Added WS listener. Total listeners:", messageListeners.size);
        // Return a function to remove the listener
        return () => {
            messageListeners.delete(callback);
            // console.log("Removed WS listener. Total listeners:", messageListeners.size);
        };
    } else {
        console.error("Invalid callback provided to addWebSocketMessageListener");
        return () => {}; // Return no-op remover
    }
}

// Public function to send messages
export function sendWebSocketMessage(message) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
        // console.log("Sending WebSocket message:", message);
        socket.send(JSON.stringify(message));
    } catch (error) {
        console.error("Error sending WebSocket message:", error);
         // If sending fails, the connection might be broken, trigger close handling
         handleWebSocketClose();
    }
  } else {
    console.warn("WebSocket not connected or not open. Message not sent:", message);
    // Optionally queue messages or alert user
    // Attempt to reconnect if trying to send while closed?
    // connectWebSocket(); // Be careful not to create loops
  }
}

// Function to specifically send a typing update
export function sendTypingUpdate(userId, date, statusText) {
    sendWebSocketMessage({
        type: 'typing',
        payload: { userId, date, statusText }
    });
}

// Hook for components to easily use WebSocket connection status and messages
export function useWebSocket(onMessage) {
    // Initialize state based on the *current* socket status, not just null check
    const [isConnected, setIsConnected] = useState(socket?.readyState === WebSocket.OPEN);
    const messageHandlerRef = useRef(onMessage);

    // Update ref if onMessage callback changes (should be stable now with useCallback)
    useEffect(() => {
        messageHandlerRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        // Define the listener function using the ref
        const listener = (message) => {
            if (message.type === 'connection_status') {
                const connected = message.payload === 'open';
                // Only update state if it changes
                setIsConnected(prev => prev === connected ? prev : connected);
            } else if (messageHandlerRef.current) {
                // Call the component's message handler
                messageHandlerRef.current(message);
            }
        };

        // Add the listener
        const removeListener = addWebSocketMessageListener(listener);

        // Attempt connection if not already connected/connecting
        // Check readyState explicitly
        if (!socket || socket.readyState === WebSocket.CLOSED) {
            // console.log("useWebSocket Hook: Initiating connection.");
            connectWebSocket();
        } else {
             // If already connected/connecting, update state immediately
             // console.log("useWebSocket Hook: Socket exists, setting initial state.");
             setIsConnected(socket.readyState === WebSocket.OPEN);
        }


        // Cleanup: remove the listener when the component unmounts
        return () => {
            // console.log("useWebSocket Hook: Cleaning up listener.");
            removeListener();
        };
    }, []); // Empty dependency array ensures this runs once on mount and cleans up on unmount

    // Expose connection status and the generic send function
    return { isConnected, sendWebSocketMessage };
}
