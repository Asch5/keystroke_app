//import CardWrapper from '@/app/ui/dashboard/cards';
//import RevenueChart from '@/app/ui/dashboard/revenue-chart';
//import LatestInvoices from '@/app/ui/dashboard/latest-invoices';

import { Suspense } from 'react';
import {
    RevenueChartSkeleton,
    CardsSkeleton,
    LatestInvoicesSkeleton,
} from '@/components/ui/skeletons';
import { geistSans } from '@/components/ui/fonts';

export default async function Page() {
    return (
        <main>
            <h1 className={`${geistSans.className} mb-4 text-xl md:text-2xl`}>
                Dashboard
            </h1>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <CardsSkeleton />
                {/* <Suspense fallback={<CardsSkeleton />}>
                    <CardWrapper />
                    
                </Suspense> */}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
                <RevenueChartSkeleton />
                {/* <Suspense fallback={<RevenueChartSkeleton />}>
                    <RevenueChart />
                </Suspense> */}

                <LatestInvoicesSkeleton />
                {/* <LatestInvoices /> */}
            </div>
        </main>
    );
}
