# Project Overview

## Application Description

The Team Status Application is a real-time collaborative status tracking system designed for development teams. It enables team members to share daily status updates, manage leave periods, track project offers, and maintain client relationships through an intuitive web interface.

## Key Features

### Real-Time Collaboration
- **WebSocket Communication**: Instant status updates across all connected clients
- **Live Typing Indicators**: See when team members are updating their status
- **Connection Status**: Visual indicators for connection state
- **Automatic Reconnection**: Resilient WebSocket connection with retry logic

### Status Management
- **Rich Text Editor**: TinyMCE integration for formatted status entries
- **Historical Tracking**: View and edit past status entries
- **Daily Status Flow**: Streamlined interface for daily status updates
- **Celebration Features**: Confetti animations for daily status completion

### Team Administration
- **Employee Management**: Add, remove, and manage team members
- **Client Management**: Maintain client organization records
- **Leave Period Tracking**: Schedule and track vacation/leave periods
- **Offer Management**: Create and manage project proposals

### Data Export
- **CSV Export**: Individual and team status exports
- **Flexible Formats**: Customizable export formats for reporting
- **Historical Data**: Access to complete status history

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 + Vite
- **Backend**: Bun server with WebSocket support
- **Database**: SQLite with in-memory caching
- **Styling**: CSS with responsive design
- **Animations**: WebGL-based effects and confetti

### System Architecture

```
┌─────────────────┐    WebSocket     ┌──────────────────┐    SQLite    ┌──────────────┐
│   React Client  │ ◄─────────────► │   Bun Server     │ ◄──────────► │   Database   │
│                 │                 │                  │              │              │
│  - Components   │    HTTP API     │  - REST API      │   Queries    │  - Tables    │
│  - Real-time UI │ ◄─────────────► │  - WebSocket     │ ◄──────────► │  - Indexes   │
│  - State Mgmt   │                 │  - Static Files  │              │  - Relations │
└─────────────────┘                 └──────────────────┘              └──────────────┘
        │                                    │
        │                                    │
        └─────── Static File Serving ────────┘
```

### Data Flow

1. **Initial Load**:
   - Client loads React application
   - WebSocket connection established
   - Initial data fetched (employees, clients, statuses)
   - Real-time updates begin

2. **Status Updates**:
   - User types in rich text editor
   - WebSocket sends typing updates
   - Server updates database and broadcasts
   - All connected clients receive updates
   - UI updates in real-time

3. **CRUD Operations**:
   - HTTP API calls for data modification
   - Database operations with validation
   - Cache updates (for statuses)
   - Client-side state synchronization

## Directory Structure

```
team-status/
├── backend/                 # Server-side code
│   ├── server.js           # Main Bun server
│   ├── db.js              # Database operations
│   └── csvUtils.js        # CSV export utilities
├── src/                    # Frontend React code
│   ├── App.jsx            # Main application component
│   ├── main.jsx           # React root
│   ├── components/        # UI components
│   ├── animations/        # Animation components
│   ├── utils/            # Utility functions
│   └── assets/           # Static assets
├── docs/                  # Documentation
│   ├── README.md         # Documentation index
│   ├── frontend-structure.md
│   ├── backend-apis.md
│   ├── database-structure.md
│   └── project-overview.md
├── public/               # Static public files
│   ├── tinymce/         # TinyMCE editor assets
│   └── favicon.png      # Application icon
├── dist/                # Vite build output
├── docker-compose.yml   # Container orchestration
├── Dockerfile          # Container definition
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
└── status_app.sqlite   # SQLite database file
```

## Development Workflow

### Local Development Setup
```bash
# Install dependencies
bun install

# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:frontend  # Vite dev server (port 5173)
npm run dev:backend   # Bun server (port 3000)
```

### Production Build
```bash
# Build frontend assets
npm run build

# Start production server
bun run backend/server.js
```

### Docker Deployment
```bash
# Build and start containers
docker-compose up --build
```

## Core Components

### Frontend Components
- **App.jsx**: Main application container with state management
- **MyStatusView**: Personal status input and history
- **StatusTableView**: Team status overview table
- **ManageEmployeesView**: Employee CRUD interface
- **ManageClientsView**: Client management interface
- **ManageLeavePeriodsView**: Leave period scheduling
- **ManageOffersView**: Project offer management
- **UserSelector**: Employee selection dropdown
- **StatusInput**: Rich text status editor
- **OfferForm**: Complex offer creation form

### Backend Modules
- **server.js**: HTTP server, WebSocket handler, static file serving
- **db.js**: Database operations, caching, data seeding
- **csvUtils.js**: Export functionality and CSV generation

### Utility Modules
- **dataService.js**: API client, WebSocket management
- **dateUtils.js**: Date formatting and manipulation
- **notification.js**: Toast notification system
- **csvUtils.js**: Frontend CSV processing

## Key Features Detail

### Real-Time Status Updates
- **Technology**: WebSocket with pub/sub pattern
- **Flow**: Type → WebSocket → Server → Database → Broadcast → All Clients
- **Caching**: In-memory status cache for performance
- **Persistence**: SQLite with UPSERT operations

### Rich Text Editing
- **Editor**: TinyMCE 7.9.0 with custom configuration
- **Features**: Formatting, links, lists, basic HTML support
- **Storage**: HTML content stored in database
- **Display**: Rendered HTML with sanitization

### User Experience
- **Navigation**: Tab-based interface with URL routing
- **Loading States**: Connection and data loading indicators
- **Notifications**: Toast notifications for actions and errors
- **Animations**: Celebration effects and smooth transitions
- **Responsive**: Mobile and desktop optimized layouts

### Data Management
- **Validation**: Client and server-side input validation
- **Constraints**: Database-level uniqueness and foreign keys
- **Exports**: CSV generation for status data
- **Backup**: File-based SQLite database

## Configuration

### Environment Variables
- **PORT**: Server port (default: 3000)
- **API_PREFIX**: API route prefix (default: /api)
- **WS_PATH**: WebSocket endpoint (default: /ws)

### Build Configuration
- **Vite**: Modern build tool with hot reloading
- **React**: Latest version with concurrent features
- **Bun**: High-performance JavaScript runtime

### Database Configuration
- **SQLite**: Embedded database with auto-creation
- **Foreign Keys**: Enabled for referential integrity
- **Indexes**: Automatic indexing on primary and foreign keys

## Security Considerations

### Authentication
- **Current**: Simple user selection (development mode)
- **Future**: JWT-based authentication system
- **Session**: localStorage for user persistence

### Data Protection
- **SQL Injection**: Prevented via prepared statements
- **XSS**: HTML sanitization in rich text rendering
- **CORS**: Configured for cross-origin requests
- **Input Validation**: Both client and server-side validation

### Authorization
- **Employee Data**: Basic employee ownership checks
- **API Access**: No authentication currently (development)
- **File Access**: Directory traversal prevention

## Performance Optimizations

### Frontend
- **React**: Optimized with useCallback and useMemo
- **WebSocket**: Efficient message handling and reconnection
- **State**: Minimal re-renders through proper state management
- **Assets**: Code splitting and lazy loading ready

### Backend
- **Caching**: In-memory status cache reduces database load
- **WebSocket**: Pub/sub pattern for efficient broadcasting
- **Database**: Prepared statements and indexed queries
- **Static Files**: Efficient serving with proper MIME types

### Database
- **Indexes**: Strategic indexing on frequently queried columns
- **Constraints**: Database-level validation reduces application logic
- **Transactions**: ACID compliance for data consistency
- **Schema**: Normalized design with appropriate relationships

## Future Enhancements

### Short Term
- User authentication and authorization
- Enhanced error handling and recovery
- Improved mobile responsiveness
- Additional export formats

### Medium Term
- Team analytics and reporting
- Advanced status templates
- Integration with external tools
- Enhanced notification system

### Long Term
- Multi-tenant support
- Advanced project management features
- API rate limiting and security
- Horizontal scaling capabilities

## Monitoring and Maintenance

### Logging
- **Server**: Request/response logging with error details
- **Client**: Console logging for debugging
- **Database**: Query logging and error tracking

### Health Checks
- **WebSocket**: Connection status monitoring
- **Database**: Connection and query health
- **Server**: Response time and error rate tracking

### Backup Strategy
- **Database**: Regular SQLite file backups
- **Configuration**: Version controlled configuration files
- **Assets**: Static file backup procedures

## Support and Documentation

### Developer Resources
- **Code Comments**: Comprehensive inline documentation
- **Type Hints**: JSDoc annotations for better IDE support
- **Error Messages**: Descriptive error messages and codes

### User Documentation
- **Interface**: Self-explanatory UI with helpful tooltips
- **Workflows**: Intuitive user experience design
- **Help System**: Built-in guidance and examples