# Overview

This is a membership management web application called "Ledenbeheer" designed specifically for mosques in Belgium. It's a full-stack TypeScript application that provides comprehensive member management, financial tracking, membership fee processing, and public display screens. The system supports multi-tenancy with role-based access control and features a modern, professional UI inspired by HubSpot's design patterns.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with Vite for development and bundling
- **Routing**: Wouter for lightweight client-side routing
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent design
- **Typography**: Poppins font family with clear hierarchy
- **State Management**: TanStack Query for server state management and caching
- **Form Handling**: React Hook Form with Zod validation
- **Design System**: HubSpot-inspired layout with professional CRM styling, featuring a fixed sidebar navigation and top bar with search functionality

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Authorization**: Role-based access control (SUPERADMIN, BEHEERDER, MEDEWERKER)
- **API Design**: RESTful endpoints with Express middleware for authentication and tenant isolation
- **File Storage**: Local file storage system with abstracted service layer for easy migration to cloud storage

## Database Schema
- **Multi-tenancy**: Tenant-isolated data model with tenant ID foreign keys
- **Core Entities**: Members, membership fees, financial transactions, users, public screens, announcements
- **Member Management**: Comprehensive member profiles with financial settings, payment preferences, and contact information
- **Financial Tracking**: Transaction categorization, SEPA payment integration, fee status tracking
- **Public Displays**: Configurable public screens for payment status matrices and announcements

## Authentication & Authorization
- **Session Management**: JWT tokens with 24-hour expiration
- **Password Security**: bcryptjs for password hashing
- **Role Hierarchy**: Three-tier role system with appropriate permissions
- **Middleware Chain**: Authentication and tenant context middleware for request protection

## Multi-tenancy Strategy
- **Data Isolation**: Row-level security through tenant ID filtering
- **Slug-based Routing**: Unique tenant identification via URL slugs
- **Shared Infrastructure**: Single application instance serving multiple mosque organizations

# External Dependencies

## Database & ORM
- **Neon Database**: Serverless PostgreSQL database with WebSocket support
- **Drizzle ORM**: Type-safe database operations with migration support
- **Database Pooling**: Connection pooling for efficient database resource management

## UI & Design System
- **Radix UI**: Headless UI primitives for accessibility and keyboard navigation
- **Lucide React**: Icon library for consistent iconography
- **TailwindCSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: Pre-built component library with consistent styling

## Development & Build Tools
- **Vite**: Fast development server and build tool with React plugin
- **TypeScript**: Strict type checking across client and server
- **ESBuild**: Server bundle compilation for production
- **Date-fns**: Date manipulation library with Belgian locale support

## Payment & Financial Integration
- **SEPA Processing**: Direct debit mandate management and payment processing
- **Multi-currency Support**: Euro-based financial calculations with Belgian formatting
- **Payment Method Support**: SEPA, bank transfer, Bancontact, and cash payment options

## Monitoring & Development
- **Replit Integration**: Development environment plugins and banner integration
- **Error Handling**: Comprehensive error boundaries and API error responses
- **Query Optimization**: Efficient data fetching with TanStack Query caching