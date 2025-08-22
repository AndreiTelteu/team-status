# Backend API Documentation

## Overview

The backend is built with Bun server providing both REST API endpoints and WebSocket functionality. It serves as the communication layer between the React frontend and SQLite database.

## Technology Stack

- **Bun** - JavaScript runtime and web server
- **SQLite** - Database with Bun's native sqlite driver
- **WebSocket** - Real-time communication
- **Node.js modules** - File system and path utilities

## Server Configuration

- **Port**: 3000
- **API Prefix**: `/api`
- **WebSocket Path**: `/ws`
- **Static Files**: Serves from `../dist` (Vite build output)
- **CORS**: Enabled for all origins (should be restricted in production)

## API Endpoints

### Employees API

#### GET [`/api/employees`](../backend/server.js:84)
- **Purpose**: Retrieve all employees
- **Method**: GET
- **Response**: Array of employee objects
- **Format**:
```json
[
  {
    "id": "emp1234567890123",
    "name": "John Doe"
  }
]
```

#### POST [`/api/employees`](../backend/server.js:88)
- **Purpose**: Add a new employee
- **Method**: POST
- **Request Body**:
```json
{
  "name": "Employee Name"
}
```
- **Response**: Created employee object (201) or error (400/409)
- **Validation**: Name must be string and unique

#### DELETE [`/api/employees/{id}`](../backend/server.js:113)
- **Purpose**: Delete an employee by ID
- **Method**: DELETE
- **Path Parameter**: `id` - Employee ID
- **Response**: 204 (success) or 404 (not found)

### Clients API

#### GET [`/api/clients`](../backend/server.js:126)
- **Purpose**: Retrieve all clients
- **Method**: GET
- **Response**: Array of client objects
- **Format**:
```json
[
  {
    "id": "client1234567890123",
    "name": "Client Name"
  }
]
```

#### POST [`/api/clients`](../backend/server.js:130)
- **Purpose**: Add a new client
- **Method**: POST
- **Request Body**:
```json
{
  "name": "Client Name"
}
```
- **Response**: Created client object (201) or error (400/409)
- **Validation**: Name must be string and unique

#### DELETE [`/api/clients/{id}`](../backend/server.js:155)
- **Purpose**: Delete a client by ID
- **Method**: DELETE
- **Path Parameter**: `id` - Client ID
- **Response**: 204 (success) or 404 (not found)

### Statuses API

#### GET [`/api/statuses`](../backend/server.js:168)
- **Purpose**: Retrieve all status data from in-memory cache
- **Method**: GET
- **Response**: Nested object structure
- **Format**:
```json
{
  "emp123": {
    "2025-01-15": "Working on project X",
    "2025-01-14": "Meeting with client"
  },
  "emp456": {
    "2025-01-15": "Code review and testing"
  }
}
```
- **Note**: POST requests return 405 - status updates handled via WebSocket

### Status CSV Export API

#### GET [`/api/statuses/export/team`](../backend/server.js:179)
- **Purpose**: Export all team statuses as CSV
- **Method**: GET
- **Response**: CSV file download
- **Headers**:
  - `Content-Type: text/csv;charset=utf-8`
  - `Content-Disposition: attachment; filename="..."`
- **Error**: 404 if no data, 500 on generation failure

#### GET [`/api/statuses/export/{userId}`](../backend/server.js:209)
- **Purpose**: Export specific user's statuses as CSV
- **Method**: GET
- **Path Parameter**: `userId` - Employee ID
- **Response**: CSV file download
- **Error**: 404 if no user data found

### Leave Periods API

#### GET [`/api/leave-periods`](../backend/server.js:245)
- **Purpose**: Retrieve all leave periods
- **Method**: GET
- **Response**: Array of leave period objects
- **Format**:
```json
[
  {
    "id": 1,
    "employeeId": "emp123",
    "fromDate": "2025-01-20",
    "untilDate": "2025-01-25"
  }
]
```

#### POST [`/api/leave-periods`](../backend/server.js:249)
- **Purpose**: Add a new leave period
- **Method**: POST
- **Request Body**:
```json
{
  "employeeId": "emp123",
  "fromDate": "2025-01-20",
  "untilDate": "2025-01-25"
}
```
- **Response**: Created leave period (201) or error (400/500)
- **Validation**: Both dates required and must be valid date strings

#### PUT [`/api/leave-periods/{id}`](../backend/server.js:276)
- **Purpose**: Update a leave period
- **Method**: PUT
- **Path Parameter**: `id` - Leave period ID (integer)
- **Request Body**: Same as POST
- **Response**: Updated leave period or 404 error

#### DELETE [`/api/leave-periods/{id}`](../backend/server.js:297)
- **Purpose**: Delete a leave period
- **Method**: DELETE
- **Path Parameter**: `id` - Leave period ID (integer)
- **Request Body**:
```json
{
  "employeeId": "emp123"
}
```
- **Response**: 204 (success) or 404/400 (error)
- **Security**: Requires employeeId in body for authorization

### Offers API

#### GET [`/api/offers`](../backend/server.js:325)
- **Purpose**: Retrieve all project offers with client details
- **Method**: GET
- **Response**: Array of offer objects with joined client data
- **Format**:
```json
[
  {
    "id": 1,
    "clientId": "client123",
    "clientName": "Client Name",
    "projectName": "Project Title",
    "description": "Rich text description",
    "requestDate": "2025-01-15",
    "employeesAssigned": "[\"emp123\", \"emp456\"]",
    "status": "pending",
    "priority": "high",
    "estimation": "2 weeks",
    "breakdown": "[{\"name\":\"Module1\",\"tasks\":[]}]"
  }
]
```

#### POST [`/api/offers`](../backend/server.js:329)
- **Purpose**: Create a new project offer
- **Method**: POST
- **Request Body**:
```json
{
  "clientId": "client123",
  "projectName": "Project Title",
  "description": "Rich text description",
  "requestDate": "2025-01-15",
  "employeesAssigned": "[\"emp123\"]",
  "status": "pending",
  "priority": "high",
  "estimation": "2 weeks",
  "breakdown": "[{\"name\":\"Module1\",\"tasks\":[]}]"
}
```
- **Response**: Created offer (201) or error (400/500)
- **Validation**: 
  - Required: `clientId`, `projectName`, `requestDate`, `status`
  - Priority must be one of: `urgent`, `high`, `medium`, `low`

#### PUT [`/api/offers/{id}`](../backend/server.js:361)
- **Purpose**: Update an existing offer
- **Method**: PUT
- **Path Parameter**: `id` - Offer ID (integer)
- **Request Body**: Same as POST
- **Response**: Updated offer or 404 error
- **Validation**: Same as POST

#### DELETE [`/api/offers/{id}`](../backend/server.js:387)
- **Purpose**: Delete an offer
- **Method**: DELETE
- **Path Parameter**: `id` - Offer ID (integer)
- **Response**: 204 (success) or 404 (not found)

## WebSocket API

### Connection Endpoint
- **Path**: `/ws`
- **Protocol**: WebSocket
- **Topic**: `status-updates`

### WebSocket Message Types

#### Server to Client Messages

##### `all_statuses`
- **Purpose**: Initial status data on connection
- **Format**:
```json
{
  "type": "all_statuses",
  "payload": {
    "emp123": {
      "2025-01-15": "Status text"
    }
  }
}
```

##### `status_update`
- **Purpose**: Real-time status change broadcast
- **Format**:
```json
{
  "type": "status_update",
  "payload": {
    "userId": "emp123",
    "date": "2025-01-15",
    "statusText": "Updated status"
  }
}
```

##### `connection_status`
- **Purpose**: Connection state notifications
- **Format**:
```json
{
  "type": "connection_status",
  "payload": "open" // or "closed"
}
```

##### `error`
- **Purpose**: Error notifications
- **Format**:
```json
{
  "type": "error",
  "message": "Error description"
}
```

#### Client to Server Messages

##### `typing` / `status_update`
- **Purpose**: Send status updates from client
- **Format**:
```json
{
  "type": "typing",
  "payload": {
    "userId": "emp123",
    "date": "2025-01-15",
    "statusText": "New status text"
  }
}
```
- **Validation**: 
  - All fields required
  - `userId` and `statusText` must be strings
  - `date` must match YYYY-MM-DD format

### WebSocket Features

- **Auto-subscribe**: Clients automatically join `status-updates` topic
- **Broadcasting**: Status updates sent to all connected clients
- **Error handling**: Invalid messages return error responses
- **Persistence**: Status updates saved to database and in-memory cache

## Static File Serving

The server also handles static file serving for the frontend:
- **Directory**: `../dist` (Vite build output)
- **Fallback**: Serves `index.html` for client-side routing
- **Security**: Prevents directory traversal attacks
- **MIME types**: Automatic content-type detection via Bun.file

## Error Handling

- **CORS**: Proper preflight handling for cross-origin requests
- **Validation**: Input validation with appropriate error messages
- **Database errors**: Graceful handling of constraint violations
- **WebSocket errors**: Connection management and error reporting
- **404 handling**: Fallback routing for SPA support

## Development Features

- **Hot reload**: Automatic restart on file changes
- **Detailed logging**: Request/response logging for debugging
- **Error context**: Stack traces and error details in development

## Security Considerations

- **CORS policy**: Currently allows all origins (needs production restriction)
- **Input validation**: Sanitization of user inputs
- **SQL injection**: Uses prepared statements via Bun's SQLite driver
- **Authorization**: Employee ID verification for leave period operations
- **Directory traversal**: Prevention in static file serving