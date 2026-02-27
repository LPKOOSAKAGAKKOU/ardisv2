import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

// --- Tipe Data ---
interface ChatItem {
    id: number;
    name: string;
    last_message: string;
    time_ago: string;
    unread_count: number;
    phone: string;
}

interface ContactItem {
    id: number;
    name: string;
    phone: string;
}

interface MessageItem {
    id: number;
    text: string;
    direction: 'inbound' | 'outbound';
    time: string;
    is_admin: boolean;
    // Tambahan Media & Lokasi
    message_type?: string;
    media_url?: string;
    file_name?: string;
    latitude?: string;
    longitude?: string;
}

export default function WhatsAppWidget() {
    const { auth } = usePage().props as any; 
    const userRole = auth?.user?.role || 'admin'; 
    const basePath = `/${userRole}/whatsapp`; 

    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'chat' | 'new_chat'>('list');
    
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [contactList, setContactList] = useState<ContactItem[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    
    // State Aktif
    const [activeChat, setActiveChat] = useState<number | null>(null);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Fitur Baru: Search, Pagination, & Upload File
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Daftar Chat & Kontak
    const fetchChatList = async () => {
        try {
            const response = await axios.get(`${basePath}/chats`); 
            setChatList(response.data.chats || []);
            setContactList(response.data.contacts || []);
        } catch (error) {
            console.error("Gagal memuat chat", error);
        }
    };

    useEffect(() => {
        fetchChatList();
        const interval = setInterval(fetchChatList, 60000); 
        return () => clearInterval(interval);
    }, []);

    // 2. Fetch Pesan dengan Pagination
    const loadMessages = async (chatId: number, pageNum: number = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages?page=${pageNum}`);
            
            if (pageNum === 1) {
                setMessages(response.data.messages);
            } else {
                // Prepend (tambahkan ke atas) jika meload history lama
                setMessages(prev => [...response.data.messages, ...prev]);
            }
            
            setChatInfo(response.data.chat_info);
            setHasMore(response.data.pagination.has_more);
            setPage(pageNum);
            
            // Hapus unread count di UI
            setChatList(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
        } catch (error) {
            console.error("Error load messages", error);
        } finally {
            setLoading(false);
        }
    };

    const openChat = (chatId: number) => {
        setActiveChat(chatId);
        setViewMode('chat');
        loadMessages(chatId, 1);
    };

    // 3. Mulai Chat Baru
    const startNewChat = (contact: ContactItem) => {
        const existingChat = chatList.find(c => c.phone === contact.phone);
        if (existingChat) {
            openChat(existingChat.id);
        } else {
            setActiveChat(null);
            setMessages([]);
            setChatInfo({ name: contact.name, phone: contact.phone, isNew: true });
            setViewMode('chat');
            setHasMore(false);
        }
    };

    // Scroll otomatis ke bawah HANYA saat buka chat baru atau kirim pesan (halaman 1)
    useEffect(() => {
        if (page === 1) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, viewMode, page]);

    // 4. Kirim Pesan (Mendukung FormData untuk File)
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !chatInfo || isSending) return;

        setIsSending(true);

        const formData = new FormData();
        formData.append('phone_number', chatInfo.phone);
        if (newMessage.trim()) formData.append('message', newMessage);
        if (selectedFile) formData.append('file', selectedFile);

        // Optimistic UI (khusus teks, karena file harus tunggu URL dari server)
        if (!selectedFile) {
            const tempMsg: MessageItem = {
                id: Date.now(),
                text: newMessage,
                direction: 'outbound',
                time: 'Just now',
                is_admin: true,
                message_type: 'chat'
            };
            setMessages([...messages, tempMsg]);
        }
        
        setNewMessage('');
        setSelectedFile(null);

        try {
            const response = await axios.post(`${basePath}/send`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (chatInfo.isNew && response.data?.chat_id) {
                openChat(response.data.chat_id);
            } else if (activeChat) {
                loadMessages(activeChat, 1); // Refresh pesan halaman 1 untuk tarik data yg barusan dikirim
            }
            fetchChatList(); 
        } catch (error) {
            alert('Gagal mengirim pesan');
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    // Filter pencarian kontak
    const filteredContacts = contactList.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone.includes(searchQuery)
    );

    // --- RENDER UI ---

    if (!isOpen) {
        const totalUnread = chatList.reduce((sum, item) => sum + item.unread_count, 0);
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                <span className="font-bold">Chat Siswa</span>
                {totalUnread > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">{totalUnread}</span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-background shadow-2xl border-l border-border z-50 flex flex-col transform transition-transform">
            
            {/* Header */}
            <div className="bg-background text-foreground border-b border-border p-4 flex justify-between items-center shadow-sm shrink-0">
                <h3 className="font-bold text-lg truncate pr-2">
                    {viewMode === 'chat' ? chatInfo?.name : viewMode === 'new_chat' ? 'Pilih Kontak' : 'Daftar Chat'}
                </h3>
                <div className="flex gap-3 items-center shrink-0">
                    {viewMode !== 'list' && (
                        <button onClick={() => { setViewMode('list'); setSearchQuery(''); }} className="text-sm font-medium hover:text-muted-foreground transition-colors">
                            Kembali
                        </button>
                    )}
                    <button onClick={() => setIsOpen(false)} className="hover:bg-accent hover:text-accent-foreground p-1 rounded-md transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-muted/10 relative">
                
                {/* 1. LIST CHAT */}
                {viewMode === 'list' && (
                    <div className="divide-y divide-border">
                        <div className="p-3">
                            <button 
                                onClick={() => setViewMode('new_chat')}
                                className="w-full flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                Chat Baru
                            </button>
                        </div>
                        {chatList.length === 0 && (
                            <div className="p-4 text-center text-muted-foreground text-sm">Belum ada percakapan.</div>
                        )}
                        {chatList.map((chat) => (
                            <div key={chat.id} onClick={() => openChat(chat.id)} className="p-3 hover:bg-accent cursor-pointer transition-colors flex items-start gap-3 bg-background">
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border border-border">
                                    {chat.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-semibold text-sm truncate text-foreground">{chat.name}</span>
                                        <span className="text-[10px] text-muted-foreground shrink-0">{chat.time_ago}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{chat.last_message}</p>
                                </div>
                                {chat.unread_count > 0 && (
                                    <div className="bg-primary text-primary-foreground text-[10px] w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-2">
                                        {chat.unread_count}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. DAFTAR KONTAK DENGAN SEARCH */}
                {viewMode === 'new_chat' && (
                    <div className="flex flex-col h-full">
                        <div className="p-3 border-b border-border bg-background shrink-0">
                            <input
                                type="text"
                                placeholder="Cari nama atau nomor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-sm bg-muted text-foreground border border-transparent rounded-full focus:border-primary focus:ring-1 focus:ring-primary px-4 py-2 outline-none transition-all"
                            />
                        </div>
                        <div className="divide-y divide-border overflow-y-auto flex-1">
                            {filteredContacts.length === 0 && (
                                <div className="p-4 text-center text-muted-foreground text-sm">Kontak tidak ditemukan.</div>
                            )}
                            {filteredContacts.map((contact) => (
                                <div key={contact.id} onClick={() => startNewChat(contact)} className="p-3 hover:bg-accent cursor-pointer transition-colors flex items-center gap-3 bg-background">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border border-border">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block font-semibold text-sm truncate text-foreground">{contact.name}</span>
                                        <span className="block text-xs text-muted-foreground">{contact.phone}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. CHAT AREA */}
                {viewMode === 'chat' && (
                    <div className="relative flex flex-col min-h-full">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10 z-0" />
                        
                        <div className="relative z-10 flex-1 p-3 space-y-4">
                            {/* Tombol Load More */}
                            {hasMore && (
                                <div className="flex justify-center mb-2">
                                    <button 
                                        onClick={() => activeChat && loadMessages(activeChat, page + 1)}
                                        disabled={loading}
                                        className="bg-white border border-border text-xs px-3 py-1 rounded-full shadow-sm hover:bg-muted transition text-foreground"
                                    >
                                        {loading ? 'Memuat...' : 'Lihat pesan sebelumnya'}
                                    </button>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-lg p-2.5 text-sm shadow-sm border ${
                                        msg.is_admin 
                                            ? 'bg-slate-100 text-slate-800 border-slate-200 rounded-tr-none dark:bg-slate-800 dark:text-slate-100 dark:border-slate-700' 
                                            : 'bg-white text-gray-800 border-gray-200 rounded-tl-none dark:bg-zinc-900 dark:text-gray-100 dark:border-zinc-800'
                                    }`}>
                                        <div className="leading-relaxed break-words whitespace-pre-wrap">
                                            
                                            {/* Render Media Gambar */}
                                            {msg.message_type === 'image' && msg.media_url && (
                                                <img src={msg.media_url} alt="Photo" className="max-w-full rounded-md mb-2 object-cover max-h-60" />
                                            )}
                                            
                                            {/* Render Media Video */}
                                            {msg.message_type === 'video' && msg.media_url && (
                                                <video src={msg.media_url} controls className="max-w-full rounded-md mb-2 max-h-60" />
                                            )}

                                            {/* Render File/Dokumen */}
                                            {['document', 'file', 'audio', 'sticker'].includes(msg.message_type ?? '') && msg.media_url && (
                                                <a href={msg.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 bg-black/5 dark:bg-white/10 rounded-md mb-2 hover:bg-black/10 transition">
                                                    <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                    <span className="truncate text-xs font-semibold">{msg.file_name || 'Download Lampiran'}</span>
                                                </a>
                                            )}

                                            {/* Render Lokasi Maps */}
                                            {msg.message_type === 'location' && msg.latitude && (
                                                <a href={`https://maps.google.com/?q=${msg.latitude},${msg.longitude}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold mb-2 hover:underline">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                    Buka Google Maps
                                                </a>
                                            )}

                                            {/* Teks Chat */}
                                            {msg.text}
                                        </div>
                                        <div className="text-[10px] text-right mt-1.5 text-gray-400 dark:text-gray-500 font-medium">
                                            {msg.time}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Input */}
            {viewMode === 'chat' && (
                <div className="relative z-10 p-3 bg-background border-t border-border shrink-0">
                    {/* Preview file yang akan dikirim */}
                    {selectedFile && (
                        <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between text-xs">
                            <span className="truncate flex-1 font-medium">{selectedFile.name}</span>
                            <button onClick={() => setSelectedFile(null)} className="text-destructive hover:text-red-700 p-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                    )}

                    <form onSubmit={sendMessage} className="flex gap-2 items-center">
                        {/* Tombol Attachment */}
                        <button 
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors shrink-0"
                            title="Lampirkan File"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />

                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            disabled={isSending}
                            placeholder="Ketik pesan..."
                            className="flex-1 text-sm bg-muted text-foreground border border-transparent rounded-full focus:border-primary focus:ring-1 focus:ring-primary px-4 py-2.5 outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={(!newMessage.trim() && !selectedFile) || isSending}
                            className="bg-primary text-primary-foreground p-2.5 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                        >
                            <svg className="w-5 h-5 -rotate-45 ml-1 mb-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}