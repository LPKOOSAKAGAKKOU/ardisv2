import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, X, Maximize2 } from "lucide-react";
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
            // Gunakan .get dengan params eksplisit untuk memastikan query string preview=true terkirim
            const url = route('cv.generate', { 
                userId: userId, 
                interviewId: interviewId 
            });
            
            const response = await axios.get(url, {
                params: { preview: 'true' }
            });
            
            if (response.data.html) {
                // Tambahkan sedikit CSS dasar agar HTML dari Excel tidak berantakan di iframe
                const styledHtml = `
                    <style>
                        body { font-family: sans-serif; padding: 20px; display: flex; justify-content: center; }
                        table { border-collapse: collapse; margin: 0 auto; background: white; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
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
            {/* max-w-7xl akan memberikan lebar yang jauh lebih luas (sekitar 1280px) */}
            <DialogContent className="max-w-7xl w-[95vw] h-[95vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950 border-none">
                <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-zinc-950 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Maximize2 size={18} />
                        </div>
                        <DialogTitle className="text-lg font-bold">Pratinjau CV: {userName}</DialogTitle>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose} className="font-semibold">
                            Tutup
                        </Button>
                        <Button size="sm" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold">
                            <Download size={16} /> Unduh Excel (.xlsx)
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-neutral-200 dark:bg-zinc-900 p-4 md:p-8 overflow-auto shadow-inner">
                    <div className="max-w-5xl mx-auto w-full h-full bg-white shadow-2xl rounded-sm relative">
                        {isLoading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3 bg-white/80 z-20">
                                <Loader2 className="animate-spin h-10 w-10 text-blue-600" />
                                <p className="text-sm font-bold uppercase tracking-widest">Menyusun Dokumen CV...</p>
                            </div>
                        ) : (
                            <iframe 
                                srcDoc={htmlContent} 
                                className="w-full h-full border-none shadow-sm"
                                title="CV Preview"
                                // allow-popups agar jika ada link di dalam CV tetap bisa diklik
                                sandbox="allow-same-origin allow-scripts allow-popups" 
                            />
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}