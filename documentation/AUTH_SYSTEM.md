# Authentication System Architecture

## Overview

This authentication system is built using NextAuth.js v5 with a split configuration approach to support both Edge runtime (middleware) and server-side features. The system implements role-based access control (RBAC) and uses Prisma as the database adapter.

## Core Components

### 1. Base Configuration (`src/lib/auth/auth.config.ts`)

-   **Purpose**: Provides Edge-compatible configuration
-   **Key Features**:
    -   Defines base credential validation using Zod
    -   Sets up basic callbacks for JWT and session handling
    -   Configures login page route
    -   Edge-compatible (no Prisma adapter)
    -   Used by middleware for route protection

### 2. Main Auth Configuration (`src/lib/auth/auth.ts`)

-   **Purpose**: Full server-side authentication implementation
-   **Key Features**:
    -   Extends base configuration
    -   Implements Prisma adapter
    -   Handles password comparison
    -   Full user authentication logic
    -   Database interactions

### 3. Route Handler (`src/app/api/auth/[...nextauth]/route.ts`)

-   **Purpose**: API endpoint for authentication
-   **Key Features**:
    -   Handles auth requests
    -   Exports auth handlers (GET, POST)
    -   Exports signIn/signOut functions

### 4. Middleware (`src/middleware.ts`)

-   **Purpose**: Route protection and RBAC
-   **Key Features**:
    -   Protects routes based on authentication status
    -   Implements role-based access control
    -   Defines public paths
    -   Handles redirects for unauthorized access

## Helper Components

### 1. RoleGate Component (`src/components/auth/RoleGate.tsx`)

-   **Purpose**: Client-side role-based component protection
-   **Usage**: Wrap components to restrict access based on user roles

```tsx
<RoleGate allowedRoles={['admin']}>
    <AdminPanel />
</RoleGate>
```

### 2. CheckRole Utility (`src/lib/auth/checkRole.ts`)

-   **Purpose**: Server-side role validation
-   **Usage**: Protect server components or actions based on roles

```tsx
await checkRole(['admin']);
```

## Authentication Flow

1. **Login Request**:

    - User submits credentials
    - Credentials validated by Zod schema
    - Password compared with hashed version
    - JWT token generated and session created

2. **Route Protection**:

    - Middleware checks auth status
    - Validates user role against route permissions
    - Redirects unauthorized access
    - Allows public paths without auth

3. **Session Management**:
    - JWT strategy for session handling
    - Session includes user ID and role
    - Callbacks enrich session with user data

## Role-Based Access Control

### Defined Roles:

-   `admin`: Full access
-   `user`: Limited access to dashboard and profile
-   `editor`: Content management access

### Access Control Implementation:

```typescript
const rolePermissions = {
    admin: ['/dashboard', '/users', '/settings', '/profile'],
    user: ['/dashboard', '/profile'],
    editor: ['/dashboard', '/content', '/profile'],
};
```

## Security Features

1. **Password Security**:

    - Bcrypt for password hashing
    - Credential validation using Zod
    - No plain text password storage

2. **Route Protection**:

    - Edge middleware for fast auth checks
    - Role-based access control
    - Protected API routes

3. **Session Security**:
    - JWT-based sessions
    - Secure session cookies
    - Environment-based secrets

## Environment Variables Required

```env
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000 (development)
DATABASE_URL=your-database-connection-string
```

## Best Practices Implemented

1. **Type Safety**:

    - Full TypeScript implementation
    - Zod schema validation
    - Proper type definitions

2. **Code Organization**:

    - Separation of concerns
    - Edge-compatible configurations
    - Modular components

3. **Error Handling**:
    - Proper error messages
    - Fallback mechanisms
    - Validation error handling

## Usage Examples

### Protecting a Server Component

```typescript
import { checkRole } from '@/lib/auth/checkRole';

export default async function AdminPage() {
    await checkRole(['admin']);
    return <div>Admin Only Content</div>;
}
```

### Protecting a Client Component

```typescript
import { RoleGate } from '@/components/auth/RoleGate';

export default function Page() {
    return (
        <RoleGate allowedRoles={['admin']} fallback={<AccessDenied />}>
            <AdminPanel />
        </RoleGate>
    );
}
```
