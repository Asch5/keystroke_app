/**
 * Mock implementation of Vercel Speed Insights vitals endpoint for development environment
 * This prevents 404 errors when running the app locally
 */
export async function POST() {
  // Just return a success response
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
