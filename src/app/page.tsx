'use client';

import { ModeToggle } from '@/components/theme/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  Book,
  Brain,
  Globe,
  Rocket,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { RoleGate } from '@/components/auth/RoleGate';
import AuthStatus from '@/components/AuthStatus';

/**
 * Home page component.
 * Displays the main landing page with navigation, hero section, features, and call to action.
 *
 * @returns {JSX.Element} The home page UI.
 */
export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <h2 className="text-xl font-bold pl-2">Keystroke</h2>
          <div className="flex items-center gap-4">
            <RoleGate allowedRoles={['admin']}>
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            </RoleGate>
            <ModeToggle />
            {session ? (
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container pt-24 pb-12 md:pt-32 md:pb-20">
        <div className="flex flex-col items-center text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
            Master New Languages
            <br />
            <span className="text-primary">One Word at a Time</span>
          </h1>
          <p className="max-w-[700px] text-lg text-muted-foreground">
            Boost your vocabulary with our intelligent learning system.
            Practice, track progress, and achieve fluency faster than ever
            before.
          </p>
          <div className="flex gap-4 mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="h-11 px-8">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="h-11 px-8">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
      <section className="container py-12 md:py-20">
        <AuthStatus />
      </section>

      {/* Features Section */}
      <section className="container py-12 md:py-20">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardContent className="p-6 pt-8">
              <Brain className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Smart Learning</h3>
              <p className="text-muted-foreground">
                Adaptive learning system that adjusts to your progress and
                learning style.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6 pt-8">
              <Globe className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Multiple Languages</h3>
              <p className="text-muted-foreground">
                Support for various languages with native pronunciations and
                examples.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6 pt-8">
              <Rocket className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Visualize your learning journey with detailed progress tracking.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="container py-12 md:py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-col items-center p-12 text-center space-y-4">
            <Book className="h-16 w-16 mb-4" />
            <h2 className="text-3xl font-bold">
              Ready to Expand Your Vocabulary?
            </h2>
            <p className="max-w-[600px] text-lg opacity-90">
              Join thousands of learners who are already improving their
              language skills.
            </p>
            <Link href="/signup" className="mt-6">
              <Button size="lg" variant="secondary" className="h-11 px-8">
                Start Learning Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
