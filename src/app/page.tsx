//import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8 text-center">
                    Vocabulary Builder
                </h1>
                {/* <ThemeToggle /> */}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Dictionary Section */}
                    <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">
                            My Dictionary
                        </h2>
                        <div className="flex gap-4 mb-4">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                Add New Word
                            </button>
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Import Words
                            </button>
                        </div>
                        {/* Placeholder for word list */}
                        <div className="border dark:border-slate-700 rounded-lg p-4 min-h-[200px]">
                            <p className="text-gray-500 dark:text-gray-400 text-center">
                                Your dictionary is empty. Start by adding new
                                words!
                            </p>
                        </div>
                    </section>

                    {/* Practice Section */}
                    <section className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                        <h2 className="text-xl font-semibold mb-4">Practice</h2>
                        <div className="space-y-4">
                            <button className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                Typing Practice
                            </button>
                            <button className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                                Pronunciation Practice
                            </button>
                            <button className="w-full px-4 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700">
                                Word Lists
                            </button>
                        </div>
                    </section>
                </div>

                {/* Dashboard Preview */}
                <section className="mt-8 bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
                    <h2 className="text-xl font-semibold mb-4">Dashboard</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border dark:border-slate-700 rounded-lg p-4">
                            <h3 className="font-medium mb-2">Total Words</h3>
                            <p className="text-2xl font-bold">0</p>
                        </div>
                        <div className="border dark:border-slate-700 rounded-lg p-4">
                            <h3 className="font-medium mb-2">Lists Created</h3>
                            <p className="text-2xl font-bold">0</p>
                        </div>
                        <div className="border dark:border-slate-700 rounded-lg p-4">
                            <h3 className="font-medium mb-2">
                                Words Practiced
                            </h3>
                            <p className="text-2xl font-bold">0</p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}
