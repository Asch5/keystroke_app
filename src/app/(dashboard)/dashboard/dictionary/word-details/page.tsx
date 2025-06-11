import { redirect } from 'next/navigation';

/**
 * Word Details Root Page
 *
 * Redirects users to the my-dictionary page when they navigate to
 * /dashboard/dictionary/word-details/ without specifying a word
 */
export default function WordDetailsRootPage() {
  // Redirect to my-dictionary page when no word is specified
  redirect('/dashboard/dictionary/my-dictionary');
}
