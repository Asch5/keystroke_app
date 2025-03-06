import { Suspense } from 'react';
import AddWordForm from './add-word-form';
import { prisma } from '@/lib/prisma';

export default async function AddWordPage() {
    // Fetch languages for the form
    const languages = await prisma.language.findMany({
        orderBy: { name: 'asc' },
    });

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">
                Add New Word to Dictionary
            </h1>

            <div className="bg-white shadow-md rounded-lg p-6">
                <Suspense fallback={<div>Loading form...</div>}>
                    <AddWordForm languages={languages} />
                </Suspense>
            </div>
        </div>
    );
}
