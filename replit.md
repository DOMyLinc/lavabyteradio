# Lava Bytes Radio

## Overview

Lava Bytes Radio is an online radio player web application with a modern car stereo-inspired interface. The app features a skeuomorphic design mimicking physical car audio systems (inspired by Pioneer, Alpine, and Kenwood head units) with warm lava-themed visuals and animated backgrounds. Users can browse and play curated internet radio stations, while administrators can manage the station library through a dedicated admin panel.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React useState for local UI state
- **Styling**: Tailwind CSS with CSS variables for theming, custom lava color palette
- **UI Components**: shadcn/ui component library (Radix UI primitives with custom styling)
- **Build Tool**: Vite with React plugin

The frontend follows a component-based architecture with:
- Pages in `client/src/pages/` (LandingPage, PublicPlayer, AdminPanel)
- Reusable UI components in `client/src/components/`
- Custom hooks in `client/src/hooks/`
- Shared utilities in `client/src/lib/`

### Page Structure
- `/` - LandingPage: Marketing page with unified login dialog (Sign In, Sign Up, Admin tabs)
- `/player` - PublicPlayer: Public radio player for listeners (no admin access)
- `/admin` - AdminPanel: Protected admin panel with session-based authentication

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript (compiled with tsx)
- **API Style**: RESTful JSON API
- **Build**: Custom esbuild script for production bundling

The server follows a modular structure:
- `server/index.ts`: Express app setup and middleware
- `server/routes.ts`: API route definitions
- `server/storage.ts`: Database access layer with interface abstraction
- `server/db.ts`: Database connection setup

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` (shared between client and server)

Database tables:
- `users`: Admin user accounts (id, username, password)
- `stations`: Radio station entries (id, name, description, streamUrl, logoUrl, genre, presetNumber, isActive, sortOrder)

### API Structure
All endpoints are prefixed with `/api/`:
- `GET /api/stations` - List all stations
- `GET /api/stations/:id` - Get single station
- `POST /api/stations` - Create station
- `PUT /api/stations/:id` - Update station
- `DELETE /api/stations/:id` - Delete station

### Design System
The application uses a dark theme with lava-inspired colors defined in `client/src/index.css`. The design follows skeuomorphic principles to simulate physical car stereo controls including:
- Power and play buttons with LED indicators
- Rotary volume knob with drag interaction
- Preset buttons (1-5)
- Station dial with horizontal scrolling
- Pop-out display panel

## External Dependencies

### Third-Party Services
- **Radio Streams**: External internet radio streams via URLs (e.g., Zeno.fm)
- **Fonts**: Google Fonts (Architects Daughter, DM Sans, Fira Code, Geist Mono)

### Database
- **PostgreSQL**: Required via `DATABASE_URL` environment variable
- **Connection**: Uses `pg` driver with connection pooling

### Key NPM Packages
- **UI**: @radix-ui/* primitives, lucide-react icons, class-variance-authority
- **Data**: @tanstack/react-query, drizzle-orm, zod
- **Server**: express, connect-pg-simple for sessions