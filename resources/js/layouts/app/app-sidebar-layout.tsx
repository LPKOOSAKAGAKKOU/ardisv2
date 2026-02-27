import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import WhatsAppWidget from '@/components/WhatsAppWidget'; // Import widget agan

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden p-0"> {/* Hapus padding default di sini jika mengganggu */}
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
            
                <div className="flex flex-1 flex-row overflow-hidden h-full">
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                        {children}
                    </main>
                    <WhatsAppWidget />
                    
                </div>
            </AppContent>
        </AppShell>
    );
}