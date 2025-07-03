/**
 * Mock implementation of Vercel Speed Insights script for development environment
 * This prevents 404 errors when running the app locally
 */
export async function GET() {
  // Simple mock script that does nothing but avoids console errors
  const mockScript = `
    // Mock Speed Insights script for development
    console.log('[Vercel Speed Insights] Mock script loaded in development environment');
    
    // Create a no-op implementation
    window.speedInsights = {
      trackMetric: () => {},
      trackCustomMetric: () => {},
      trackEvent: () => {},
      trackPageView: () => {},
    };
  `;

  return new Response(mockScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
