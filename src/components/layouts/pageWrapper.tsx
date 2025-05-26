import { memo } from 'react';
import { cn } from '@/core/lib/utils';

/**
 * Props for the PageWrapper component
 */
interface PageWrapperProps {
  /** The content to be wrapped */
  children: React.ReactNode;
  /** The main heading for the page */
  title?: string;
  /** Additional CSS classes to apply to the wrapper */
  className?: string;
  /** Custom heading level for accessibility */
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  /** Whether to show the title */
  showTitle?: boolean;
}

/**
 * A reusable page wrapper component that provides consistent layout and typography
 * across the application. Follows shadcn/ui design patterns and accessibility guidelines.
 *
 * @param props - The component props
 * @returns A wrapped page layout with optional title
 */
const PageWrapper = memo<PageWrapperProps>(
  ({ children, title, className, headingLevel = 'h2', showTitle = true }) => {
    const HeadingComponent = headingLevel;

    return (
      <main
        className={cn(
          'flex min-h-screen flex-col space-y-6 p-4 md:space-y-8 md:p-6',
          className,
        )}
        role="main"
        aria-label={title ? `${title} page` : 'Main content'}
      >
        {showTitle && title && (
          <header className="space-y-2">
            <HeadingComponent className="scroll-m-20 text-3xl font-bold tracking-tight md:text-4xl">
              {title}
            </HeadingComponent>
          </header>
        )}

        <div className="flex-1 space-y-6">{children}</div>
      </main>
    );
  },
);

PageWrapper.displayName = 'PageWrapper';

export default PageWrapper;
