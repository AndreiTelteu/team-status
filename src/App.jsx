import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Confetti from 'react-confetti';
import 'simple-notify/dist/simple-notify.css'
import MyStatusView from './components/MyStatusView';
import StatusTableView from './components/StatusTableView';
import ManageEmployeesView from './components/ManageEmployeesView';
import ManageClientsView from './components/ManageClientsView';
import ManageLeavePeriodsView from './components/ManageLeavePeriodsView';
import ManageOffersView from './components/ManageOffersView';
import UserSelector from './components/UserSelector';
import { getEmployees, addEmployee, deleteEmployee, getClients, addClient, deleteClient, getLeavePeriods, addLeavePeriod, updateLeavePeriod, deleteLeavePeriod, useWebSocket, sendTypingUpdate as sendWsTypingUpdate } from './dataService';
import './App.css';
import { getTodayDateString } from './utils/dateUtils';
import { showNotification } from './utils/notification';
import SplashPopup from './components/SplashPopup';

// Simulate logged-in user (Needs proper auth eventually)
// IMPORTANT: Update this ID based on the IDs generated by the backend (see backend/db.js logs)
const LOCAL_STORAGE_USER_ID_KEY = 'teamStatusApp_selectedUserId';
const CONFETTI_STORAGE_KEY_PREFIX = 'confettiLastShown_';

// Helper function for notifications

const hashToView = {
  '#my-status': 'myStatus',
  '#status-table': 'statusTable',
  '#employees': 'manageEmployees',
  '#clients': 'manageClients',
  '#vacations': 'manageLeavePeriods',
  '#offers': 'manageOffers',
};
const viewToHash = {
  'myStatus': '#my-status',
  'statusTable': '#status-table',
  'manageEmployees': '#employees',
  'manageClients': '#clients',
  'manageLeavePeriods': '#vacations',
  'manageOffers': '#offers',
};

function App() {
  // Initialize view based on URL hash or default to 'myStatus'
  const [view, setView] = useState(() => {
    const hash = window.location.hash;
    return hashToView[hash] || 'myStatus';
  });
  const [statuses, setStatuses] = useState({}); // { userId: { date: statusText } }
  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [leavePeriods, setLeavePeriods] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(
    () => localStorage.getItem(LOCAL_STORAGE_USER_ID_KEY) || null // Load initial user ID
  );
  const [selectedUserName, setSelectedUserName] = useState('...'); // Placeholder name
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isConnected, setIsConnected] = useState(false); // WebSocket connection status
  const [showSplashPopup, setShowSplashPopup] = useState(false);

  // --- User Selection Handling ---
  const handleUserSelect = (userId, userName) => {
    if (userId) {
      localStorage.setItem(LOCAL_STORAGE_USER_ID_KEY, userId);
      setSelectedUserId(userId);
      setSelectedUserName(userName);
    } else {
      // Handle case where selection is cleared or invalid user ID was loaded
      localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
      setSelectedUserId(null);
      setSelectedUserName('Select User');
    }
  };

  // --- Window Size Effect ---
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- URL Hash Effect ---
  useEffect(() => {
    // Update hash when view changes
    window.history.replaceState(null, '', viewToHash[view] || '');

    // Listen for hash changes
    const handleHashChange = () => {
      const hash = window.location.hash;
      const newView = hashToView[hash];
      if (newView && newView !== view) {
        setView(newView);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [view, viewToHash, hashToView]);

  // --- Initial Data Loading Effect ---
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Load employees
        const fetchedEmployees = await getEmployees() || []; // Ensure it's an array
        setEmployees(fetchedEmployees);

        // Load clients
        const fetchedClients = await getClients() || []; // Ensure it's an array
        setClients(fetchedClients);

        // Load leave periods
        const fetchedLeavePeriods = await getLeavePeriods() || [];
        setLeavePeriods(fetchedLeavePeriods);

        // If we have a selected user ID, find their name
        if (selectedUserId) {
          const user = fetchedEmployees?.find(emp => emp.id === selectedUserId);
          setSelectedUserName(user ? user.name : 'Select User');
          if (!user) {
              // If the stored ID is invalid, clear it
              localStorage.removeItem(LOCAL_STORAGE_USER_ID_KEY);
              setSelectedUserId(null);
          }
        } else {
            setSelectedUserName('Select User');
        }

      } catch (error) {
        console.error("Error loading initial data:", error);
      } finally {
        // Don't set isLoading false here, wait for WS connection and initial statuses
        // setIsLoading(false);
      }
    }
    loadData();
  }, []); // Run only on mount

  const handleWebSocketMessage = useCallback((message) => {
    // console.log("App received WS message:", message);
    if (message.type === 'all_statuses') {
      console.log("Received initial statuses via WebSocket:", message.payload);
      setStatuses(message.payload || {});
      setIsLoading(false); // Loading finished once initial statuses arrive
    } else if (message.type === 'status_update') {
      const { userId, date, statusText } = message.payload;
      // console.log(`Received status update for ${userId} on ${date}`);
      setStatuses(prevStatuses => {
        // Avoid unnecessary state updates if data is identical
        if (prevStatuses[userId]?.[date] === statusText) {
            return prevStatuses;
        }
        const newStatuses = structuredClone(prevStatuses); // Deep clone
        if (!newStatuses[userId]) {
          newStatuses[userId] = {};
        }
        newStatuses[userId][date] = statusText;
        return newStatuses;
      });
      // Confetti logic is now handled in handleStatusChange when the *user* sends the update
    } else if (message.type === 'connection_status') {
        const connected = message.payload === 'open';
        setIsConnected(connected);
        if (!connected) {
            // If disconnected, maybe show loading again until reconnected?
            // setIsLoading(true); // Or handle differently
            console.warn("WebSocket disconnected.");
        } else {
            console.log("WebSocket connected/reconnected.");
            // If we were loading and WS connects, request statuses again?
            // The server should send `all_statuses` on connect automatically.
        }
    } else if (message.type === 'error') {
        console.error("Received error message from WebSocket:", message.message);
        showNotification(`Server error via WebSocket: ${message.message}`, 'error', 'Server Error');
    }
  }, []);

  // --- WebSocket Connection Hook ---
  const { isConnected: wsConnectedStatus } = useWebSocket(handleWebSocketMessage);
   // Update local state based on hook's status
  useEffect(() => {
    // Only update state if the status actually changed
    if (wsConnectedStatus !== isConnected) {
      setIsConnected(wsConnectedStatus);
    }
  }, [wsConnectedStatus, isConnected]);


  // --- Confetti Effect ---
  useEffect(() => {
    let timer;
    if (showConfetti) {
      timer = setTimeout(() => {
          setShowConfetti(false)
      }, 15000);
    }
    return () => clearTimeout(timer);
  }, [showConfetti]);

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
  }, []);

  // --- Event Handlers ---

  // Memoize handleStatusChange
  const handleStatusChange = useCallback((userId, date, statusText) => {
    // 1. Send update via WebSocket
    sendWsTypingUpdate(userId, date, statusText);

    // 2. Check conditions for triggering confetti (only for the current user)
    if (userId === selectedUserId) {
      const today = getTodayDateString();
      if (date === today && statusText.trim() !== '') { // Check if it's for today and not empty
        const storageKey = `${CONFETTI_STORAGE_KEY_PREFIX}${userId}`;
        const lastShownDate = localStorage.getItem(storageKey);

        if (lastShownDate !== today) {
          // console.log(`Confetti condition met for ${userId} on ${today}. Triggering.`);
          triggerConfetti();
          localStorage.setItem(storageKey, today); // Store today's date
        } else {
            // console.log(`Confetti already shown for ${userId} today (${today}).`);
        }
      }
    }
  }, [triggerConfetti, selectedUserId]);

  // Memoize handleAddEmployee
  const handleAddEmployee = useCallback(async (employeeName) => {
    setIsLoading(true); // Indicate activity
    try {
        const newEmployee = await addEmployee(employeeName);
        if (newEmployee) {
          // Re-fetch employees to get the updated list including the new ID
          const updatedEmployees = await getEmployees() || [];
          setEmployees(updatedEmployees);
          showNotification(`Employee "${employeeName}" added successfully! ID: ${newEmployee.id}`);
        } else {
            // Handle case where addEmployee returns null (e.g., duplicate name)
            showNotification(`Failed to add employee "${employeeName}". Name might already exist.`, 'error', 'Error');
        }
    } catch (error) {
        // Error already logged and alerted in handleFetch/addEmployee
        console.error("Error adding employee in component:", error);
    } finally {
        setIsLoading(false);
    }
  }, []); // No dependencies needed

  // Memoize handleDeleteEmployee
  const handleDeleteEmployee = useCallback(async (id, name) => {
    setIsLoading(true); // Indicate activity
    try {
        await deleteEmployee(id);
        // Re-fetch employees to get the updated list
        const updatedEmployees = await getEmployees() || [];
        setEmployees(updatedEmployees);
        showNotification(`Employee "${name}" deleted successfully!`);
    } catch (error) {
        console.error("Error deleting employee:", error);
        showNotification(`Failed to delete employee. ${error.message}`, 'error', 'Error');
    } finally {
        setIsLoading(false);
    }
  }, []); // No dependencies needed

  // Memoize handleAddClient
  const handleAddClient = useCallback(async (clientName) => {
    setIsLoading(true); // Indicate activity
    try {
        const newClient = await addClient(clientName);
        if (newClient) {
          // Re-fetch clients to get the updated list including the new ID
          const updatedClients = await getClients() || [];
          setClients(updatedClients);
          showNotification(`Client "${clientName}" added successfully! ID: ${newClient.id}`);
        } else {
            // Handle case where addClient returns null (e.g., duplicate name)
            showNotification(`Failed to add client "${clientName}". Name might already exist.`, 'error', 'Error');
        }
    } catch (error) {
        console.error("Error adding client in component:", error);
    } finally {
        setIsLoading(false);
    }
  }, []); // No dependencies needed

  // Memoize handleDeleteClient
  const handleDeleteClient = useCallback(async (id, name) => {
    setIsLoading(true); // Indicate activity
    try {
        await deleteClient(id);
        // Re-fetch clients to get the updated list
        const updatedClients = await getClients() || [];
        setClients(updatedClients);
        showNotification(`Client "${name}" deleted successfully!`);
    } catch (error) {
        console.error("Error deleting client:", error);
        showNotification(`Failed to delete client. ${error.message}`, 'error', 'Error');
    } finally {
        setIsLoading(false);
    }
  }, []); // No dependencies needed

  // Memoize handleAddLeavePeriod
  const handleAddLeavePeriod = useCallback(async (newLeavePeriod) => {
    setIsLoading(true);
    try {
      // Include selectedUserId in the leave period data
      const leavePeriodWithUserId = { ...newLeavePeriod, employeeId: selectedUserId };
      const addedLeavePeriod = await addLeavePeriod(leavePeriodWithUserId);
      if (addedLeavePeriod) {
        const updatedLeavePeriods = await getLeavePeriods() || [];
        setLeavePeriods(updatedLeavePeriods);
        showNotification(`Leave period added successfully! ID: ${addedLeavePeriod.id}`);
      } else {
        showNotification('Failed to add leave period.', 'error', 'Error');
      }
    } catch (error) {
      console.error("Error adding leave period:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]); // Add selectedUserId as a dependency

  // Memoize handleEditLeavePeriod
  const handleEditLeavePeriod = useCallback(async (id, updatedLeavePeriod) => {
    setIsLoading(true);
    try {
      // Include selectedUserId in the updated leave period data
      const leavePeriodWithUserId = { ...updatedLeavePeriod, employeeId: selectedUserId };
      const editedLeavePeriod = await updateLeavePeriod(id, leavePeriodWithUserId);
      if (editedLeavePeriod) {
        const updatedLeavePeriods = await getLeavePeriods() || [];
        setLeavePeriods(updatedLeavePeriods);
        showNotification(`Leave period updated successfully! ID: ${id}`);
      } else {
        showNotification('Failed to update leave period.', 'error', 'Error');
      }
    } catch (error) {
      console.error("Error updating leave period:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]); // Add selectedUserId as a dependency

  // Memoize handleDeleteLeavePeriod
  const handleDeleteLeavePeriod = useCallback(async (id) => {
    setIsLoading(true);
    try {
      // Pass selectedUserId to the delete function
      await deleteLeavePeriod(id, selectedUserId);
      const updatedLeavePeriods = await getLeavePeriods() || [];
      setLeavePeriods(updatedLeavePeriods);
      showNotification(`Leave period deleted successfully! ID: ${id}`);
    } catch (error) {
      console.error("Error deleting leave period:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedUserId]); // Add selectedUserId as a dependency

  // --- Render Logic ---

  // Show loading indicator more accurately
  // Loading = true if initial employee fetch hasn't finished OR if WS is not connected AND we don't have statuses yet
  const showLoadingIndicator = isLoading || (!isConnected && Object.keys(statuses).length === 0);

  return (
    <div className="app-container">
      {showSplashPopup ? <SplashPopup onClose={() => setShowSplashPopup(false)} /> : null}
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.15}
        />
      )}

      <header className="app-header">
        <h1>Daily Status Update</h1>
        <div
          className="status-badge status-accepted"
          style={{ marginLeft: 'auto', marginRight: '30px', cursor: 'pointer' }}
          onClick={() => setShowSplashPopup(true)}
        >
          Relax Mode
        </div>
        <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Connected' : '○ Disconnected'}
        </div>
      </header>

      <nav>
        {/* Navigation Buttons */}
        <button onClick={() => setView('myStatus')} disabled={view === 'myStatus'} className={view === 'myStatus' ? 'active' : ''}>My Status</button>
        <button onClick={() => setView('statusTable')} disabled={view === 'statusTable'} className={view === 'statusTable' ? 'active' : ''}>Status Table</button>
        <button onClick={() => setView('manageEmployees')} disabled={view === 'manageEmployees'} className={view === 'manageEmployees' ? 'active' : ''}>Manage Employees</button>
        <button onClick={() => setView('manageLeavePeriods')} disabled={view === 'manageLeavePeriods'} className={view === 'manageLeavePeriods' ? 'active' : ''}>Manage Leave Periods</button>
        <button onClick={() => setView('manageClients')} disabled={view === 'manageClients'} className={view === 'manageClients' ? 'active' : ''}>Manage Clients</button>
        <button onClick={() => setView('manageOffers')} disabled={view === 'manageOffers'} className={view === 'manageOffers' ? 'active' : ''}>Manage Offers</button>
      </nav>

      <main>
        {showLoadingIndicator ? (
          <div role="status" aria-live="polite">Loading data and connecting...</div>
        ) : (
          <>
            {view === 'myStatus' &&  (
              <>
                {selectedUserId ? (
                  <MyStatusView
                    key={selectedUserId}
                    userId={selectedUserId}
                    userName={selectedUserName}
                    statuses={statuses}
                    onStatusChange={handleStatusChange}
                    onLogout={() => handleUserSelect(null, null)}
                  />
                ) : (
                  <div>
                    <p>Please select your user from the dropdown bellow.</p>
                    <UserSelector
                      selectedUserId={selectedUserId}
                      onUserSelect={handleUserSelect}
                    />
                  </div>
                )}
              </>
            )}
            {view === 'statusTable' && (
              <StatusTableView
                statuses={statuses}
                employees={employees}
                selectedUserId={selectedUserId}
              />
            )}
            {view === 'manageEmployees' && (
              <ManageEmployeesView
                employees={employees}
                onAddEmployee={handleAddEmployee}
                onDeleteEmployee={handleDeleteEmployee}
              />
            )}
            {view === 'manageClients' && (
              <ManageClientsView
                clients={clients}
                onAddClient={handleAddClient}
                onDeleteClient={handleDeleteClient}
              />
            )}
            {view === 'manageLeavePeriods' && (
              <ManageLeavePeriodsView
                selectedUserId={selectedUserId}
                leavePeriods={leavePeriods}
                onAddLeavePeriod={handleAddLeavePeriod}
                onEditLeavePeriod={handleEditLeavePeriod}
                onDeleteLeavePeriod={handleDeleteLeavePeriod}
              />
            )}
            {view === 'manageOffers' && (
              <ManageOffersView key={view} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
