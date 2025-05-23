/**
 * Session types for auth domain
 * Simplified to avoid NextAuth module augmentation conflicts
 */

// Session utility types
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

export interface ExtendedSession {
  user: SessionUser;
  expires: string;
}

// Auth credentials
export interface AuthCredentials {
  email: string;
  password: string;
}

// JWT payload
export interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
