import { NavFooter } from '@/components/nav-footer'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar'
import { type NavItem } from '@/types'
import { Link, usePage } from '@inertiajs/react'
import {
    BookOpen,
    Folder,
    LayoutGrid,
    Users,
    School,
    MessageSquare,
    Building2,
    Network,
    GraduationCap,
    CreditCard,
} from 'lucide-react'
import AppLogo from './app-logo'
import { route } from 'ziggy-js'


/* =======================
   NAV ITEMS PER ROLE
======================= */

const adminNavItems = (): NavItem[] => [
    { title: 'Dashboard', href: route('admin.dashboard'), icon: LayoutGrid },
    { title: 'Data Siswa', href: route('admin.students.index'), icon: Users },
    { title: 'Data Kelas', href: '#', icon: School },
    { title: 'Data Guru', href: '#', icon: GraduationCap },
    { title: 'Data Wawancara', href: '#', icon: MessageSquare },
    { title: 'Data Perusahaan', href: '#', icon: Building2 },
    { title: 'Data Organisasi Penerima', href: '#', icon: Network },
    { title: 'Data Pembayaran', href: '#', icon: CreditCard },
]


const senseiNavItems = (): NavItem[] => [
    { title: 'Dashboard', href: route('sensei.dashboard'), icon: LayoutGrid },
    { title: 'Data Kelas', href: '#', icon: School },
    { title: 'Data Siswa', href: '#', icon: Users },
]


const studentNavItems = (): NavItem[] => [
    { title: 'Dashboard', href: route('student.dashboard'), icon: LayoutGrid },
    { title: 'Kelas Saya', href: '#', icon: School },
]


const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
]

export function AppSidebar() {
    const { auth } = usePage().props as any
    const role = auth?.user?.role

    let mainNavItems: NavItem[] = []

    if (role === 'admin') {
        mainNavItems = adminNavItems()
    } else if (role === 'sensei') {
        mainNavItems = senseiNavItems()
    } else {
        mainNavItems = studentNavItems()
    }


    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={mainNavItems[0].href} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
