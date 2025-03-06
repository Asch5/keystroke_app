import SideNav from '@/components/ui/dashboard/sidenav';
import AuthStatus from '@/components/AuthStatus';

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
            <div className="w-full flex-none md:w-64">
                <SideNav />
            </div>
            <div className="flex-grow p-6 md:overflow-y-auto md:p-12">
                <AuthStatus />
                <div className="mt-4">{children}</div>
            </div>
        </div>
    );
}
