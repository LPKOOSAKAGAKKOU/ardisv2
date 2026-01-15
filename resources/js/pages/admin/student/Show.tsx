import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    User, Mail, Fingerprint, Calendar, MapPin, 
    Ruler, Weight, Heart, Shield, GraduationCap, 
    Briefcase, Users, ArrowLeft, Edit, Phone, 
    Target, Award, BookOpen, PlaneTakeoff,
    Eye, Beer, Flame, Anchor, CreditCard, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface Props {
    student: any;
}

export default function StudentShow({ student }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Data Siswa', href: route('admin.students.index') },
        { title: 'Profil Siswa', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Profil - ${student.full_name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-8 overflow-x-auto rounded-xl">
                
                {/* --- HEADER ACTIONS --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.students.index')}>
                            <Button variant="outline" size="sm" className="border-sidebar-border/70 dark:border-sidebar-border">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                            </Button>
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight text-foreground">{student.full_name}</h1>
                        <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground font-semibold uppercase tracking-wider text-[10px]">
                            {student.student_status}
                        </Badge>
                    </div>
                    <Link href={route('admin.students.edit', student.id)}>
                        <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 shadow-sm">
                            <Edit className="mr-2 h-4 w-4" /> Edit Profil
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* --- SIDEBAR INFO (LEFT) --- */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardContent className="pt-8 text-center relative">
                                <div className="mx-auto h-28 w-28 rounded-2xl bg-sidebar-accent flex items-center justify-center text-sidebar-foreground border border-sidebar-border/70 mb-4 overflow-hidden relative">
                                    <User size={56} strokeWidth={1.5} />
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10" />
                                </div>
                                <h3 className="text-lg font-bold">{student.full_name}</h3>
                                <p className="text-sm text-muted-foreground">{student.full_name_katakana || 'カナ未登録'}</p>
                            </CardContent>
                            <Separator className="bg-sidebar-border/50" />
                            <CardContent className="space-y-4 py-6">
                                <DetailRow icon={<Fingerprint size={16}/>} label="NIK" value={student.nik} />
                                <DetailRow icon={<Mail size={16}/>} label="Email" value={student.user?.email} />
                                <DetailRow icon={<Phone size={16}/>} label="Whatsapp" value={student.phone_student} />
                                <DetailRow icon={<MapPin size={16}/>} label="Alamat" value={student.address_ktp} />
                            </CardContent>
                        </Card>

                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="bg-sidebar-accent/30 py-3 border-b border-sidebar-border/70">
                                <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                    <Info size={14}/> Kondisi Fisik & Medis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-2 gap-px bg-sidebar-border/70 border-b border-sidebar-border/70">
                                <StatCell label="Tinggi" value={`${student.height} cm`} />
                                <StatCell label="Berat" value={`${student.weight} kg`} />
                                <StatCell label="Darah" value={student.blood_type} />
                                <StatCell label="Warna" value={student.color_blind} />
                            </CardContent>
                            <CardContent className="p-4 space-y-3">
                                <HabitRow label="Merokok" value={student.smoking} />
                                <HabitRow label="Alkohol" value={student.alcohol} />
                                <HabitRow label="Tato" value={student.tattoo} />
                                <HabitRow label="Riwayat TBC" value={student.tbc_history} />
                            </CardContent>
                        </Card>
                    </div>

                    {/* --- MAIN CONTENT (RIGHT) --- */}
                    <div className="lg:col-span-8 space-y-6">
                        
                        {/* QUICK STATS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <QuickBox title="Target Tabungan" value={`¥${Number(student.savings_target).toLocaleString()}`} icon={<CreditCard size={18}/>} />
                            <QuickBox title="Program LPK" value={student.program_expert || 'B. Jepang'} icon={<Target size={18}/>} />
                            <QuickBox title="Level Kelas" value={student.class_level || 'N/A'} icon={<Award size={18}/>} />
                        </div>

                        {/* EDUCATION RECORDS */}
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/30 py-4 flex flex-row items-center gap-3">
                                <GraduationCap size={20} className="text-muted-foreground" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Riwayat Pendidikan</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-sidebar-border/50">
                                {student.educations?.length > 0 ? student.educations.map((edu: any, i: number) => (
                                    <div key={i} className="p-5 flex justify-between items-start hover:bg-sidebar-accent/20 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground leading-none">{edu.school_name}</p>
                                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-tighter">{edu.level} • {edu.major || 'Umum'} • {edu.school_type}</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="text-[9px] border-sidebar-border/70 text-muted-foreground">{edu.entry_date} - {edu.graduation_date}</Badge>
                                        </div>
                                    </div>
                                )) : <EmptyPlaceholder label="Data pendidikan belum tersedia" />}
                            </CardContent>
                        </Card>

                        {/* WORK RECORDS */}
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/30 py-4 flex flex-row items-center gap-3">
                                <Briefcase size={20} className="text-muted-foreground" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Pengalaman Kerja</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-sidebar-border/50">
                                {student.experiences?.length > 0 ? student.experiences.map((exp: any, i: number) => (
                                    <div key={i} className="p-5 flex justify-between items-center hover:bg-sidebar-accent/20 transition-colors">
                                        <div className="space-y-1">
                                            <p className="font-bold text-foreground leading-none">{exp.company_name}</p>
                                            <p className="text-xs font-bold text-muted-foreground uppercase">{exp.job_type}</p>
                                            <p className="text-[10px] text-muted-foreground/60 italic">{exp.start_date} s/d {exp.end_date || 'Sekarang'}</p>
                                        </div>
                                        <div className="text-right px-4 py-2 bg-sidebar-accent/40 rounded-xl border border-sidebar-border/50">
                                            <p className="text-[10px] font-black text-muted-foreground uppercase leading-none">Salary</p>
                                            <p className="text-sm font-black text-foreground">Rp {Number(exp.monthly_salary).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )) : <EmptyPlaceholder label="Pengalaman kerja belum ditambahkan" />}
                            </CardContent>
                        </Card>

                        {/* FAMILY TABLE */}
                        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl overflow-hidden">
                            <CardHeader className="border-b border-sidebar-border/70 bg-sidebar-accent/30 py-4 flex flex-row items-center gap-3">
                                <Users size={20} className="text-muted-foreground" />
                                <CardTitle className="text-sm font-bold uppercase tracking-wider">Anggota Keluarga</CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-sidebar-border/50">
                                    {student.families?.map((fam: any, i: number) => (
                                        <div key={i} className="p-4 flex items-center gap-4 hover:bg-sidebar-accent/20 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-sidebar-accent flex items-center justify-center text-muted-foreground shrink-0 text-[10px] font-black border border-sidebar-border/70 uppercase">
                                                {fam.relationship.substring(0, 3)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-sm text-foreground truncate leading-tight">{fam.name}</p>
                                                <p className="text-[11px] text-muted-foreground leading-none mt-1">{fam.occupation} • {fam.age} Thn</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

/* --- REUSABLE INTERNAL COMPONENTS (MATCHING THE DASHBOARD THEME) --- */

function DetailRow({ icon, label, value }: any) {
    return (
        <div className="flex gap-4 items-start group">
            <div className="text-muted-foreground/60 mt-0.5 group-hover:text-foreground transition-colors">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-sm font-semibold text-foreground leading-tight">{value || '-'}</p>
            </div>
        </div>
    );
}

function StatCell({ label, value }: any) {
    return (
        <div className="bg-background p-4 text-center">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
            <p className="text-base font-black text-foreground">{value}</p>
        </div>
    );
}

function HabitRow({ label, value }: any) {
    const isHighlight = ['ada', 'merokok', 'minum'].includes(value?.toLowerCase());
    return (
        <div className="flex items-center justify-between py-1 border-b border-sidebar-border/30 last:border-0">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            <Badge variant="outline" className={`text-[9px] font-black uppercase px-2 py-0 h-5 border-sidebar-border/70 ${isHighlight ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                {value}
            </Badge>
        </div>
    );
}

function QuickBox({ title, value, icon }: any) {
    return (
        <Card className="border-sidebar-border/70 dark:border-sidebar-border shadow-none bg-background rounded-xl">
            <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-sidebar-accent flex items-center justify-center border border-sidebar-border/70 shadow-sm text-muted-foreground">
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
                    <p className="text-sm font-black text-foreground mt-0.5 leading-none">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyPlaceholder({ label }: { label: string }) {
    return (
        <div className="p-10 text-center relative overflow-hidden group">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest relative z-10 italic">{label}</p>
            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/[0.03] dark:stroke-neutral-100/[0.03]" />
        </div>
    );
}