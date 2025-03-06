import { prisma } from '@/lib/prisma';

export default async function PrismaExamplePage() {
    // Fetch languages from the database
    const languages = await prisma.language.findMany({
        take: 10, // Limit to 10 results
    });

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Prisma Example</h1>

            <div className="bg-white shadow-md rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Languages</h2>

                {languages.length === 0 ? (
                    <p className="text-gray-500">
                        No languages found in the database.
                    </p>
                ) : (
                    <ul className="space-y-2">
                        {languages.map((language) => (
                            <li key={language.id} className="border-b pb-2">
                                <div className="font-medium">
                                    {language.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Code: {language.code}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
