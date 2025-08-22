# Frontend Structure

## Overview

The frontend is built with React 19 and uses Vite as the build tool. It provides a real-time status tracking interface with WebSocket communication for live updates.

## Technology Stack

- **React** 19.0.0 - UI framework
- **Vite** 6.2.0 - Build tool and dev server
- **WebSocket** - Real-time communication
- **TinyMCE** 7.9.0 - Rich text editor
- **React Confetti** 6.1.0 - Celebration animations
- **simple-notify** 1.0.6 - Toast notifications

## Main Application Structure

### [`App.jsx`](../src/App.jsx:1)
The main application component that manages:
- **State Management**: Global state for employees, clients, statuses, leave periods
- **WebSocket Integration**: Real-time status updates and connection management
- **Navigation**: Tab-based navigation between different views
- **URL Routing**: Hash-based routing for deep linking
- **User Selection**: Persistent user selection with localStorage
- **Loading States**: Connection and data loading indicators

#### Key Features
- Real-time confetti celebration when users submit daily status
- Responsive window size tracking for confetti animations
- WebSocket connection status indicator
- Splash popup for relaxation mode

## Navigation Tabs

The application features 6 main navigation tabs:

### 1. My Status (`myStatus`)
- **Route**: `#my-status`
- **Component**: [`MyStatusView`](../src/components/MyStatusView.jsx:1)
- **Purpose**: Personal status input and management
- **Features**:
  - Rich text editor for daily status updates
  - Historical status viewing and editing
  - Real-time WebSocket communication
  - User logout functionality

### 2. Status Table (`statusTable`)
- **Route**: `#status-table`
- **Component**: [`StatusTableView`](../src/components/StatusTableView.jsx:1)
- **Purpose**: Team-wide status overview
- **Features**:
  - Tabular view of all team members' statuses
  - 5-day historical view (today + 4 past days)
  - Real-time updates via WebSocket

### 3. Manage Employees (`manageEmployees`)
- **Route**: `#employees`
- **Component**: [`ManageEmployeesView`](../src/components/ManageEmployeesView.jsx:1)
- **Purpose**: Employee CRUD operations
- **Features**:
  - Add new employees
  - Delete existing employees
  - Auto-generated unique IDs

### 4. Manage Leave Periods (`manageLeavePeriods`)
- **Route**: `#vacations`
- **Component**: [`ManageLeavePeriodsView`](../src/components/ManageLeavePeriodsView.jsx:1)
- **Purpose**: Leave period management
- **Features**:
  - Add leave periods with date ranges
  - Edit existing leave periods
  - Delete leave periods
  - Employee-specific leave tracking

### 5. Manage Clients (`manageClients`)
- **Route**: `#clients`
- **Component**: [`ManageClientsView`](../src/components/ManageClientsView.jsx:1)
- **Purpose**: Client CRUD operations
- **Features**:
  - Add new clients
  - Delete existing clients
  - Unique client name validation

### 6. Manage Offers (`manageOffers`)
- **Route**: `#offers`
- **Component**: [`ManageOffersView`](../src/components/ManageOffersView.jsx:1)
- **Purpose**: Project offer management
- **Features**:
  - Create and manage project offers
  - Rich project descriptions with TinyMCE
  - Project breakdown with modules and tasks
  - Priority and estimation tracking
  - Employee assignment

## Core Components

### Status Management Components

#### [`StatusInput.jsx`](../src/components/StatusInput.jsx:1)
- Rich text input component using TinyMCE
- Real-time WebSocket status updates
- Debounced typing indicators

#### [`StatusDisplay.jsx`](../src/components/StatusDisplay.jsx:1)
- Displays formatted status text
- Handles empty states

#### [`StatusTable.jsx`](../src/components/StatusTable.jsx:1)
- Tabular display of team statuses
- Date-based columns
- Leave period integration

### User Interface Components

#### [`UserSelector.jsx`](../src/components/UserSelector.jsx:1)
- Dropdown for user selection
- Search functionality
- Persistent selection with localStorage

#### [`SplashPopup.jsx`](../src/components/SplashPopup.jsx:1)
- Aurora animation component
- Relaxation/meditation mode

### Form Components

#### [`OfferForm.jsx`](../src/components/OfferForm.jsx:1)
- Comprehensive project offer form
- Dynamic module and task management
- Rich text description editing
- Employee multi-select
- Priority and estimation fields

### Animation Components

#### [`Aurora.jsx`](../src/animations/Aurora/Aurora.jsx:1)
- WebGL-based aurora animation
- Customizable color stops and effects
- Used in splash popup

#### [`SplashCursor.jsx`](../src/animations/SplashCursor/SplashCursor.jsx:1)
- Interactive cursor effects
- Animation utilities

## Services and Utilities

### [`dataService.js`](../src/dataService.js:1)
Central service for all API communications:
- **HTTP API functions**: CRUD operations for all entities
- **WebSocket management**: Connection, reconnection, message handling
- **React hooks**: [`useWebSocket()`](../src/dataService.js:367) for component integration
- **CSV export functions**: User and team status exports

### Utility Modules

#### [`dateUtils.js`](../src/utils/dateUtils.js:1)
- Date formatting and manipulation
- Past date generation for tables

#### [`notification.js`](../src/utils/notification.js:1)
- Toast notification wrapper
- Error and success messaging

#### [`csvUtils.js`](../src/utils/csvUtils.js:1)
- CSV parsing and generation utilities

## State Management

The application uses React's built-in state management with:
- **Local state** in individual components
- **Lifted state** in App.jsx for shared data
- **WebSocket state synchronization** for real-time updates
- **localStorage persistence** for user preferences

## Real-time Features

### WebSocket Integration
- Automatic connection and reconnection
- Real-time status broadcasting
- Connection status indicators
- Offline graceful degradation

### Live Updates
- Status changes broadcast to all connected clients
- Typing indicators for collaborative editing
- Instant UI updates without page refresh

## Styling

- **CSS Modules**: Component-specific styling
- **Global styles**: [`App.css`](../src/App.css:1) and [`index.css`](../src/index.css:1)
- **Responsive design**: Mobile and desktop layouts
- **Theme consistency**: Unified color scheme and typography

## Build and Development

### Development Commands
```bash
npm run dev:frontend  # Start Vite dev server
npm run dev          # Start both frontend and backend
npm run build        # Production build
npm run preview      # Preview production build
```

### File Structure
```
src/
├── App.jsx                 # Main application component
├── main.jsx               # React root and rendering
├── components/            # Reusable UI components
├── animations/           # Animation components
├── utils/               # Utility functions
├── assets/             # Static assets
└── types/             # TypeScript type definitions (if used)