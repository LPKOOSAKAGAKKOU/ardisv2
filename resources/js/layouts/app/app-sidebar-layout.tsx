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
            
            {/* Bungkus AppContent dan WhatsAppWidget dalam flex-row utama.
                Ini akan membuat keduanya sejajar dari ujung atas layar hingga bawah.
            */}
            <div className="flex flex-1 flex-row overflow-hidden">
                
                <AppContent variant="sidebar" className="flex-1 flex flex-col overflow-x-hidden p-0 border-r border-transparent">
                    {/* Header/Breadcrumb tetap di kiri atas */}
                    <AppSidebarHeader breadcrumbs={breadcrumbs} />
                    
                    {/* Area Konten Utama tetap bisa di-scroll sendiri */}
                    <main className="flex-1 overflow-y-auto p-4 lg:p-6">
                        {children}
                    </main>
                </AppContent>

                {/* WhatsAppWidget diletakkan di sini (sejajar dengan AppContent).
                    Sekarang bagian "Daftar Chat" akan sejajar lurus dengan Breadcrumb.
                */}
                <WhatsAppWidget />
                
            </div>
        </AppShell>
    );
}