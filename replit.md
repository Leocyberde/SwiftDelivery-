# Delivery Management App

A full-stack delivery management application built with Express + React (TypeScript), using PostgreSQL via Drizzle ORM.

## Architecture

- **Frontend**: React + Vite, TypeScript, TailwindCSS, shadcn/ui components, Wouter routing, TanStack Query
- **Backend**: Express.js (Node.js), TypeScript, served via tsx in development
- **Database**: PostgreSQL (Replit built-in), Drizzle ORM
- **Maps**: Leaflet / react-leaflet for courier location tracking

## Project Structure

```
client/         - React frontend (Vite)
  src/
    components/ - UI components
    hooks/      - Custom React hooks
    lib/        - Utility libraries
    pages/      - Page components
server/         - Express backend
  index.ts      - App entry point (port 5000)
  routes.ts     - API route handlers
  storage.ts    - Database access layer
  db.ts         - Drizzle/PostgreSQL connection
  vite.ts       - Vite dev middleware integration
shared/         - Shared types/schemas
  schema.ts     - Drizzle table definitions (merchants, couriers, deliveries)
  routes.ts     - Shared API route definitions
```

## Database Schema

- **merchants**: Stores merchant info (name, whatsapp, category, address)
- **couriers**: Delivery couriers with location and availability tracking
- **deliveries**: Delivery orders linking merchants and couriers

## Development

```bash
npm run dev       # Start dev server (port 5000)
npm run build     # Build for production
npm run db:push   # Push schema to database
```

## Deployment

- Target: autoscale
- Build: `npm run build`
- Run: `node dist/index.cjs`
