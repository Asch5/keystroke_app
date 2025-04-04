import { ModeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';

export default function Home() {
    return (
        <div className="min-h-screen flex flex-col gap-8 items-center justify-center bg-background">
            <div className="flex flex-col gap-4 items-center p-8 rounded-lg border bg-card text-card-foreground shadow-sm">
                <h1 className="text-3xl font-bold tracking-tight">
                    Keystroke App
                </h1>
                <p className="text-muted-foreground">
                    Welcome to the Keystroke App. This is styled with shadcn/ui.
                </p>

                <div className="flex flex-row gap-4 mt-4">
                    <Button>Default Button</Button>
                    <Button variant="secondary">Secondary Button</Button>
                    <Button variant="destructive">Destructive Button</Button>
                    <Button variant="outline">Outline Button</Button>
                </div>

                <div className="flex items-center justify-center mt-4">
                    <ModeToggle />
                </div>
            </div>
        </div>
    );
}
