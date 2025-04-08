'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function ApiTestPage() {
  const [appRouterResult, setAppRouterResult] = useState<string>(
    'No data fetched yet',
  );
  const [pagesRouterResult, setPagesRouterResult] = useState<string>(
    'No data fetched yet',
  );
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const testAppApi = async () => {
    if (!session?.user?.id) {
      setError('No user session available');
      return;
    }

    try {
      setAppRouterResult('Fetching data from App Router API...');
      setError(null);

      const userId = session.user.id;
      const response = await fetch(`/api/user-dictionary?userId=${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      console.log('App Router Response status:', response.status);
      console.log(
        'App Router Response headers:',
        Object.fromEntries([...response.headers.entries()]),
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Unknown error occurred');
        } else {
          const text = await response.text();
          console.error(
            'Non-JSON response from App Router:',
            text.substring(0, 500),
          );
          throw new Error(
            `Received non-JSON response with status ${response.status}`,
          );
        }
      }

      const data = await response.json();
      setAppRouterResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error testing App Router API:', err);
      setAppRouterResult(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const testPagesApi = async () => {
    if (!session?.user?.id) {
      setError('No user session available');
      return;
    }

    try {
      setPagesRouterResult('Fetching data from Pages Router API...');
      setError(null);

      const userId = session.user.id;
      // Using the pages router API with api prefix
      const response = await fetch(`/api/user-dictionaryy?userId=${userId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        cache: 'no-store',
      });

      console.log('Pages API Response status:', response.status);
      console.log(
        'Pages API Response headers:',
        Object.fromEntries([...response.headers.entries()]),
      );

      if (!response.ok) {
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Unknown error occurred');
        } else {
          const text = await response.text();
          console.error(
            'Non-JSON response from Pages API:',
            text.substring(0, 500),
          );
          throw new Error(
            `Received non-JSON response with status ${response.status}`,
          );
        }
      }

      const data = await response.json();
      setPagesRouterResult(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error testing Pages API:', err);
      setPagesRouterResult(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  useEffect(() => {
    // Show session info when it's available
    if (session?.user) {
      console.log('Session user:', session.user);
    }
  }, [session]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Session Info</h2>
        <pre className="bg-gray-100 p-3 rounded">
          {JSON.stringify(session?.user || 'No session', null, 2)}
        </pre>
      </div>

      <div className="mb-6 flex space-x-4">
        <button
          onClick={testAppApi}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test App Router API
        </button>

        <button
          onClick={testPagesApi}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Pages Router API
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">App Router API Result</h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
            {appRouterResult}
          </pre>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Pages Router API Result
          </h2>
          <pre className="bg-gray-100 p-3 rounded overflow-auto max-h-96">
            {pagesRouterResult}
          </pre>
        </div>
      </div>
    </div>
  );
}
