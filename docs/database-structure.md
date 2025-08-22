# Database Structure

## Overview

The application uses SQLite as its primary database with Bun's native SQLite driver. The database includes in-memory caching for performance optimization and supports ACID transactions.

## Database Configuration

- **Engine**: SQLite
- **File**: `status_app.sqlite` (created in project root)
- **Driver**: Bun's built-in SQLite support
- **Features**: Auto-creation, foreign key constraints, unique constraints

## Database Schema

### Tables Overview

The database consists of 5 main tables:
1. [`employees`](#employees-table) - Team member records
2. [`clients`](#clients-table) - Client organization records  
3. [`statuses`](#statuses-table) - Daily status entries
4. [`leave_periods`](#leave_periods-table) - Employee vacation/leave records
5. [`offers`](#offers-table) - Project offers and proposals

## Table Definitions

### Employees Table

```sql
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Auto-generated unique identifier (format: `emp{timestamp}{random}`) |
| `name` | TEXT | NOT NULL, UNIQUE | Employee full name |

**Indexes**: 
- Primary key index on `id`
- Unique index on `name`

**Example Data**:
```json
{
  "id": "emp1706123456789",
  "name": "Andrei"
}
```

### Clients Table

```sql
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY | Auto-generated unique identifier (format: `client{timestamp}{random}`) |
| `name` | TEXT | NOT NULL, UNIQUE | Client organization name |

**Indexes**:
- Primary key index on `id`
- Unique index on `name`

**Example Data**:
```json
{
  "id": "client1706123456789",
  "name": "Synevo"
}
```

### Statuses Table

```sql
CREATE TABLE IF NOT EXISTS statuses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL,
  status_date TEXT NOT NULL,
  status_text TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  UNIQUE (employee_id, status_date)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing unique identifier |
| `employee_id` | TEXT | NOT NULL, FOREIGN KEY | Reference to employees.id |
| `status_date` | TEXT | NOT NULL | Date in YYYY-MM-DD format |
| `status_text` | TEXT | NULL allowed | Rich text status content |
| `timestamp` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation/update time |

**Constraints**:
- Foreign key: `employee_id` → [`employees(id)`](#employees-table)
- Composite unique: `(employee_id, status_date)` - One status per employee per day

**Indexes**:
- Primary key index on `id`
- Unique composite index on `(employee_id, status_date)`
- Foreign key index on `employee_id`

**Example Data**:
```json
{
  "id": 1,
  "employee_id": "emp1706123456789",
  "status_date": "2025-01-15",
  "status_text": "Working on team status application documentation",
  "timestamp": "2025-01-15 14:30:00"
}
```

### Leave Periods Table

```sql
CREATE TABLE IF NOT EXISTS leave_periods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  employee_id TEXT NOT NULL,
  from_date TEXT NOT NULL,
  until_date TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing unique identifier |
| `employee_id` | TEXT | NOT NULL, FOREIGN KEY | Reference to employees.id |
| `from_date` | TEXT | NOT NULL | Leave start date (YYYY-MM-DD) |
| `until_date` | TEXT | NOT NULL | Leave end date (YYYY-MM-DD) |
| `timestamp` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Constraints**:
- Foreign key: `employee_id` → [`employees(id)`](#employees-table)

**Indexes**:
- Primary key index on `id`
- Foreign key index on `employee_id`

**Example Data**:
```json
{
  "id": 1,
  "employee_id": "emp1706123456789",
  "from_date": "2025-02-01",
  "until_date": "2025-02-07",
  "timestamp": "2025-01-15 10:00:00"
}
```

### Offers Table

```sql
CREATE TABLE IF NOT EXISTS offers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  request_date TEXT NOT NULL,
  employees_assigned TEXT,
  status TEXT NOT NULL,
  priority TEXT,
  estimation TEXT,
  breakdown TEXT DEFAULT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Auto-incrementing unique identifier |
| `client_id` | TEXT | NOT NULL, FOREIGN KEY | Reference to clients.id |
| `project_name` | TEXT | NOT NULL | Project title/name |
| `description` | TEXT | NULL allowed | Rich text project description |
| `request_date` | TEXT | NOT NULL | Date when offer was requested (YYYY-MM-DD) |
| `employees_assigned` | TEXT | NULL allowed | JSON string array of employee IDs |
| `status` | TEXT | NOT NULL | Current offer status |
| `priority` | TEXT | NULL allowed | Priority level (urgent, high, medium, low) |
| `estimation` | TEXT | NULL allowed | Time/effort estimation |
| `breakdown` | TEXT | DEFAULT NULL | JSON string of project modules and tasks |
| `timestamp` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Constraints**:
- Foreign key: `client_id` → [`clients(id)`](#clients-table)
- Priority enum validation in application layer

**Indexes**:
- Primary key index on `id`
- Foreign key index on `client_id`

**Example Data**:
```json
{
  "id": 1,
  "client_id": "client1706123456789",
  "project_name": "Team Status Dashboard",
  "description": "<p>Real-time team status tracking application</p>",
  "request_date": "2025-01-10",
  "employees_assigned": "[\"emp1706123456789\", \"emp1706123456790\"]",
  "status": "in_progress",
  "priority": "high",
  "estimation": "4 weeks",
  "breakdown": "[{\"name\":\"Backend API\",\"tasks\":[{\"name\":\"Database setup\",\"estimation\":\"1 week\"}]}]",
  "timestamp": "2025-01-10 09:00:00"
}
```

## Entity Relationships

### Relationship Diagram

```
employees (1) ──┬─── (N) statuses
                ├─── (N) leave_periods
                └─── (N) offers.employees_assigned [JSON]

clients (1) ────── (N) offers
```

### Foreign Key Relationships

1. **statuses.employee_id** → **employees.id**
   - One employee can have many status entries
   - Cascade behavior: Manual cleanup required

2. **leave_periods.employee_id** → **employees.id**
   - One employee can have multiple leave periods
   - Cascade behavior: Manual cleanup required

3. **offers.client_id** → **clients.id**
   - One client can have multiple offers
   - Cascade behavior: Manual cleanup required

4. **offers.employees_assigned** → **employees.id** (JSON array)
   - Many-to-many relationship stored as JSON
   - No formal foreign key constraint
   - Application-level validation

## Data Types and Constraints

### Date Format
All date fields use **ISO 8601 format**: `YYYY-MM-DD`
- `statuses.status_date`
- `leave_periods.from_date`, `until_date`
- `offers.request_date`

### JSON Fields
JSON data stored as TEXT with application-level parsing:
- `offers.employees_assigned`: Array of employee IDs
- `offers.breakdown`: Nested project structure

### ID Generation
- **Employee IDs**: `emp{timestamp}{random2digits}` (e.g., `emp170612345612`)
- **Client IDs**: `client{timestamp}{random2digits}` (e.g., `client170612345634`)
- **Other IDs**: Auto-incrementing integers

## In-Memory Caching

### Status Cache Structure
```javascript
liveStatuses = {
  "emp123": {
    "2025-01-15": "Status text for today",
    "2025-01-14": "Status text for yesterday"
  },
  "emp456": {
    "2025-01-15": "Another employee's status"
  }
}
```

### Cache Management
- **Load**: [`loadInitialStatuses()`](../backend/db.js:107) on server startup
- **Update**: Real-time via [`saveStatusDB()`](../backend/db.js:298)
- **Broadcast**: WebSocket distribution to connected clients

## Database Operations

### CRUD Functions

#### Employee Operations
- [`getAllEmployees()`](../backend/db.js:139) - Fetch all employees
- [`addEmployeeDB(name)`](../backend/db.js:149) - Add new employee
- [`deleteEmployeeDB(id)`](../backend/db.js:168) - Remove employee

#### Client Operations
- [`getAllClients()`](../backend/db.js:189) - Fetch all clients
- [`addClientDB(name)`](../backend/db.js:199) - Add new client
- [`deleteClientDB(id)`](../backend/db.js:218) - Remove client

#### Status Operations
- [`getAllStatuses()`](../backend/db.js:241) - Get from cache
- [`saveStatusDB(userId, date, text)`](../backend/db.js:298) - Upsert with cache update
- [`getUserStatusesForExport(userId)`](../backend/db.js:253) - Export data
- [`getAllStatusesForExport()`](../backend/db.js:275) - Team export data

#### Leave Period Operations
- [`getAllLeavePeriods()`](../backend/db.js:374) - Fetch all leave periods
- [`addLeavePeriodDB(leavePeriod)`](../backend/db.js:388) - Add leave period
- [`updateLeavePeriodDB(id, leavePeriod)`](../backend/db.js:405) - Update leave period
- [`deleteLeavePeriodDB(id, employeeId)`](../backend/db.js:427) - Remove leave period

#### Offer Operations
- [`getAllOffers()`](../backend/db.js:449) - Fetch with client join
- [`addOfferDB(offer)`](../backend/db.js:475) - Add new offer
- [`updateOfferDB(id, offer)`](../backend/db.js:493) - Update existing offer
- [`deleteOfferDB(id)`](../backend/db.js:516) - Remove offer

### Data Seeding

#### Default Employees
```javascript
ensureDefaultUsers() // Creates default team members if empty
```

#### Default Clients
```javascript
ensureDefaultClients() // Creates default client if empty
```

## Migration Strategy

The database supports schema evolution through column addition:
- **Priority column**: Added to offers table via [`ALTER TABLE`](../backend/db.js:64)
- **Estimation column**: Added to offers table via [`ALTER TABLE`](../backend/db.js:78)
- **Breakdown column**: Added to offers table via [`ALTER TABLE`](../backend/db.js:92)

### Migration Pattern
```javascript
// Check if column exists
const columnExists = db.query(`PRAGMA table_info(table_name)`).all()
  .some(column => column.name === 'new_column');

if (!columnExists) {
  db.run(`ALTER TABLE table_name ADD COLUMN new_column TEXT;`);
}
```

## Performance Optimizations

1. **In-memory status cache** - Reduces database reads for frequently accessed data
2. **Prepared statements** - Bun's SQLite driver uses prepared statements automatically
3. **Indexes** - Primary keys and foreign keys automatically indexed
4. **Unique constraints** - Prevent duplicate data and enable fast lookups
5. **Batch operations** - Multiple operations can be wrapped in transactions

## Backup and Recovery

- **File-based**: SQLite database is a single file (`status_app.sqlite`)
- **Incremental backup**: SQLite supports online backup via backup API
- **Export functionality**: CSV export available for status data
- **Data portability**: Standard SQLite format ensures compatibility

## Security Considerations

- **SQL injection prevention**: Prepared statements used throughout
- **Foreign key constraints**: Data integrity enforced at database level  
- **Unique constraints**: Prevent duplicate entries
- **Input validation**: Application-layer validation before database operations
- **Authorization checks**: Employee ownership validation for sensitive operations