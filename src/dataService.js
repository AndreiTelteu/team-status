// Data service using fetch to interact with the Bun backend API

const API_BASE_URL = 'http://localhost:3000/api'; // Adjust if your backend runs elsewhere

// Removed initializeData as backend handles persistence

/**
 * Fetches all employees from the backend.
 * @returns {Promise<Array<{id: string, name: string}>>}
 */
export async function getEmployees() {
  try {
    const response = await fetch(`${API_BASE_URL}/employees`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const employees = await response.json();
    return employees || [];
  } catch (error) {
    console.error("Error fetching employees:", error);
    alert("Failed to fetch employees from the server.");
    return []; // Return empty array on error
  }
}

/**
 * Fetches all statuses from the backend.
 * @returns {Promise<Record<string, Record<string, string>>>} Object like { empId: { date: status } }
 */
export async function getStatuses() {
  try {
    const response = await fetch(`${API_BASE_URL}/statuses`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const statuses = await response.json();
    return statuses || {};
  } catch (error) {
    console.error("Error fetching statuses:", error);
    alert("Failed to fetch statuses from the server.");
    return {}; // Return empty object on error
  }
}

/**
 * Saves or updates a status by sending it to the backend.
 * @param {string} userId
 * @param {string} date - Format YYYY-MM-DD
 * @param {string} statusText - Status text. Empty string deletes the status.
 * @returns {Promise<Record<string, Record<string, string>> | null>} The updated statuses object or null on failure.
 */
export async function saveStatus(userId, date, statusText) {
  try {
    const response = await fetch(`${API_BASE_URL}/statuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, date, statusText }), // Send empty string to delete
    });

    if (!response.ok) {
      // Try to get error message from backend response body
      let errorMsg = `HTTP error! status: ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody && errorBody.error) {
          errorMsg += ` - ${errorBody.error}`;
        }
      } catch (parseError) {
        // Ignore if response body isn't valid JSON
      }
      throw new Error(errorMsg);
    }

    const updatedStatuses = await response.json(); // Backend returns the full updated status object
    return updatedStatuses;
  } catch (error) {
    console.error("Error saving status:", error);
    alert(`Failed to save status: ${error.message}`);
    return null; // Indicate failure
  }
}

/**
 * Adds a new employee via the backend API.
 * @param {string} employeeName - The name of the new employee.
 * @returns {Promise<object | null>} The newly added employee object or null on failure.
 */
export async function addEmployee(employeeName) {
  if (!employeeName || typeof employeeName !== 'string' || employeeName.trim() === '') {
    console.error("Invalid employee name provided.");
    alert("Employee name cannot be empty.");
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: employeeName.trim() }),
    });

    if (!response.ok) {
       let errorMsg = `HTTP error! status: ${response.status}`;
       try {
         const errorBody = await response.json();
         if (errorBody && errorBody.error) {
           errorMsg += ` - ${errorBody.error}`;
         }
       } catch (parseError) { /* Ignore */ }
       throw new Error(errorMsg);
    }

    const newEmployee = await response.json();
    console.log("Employee added via API:", newEmployee);
    return newEmployee; // Return the newly added employee object
  } catch (error) {
    console.error("Error adding employee:", error);
    alert(`Failed to add employee: ${error.message}`);
    return null; // Indicate failure
  }
}
