'use client';

import { ModeToggle } from '@/components/shared/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Book,
  Brain,
  Globe,
  Rocket,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { RoleGate } from '@/components/features/auth';

/**
 * Home page component.
 * Displays the main landing page with navigation, hero section, features, and call to action.
 * Enhanced with modern animations, gradients, and interactive elements.
 *
 * @returns {JSX.Element} The home page UI.
 */
export default function Home() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Keystroke
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <RoleGate allowedRoles={['admin']}>
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="sm"
                  className="hover:scale-105 transition-all duration-200"
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Admin Panel
                </Button>
              </Link>
            </RoleGate>
            <ModeToggle />
            {session ? (
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="hover:scale-105 transition-all duration-200"
                >
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="hover:scale-105 transition-all duration-200"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative container pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="flex flex-col items-center text-center space-y-8 relative z-10">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Badge
              variant="secondary"
              className="px-4 py-2 text-sm font-medium"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI-Powered Learning
            </Badge>
          </div>

          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl max-w-4xl">
              Master New Languages
              <br />
              <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                One Word at a Time
              </span>
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground leading-relaxed">
              Boost your vocabulary with our intelligent learning system.
              Practice, track progress, and achieve fluency faster than ever
              before.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="h-12 px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-8 hover:scale-105 transition-all duration-200 hover:shadow-lg"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">
                Active Learners
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Languages</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1M+</div>
              <div className="text-sm text-muted-foreground">Words Learned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container py-16 md:py-24">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h2 className="text-3xl font-bold mb-4">
            Why Choose <span className="text-primary">Keystroke</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the future of language learning with our cutting-edge
            features
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative p-8">
              <div className="mb-6 relative">
                <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Brain className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                Smart Learning
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Adaptive learning system that adjusts to your progress and
                learning style with AI-powered recommendations.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-400">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative p-8">
              <div className="mb-6 relative">
                <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Globe className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                Multiple Languages
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Support for 50+ languages with native pronunciations, cultural
                context, and real-world examples.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-600">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative p-8">
              <div className="mb-6 relative">
                <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                Track Progress
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize your learning journey with detailed analytics,
                streaks, and achievement milestones.
              </p>
            </CardContent>
          </Card>

          {/* Additional Feature Cards */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-700">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative p-8">
              <div className="mb-6 relative">
                <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                Lightning Fast
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Optimized for speed with instant translations and real-time
                feedback on your performance.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-800">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative p-8">
              <div className="mb-6 relative">
                <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                Community
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Join a vibrant community of learners, compete in challenges, and
                share your achievements.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-500 hover:scale-105 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-900">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardContent className="relative p-8">
              <div className="mb-6 relative">
                <div className="h-14 w-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <Rocket className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">
                Advanced Tools
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                Access premium features like voice recognition, spaced
                repetition, and custom study plans.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="relative container py-16 md:py-24">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent" />
          <CardContent className="relative flex flex-col items-center p-12 md:p-16 text-center space-y-8">
            <div className="mb-6">
              <div className="h-20 w-20 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-6 hover:scale-110 transition-transform duration-300">
                <Book className="h-10 w-10 text-primary-foreground" />
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">
                Ready to Expand Your Vocabulary?
              </h2>
              <p className="max-w-[600px] text-lg opacity-90 leading-relaxed">
                Join thousands of learners who are already improving their
                language skills with our AI-powered platform.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12 px-8 bg-primary-foreground text-primary hover:bg-primary-foreground/90 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Learning Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 transform hover:scale-105 transition-all duration-200"
                >
                  Try Demo
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50 backdrop-blur-sm">
        <div className="container py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-2">
              <div className="h-6 w-6 bg-gradient-to-br from-primary to-primary/60 rounded-md flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                © 2024 Keystroke. All rights reserved.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
