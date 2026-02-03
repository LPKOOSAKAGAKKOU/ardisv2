import React, { useEffect } from "react";
import { useForm } from "@inertiajs/react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// HAPUS import Switch

interface TeacherFormProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    teacher?: any;
}

export default function TeacherForm({ open, setOpen, teacher }: TeacherFormProps) {
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: "",
        email: "",
        nip: "",
        type: "",
        phone_number: "",
        is_active: true,
    });

    useEffect(() => {
        if (teacher) {
            setData({
                name: teacher.name || "",
                email: teacher.email || "",
                nip: teacher.nip || "",
                type: teacher.type || "",
                phone_number: teacher.phone_number || "",
                is_active: Boolean(teacher.is_active),
            });
        } else {
            reset();
            setData("is_active", true);
        }
        clearErrors();
    }, [teacher, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (teacher) {
            // Update: /admin/teachers/{id}
            put(`/admin/teachers/${teacher.id}`, {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        } else {
            // Store: /admin/teachers
            post('/admin/teachers', {
                onSuccess: () => {
                    setOpen(false);
                    reset();
                },
            });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>{teacher ? "Edit Data Sensei" : "Tambah Sensei Baru"}</DialogTitle>
                        <DialogDescription>
                            {teacher 
                                ? "Perbarui informasi instruktur dan akun login." 
                                : "Menambahkan instruktur baru akan otomatis membuat akun login (Role: Sensei)."
                            }
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        {/* Nama Lengkap */}
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                Nama Lengkap
                            </Label>
                            <Input 
                                id="name" 
                                value={data.name} 
                                onChange={e => setData("name", e.target.value)} 
                                placeholder="Cth: AGUS SANTOSO"
                                autoFocus
                            />
                            {errors.name && <p className="text-[10px] text-red-500 font-medium">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* NIP */}
                            <div className="grid gap-2">
                                <Label htmlFor="nip">NIP (Opsional)</Label>
                                <Input 
                                    id="nip" 
                                    value={data.nip} 
                                    onChange={e => setData("nip", e.target.value)} 
                                    placeholder="Nomor Induk"
                                />
                                {errors.nip && <p className="text-[10px] text-red-500 font-medium">{errors.nip}</p>}
                            </div>

                            {/* Jenis Sensei */}
                            <div className="grid gap-2">
                                <Label className="after:content-['*'] after:ml-0.5 after:text-red-500">Spesialisasi</Label>
                                <Select value={data.type} onValueChange={val => setData("type", val)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih Bidang" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bahasa_jepang">Bahasa Jepang</SelectItem>
                                        <SelectItem value="kaigo">Kaigo (Perawat)</SelectItem>
                                        <SelectItem value="kensetsu">Kensetsu (Konstruksi)</SelectItem>
                                        <SelectItem value="budaya">Budaya & Etika</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.type && <p className="text-[10px] text-red-500 font-medium">{errors.type}</p>}
                            </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                                    Email (Login)
                                </Label>
                                <Input 
                                    id="email" 
                                    type="email"
                                    value={data.email} 
                                    onChange={e => setData("email", e.target.value)} 
                                    placeholder="email@sekolah.com"
                                />
                                {errors.email && <p className="text-[10px] text-red-500 font-medium">{errors.email}</p>}
                            </div>
                            
                            <div className="grid gap-2">
                                <Label htmlFor="phone">WhatsApp</Label>
                                <Input 
                                    id="phone" 
                                    value={data.phone_number} 
                                    onChange={e => setData("phone_number", e.target.value)} 
                                    placeholder="0812..."
                                />
                                {errors.phone_number && <p className="text-[10px] text-red-500 font-medium">{errors.phone_number}</p>}
                            </div>
                        </div>

                        {/* Status Aktif (Ganti Switch dengan Checkbox biasa) */}
                        {teacher && (
                            <div className="flex items-center gap-2 rounded-lg border p-3 bg-neutral-50/50">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={data.is_active}
                                    onChange={(e) => setData("is_active", e.target.checked)}
                                />
                                <Label htmlFor="is_active" className="cursor-pointer text-sm font-medium text-gray-700">
                                    Status Guru Aktif
                                </Label>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? "Menyimpan..." : (teacher ? "Simpan Perubahan" : "Simpan Data")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}