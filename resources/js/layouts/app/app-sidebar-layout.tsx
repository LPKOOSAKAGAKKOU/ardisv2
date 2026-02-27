import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import { type BreadcrumbItem } from '@/types';
import { type PropsWithChildren } from 'react';
import WhatsAppWidget from '@/components/WhatsAppWidget';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[] }>) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            
            {/* Container ini dibuat h-screen (tinggi layar penuh) 
                dan flex-row agar sejajar. 
            */}
            <div className="flex flex-1 flex-row h-screen overflow-hidden bg-background">
                
                <AppContent variant="sidebar" className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Header Breadcrumb */}
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    
                    {/* Area Konten Utama diberikan overflow-y-auto 
                        supaya punya scroll sendiri. 
                    */}
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
                        {children}
                    </main>
                </AppContent>

                {/* WhatsAppWidget diletakkan di luar AppContent.
                    Karena container induk h-screen, dia akan otomatis 
                    memanjang dari atas header sampai bawah layar.
                */}
                <WhatsAppWidget />
                
            </div>
        </AppShell>
    );
}