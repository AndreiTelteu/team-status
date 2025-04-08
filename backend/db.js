// @ts-check
import { Database } from "bun:sqlite";

const DB_FILE = "status_app.sqlite";
export const db = new Database(DB_FILE, { create: true });

console.log(`Using database file: ${DB_FILE}`);

// Enable WAL mode for better concurrency
db.exec("PRAGMA journal_mode = WAL;");

// Create tables if they don't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS statuses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id TEXT NOT NULL,
    date TEXT NOT NULL, -- Format YYYY-MM-DD
    status_text TEXT NOT NULL,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    UNIQUE (employee_id, date) -- Ensure only one status per employee per day
  );
`);

// --- Employee Functions ---

/**
 * Gets all employees from the database.
 * @returns {Array<{id: string, name: string}>}
 */
export function getAllEmployees() {
  try {
    return db.query("SELECT id, name FROM employees ORDER BY name;").all();
  } catch (err) {
    console.error("Error fetching employees:", err);
    return [];
  }
}

/**
 * Adds a new employee to the database.
 * @param {string} name
 * @returns {{id: string, name: string} | null} The new employee or null if error/duplicate.
 */
export function addEmployeeDB(name) {
  const trimmedName = name.trim();
  if (!trimmedName) return null;

  const newId = `emp${Date.now()}`; // Simple unique ID
  try {
    // Check if name already exists (case-insensitive check might be better in real app)
    const existing = db.query("SELECT id FROM employees WHERE name = ?;").get(trimmedName);
    if (existing) {
      console.warn(`Employee with name "${trimmedName}" already exists.`);
      return null; // Or return the existing employee? For now, return null.
    }

    db.query("INSERT INTO employees (id, name) VALUES (?, ?);").run(newId, trimmedName);
    console.log("Employee added to DB:", { id: newId, name: trimmedName });
    return { id: newId, name: trimmedName };
  } catch (err) {
    console.error("Error adding employee:", err);
    return null;
  }
}

// --- Status Functions ---

/**
 * Gets all statuses, formatted for the frontend.
 * @returns {Record<string, Record<string, string>>} Object like { empId: { date: status } }
 */
export function getAllStatuses() {
  try {
    const rows = db.query("SELECT employee_id, date, status_text FROM statuses;").all();
    const formattedStatuses = {};
    for (const row of rows) {
      if (!formattedStatuses[row.employee_id]) {
        formattedStatuses[row.employee_id] = {};
      }
      formattedStatuses[row.employee_id][row.date] = row.status_text;
    }
    return formattedStatuses;
  } catch (err) {
    console.error("Error fetching statuses:", err);
    return {};
  }
}

/**
 * Saves or updates a status for a given employee and date.
 * Deletes the status if statusText is empty.
 * @param {string} employeeId
 * @param {string} date - Format YYYY-MM-DD
 * @param {string} statusText
 * @returns {boolean} True on success, false on failure.
 */
export function saveStatusDB(employeeId, date, statusText) {
  try {
    const trimmedStatus = statusText.trim();
    if (trimmedStatus === '') {
      // Delete the status entry if the text is empty
      db.query("DELETE FROM statuses WHERE employee_id = ? AND date = ?;")
        .run(employeeId, date);
      console.log(`Status deleted for ${employeeId} on ${date}`);
    } else {
      // Insert or replace the status entry
      // ON CONFLICT handles the UNIQUE constraint (employee_id, date)
      db.query(`
        INSERT INTO statuses (employee_id, date, status_text)
        VALUES (?, ?, ?)
        ON CONFLICT(employee_id, date) DO UPDATE SET
          status_text = excluded.status_text;
      `).run(employeeId, date, trimmedStatus);
      console.log(`Status saved/updated for ${employeeId} on ${date}`);
    }
    return true;
  } catch (err) {
    console.error("Error saving status:", err);
    return false;
  }
}

// --- Initial Data (Optional - only if DB is empty) ---
function initializeDatabaseIfNeeded() {
    const employeeCount = db.query("SELECT COUNT(*) as count FROM employees;").get()?.count ?? 0;
    if (employeeCount === 0) {
        console.log("Database empty, adding initial employees...");
        const initialEmployees = [
            { id: 'emp1', name: 'Alice' },
            { id: 'emp2', name: 'Bob' },
            { id: 'emp3', name: 'Charlie' },
        ];
        const insertEmployee = db.prepare("INSERT INTO employees (id, name) VALUES (?, ?)");
        const insertManyEmployees = db.transaction(employees => {
            for (const emp of employees) insertEmployee.run(emp.id, emp.name);
        });

        try {
            insertManyEmployees(initialEmployees);
            console.log("Initial employees added.");
        } catch (err) {
            console.error("Error adding initial employees:", err);
        }
    } else {
        console.log("Database already contains employees.");
    }
}

// Run initialization check when the module loads
initializeDatabaseIfNeeded();
