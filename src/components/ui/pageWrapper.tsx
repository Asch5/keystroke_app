import { geistSans } from '@/components/ui/fonts';

export default function PageWrapper({
    children,
    title,
}: {
    children: React.ReactNode;
    title: string;
}) {
    return (
        <main className="flex flex-col md:gap-4 md:mt-4 ">
            <h1
                className={`${geistSans.className} mb-4 text-center md:text-left text-xl md:text-2xl`}
            >
                {title}
            </h1>
            <div className="mb-4 flex justify-center md:justify-start ">
                {children}
            </div>
        </main>
    );
}
