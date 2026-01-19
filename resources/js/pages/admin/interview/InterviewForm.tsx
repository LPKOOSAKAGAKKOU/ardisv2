import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Building2, LayoutGrid, Info } from 'lucide-react';
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Import Shadcn UI Components
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

interface Props {
    interview?: any;
    companies: { id: number; name: string }[];
    organizations: { id: number; name: string }[];
}

export default function InterviewForm({ interview, companies, organizations }: Props) {
    const isEdit = !!interview;

    const { data, setData, post, patch, processing, errors } = useForm({
        interviewer_title: interview?.interviewer_title || '',
        company_id: interview?.company_id?.toString() || '',
        accepting_organization_id: interview?.accepting_organization_id?.toString() || '',
        description: interview?.description || '',
        interview_date: interview?.interview_date ? new Date(interview.interview_date) : undefined,
        interview_registration_deadline: interview?.interview_registration_deadline ? new Date(interview.interview_registration_deadline) : undefined,
        date_fly_to_japan: interview?.date_fly_to_japan ? new Date(interview.date_fly_to_japan) : undefined,
        group_chat_link: interview?.group_chat_link || '',
    });

    const breadcrumbs = [
        { title: 'Data Wawancara', href: '/admin/interviews' },
        { title: isEdit ? 'Edit Wawancara' : 'Tambah Wawancara', href: '#' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Format tanggal kembali ke string YYYY-MM-DD sebelum dikirim ke Laravel
        const payload = {
            ...data,
            interview_date: data.interview_date ? format(data.interview_date as Date, "yyyy-MM-dd") : '',
            interview_registration_deadline: data.interview_registration_deadline ? format(data.interview_registration_deadline as Date, "yyyy-MM-dd") : '',
        };

        if (isEdit) {
            router.patch(`/admin/interviews/${interview.id}`, payload);
        } else {
            router.post('/admin/interviews', payload);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={isEdit ? 'Edit Wawancara' : 'Tambah Wawancara'} />
            
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                <div className="mb-8 flex items-center gap-4">
                    <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                        <LayoutGrid className="text-white size-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{isEdit ? 'Perbarui Jadwal' : 'Buat Wawancara'}</h1>
                        <p className="text-sm text-muted-foreground">Kelola informasi perekrutan tenaga kerja Jepang.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-sidebar-border shadow-sm">
                        
                        {/* Judul Lowongan */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <Info size={12} /> Judul Lowongan / Job Title
                            </label>
                            <Input 
                                value={data.interviewer_title} 
                                onChange={e => setData('interviewer_title', e.target.value)}
                                placeholder="Contoh: Kaigo - Tokyo (SSW)"
                                className="h-11"
                            />
                            {errors.interviewer_title && <p className="text-xs text-red-500 font-medium">{errors.interviewer_title}</p>}
                        </div>

                        {/* Select Perusahaan */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Perusahaan (Kumiai)</label>
                            <Select 
                                value={data.company_id} 
                                onValueChange={(val) => setData('company_id', val)}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih Perusahaan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Select AO */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Organisasi Penerima (AO)</label>
                            <Select 
                                value={data.accepting_organization_id} 
                                onValueChange={(val) => setData('accepting_organization_id', val)}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Pilih Organisasi" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map(o => (
                                        <SelectItem key={o.id} value={o.id.toString()}>{o.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Picker: Tanggal Wawancara */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <CalendarIcon size={12} /> Tanggal Wawancara
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-11 justify-start text-left font-normal",
                                            !data.interview_date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">
                                            {data.interview_date ? format(data.interview_date as Date, "PPP") : "Pilih tanggal"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                {/* Tambahkan w-64 atau w-[280px] agar lebar card kalender tidak berubah-ubah */}
                                <PopoverContent className="w-64 p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={data.interview_date as any}
                                        onSelect={(date) => setData('interview_date', date as any)}
                                        initialFocus
                                        className="rounded-md border-none"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Date Picker: Deadline Pendaftaran */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                                <CalendarIcon size={12} /> Deadline Pendaftaran
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-11 justify-start text-left font-normal",
                                            !data.interview_registration_deadline && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                                        <span className="truncate">
                                            {data.interview_registration_deadline ? format(data.interview_registration_deadline as Date, "PPP") : "Pilih tanggal"}
                                        </span>
                                    </Button>
                                </PopoverTrigger>
                                {/* Samakan lebar dengan Popover sebelumnya */}
                                <PopoverContent className="w-64 p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={data.interview_registration_deadline as any}
                                        onSelect={(date) => setData('interview_registration_deadline', date as any)}
                                        initialFocus
                                        className="rounded-md border-none"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Deskripsi */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Deskripsi Pekerjaan</label>
                            <Textarea 
                                rows={5}
                                value={data.description} 
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Detail gaji, lokasi, persyaratan khusus..."
                                className="resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end items-center gap-4">
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => window.history.back()}
                        >
                            Batal
                        </Button>
                        <Button 
                            disabled={processing} 
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[180px] h-11 shadow-lg shadow-blue-500/20"
                        >
                            {processing ? 'Memproses...' : (isEdit ? 'Update Wawancara' : 'Simpan Jadwal')}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}