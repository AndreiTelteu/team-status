import React, { useState, useEffect } from 'react';
import Confetti from 'react-confetti';
import MyStatusView from './components/MyStatusView';
import StatusTableView from './components/StatusTableView';
import ManageEmployeesView from './components/ManageEmployeesView';
// Import API functions, remove initializeData
import { getStatuses, saveStatus, getEmployees, addEmployee } from './dataService';
import './App.css';

// Simulate logged-in user (Needs proper auth eventually)
const CURRENT_USER_ID = 'emp1'; // Ensure this ID exists in your DB or is added
const CURRENT_USER_NAME = 'Alice'; // Ensure this name matches the ID in the DB

function App() {
  const [view, setView] = useState('myStatus');
  const [statuses, setStatuses] = useState({});
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Effect to update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Effect to load initial data from API
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Fetch both in parallel
        const [fetchedStatuses, fetchedEmployees] = await Promise.all([
          getStatuses(),
          getEmployees(),
        ]);
        setStatuses(fetchedStatuses);
        setEmployees(fetchedEmployees);

        // Ensure the simulated user exists in the fetched employees
        // In a real app, user info would come from auth/backend
        const currentUserExists = fetchedEmployees.some(emp => emp.id === CURRENT_USER_ID);
        if (!currentUserExists && fetchedEmployees.length > 0) {
            console.warn(`Simulated user ID ${CURRENT_USER_ID} not found in fetched employees. Defaulting UI, but data might be inconsistent.`);
            // Potentially set to the first employee or handle differently
        } else if (fetchedEmployees.length === 0) {
             console.warn("No employees loaded from backend.");
        }

      } catch (error) {
        console.error("Error loading initial data:", error);
        // Keep app running with empty data, error shown by dataService alerts
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []); // Run only on mount

  // Effect to turn off confetti after a delay
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  const triggerConfetti = () => {
    setShowConfetti(true);
  };

  // Updated to handle async saveStatus and update state with returned data
  const handleStatusSubmit = async (userId, date, statusText) => {
    const updatedStatuses = await saveStatus(userId, date, statusText);
    if (updatedStatuses !== null) { // Check if save was successful
      setStatuses(updatedStatuses); // Update state with the latest statuses from backend
      triggerConfetti();
    }
    // If saveStatus failed, an alert is shown by dataService
  };

  // Updated to handle async addEmployee and refresh employee list
  const handleAddEmployee = async (employeeName) => {
    const newEmployee = await addEmployee(employeeName);
    if (newEmployee) {
      // Re-fetch employees to ensure list is up-to-date
      const updatedEmployees = await getEmployees();
      setEmployees(updatedEmployees);
      alert(`Employee "${employeeName}" added successfully!`);
    }
    // If addEmployee failed, an alert is shown by dataService
  };


  if (isLoading) {
    return <div>Loading data from server...</div>;
  }

  // Find the current user's name from the loaded employees list
  // Fallback to the constant if not found (e.g., during initial load issues)
  const currentUser = employees.find(emp => emp.id === CURRENT_USER_ID);
  const currentUserName = currentUser ? currentUser.name : CURRENT_USER_NAME;


  return (
    <div className="app-container">
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.15}
        />
      )}

      <h1>Daily Status Update</h1>
      <nav>
        <button
          onClick={() => setView('myStatus')}
          disabled={view === 'myStatus'}
          className={view === 'myStatus' ? 'active' : ''}
        >
          My Status
        </button>
        <button
          onClick={() => setView('statusTable')}
          disabled={view === 'statusTable'}
          className={view === 'statusTable' ? 'active' : ''}
        >
          Status Table
        </button>
        <button
          onClick={() => setView('manageEmployees')}
          disabled={view === 'manageEmployees'}
          className={view === 'manageEmployees' ? 'active' : ''}
        >
          Manage Employees
        </button>
      </nav>

      <main>
        {view === 'myStatus' && (
          <MyStatusView
            userId={CURRENT_USER_ID}
            userName={currentUserName} // Use name from loaded employees
            statuses={statuses}
            onSubmit={handleStatusSubmit}
          />
        )}
        {view === 'statusTable' && (
          <StatusTableView statuses={statuses} employees={employees} />
        )}
        {view === 'manageEmployees' && (
          <ManageEmployeesView
            employees={employees}
            onAddEmployee={handleAddEmployee}
          />
        )}
      </main>
    </div>
  );
}

export default App;
