import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, X } from "lucide-react";
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
            // Request ke backend dengan parameter preview=true
            const url = route('cv.generate', { userId, interviewId, preview: true });
            const response = await axios.get(url);
            
            if (response.data.html) {
                setHtmlContent(response.data.html);
            }
        } catch (error) {
            console.error("Gagal memuat preview CV", error);
            setHtmlContent("<div style='text-align:center; padding: 20px;'>Gagal memuat pratinjau. Silakan coba unduh langsung.</div>");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = () => {
        // Link download asli tanpa parameter preview
        const url = route('cv.generate', { userId, interviewId });
        window.open(url, '_blank');
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-zinc-950">
                <div className="flex items-center justify-between p-4 border-b">
                    <DialogTitle>Pratinjau CV: {userName}</DialogTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onClose}>
                            Tutup
                        </Button>
                        <Button size="sm" onClick={handleDownload} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                            <Download size={16} /> Unduh Excel (.xlsx)
                        </Button>
                    </div>
                </div>

                <div className="flex-1 bg-neutral-100 dark:bg-zinc-900 overflow-hidden relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-2">
                            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
                            <p className="text-sm font-medium">Sedang men-generate CV...</p>
                        </div>
                    ) : (
                        <iframe 
                            srcDoc={htmlContent} 
                            className="w-full h-full border-none bg-white"
                            title="CV Preview"
                            sandbox="allow-same-origin" 
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}