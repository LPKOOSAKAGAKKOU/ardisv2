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
    is_group?: boolean | number; // ✅ TAMBAHAN: Deteksi Grup
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
    message_type?: string;
    media_url?: string;
    file_name?: string;
    latitude?: string;
    longitude?: string;
    sender_name?: string; // ✅ TAMBAHAN: Nama pengirim di dalam grup
}

// --- Komponen Window Chat Terpisah (Khusus Desktop) ---
function ChatWindow({ 
    chatId, 
    info, 
    onClose, 
    basePath, 
    baseGowaUrl 
}: { 
    chatId: number; 
    info: any; 
    onClose: () => void; 
    basePath: string;
    baseGowaUrl: string;
}) {
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const loadMessages = async (pageNum: number = 1) => {
        if (pageNum === 1) setLoading(true);

        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages?page=${pageNum}`);
            
            if (pageNum === 1) {
                setMessages(response.data.messages);
            } else {
                setMessages(prev => [...response.data.messages, ...prev]);
            }
            
            setHasMore(response.data.pagination.has_more);
            setPage(pageNum);
            
        } catch (error) {
            console.error("Gagal memuat pesan di window", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FITUR BARU: Polling Pesan Secara Siluman (Tanpa Loading)
    const pollMessages = async () => {
        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages?page=1`);
            const newFetchedMessages = response.data.messages;

            setMessages(prev => {
                if (prev.length === 0) return newFetchedMessages;
                
                // Cari pesan yang benar-benar baru berdasarkan ID
                const existingIds = new Set(prev.map(m => m.id));
                const trulyNewMessages = newFetchedMessages.filter((m: MessageItem) => !existingIds.has(m.id));
                
                // Jika ada pesan baru, gabungkan di posisi paling bawah
                if (trulyNewMessages.length > 0) {
                    return [...prev, ...trulyNewMessages];
                }
                return prev;
            });
        } catch (error) {
            console.error("Gagal polling pesan di desktop", error);
        }
    };

    // Trigger Load awal
    useEffect(() => {
        loadMessages(1);
    }, [chatId]);

    // ✅ FITUR BARU: Interval Polling setiap 3 Detik untuk Desktop
    useEffect(() => {
        const interval = setInterval(() => {
            pollMessages();
        }, 3000);

        return () => clearInterval(interval);
    }, [chatId]);

    useEffect(() => {
        if (page === 1) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, page]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || isSending) return;

        setIsSending(true);
        const formData = new FormData();
        formData.append('phone_number', info.phone);
        if (newMessage.trim()) formData.append('message', newMessage);
        if (selectedFile) formData.append('file', selectedFile);
        
        try {
            await axios.post(`${basePath}/send`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setNewMessage('');
            setSelectedFile(null);
            loadMessages(1);
            
        } catch (error) {
            alert('Gagal mengirim');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-80 h-[450px] bg-background border border-border shadow-2xl rounded-t-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 relative">
            
            <div className="p-3 bg-background border-b border-border flex gap-2 items-center shrink-0 relative z-30">
                {/* Ikon Grup di Header Desktop */}
                {info.is_group ? (
                    <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                ) : null}
                <span className="font-bold text-[11px] truncate uppercase tracking-tight text-foreground flex-1">
                    {info.name}
                </span>
                <button 
                    onClick={onClose} 
                    className="hover:bg-accent p-1 rounded-md transition-colors text-muted-foreground"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 relative flex flex-col min-h-0 bg-background">
                
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5" />
                </div>
                
                <div className="relative z-10 flex-1">
                    
                    {hasMore && (
                        <div className="flex justify-center mb-2">
                            <button 
                                onClick={() => loadMessages(page + 1)}
                                className="text-[9px] font-bold py-1 px-3 bg-white border border-border rounded-full shadow-sm hover:bg-muted transition-colors uppercase text-muted-foreground"
                            >
                                {loading ? '...' : 'Lihat Pesan Lama'}
                            </button>
                        </div>
                    )}

                    {loading && page === 1 ? (
                        <div className="flex justify-center items-center h-32 text-[10px] uppercase font-bold animate-pulse text-muted-foreground">
                            Memuat...
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`flex mb-3 ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] rounded-lg p-2 shadow-sm border text-[11px] ${
                                    msg.is_admin ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white border-gray-200 text-gray-800'
                                }`}>
                                    
                                    {/* ✅ TAMPILKAN NAMA PENGIRIM DI DALAM GRUP */}
                                    {!msg.is_admin && info.is_group && (
                                        <span className="text-[9px] font-bold text-[#25D366] block mb-1 truncate">
                                            ~ {msg.sender_name || 'Anggota'}
                                        </span>
                                    )}

                                    {msg.message_type === 'image' && msg.media_url && (
                                        <img 
                                            src={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} 
                                            className="rounded mb-1 max-h-32 w-full object-cover cursor-pointer"
                                            onClick={() => window.open(`${baseGowaUrl}/${msg.media_url}`, '_blank')}
                                        />
                                    )}

                                    {msg.text && !['[image]', '[document]'].includes(msg.text) && (
                                        <p className="break-words leading-relaxed">{msg.text}</p>
                                    )}
                                    
                                    <div className="text-[8px] text-right opacity-50 mt-1 font-medium">
                                        {msg.time}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <form onSubmit={handleSend} className="p-2 border-t border-border bg-background shrink-0 relative z-30">
                
                {selectedFile && (
                    <div className="mb-1.5 p-1 px-2 bg-muted rounded text-[9px] flex justify-between items-center italic">
                        <span className="truncate">{selectedFile.name}</span>
                        <button type="button" onClick={() => setSelectedFile(null)} className="text-destructive">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()} 
                        className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"
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
                        className="flex-1 bg-muted border-none rounded-md px-2 py-1.5 text-[11px] outline-none focus:ring-1 focus:ring-primary shadow-inner text-foreground" 
                        placeholder="Ketik..." 
                    />
                    
                    <button 
                        type="submit" 
                        disabled={(!newMessage.trim() && !selectedFile) || isSending}
                        className="bg-primary text-primary-foreground p-1.5 rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-sm flex items-center justify-center"
                    >
                        <svg className="w-4 h-4 -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
}

export default function WhatsAppWidget() {
    const { auth } = usePage().props as any; 
    const userRole = auth?.user?.role || 'admin'; 
    const basePath = `/${userRole}/whatsapp`; 
    const baseGowaUrl = 'https://gowa-iynqg2oa4rc5.waha.web.id';

    // ✅ FIX 1: State reaktif untuk deteksi mobile/desktop
    const [isMobile, setIsMobile] = useState(() => 
        typeof window !== 'undefined' ? window.innerWidth < 1024 : false
    );

    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'chat' | 'new_chat'>('list');
    
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [contactList, setContactList] = useState<ContactItem[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    
    const [activeChat, setActiveChat] = useState<number | null>(null);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const [openWindows, setOpenWindows] = useState<{id: number, info: any}[]>([]);

    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    const [chatListPage, setChatListPage] = useState(1);
    const [hasMoreChats, setHasMoreChats] = useState(false);
    const [isListLoading, setIsListLoading] = useState(false);
    const [contactPage, setContactPage] = useState(1);
    const [hasMoreContacts, setHasMoreContacts] = useState(false);
    const [isContactLoading, setIsContactLoading] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ✅ FIX 2: Pisahkan resize handler — HANYA update isMobile & isOpen
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) {
                setIsOpen(true);
            }
        };

        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 1. Fetch Daftar Chat
    const fetchChatList = async (pageNum: number = 1, isLoadMore: boolean = false) => {
        if (isListLoading && pageNum > 1) return;
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

    useEffect(() => {
        fetchChatList(1, false);
        const interval = setInterval(() => {
            if (!searchQuery) {
                fetchChatList(1, false);
            }
        }, 5000); 
        return () => clearInterval(interval);
    }, [searchQuery]);

    useEffect(() => {
        if (viewMode === 'new_chat') {
            fetchContacts(1, false);
        }
    }, [viewMode, searchQuery]);

    // ✅ FIX 3: Infinite scroll
    const handleChatListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (
            container.scrollHeight - container.scrollTop <= container.clientHeight + 80 &&
            hasMoreChats &&
            !isListLoading
        ) {
            fetchChatList(chatListPage + 1, true);
        }
    };

    const fetchContacts = async (pageNum: number = 1, isLoadMore: boolean = false) => {
        if (isContactLoading && pageNum > 1) return;
        setIsContactLoading(true);
        try {
            const response = await axios.get(`${basePath}/chats`, {
                params: { search: searchQuery, page: pageNum, contacts_only: 1 }
            });
            const contacts = response.data.contacts || [];
            if (isLoadMore) {
                setContactList(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    return [...prev, ...contacts.filter((c: ContactItem) => !existingIds.has(c.id))];
                });
            } else {
                setContactList(contacts);
            }
            setHasMoreContacts(response.data.pagination?.has_more_contacts || contacts.length >= 20);
            setContactPage(pageNum);
        } catch (error) {
            console.error("Gagal memuat kontak", error);
        } finally {
            setIsContactLoading(false);
        }
    };

    const handleContactScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (
            container.scrollHeight - container.scrollTop <= container.clientHeight + 80 &&
            hasMoreContacts &&
            !isContactLoading
        ) {
            fetchContacts(contactPage + 1, true);
        }
    };

    // 2. Fetch Pesan Mobile
    const loadMessages = async (chatId: number, pageNum: number = 1) => {
        if (pageNum === 1) setLoading(true);

        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages?page=${pageNum}`);
            
            if (pageNum === 1) {
                setMessages(response.data.messages);
            } else {
                setMessages(prev => [...response.data.messages, ...prev]);
            }
            
            setChatInfo(response.data.chat_info);
            setHasMore(response.data.pagination.has_more);
            setPage(pageNum);
            
            setChatList(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
        } catch (error) {
            console.error("Error load messages", error);
        } finally {
            setLoading(false);
        }
    };

    // ✅ FITUR BARU: Polling Pesan Secara Siluman untuk Mobile
    const pollMobileMessages = async () => {
        if (!activeChat || viewMode !== 'chat') return;
        try {
            const response = await axios.get(`${basePath}/chats/${activeChat}/messages?page=1`);
            const newFetchedMessages = response.data.messages;

            setMessages(prev => {
                if (prev.length === 0) return newFetchedMessages;
                
                const existingIds = new Set(prev.map(m => m.id));
                const trulyNewMessages = newFetchedMessages.filter((m: MessageItem) => !existingIds.has(m.id));
                
                if (trulyNewMessages.length > 0) {
                    return [...prev, ...trulyNewMessages];
                }
                return prev;
            });
            
            // Hapus unread count jika menerima pesan saat room sedang dibuka
            setChatList(prevChats => prevChats.map(c => c.id === activeChat ? { ...c, unread_count: 0 } : c));
        } catch (error) {
            console.error("Gagal polling pesan di mobile", error);
        }
    };

    // Interval Polling setiap 3 Detik untuk Mobile
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeChat && viewMode === 'chat' && isMobile) {
            interval = setInterval(() => {
                pollMobileMessages();
            }, 3000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeChat, viewMode, isMobile]);

    // ✅ FIX 4: openChat pakai isMobile state
    const openChat = (chatId: number) => {
        const selected = chatList.find(c => c.id === chatId);
        if (!selected) return;

        if (!isMobile) {
            setOpenWindows(prev => {
                if (prev.find(w => w.id === chatId)) return prev;
                return [{ id: chatId, info: selected }, ...prev].slice(0, 2);
            });
        } else {
            setMessages([]);
            setLoading(true);
            setActiveChat(chatId);
            setChatInfo(selected);
            setViewMode('chat');
            loadMessages(chatId, 1);
        }
    };

    // ✅ FIX 5: startNewChat pakai isMobile state
    const startNewChat = (contact: ContactItem) => {
        const existingChat = chatList.find(c => c.phone === contact.phone);
        
        if (existingChat) {
            openChat(existingChat.id);
        } else {
            const info = { name: contact.name, phone: contact.phone, isNew: true };
            
            if (!isMobile) {
                setOpenWindows(prev => [{ id: Math.random(), info }, ...prev].slice(0, 2));
            } else {
                setMessages([]);
                setActiveChat(null);
                setChatInfo(info);
                setViewMode('chat');
                setHasMore(false);
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        if (page === 1 && !loading && isMobile) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, viewMode, page, loading, isMobile]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !chatInfo || isSending) return;

        setIsSending(true);
        const formData = new FormData();
        formData.append('phone_number', chatInfo.phone);
        if (newMessage.trim()) formData.append('message', newMessage);
        if (selectedFile) formData.append('file', selectedFile);

        try {
            await axios.post(`${basePath}/send`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            setNewMessage('');
            setSelectedFile(null);

            if (activeChat) {
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

    // ✅ LOGIKA SORTING CHAT LIST (Grup selalu di atas)
    const sortedChatList = [...chatList].sort((a, b) => {
        const aGroup = a.is_group ? 1 : 0;
        const bGroup = b.is_group ? 1 : 0;
        return bGroup - aGroup; // Grup (1) berada di atas Personal (0)
    });

    return (
        <>
            {/* --- AREA JENDELA CHAT DESKTOP --- */}
            <div className="hidden lg:flex fixed bottom-0 right-[390px] z-[100] gap-4 items-end pointer-events-none pr-4">
                {openWindows.map((win) => (
                    <div key={win.id} className="pointer-events-auto">
                        <ChatWindow 
                            chatId={win.id} 
                            info={win.info} 
                            basePath={basePath} 
                            baseGowaUrl={baseGowaUrl}
                            onClose={() => setOpenWindows(prev => prev.filter(w => w.id !== win.id))} 
                        />
                    </div>
                ))}
            </div>

            <div className="flex flex-col h-full relative">
                
                {/* FLOATING TRIGGER MOBILE */}
                {!isOpen && (
                    <div className="fixed bottom-6 right-6 z-[999] lg:hidden">
                        <button 
                            onClick={() => setIsOpen(true)} 
                            className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-all active:scale-95"
                        >
                            {totalUnread > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold border-2 border-white text-white">
                                    {totalUnread > 99 ? '99+' : totalUnread}
                                </span>
                            )}
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* TOMBOL TOGGLE DESKTOP — di luar sidebar agar selalu visible */}
                <button 
                    onClick={() => setIsOpen(!isOpen)} 
                    className={`fixed z-[1001] hidden lg:flex items-center justify-center bg-slate-300 hover:bg-slate-400 text-slate-600 shadow-lg transition-all duration-300 pointer-events-auto top-1/2 -translate-y-1/2 w-5 h-12 rounded-l-lg
                        ${isOpen ? 'right-[380px]' : 'right-0'}`}
                >
                    <svg 
                        className={`w-4 h-4 transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* SIDEBAR UTAMA */}
                <div 
                    style={{ height: '100dvh' }}
                    className={`fixed lg:relative top-0 right-0 bg-background border-l border-border z-[1000] flex flex-col transition-all duration-300 ease-in-out shadow-xl lg:shadow-none lg:h-full
                        ${isOpen ? 'w-full lg:w-[380px]' : 'w-0 border-none pointer-events-none lg:pointer-events-auto'}`}
                >

                    {/* Header — selalu tampil */}
                    <div className="h-14 bg-background border-b border-border px-3 flex justify-between items-center shrink-0 z-30">
                        <div className="flex items-center gap-2 overflow-hidden pr-2">
                            {/* Ikon Grup di Header Mobile View */}
                            {viewMode === 'chat' && isMobile && chatInfo?.is_group && (
                                <div className="w-6 h-6 bg-slate-200 text-slate-600 rounded-full flex items-center justify-center shrink-0">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </div>
                            )}
                            <h3 className="font-bold text-xs truncate uppercase tracking-widest text-muted-foreground">
                                {viewMode === 'chat' && isMobile ? chatInfo?.name : 'WhatsApp Chat'}
                            </h3>
                        </div>
                        <button 
                            onClick={() => {
                                if (viewMode === 'chat' && isMobile) {
                                    setViewMode('list');
                                } else if (viewMode === 'new_chat') {
                                    setViewMode('list');
                                } else {
                                    setIsOpen(false);
                                }
                            }} 
                            className="hover:bg-accent p-1 rounded-md transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {(viewMode === 'chat' || viewMode === 'new_chat') && isMobile ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                )}
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 min-h-0 bg-background relative">

                        {/* 1. LIST CHAT VIEW */}
                        <div className={`absolute inset-0 flex flex-col ${
                            (viewMode === 'list' || (!isMobile && viewMode !== 'new_chat')) ? 'z-10 pointer-events-auto' : 'z-0 pointer-events-none opacity-0'
                        }`}>
                            <div className="p-2 border-b border-border bg-background shrink-0">
                                <input 
                                    type="text" 
                                    placeholder="Cari percakapan..." 
                                    value={searchQuery} 
                                    onChange={(e) => setSearchQuery(e.target.value)} 
                                    className="w-full text-xs bg-muted border-none rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary shadow-inner text-foreground" 
                                />
                            </div>
                            <div 
                                onScroll={handleChatListScroll} 
                                className="flex-1 min-h-0 overflow-y-auto divide-y divide-border bg-background scrollbar-none touch-pan-y"
                            >
                                <div className="p-2 bg-background">
                                    <button 
                                        onClick={() => setViewMode('new_chat')} 
                                        className="w-full flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all text-xs font-bold shadow-sm"
                                    >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" />
                                        </svg>
                                        CHAT BARU
                                    </button>
                                </div>
                                {/* ✅ RENDER DARI sortedChatList (Bukan chatList langsung) */}
                                {sortedChatList.map((chat) => (
                                    <div 
                                        key={chat.id} 
                                        onClick={() => openChat(chat.id)} 
                                        className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors flex items-center gap-3 border-b border-muted 
                                            ${openWindows.find(w => w.id === chat.id) ? 'bg-accent/40 ring-1 ring-inset ring-primary/20' : ''}`}
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-border text-sm shrink-0">
                                            {/* ✅ Ikon Khusus jika itu adalah Grup */}
                                            {chat.is_group ? (
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            ) : (
                                                chat.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 pointer-events-none">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-bold text-xs truncate text-foreground">{chat.name}</span>
                                                <span className="text-[9px] text-muted-foreground">{chat.time_ago}</span>
                                            </div>
                                            <p className={`text-[11px] truncate ${chat.unread_count > 0 ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                                                {chat.last_message}
                                            </p>
                                        </div>
                                        {chat.unread_count > 0 && (
                                            <div className="bg-green-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                                                {chat.unread_count}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {isListLoading && (
                                    <div className="p-4 text-center">
                                        <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. DAFTAR KONTAK VIEW */}
                        {viewMode === 'new_chat' && (
                            <div className="absolute inset-0 z-20 flex flex-col bg-background">
                                <div className="p-2 border-b border-border shrink-0 flex items-center gap-2 bg-background">
                                    <button onClick={() => setViewMode('list')} className="text-[10px] font-bold uppercase p-1 hover:bg-accent rounded shrink-0">Kembali</button>
                                    <input 
                                        type="text" 
                                        placeholder="Cari kontak..." 
                                        value={searchQuery} 
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setContactPage(1);
                                            setContactList([]);
                                        }} 
                                        className="flex-1 text-xs bg-muted border-none rounded-lg px-3 py-1.5 outline-none shadow-inner text-foreground" 
                                    />
                                </div>
                                <div 
                                    onScroll={handleContactScroll}
                                    className="flex-1 min-h-0 overflow-y-auto divide-y divide-border scrollbar-none touch-pan-y"
                                >
                                    {filteredContacts.map((contact) => (
                                        <div 
                                            key={contact.id} 
                                            onClick={() => startNewChat(contact)} 
                                            className="p-2.5 hover:bg-accent cursor-pointer flex items-center gap-3 bg-background"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border border-border text-xs">
                                                {contact.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0 pointer-events-none">
                                                <span className="block font-bold text-xs truncate text-foreground">{contact.name}</span>
                                                <span className="block text-[10px] text-muted-foreground">{contact.phone}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {isContactLoading && (
                                        <div className="p-4 text-center">
                                            <div className="inline-block w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    )}
                                    {!isContactLoading && filteredContacts.length === 0 && (
                                        <div className="p-6 text-center text-[11px] text-muted-foreground">
                                            Tidak ada kontak ditemukan
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 3. MOBILE CHAT VIEW */}
                        {viewMode === 'chat' && isMobile && (
                            <div className="absolute inset-0 z-20 flex flex-col bg-background">
                                
                                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5" />
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-4 relative z-10 scrollbar-none">
                                    
                                    {hasMore && (
                                        <div className="flex justify-center mb-2">
                                            <button 
                                                onClick={() => loadMessages(activeChat!, page + 1)} 
                                                className="text-[9px] font-bold py-1 px-3 bg-white border border-border rounded-full shadow-sm hover:bg-muted transition text-foreground uppercase tracking-widest"
                                            >
                                                {loading ? '...' : 'Lihat pesan lama'}
                                            </button>
                                        </div>
                                    )}

                                    {loading && page === 1 ? (
                                        <div className="text-center text-xs animate-pulse font-bold mt-10 uppercase text-muted-foreground tracking-widest">Memuat Chat...</div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[85%] rounded-xl p-2 shadow-sm border text-xs ${
                                                    msg.is_admin ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-white border-gray-200 text-gray-800'
                                                }`}>
                                                    
                                                    {/* ✅ TAMPILKAN NAMA PENGIRIM DI DALAM GRUP (MOBILE) */}
                                                    {!msg.is_admin && chatInfo?.is_group && (
                                                        <span className="text-[10px] font-bold text-[#25D366] block mb-1 truncate">
                                                            ~ {msg.sender_name || 'Anggota'}
                                                        </span>
                                                    )}

                                                    {msg.message_type === 'image' && msg.media_url && (
                                                        <img 
                                                            src={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} 
                                                            className="rounded mb-1 max-h-60 object-cover" 
                                                            onClick={() => window.open(msg.media_url, '_blank')} 
                                                        />
                                                    )}
                                                    {msg.text && !['[image]', '[document]'].includes(msg.text) && (
                                                        <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                                    )}
                                                    <div className="text-[8px] text-right mt-1 opacity-50 font-medium">{msg.time}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form 
                                    onSubmit={sendMessage} 
                                    className="shrink-0 p-3 bg-background border-t border-border relative z-20"
                                >
                                    {selectedFile && (
                                        <div className="mb-2 p-1 px-2 bg-muted rounded text-[9px] flex justify-between items-center italic">
                                            <span className="truncate">{selectedFile.name}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setSelectedFile(null)} 
                                                className="text-destructive ml-2 shrink-0"
                                            >✕</button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="shrink-0 p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
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
                                            className="flex-1 min-w-0 text-xs bg-muted border-none rounded-lg px-3 py-2 outline-none shadow-inner text-foreground focus:ring-1 focus:ring-primary" 
                                            placeholder="Ketik pesan..." 
                                            style={{ fontSize: '16px' }}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={(!newMessage.trim() && !selectedFile) || isSending}
                                            className="shrink-0 bg-primary text-primary-foreground p-2 rounded-lg shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                                        >
                                            <svg className="w-4 h-4 -rotate-45" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                            </svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </>
    );
}