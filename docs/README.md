# Team Status Application Documentation

This directory contains comprehensive documentation for the Team Status Application, a real-time status tracking system for team members.

## Documentation Structure

- [`frontend-structure.md`](frontend-structure.md) - Frontend components, tabs, features, and architecture
- [`backend-apis.md`](backend-apis.md) - Backend API endpoints and their functionality
- [`database-structure.md`](database-structure.md) - Database schema and model relationships
- [`project-overview.md`](project-overview.md) - High-level project overview and architecture

## Quick Navigation

### Frontend
The application uses React with real-time WebSocket communication for live status updates. It features a tabbed interface for different management views and rich text editing capabilities.

### Backend
Built with Bun server providing REST API endpoints and WebSocket functionality. Handles CRUD operations for all entities and real-time status broadcasting.

### Database
Uses SQLite with in-memory caching for performance. Contains tables for employees, clients, statuses, leave periods, and offers with proper foreign key relationships.

## Getting Started

For development setup and usage instructions, refer to the main [`README.md`](../README.md) file in the project root.