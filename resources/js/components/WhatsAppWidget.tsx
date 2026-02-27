import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

// --- Tipe Data Tetap ---
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
    const baseGowaUrl = 'https://gowa-iynqg2oa4rc5.waha.web.id';

    // State isOpen
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

    // Tambahan State khusus Pagination Chat List
    const [chatListPage, setChatListPage] = useState(1);
    const [hasMoreChats, setHasMoreChats] = useState(false);
    const [isListLoading, setIsListLoading] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatListContainerRef = useRef<HTMLDivElement>(null);

    // Logic Persistent: Desktop Auto-Open, Mobile Auto-Close
    useEffect(() => {
        const handleInitialState = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };
        handleInitialState();
        window.addEventListener('resize', handleInitialState);
        return () => window.removeEventListener('resize', handleInitialState);
    }, []);

    // 1. Fetch Daftar Chat dengan Search & Pagination
    const fetchChatList = async (pageNum: number = 1, isLoadMore: boolean = false) => {
        if (isListLoading) return;
        setIsListLoading(true);

        try {
            const response = await axios.get(`${basePath}/chats`, {
                params: {
                    search: searchQuery,
                    page: pageNum
                }
            }); 
            
            if (isLoadMore) {
                setChatList(prev => [...prev, ...(response.data.chats || [])]);
            } else {
                setChatList(response.data.chats || []);
            }
            
            setContactList(response.data.contacts || []);
            setHasMoreChats(response.data.pagination?.has_more || false);
            setChatListPage(pageNum);

        } catch (error) {
            console.error("Gagal memuat chat", error);
        } finally {
            setIsListLoading(false);
        }
    };

    // Auto refresh chat list (halaman 1 saja)
    useEffect(() => {
        fetchChatList(1, false);
        const interval = setInterval(() => {
            // Hanya refresh otomatis jika sedang tidak mengetik pencarian
            if (!searchQuery) {
                fetchChatList(1, false);
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, [searchQuery]);

    // Handle Infinite Scroll untuk Daftar Chat
    const handleChatListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (
            container.scrollHeight - container.scrollTop <= container.clientHeight + 50 &&
            hasMoreChats &&
            !isListLoading
        ) {
            fetchChatList(chatListPage + 1, true);
        }
    };

    // 2. Fetch Pesan dengan Pagination
    const loadMessages = async (chatId: number, pageNum: number = 1) => {
        // PERBAIKAN: Aktifkan loading jika halaman pertama
        if (pageNum === 1) {
            setLoading(true);
        }

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
        // PERBAIKAN: Bersihkan data lama agar tidak "stale"
        setMessages([]);
        setLoading(true);
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
            // PERBAIKAN: Bersihkan data lama
            setMessages([]);
            setActiveChat(null);
            setChatInfo({ name: contact.name, phone: contact.phone, isNew: true });
            setViewMode('chat');
            setHasMore(false);
            setLoading(false);
        }
    };

    // Scroll otomatis ke bawah
    useEffect(() => {
        if (page === 1 && !loading) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, viewMode, page, loading]);

    // 4. Kirim Pesan
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !chatInfo || isSending) return;

        setIsSending(true);
        const formData = new FormData();
        formData.append('phone_number', chatInfo.phone);
        if (newMessage.trim()) formData.append('message', newMessage);
        if (selectedFile) formData.append('file', selectedFile);

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
                loadMessages(activeChat, 1);
            }
            fetchChatList(1, false); 
        } catch (error) {
            alert('Gagal mengirim pesan');
        } finally {
            setIsSending(false);
        }
    };

    const filteredContacts = contactList.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone.includes(searchQuery)
    );

    const totalUnread = chatList.reduce((sum, item) => sum + item.unread_count, 0);

    // --- RENDER UI ---

    // Tombol Floating (Muncul saat Sidebar tertutup)
    if (!isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-2">
                <button 
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300 ease-in-out"
                >
                    {totalUnread > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white border-2 border-white animate-bounce">
                            {totalUnread > 99 ? '99+' : totalUnread}
                        </span>
                    )}
                    
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                </button>
            </div>
        );
    }

    return (
        /* Container Sidebar dengan Animasi Expand/Collapse */
        <div 
            className={`fixed lg:relative top-0 right-0 h-screen bg-background border-l border-border z-[50] flex flex-col transition-all duration-300 ease-in-out shadow-xl lg:shadow-none overflow-hidden
                ${isOpen ? 'w-full lg:w-[380px]' : 'w-0 lg:w-0 border-none'}`}
        >
            {/* Tombol Toggle Floating (Mendorong Sidebar) */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed z-[60] flex items-center justify-center bg-slate-300 text-slate-600 shadow-lg transition-all duration-300
                    ${isOpen 
                        ? 'lg:right-[380px] lg:top-1/2 lg:-translate-y-1/2 lg:w-5 lg:h-12 lg:rounded-l-lg lg:rounded-r-none' 
                        : 'hidden'}`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                </svg>
            </button>
            
            {/* Header - Ukuran Dikecilkan agar Sesuai Dashboard */}
            <div className="h-14 bg-background text-foreground border-b border-border px-3 flex justify-between items-center shrink-0 z-20">
                <h3 className="font-bold text-xs truncate pr-2 uppercase tracking-tight">
                    {viewMode === 'chat' ? chatInfo?.name : viewMode === 'new_chat' ? 'Pilih Kontak' : 'WhatsApp Chat'}
                </h3>
                <div className="flex gap-2 items-center">
                    {viewMode !== 'list' && (
                        <button 
                            onClick={() => { setViewMode('list'); setSearchQuery(''); }} 
                            className="text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase"
                        >
                            Kembali
                        </button>
                    )}
                    <button 
                        onClick={() => setIsOpen(false)} 
                        className="hover:bg-accent p-1 rounded-md transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Container Body - Independent Scroll */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
                
                {/* Loader Tengah (Jika sedang muat chat baru) */}
                {loading && messages.length === 0 && (
                    <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-[40] flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase animate-pulse">Memuat Chat...</span>
                    </div>
                )}

                {/* 1. LIST CHAT VIEW dengan Pencarian & Infinite Scroll */}
                {viewMode === 'list' && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-background">
                        {/* Area Pencarian di List View */}
                        <div className="p-2 border-b border-border bg-background shrink-0 sticky top-0 z-10">
                            <input 
                                type="text" 
                                placeholder="Cari percakapan..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full text-xs bg-muted border border-transparent rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                            />
                        </div>

                        <div 
                            ref={chatListContainerRef}
                            onScroll={handleChatListScroll}
                            className="flex-1 overflow-y-auto divide-y divide-border bg-background scrollbar-none"
                        >
                            <div className="p-2 sticky top-0 bg-background z-10">
                                <button 
                                    onClick={() => setViewMode('new_chat')} 
                                    className="w-full flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all text-xs font-bold shadow-sm"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                    </svg>
                                    CHAT BARU
                                </button>
                            </div>
                            
                            {chatList.map((chat) => (
                                <div 
                                    key={chat.id} 
                                    onClick={() => openChat(chat.id)} 
                                    className="p-3 hover:bg-accent/50 cursor-pointer transition-colors flex items-center gap-3 bg-background relative border-b border-muted"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-border text-sm shrink-0">
                                        {chat.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-bold text-xs truncate pr-2 text-foreground">{chat.name}</span>
                                            <span className="text-[9px] text-muted-foreground shrink-0">{chat.time_ago}</span>
                                        </div>
                                        <p className={`text-[11px] truncate ${chat.unread_count > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                            {chat.last_message}
                                        </p>
                                    </div>
                                    {chat.unread_count > 0 && (
                                        <div className="bg-green-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1 shrink-0 shadow-sm">
                                            {chat.unread_count}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Loader Bawah saat Pagination List */}
                            {isListLoading && chatListPage > 1 && (
                                <div className="p-4 text-center">
                                    <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. DAFTAR KONTAK VIEW */}
                {viewMode === 'new_chat' && (
                    <div className="flex-1 flex flex-col overflow-hidden bg-background">
                        <div className="p-2 border-b border-border bg-background shrink-0 sticky top-0 z-10">
                            <input 
                                type="text" 
                                placeholder="Cari kontak..." 
                                value={searchQuery} 
                                onChange={(e) => setSearchQuery(e.target.value)} 
                                className="w-full text-xs bg-muted border border-transparent rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary transition-all shadow-inner" 
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-border scrollbar-none">
                            {filteredContacts.map((contact) => (
                                <div 
                                    key={contact.id} 
                                    onClick={() => startNewChat(contact)} 
                                    className="p-2.5 hover:bg-accent cursor-pointer transition-colors flex items-center gap-3 bg-background"
                                >
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border border-border text-xs">
                                        {contact.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block font-bold text-xs truncate text-foreground">{contact.name}</span>
                                        <span className="block text-[10px] text-muted-foreground">{contact.phone}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. CHAT VIEW */}
                {viewMode === 'chat' && (
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 z-0" />
                        
                        <div className="flex-1 overflow-y-auto p-3 space-y-4 relative z-10 scrollbar-none">
                            {hasMore && (
                                <div className="flex justify-center mb-2">
                                    <button 
                                        onClick={() => activeChat && loadMessages(activeChat, page + 1)} 
                                        disabled={loading} 
                                        className="bg-white border border-border text-[9px] font-bold px-2 py-1 rounded-full shadow-sm hover:bg-muted transition text-foreground uppercase tracking-tighter"
                                    >
                                        {loading ? '...' : 'Lihat pesan lama'}
                                    </button>
                                </div>
                            )}

                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-xl p-1 shadow-sm border ${
                                        msg.is_admin 
                                            ? 'bg-slate-100 text-slate-800 border-slate-200 rounded-tr-none' 
                                            : 'bg-white text-gray-800 border-gray-200 rounded-tl-none'
                                    }`}>
                                        
                                        {/* --- PERTAHANKAN KODE RENDER MEDIA --- */}
                                        <div className="overflow-hidden rounded-lg">
                                            {/* Render Gambar */}
                                            {msg.message_type === 'image' && msg.media_url && (
                                                <div className="relative group">
                                                    <img 
                                                        src={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} 
                                                        alt="WhatsApp Image" 
                                                        className="max-w-full h-auto object-cover cursor-zoom-in hover:brightness-90 transition-all rounded-md min-w-[150px]" 
                                                        onClick={() => window.open(msg.media_url || '', '_blank')} 
                                                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300?text=Gambar+Tidak+Tersedia'; }} 
                                                    />
                                                </div>
                                            )}
                                            
                                            {/* Render Video */}
                                            {msg.message_type === 'video' && msg.media_url && (
                                                <video 
                                                    src={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} 
                                                    controls 
                                                    className="max-w-full rounded-md max-h-60 bg-black" 
                                                />
                                            )}

                                            {/* Render Dokumen/PDF */}
                                            {msg.message_type === 'document' && msg.media_url && (
                                                <a 
                                                    href={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} 
                                                    target="_blank" 
                                                    rel="noreferrer" 
                                                    className="flex items-center gap-2 p-2 bg-slate-50 rounded-md m-0.5 border border-dashed border-slate-300 hover:bg-slate-100 transition"
                                                >
                                                    <div className="bg-red-100 p-1.5 rounded-md text-red-600">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[10px] font-bold truncate text-slate-700">{msg.file_name || 'Dokumen'}</span>
                                                        <span className="text-[8px] text-slate-400 uppercase font-semibold">Lihat</span>
                                                    </div>
                                                </a>
                                            )}
                                        </div>

                                        {(msg.text && msg.text !== '[image]' && msg.text !== '[document]') && (
                                            <div className="px-2 py-1.5 leading-snug break-words whitespace-pre-wrap text-xs">
                                                {msg.text}
                                            </div>
                                        )}

                                        <div className="px-2 pb-0.5 flex justify-end items-center gap-1">
                                            <span className="text-[8px] text-slate-400 font-medium">{msg.time}</span>
                                            {msg.is_admin && (
                                                <svg className="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z" />
                                                </svg>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-2.5 bg-background border-t border-border shrink-0 z-20">
                            {selectedFile && (
                                <div className="mb-1.5 p-1.5 bg-muted rounded-md flex items-center justify-between text-[10px]">
                                    <span className="truncate flex-1 italic font-medium">{selectedFile.name}</span>
                                    <button onClick={() => setSelectedFile(null)} className="text-destructive p-0.5">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                            <form onSubmit={sendMessage} className="flex gap-2 items-center">
                                <button 
                                    type="button" 
                                    onClick={() => fileInputRef.current?.click()} 
                                    className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors shrink-0"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                    </svg>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                <input 
                                    type="text" 
                                    value={newMessage} 
                                    onChange={(e) => setNewMessage(e.target.value)} 
                                    disabled={isSending} 
                                    placeholder="Ketik pesan..." 
                                    className="flex-1 text-xs bg-muted border border-transparent rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary shadow-inner" 
                                />
                                <button 
                                    type="submit" 
                                    disabled={(!newMessage.trim() && !selectedFile) || isSending} 
                                    className="bg-primary text-primary-foreground p-1.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0 shadow-sm"
                                >
                                    <svg className="w-4 h-4 -rotate-45 ml-0.5 mb-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}