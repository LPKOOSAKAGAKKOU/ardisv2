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
    { title: 'Data Kelas', href: route('admin.classrooms.index'), icon: School },
    { title: 'Data Guru', href: route('admin.teachers.index'), icon: GraduationCap },
    { title: 'Data Wawancara', href: route('admin.interviews.index'), icon: MessageSquare },
    { title: 'Data Perusahaan', href: route('admin.companies.index'), icon: Building2 },
    { title: 'Data Organisasi Penerima', href: route('admin.organizations.index'), icon: Network },
    { title: 'Data Rekrutmen', href: route('admin.recruitments.index'), icon: Folder },
    { title: 'Data Pembayaran', href: '#', icon: CreditCard },
]


const senseiNavItems = (): NavItem[] => [
    { 
        title: 'Dashboard', 
        href: route('sensei.dashboard'), 
        icon: LayoutGrid 
    },
    { 
        title: 'Data Kelas', 
        href: route('sensei.classrooms.index'), // <-- Update ini
        icon: School 
    },
    { 
        title: 'Data Siswa', 
        href: route('sensei.students.index'), // Tetap # sesuai request
        icon: Users 
    },
    { 
        title: 'Data Wawancara', 
        href: route('sensei.interviews.index'), 
        icon: MessageSquare 
    },
]


const studentNavItems = (): NavItem[] => [
    { title: 'Dashboard', href: route('student.dashboard'), icon: LayoutGrid },
    { 
        title: 'Wawancara', href: route('student.interviews.index'), icon: School 
    },
]


const footerNavItems: NavItem[] = [

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
