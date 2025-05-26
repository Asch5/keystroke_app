'use client';

import { useSession } from 'next-auth/react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default function AuthStatus() {
  const { status, data: session } = useSession();
  const isAuthenticated = status === 'authenticated';
  const user = session?.user;

  if (status === 'loading') {
    return (
      <Card className="p-4">
        <CardContent>
          <CardTitle>Loading authentication status...</CardTitle>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Authentication Status</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>Session Status: {status}</CardDescription>
        <CardDescription>
          Auth State: {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
        </CardDescription>
        {user && (
          <div className="mt-2">
            <CardDescription>User ID: {user.id}</CardDescription>
            <CardDescription>Name: {user.name}</CardDescription>
            <CardDescription>Email: {user.email}</CardDescription>
            <CardDescription>Role: {user.role}</CardDescription>
          </div>
        )}
        {process.env.NODE_ENV === 'production' && (
          <CardDescription>
            Secret Loaded: {process.env.NEXTAUTH_SECRET ? '✅' : '❌'}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}
