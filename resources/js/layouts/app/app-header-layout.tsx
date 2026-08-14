import { AppContent } from '@/components/app-content';
import { AppHeader } from '@/components/app-header';
import { AppShell } from '@/components/app-shell';
import PaymentPartnerBadge from '@/components/PaymentPartnerBadge';
import { type BreadcrumbItem } from '@/types';
import type { PropsWithChildren } from 'react';

export default function AppHeaderLayout({
    children,
    breadcrumbs,
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell>
            <AppHeader breadcrumbs={breadcrumbs} />
            <AppContent className="flex flex-col min-h-[calc(100vh-4rem)]">
                <div className="flex-1">
                    {children}
                </div>
                <PaymentPartnerBadge variant="student-footer" />
            </AppContent>
        </AppShell>
    );
}

