import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { usePage } from '@inertiajs/react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const { auth } = usePage().props as any;
    const userRole = auth?.user?.role || auth?.user?.roles?.[0]?.name;

    // Jika role student, gunakan AppHeaderLayout
    if (userRole === 'student') {
        return (
            <AppHeaderLayout breadcrumbs={breadcrumbs} {...props}>
                {children}
            </AppHeaderLayout>
        );
    }

    // Selain student (admin, staff, dll), gunakan AppSidebarLayout
    return (
        <AppSidebarLayout breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppSidebarLayout>
    );
};