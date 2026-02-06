import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Download, Loader2, RotateCw } from "lucide-react"; // Tambahkan RotateCw
import { useState, useEffect } from "react";
import axios from "axios";
import { route } from "ziggy-js";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: number | null;
    interviewId: number | null;
    userName: string;
}

export default function CvPreviewModal({ isOpen, onClose, userId, interviewId, userName }: Props) {
    const [htmlContent, setHtmlContent] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchPreview();
        } else {
            setHtmlContent("");
        }
    }, [isOpen, userId, interviewId]);

    const fetchPreview = async () => {
        setIsLoading(true);
        try {
            const url = route('cv.generate', { 
                userId: userId, 
                interviewId: interviewId 
            });
            
            const response = await axios.get(url, {
                params: { preview: 'true' }
            });
            
            if (response.data.html) {
                const styledHtml = `
                <style>
                    html, body {
                        margin: 0;
                        padding: 0;
                        height: 130%;
                        overflow: hidden; /* 🔥 MATIKAN SCROLL DI IFRAME */
                        background: white;
                    }

                    table {
                        border-collapse: collapse !important;
                        margin: 0 auto !important;
                    }
                </style>
                ${response.data.html}
                `;

                setHtmlContent(styledHtml);
            }
        } catch (error) {
            console.error("Gagal memuat preview CV", error);
            setHtmlContent("<div style='text-align:center; padding: 50px; font-family:sans-serif;'>⚠️ Gagal memuat pratinjau. Silakan coba unduh langsung.</div>");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        const url = route('cv.generate', { userId, interviewId });
        window.open(url, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* Gunakan !max-w-7xl untuk memaksa lebar native tetap XL7 */}
            <DialogContent className="!max-w-7xl w-[95vw] lg:max-w-[90vw] max-h-[95vh] flex flex-col p-0 overflow-hidden bg-muted/30 border shadow-2xl">
                
                <div className="sticky top-0 z-50 bg-background border-b p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold">Pratinjau CV: {userName}</DialogTitle>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Laporan Hasil Resume Siswa</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* TOMBOL REFRESH BARU */}
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            onClick={fetchPreview} 
                            disabled={isLoading}
                            className="gap-2 font-bold"
                        >
                            <RotateCw size={16} className={isLoading ? "animate-spin" : ""} />
                            Refresh
                        </Button>

                        <Button variant="outline" size="sm" onClick={onClose} className="font-semibold">
                            Tutup
                        </Button>

                        <Button size="sm" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-bold shadow-sm">
                            <Download size={16} /> Unduh (.xlsx)
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-neutral-200 dark:bg-zinc-900 p-4 md:p-8 flex justify-center overflow-y-auto">
                    <div className="w-full max-w-5xl bg-white shadow-xl rounded-sm relative min-h-full">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 bg-white/80 z-20">
                                <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
                                <p className="text-sm font-bold uppercase tracking-widest text-blue-600">Memperbarui Pratinjau...</p>
                            </div>
                        ) : (
                            <iframe 
                                srcDoc={htmlContent} 
                                className="w-full h-full min-h-[1200px] border-none"
                                title="CV Preview"
                                sandbox="allow-same-origin allow-scripts allow-popups" 
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}