import { geistSans } from '@/components/ui/fonts';

export default function PageWrapper({
    children,
    title,
}: {
    children: React.ReactNode;
    title: string;
}) {
    return (
        <main>
            <h1 className={`${geistSans.className} mb-4 text-xl md:text-2xl`}>
                {title}
            </h1>
            <div className="mb-4 flex justify-start ">{children}</div>
        </main>
    );
}
