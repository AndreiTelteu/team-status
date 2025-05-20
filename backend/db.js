// @ts-check
import { Database } from "bun:sqlite";

// --- Database Setup ---
const db = new Database("status_app.sqlite", { create: true });
console.log("Initialized SQLite database.");

// Create tables if they don't exist
db.run(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );
`);
db.run(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );
`);
db.run(`
  CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    status_date TEXT NOT NULL, -- YYYY-MM-DD
    status_text TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    UNIQUE (employee_id, status_date) -- Ensure only one status per employee per day
  );
`);
db.run(`
  CREATE TABLE IF NOT EXISTS leave_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL, -- Added employee ID
    from_date TEXT NOT NULL, -- YYYY-MM-DD
    until_date TEXT NOT NULL, -- YYYY-MM-DD
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) -- Added foreign key constraint
  );
`);

// Create offers table if it doesn't exist (without the new columns)
db.run(`
  CREATE TABLE IF NOT EXISTS offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NOT NULL,
    project_name TEXT NOT NULL,
    description TEXT,
    request_date TEXT NOT NULL, -- YYYY-MM-DD
    employees_assigned TEXT, -- JSON string of employee IDs
    status TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id)
  );
`);

// Check if priority column exists in offers table, add it if it doesn't
try {
  const priorityColumnExists = db.query(`PRAGMA table_info(offers)`).all()
    .some(column => column.name === 'priority');

  if (!priorityColumnExists) {
    console.log("Adding 'priority' column to offers table...");
    db.run(`ALTER TABLE offers ADD COLUMN priority TEXT;`);
    console.log("'priority' column added successfully.");
  }
} catch (error) {
  console.error("Error checking/adding 'priority' column:", error);
}

// Check if estimation column exists in offers table, add it if it doesn't
try {
  const estimationColumnExists = db.query(`PRAGMA table_info(offers)`).all()
    .some(column => column.name === 'estimation');

  if (!estimationColumnExists) {
    console.log("Adding 'estimation' column to offers table...");
    db.run(`ALTER TABLE offers ADD COLUMN estimation TEXT;`);
    console.log("'estimation' column added successfully.");
  }
} catch (error) {
  console.error("Error checking/adding 'estimation' column:", error);
}

console.log("Database tables checked/created.");

// --- In-Memory Cache for Live Updates ---
// Structure: { userId: { date: statusText, ... }, ... }
let liveStatuses = {};

// Function to load initial statuses into memory
function loadInitialStatuses() {
  try {
    const query = db.query(`
      SELECT employee_id, status_date, status_text
      FROM statuses
      ORDER BY timestamp DESC;
    `);
    const results = query.all();
    const loadedStatuses = {};
    results.forEach(row => {
      if (!loadedStatuses[row.employee_id]) {
        loadedStatuses[row.employee_id] = {};
      }
      // Only store the latest status if multiple exist for the same day (shouldn't happen with UNIQUE constraint)
      if (!loadedStatuses[row.employee_id][row.status_date]) {
        loadedStatuses[row.employee_id][row.status_date] = row.status_text;
      }
    });
    liveStatuses = loadedStatuses;
    console.log("Initial statuses loaded into memory.");
    // console.log("Initial liveStatuses:", JSON.stringify(liveStatuses, null, 2));
  } catch (error) {
    console.error("Error loading initial statuses:", error);
    liveStatuses = {}; // Start with empty if loading fails
  }
}

// Load statuses when the module starts
loadInitialStatuses();


// --- Employee Functions ---
export function getAllEmployees() {
  try {
    const query = db.query("SELECT id, name FROM employees ORDER BY id;");
    return query.all();
  } catch (error) {
    console.error("Error fetching employees:", error);
    return [];
  }
}

export function addEmployeeDB(name) {
  try {
    // Simple ID generation (consider UUIDs for production)
    const id = `emp${Date.now()}${Math.floor(Math.random() * 100)}`;
    const query = db.query("INSERT INTO employees (id, name) VALUES (?, ?) RETURNING id, name;");
    const newEmployee = query.get(id, name);
    console.log("Added employee:", newEmployee);
    return newEmployee;
  } catch (error) {
    // Check for UNIQUE constraint violation
    if (error.message.includes("UNIQUE constraint failed: employees.name")) {
        console.warn(`Attempted to add duplicate employee name: ${name}`);
        return null; // Indicate duplicate
    }
    console.error("Error adding employee:", error);
    return null; // Indicate general error
  }
}

export function deleteEmployeeDB(id) {
  try {
    const query = db.query(`
      DELETE FROM employees
      WHERE id = ?
      RETURNING id;
    `);
    const result = query.get(id);
    if (!result) {
      console.warn(`No employee found with id: ${id}`);
      return false;
    }
    console.log(`Deleted employee with id: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting employee with id ${id}:`, error);
    return false;
  }
}

// --- Client Functions ---
export function getAllClients() {
  try {
    const query = db.query("SELECT id, name FROM clients ORDER BY id;");
    return query.all();
  } catch (error) {
    console.error("Error fetching clients:", error);
    return [];
  }
}

export function addClientDB(name) {
  try {
    // Simple ID generation (consider UUIDs for production)
    const id = `client${Date.now()}${Math.floor(Math.random() * 100)}`;
    const query = db.query("INSERT INTO clients (id, name) VALUES (?, ?) RETURNING id, name;");
    const newClient = query.get(id, name);
    console.log("Added client:", newClient);
    return newClient;
  } catch (error) {
    // Check for UNIQUE constraint violation
    if (error.message.includes("UNIQUE constraint failed: clients.name")) {
        console.warn(`Attempted to add duplicate client name: ${name}`);
        return null; // Indicate duplicate
    }
    console.error("Error adding client:", error);
    return null; // Indicate general error
  }
}

export function deleteClientDB(id) {
  try {
    const query = db.query(`
      DELETE FROM clients
      WHERE id = ?
      RETURNING id;
    `);
    const result = query.get(id);
    if (!result) {
      console.warn(`No client found with id: ${id}`);
      return false;
    }
    console.log(`Deleted client with id: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting client with id ${id}:`, error);
    return false;
  }
}

// --- Status Functions ---

// Gets all statuses directly from the in-memory cache
export function getAllStatuses() {
  // Return a deep copy to prevent accidental modification? For now, return direct reference.
  return liveStatuses;
}

// Gets specific status from in-memory cache
export function getStatusesForUserAndDate(userId, date) {
    return liveStatuses[userId]?.[date] || ''; // Return empty string if not found
}


// Saves status to DB AND updates the in-memory cache
// Modified for live updates: Primarily updates cache, then persists to DB.
export function saveStatusDB(userId, date, statusText) {
  // 1. Update In-Memory Cache Immediately
  if (!liveStatuses[userId]) {
    liveStatuses[userId] = {};
  }
  liveStatuses[userId][date] = statusText;
  // console.log(`Updated liveStatuses for ${userId} on ${date}:`, statusText);

  // 2. Persist to Database (Upsert logic)
  try {
    const query = db.query(`
      INSERT INTO statuses (employee_id, status_date, status_text)
      VALUES (?, ?, ?)
      ON CONFLICT(employee_id, status_date) DO UPDATE SET
        status_text = excluded.status_text,
        timestamp = CURRENT_TIMESTAMP;
    `);
    query.run(userId, date, statusText);
    // console.log(`Persisted status for ${userId} on ${date} to DB.`);
    return true; // Indicate success
  } catch (error) {
    console.error(`Error saving status to DB for ${userId} on ${date}:`, error);
    // Should we revert the in-memory change? Maybe not for live updates.
    // Log the error, the in-memory version is already updated and broadcasted.
    return false; // Indicate persistence failure
  }
}

// Example: Ensure default users exist if DB is empty
function ensureDefaultUsers() {
    const employees = getAllEmployees();
    if (employees.length === 0) {
        let seedEmployees = [
          'Andrei',
          'Nocs',
          'Dragos',
          'Carmen',
          'Florin',
          'Timi',
          'Catalin',
          'Dorin',
          'Vasi',
          'Ioana',
          'Alex',
          'Cristina',
          'Madalina',
        ];
        for (const name of seedEmployees) {
          addEmployeeDB(name);
        }
        const currentEmployees = getAllEmployees();
        console.log("Current employees after adding defaults:", currentEmployees);
    } else {
         console.log("Existing employees found:", employees);
    }
}

// Ensure default clients exist if DB is empty
function ensureDefaultClients() {
    const clients = getAllClients();
    if (clients.length === 0) {
        let seedClients = [
          'Synevo',
        ];
        for (const name of seedClients) {
          addClientDB(name);
        }
        const currentClients = getAllClients();
        console.log("Current clients after adding defaults:", currentClients);
    } else {
        console.log("Existing clients found:", clients);
    }
}

// --- Leave Period Functions ---

export function getAllLeavePeriods() {
  try {
    const query = db.query(`
      SELECT id, employee_id as employeeId, from_date as fromDate, until_date as untilDate
      FROM leave_periods
      ORDER BY from_date;
    `);
    return query.all();
  } catch (error) {
    console.error("Error fetching leave periods:", error);
    return [];
  }
}

export function addLeavePeriodDB(leavePeriod) {
  try {
    const { employeeId, fromDate, untilDate } = leavePeriod; // Added employeeId
    const query = db.query(`
      INSERT INTO leave_periods (employee_id, from_date, until_date)
      VALUES (?, ?, ?)
      RETURNING id, employee_id as employeeId, from_date as fromDate, until_date as untilDate;
    `);
    const newLeavePeriod = query.get(employeeId, fromDate, untilDate); // Added employeeId
    console.log("Added leave period:", newLeavePeriod);
    return newLeavePeriod;
  } catch (error) {
    console.error("Error adding leave period:", error);
    return null;
  }
}

export function updateLeavePeriodDB(id, leavePeriod) {
  try {
    const { employeeId, fromDate, untilDate } = leavePeriod; // Added employeeId
    const query = db.query(`
      UPDATE leave_periods
      SET employee_id = ?, from_date = ?, until_date = ?
      WHERE id = ?
      RETURNING id, employee_id as employeeId, from_date as fromDate, until_date as untilDate;
    `);
    const updatedLeavePeriod = query.get(employeeId, fromDate, untilDate, id); // Added employeeId
    if (!updatedLeavePeriod) {
      console.warn(`No leave period found with id: ${id}`);
      return null;
    }
    console.log("Updated leave period:", updatedLeavePeriod);
    return updatedLeavePeriod;
  } catch (error) {
    console.error(`Error updating leave period with id ${id}:`, error);
    return null;
  }
}

export function deleteLeavePeriodDB(id, employeeId) {
  try {
    const query = db.query(`
      DELETE FROM leave_periods
      WHERE id = ? AND employee_id = ?
      RETURNING id;
    `);
    const result = query.get(id, employeeId);
    if (!result) {
      console.warn(`No leave period found with id: ${id}`);
      return false;
    }
    console.log(`Deleted leave period with id: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting leave period with id ${id}:`, error);
    return false;
  }
}

// --- Offers Functions ---

export function getAllOffers() {
  try {
    const query = db.query(`
      SELECT
        o.id,
        o.client_id as clientId,
        c.name as clientName,
        o.project_name as projectName,
        o.description,
        o.request_date as requestDate,
        o.employees_assigned as employeesAssigned,
        o.status,
        o.priority,
        o.estimation
      FROM offers o
      JOIN clients c ON o.client_id = c.id
      ORDER BY o.id DESC;
    `);
    return query.all();
  } catch (error) {
    console.error("Error fetching offers:", error);
    return [];
  }
}

export function addOfferDB(offer) {
  try {
    const { clientId, projectName, description, requestDate, employeesAssigned, status, priority, estimation } = offer;
    const query = db.query(`
      INSERT INTO offers (client_id, project_name, description, request_date, employees_assigned, status, priority, estimation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id, client_id as clientId, project_name as projectName, description,
                request_date as requestDate, employees_assigned as employeesAssigned, status, priority, estimation;
    `);
    const newOffer = query.get(clientId, projectName, description, requestDate, employeesAssigned, status, priority, estimation);
    console.log("Added offer:", newOffer);
    return newOffer;
  } catch (error) {
    console.error("Error adding offer:", error);
    return null;
  }
}

export function updateOfferDB(id, offer) {
  try {
    const { clientId, projectName, description, requestDate, employeesAssigned, status, priority, estimation } = offer;
    const query = db.query(`
      UPDATE offers
      SET client_id = ?, project_name = ?, description = ?, request_date = ?, employees_assigned = ?, status = ?, priority = ?, estimation = ?
      WHERE id = ?
      RETURNING id, client_id as clientId, project_name as projectName, description,
                request_date as requestDate, employees_assigned as employeesAssigned, status, priority, estimation;
    `);
    const updatedOffer = query.get(clientId, projectName, description, requestDate, employeesAssigned, status, priority, estimation, id);
    if (!updatedOffer) {
      console.warn(`No offer found with id: ${id}`);
      return null;
    }
    console.log("Updated offer:", updatedOffer);
    return updatedOffer;
  } catch (error) {
    console.error(`Error updating offer with id ${id}:`, error);
    return null;
  }
}

export function deleteOfferDB(id) {
  try {
    const query = db.query(`
      DELETE FROM offers
      WHERE id = ?
      RETURNING id;
    `);
    const result = query.get(id);
    if (!result) {
      console.warn(`No offer found with id: ${id}`);
      return false;
    }
    console.log(`Deleted offer with id: ${id}`);
    return true;
  } catch (error) {
    console.error(`Error deleting offer with id ${id}:`, error);
    return false;
  }
}

ensureDefaultUsers();
ensureDefaultClients();
