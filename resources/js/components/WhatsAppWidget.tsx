import { useState, useEffect, useRef, useMemo } from 'react';
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
    is_group?: number;
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
    full_date?: string;
    is_admin: boolean;
    sender_name?: string;   // ✅ Tambahan: nama pengirim (untuk grup)
    message_type?: string;
    media_url?: string;
    file_name?: string;
    mime_type?: string;
    latitude?: string;
    longitude?: string;
}

// ─── Helper: Warna unik per nama pengirim ───────────────────────────────────
const SENDER_COLORS = [
    '#E53E3E', '#DD6B20', '#D69E2E', '#38A169',
    '#319795', '#3182CE', '#805AD5', '#D53F8C',
    '#00B5D8', '#2F855A',
];

function getSenderColor(name: string): string {
    if (!name) return SENDER_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return SENDER_COLORS[Math.abs(hash) % SENDER_COLORS.length];
}

// ─── Helper: Kelompokkan pesan berdasarkan tanggal ───────────────────────────
function groupMessagesByDate(messages: MessageItem[]): { date: string; messages: MessageItem[] }[] {
    const groups: Record<string, MessageItem[]> = {};
    messages.forEach(msg => {
        const key = msg.full_date ?? 'Hari ini';
        if (!groups[key]) groups[key] = [];
        groups[key].push(msg);
    });
    return Object.entries(groups).map(([date, messages]) => ({ date, messages }));
}

// ─── Komponen: Bubble Pesan ──────────────────────────────────────────────────
function MessageBubble({
    msg,
    isGroup,
    baseGowaUrl,
    showSenderName,
}: {
    msg: MessageItem;
    isGroup: boolean;
    baseGowaUrl: string;
    showSenderName: boolean; // true jika pengirim berbeda dari pesan sebelumnya
}) {
    const senderColor = useMemo(() => getSenderColor(msg.sender_name ?? ''), [msg.sender_name]);

    return (
        <div className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'} mb-1`}>
            {/* Avatar inbound untuk grup */}
            {!msg.is_admin && isGroup && (
                <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold mr-2 mt-auto shrink-0 border border-white shadow-sm"
                    style={{ backgroundColor: senderColor }}
                >
                    {(msg.sender_name ?? '?').charAt(0).toUpperCase()}
                </div>
            )}

            <div className={`max-w-[85%] flex flex-col ${msg.is_admin ? 'items-end' : 'items-start'}`}>
                {/* Nama pengirim — hanya inbound & grup & saat ganti pengirim */}
                {!msg.is_admin && isGroup && showSenderName && msg.sender_name && (
                    <span
                        className="text-[10px] font-bold mb-0.5 ml-1 tracking-tight"
                        style={{ color: senderColor }}
                    >
                        {msg.sender_name}
                    </span>
                )}

                <div className={`rounded-xl p-2 shadow-sm border text-xs leading-relaxed ${
                    msg.is_admin
                        ? 'bg-slate-100 border-slate-200 text-slate-800 rounded-tr-sm'
                        : 'bg-white border-gray-200 text-gray-800 rounded-tl-sm'
                }`}>
                    {/* Gambar */}
                    {msg.message_type === 'image' && msg.media_url && (
                        <img
                            src={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`}
                            className="rounded-lg mb-1 max-h-60 object-cover cursor-pointer w-full"
                            onClick={() => window.open(msg.media_url, '_blank')}
                            alt="media"
                        />
                    )}

                    {/* Dokumen */}
                    {msg.message_type === 'document' && msg.media_url && (
                        <a
                            href={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 p-2 bg-muted rounded-lg mb-1 hover:opacity-80 transition"
                        >
                            <svg className="w-5 h-5 shrink-0 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <span className="text-[10px] truncate font-medium">{msg.file_name ?? 'Dokumen'}</span>
                        </a>
                    )}

                    {/* Lokasi */}
                    {msg.message_type === 'location' && msg.latitude && msg.longitude && (
                        <a
                            href={`https://maps.google.com/?q=${msg.latitude},${msg.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-blue-600 mb-1 hover:underline"
                        >
                            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[10px]">Lihat Lokasi</span>
                        </a>
                    )}

                    {/* Teks */}
                    {msg.text && !['[IMAGE]', '[DOCUMENT]', '[VIDEO]', '[AUDIO]'].includes(msg.text.toUpperCase()) && (
                        <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                    )}

                    <div className="text-[8px] text-right mt-1 opacity-40 font-medium">{msg.time}</div>
                </div>
            </div>
        </div>
    );
}

// ─── Komponen: Daftar Pesan (dipakai di mobile & window desktop) ─────────────
function MessageList({
    messages,
    loading,
    page,
    hasMore,
    isGroup,
    baseGowaUrl,
    onLoadMore,
    messagesEndRef,
}: {
    messages: MessageItem[];
    loading: boolean;
    page: number;
    hasMore: boolean;
    isGroup: boolean;
    baseGowaUrl: string;
    onLoadMore: () => void;
    messagesEndRef: React.RefObject<HTMLDivElement>;
}) {
    const grouped = useMemo(() => groupMessagesByDate(messages), [messages]);

    return (
        <>
            {hasMore && (
                <div className="flex justify-center mb-3">
                    <button
                        onClick={onLoadMore}
                        className="text-[9px] font-bold py-1 px-4 bg-white border border-border rounded-full shadow-sm hover:bg-muted transition text-muted-foreground uppercase tracking-widest"
                    >
                        {loading ? '...' : 'Pesan Lama'}
                    </button>
                </div>
            )}

            {loading && page === 1 ? (
                <div className="flex justify-center items-center h-32 text-[10px] uppercase font-bold animate-pulse text-muted-foreground">
                    Memuat...
                </div>
            ) : (
                grouped.map(({ date, messages: dayMsgs }) => (
                    <div key={date}>
                        {/* Divider Tanggal */}
                        <div className="flex items-center gap-2 my-3">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest bg-background px-2 rounded-full border border-border py-0.5">
                                {date}
                            </span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {dayMsgs.map((msg, idx) => {
                            const prevMsg = idx > 0 ? dayMsgs[idx - 1] : null;
                            const showSenderName = !prevMsg || prevMsg.sender_name !== msg.sender_name || prevMsg.is_admin !== msg.is_admin;
                            return (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    isGroup={isGroup}
                                    baseGowaUrl={baseGowaUrl}
                                    showSenderName={showSenderName}
                                />
                            );
                        })}
                    </div>
                ))
            )}
            <div ref={messagesEndRef} />
        </>
    );
}

// ─── Komponen: Badge Grup ────────────────────────────────────────────────────
function GroupBadge() {
    return (
        <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 ml-1">
            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
            </svg>
            Grup
        </span>
    );
}

// ─── Komponen: ChatWindow (Desktop) ─────────────────────────────────────────
function ChatWindow({
    chatId,
    info,
    onClose,
    basePath,
    baseGowaUrl,
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
    const [isGroup, setIsGroup] = useState<boolean>(info?.is_group === 1);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Simpan ID pesan terakhir untuk deteksi pesan baru tanpa flicker
    const lastMsgIdRef = useRef<number | null>(null);

    const loadMessages = async (pageNum: number = 1, silent: boolean = false) => {
        if (pageNum === 1 && !silent) setLoading(true);
        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages?page=${pageNum}`);
            const incoming: MessageItem[] = response.data.messages;

            if (pageNum === 1) {
                // Silent poll: hanya update jika ada pesan baru (cek ID terakhir)
                const newestId = incoming.length > 0 ? incoming[incoming.length - 1].id : null;
                if (silent && newestId === lastMsgIdRef.current) return; // Tidak ada perubahan

                lastMsgIdRef.current = newestId;
                setMessages(incoming);
            } else {
                setMessages(prev => [...incoming, ...prev]);
            }
            setIsGroup(response.data.chat_info?.is_group === 1);
            setHasMore(response.data.pagination.has_more);
            setPage(pageNum);
        } catch (error) {
            console.error('Gagal memuat pesan di window', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Load awal
    useEffect(() => { loadMessages(1); }, [chatId]);

    // Polling setiap 4 detik — silent agar tidak flicker
    useEffect(() => {
        const interval = setInterval(() => loadMessages(1, true), 4000);
        return () => clearInterval(interval);
    }, [chatId]);

    useEffect(() => {
        if (page === 1) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
            await axios.post(`${basePath}/send`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setNewMessage('');
            setSelectedFile(null);
            loadMessages(1);
        } catch {
            alert('Gagal mengirim');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-80 h-[450px] bg-background border border-border shadow-2xl rounded-t-xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 relative">
            {/* Header */}
            <div className="p-3 bg-background border-b border-border flex justify-between items-center shrink-0 relative z-30">
                <div className="flex items-center gap-2 min-w-0">
                    {/* Avatar */}
                    <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 border border-border"
                        style={{ backgroundColor: isGroup ? '#38A169' : '#3182CE' }}
                    >
                        {isGroup ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
                            </svg>
                        ) : (
                            info.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="min-w-0">
                        <span className="font-bold text-[11px] truncate uppercase tracking-tight text-foreground block">
                            {info.name}
                        </span>
                        {isGroup && <span className="text-[8px] text-emerald-600 font-semibold">Grup WhatsApp</span>}
                    </div>
                </div>
                <button onClick={onClose} className="hover:bg-accent p-1 rounded-md transition-colors text-muted-foreground shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 relative flex flex-col min-h-0 bg-background">
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5" />
                </div>
                <div className="relative z-10 flex-1">
                    <MessageList
                        messages={messages}
                        loading={loading}
                        page={page}
                        hasMore={hasMore}
                        isGroup={isGroup}
                        baseGowaUrl={baseGowaUrl}
                        onLoadMore={() => loadMessages(page + 1)}
                        messagesEndRef={messagesEndRef}
                    />
                </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-2 border-t border-border bg-background shrink-0 relative z-30">
                {selectedFile && (
                    <div className="mb-1.5 p-1 px-2 bg-muted rounded text-[9px] flex justify-between items-center italic">
                        <span className="truncate">{selectedFile.name}</span>
                        <button type="button" onClick={() => setSelectedFile(null)} className="text-destructive ml-2">✕</button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors">
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
                        placeholder={isGroup ? "Pesan ke grup..." : "Ketik..."}
                    />
                    <button
                        type="submit"
                        disabled={(!newMessage.trim() && !selectedFile) || isSending}
                        className="bg-primary text-primary-foreground p-1.5 rounded-md hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
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

// ─── Komponen Utama: WhatsAppWidget ─────────────────────────────────────────
export default function WhatsAppWidget() {
    const { auth } = usePage().props as any;
    const userRole = auth?.user?.role || 'admin';
    const basePath = `/${userRole}/whatsapp`;
    const baseGowaUrl = 'https://gowa-iynqg2oa4rc5.waha.web.id';

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
    const [isGroupChat, setIsGroupChat] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const [openWindows, setOpenWindows] = useState<{ id: number; info: any }[]>([]);

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

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            if (!mobile) setIsOpen(true);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const fetchChatList = async (pageNum: number = 1, isLoadMore: boolean = false) => {
        if (isListLoading && pageNum > 1) return;
        setIsListLoading(true);
        try {
            const response = await axios.get(`${basePath}/chats`, {
                params: { search: searchQuery, page: pageNum }
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
            console.error('Gagal memuat chat', error);
        } finally {
            setIsListLoading(false);
        }
    };

    useEffect(() => {
        fetchChatList(1, false);
        const interval = setInterval(() => {
            if (!searchQuery) fetchChatList(1, false);
        }, 5000);
        return () => clearInterval(interval);
    }, [searchQuery]);

    useEffect(() => {
        if (viewMode === 'new_chat') fetchContacts(1, false);
    }, [viewMode, searchQuery]);

    const handleChatListScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (
            container.scrollHeight - container.scrollTop <= container.clientHeight + 80 &&
            hasMoreChats && !isListLoading
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
            console.error('Gagal memuat kontak', error);
        } finally {
            setIsContactLoading(false);
        }
    };

    const handleContactScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const container = e.currentTarget;
        if (
            container.scrollHeight - container.scrollTop <= container.clientHeight + 80 &&
            hasMoreContacts && !isContactLoading
        ) {
            fetchContacts(contactPage + 1, true);
        }
    };

    // Ref untuk deteksi pesan baru tanpa flicker di mobile
    const mobilLastMsgIdRef = useRef<number | null>(null);

    const loadMessages = async (chatId: number, pageNum: number = 1, silent: boolean = false) => {
        if (pageNum === 1 && !silent) setLoading(true);
        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages?page=${pageNum}`);
            const incoming: MessageItem[] = response.data.messages;

            if (pageNum === 1) {
                // Silent poll: skip update jika tidak ada pesan baru
                const newestId = incoming.length > 0 ? incoming[incoming.length - 1].id : null;
                if (silent && newestId === mobilLastMsgIdRef.current) return;
                mobilLastMsgIdRef.current = newestId;
                setMessages(incoming);
            } else {
                setMessages(prev => [...incoming, ...prev]);
            }
            setChatInfo(response.data.chat_info);
            setIsGroupChat(response.data.chat_info?.is_group === 1);
            setHasMore(response.data.pagination.has_more);
            setPage(pageNum);
            setChatList(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
        } catch (error) {
            console.error('Error load messages', error);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    // Polling mobile chat — aktif hanya saat chat view terbuka
    useEffect(() => {
        if (viewMode !== 'chat' || !activeChat || !isMobile) return;
        const interval = setInterval(() => loadMessages(activeChat, 1, true), 4000);
        return () => clearInterval(interval);
    }, [viewMode, activeChat, isMobile]);

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
            setIsGroupChat(selected.is_group === 1);
            setViewMode('chat');
            loadMessages(chatId, 1);
        }
    };

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
                setIsGroupChat(false);
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
            await axios.post(`${basePath}/send`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setNewMessage('');
            setSelectedFile(null);
            if (activeChat) loadMessages(activeChat, 1);
            fetchChatList(1, false);
        } catch {
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

    return (
        <>
            {/* ── AREA JENDELA CHAT DESKTOP ── */}
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

                {/* TOMBOL TOGGLE DESKTOP */}
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

                    {/* Header */}
                    <div className="h-14 bg-background border-b border-border px-3 flex justify-between items-center shrink-0 z-30">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-bold text-xs truncate uppercase tracking-widest text-muted-foreground">
                                {viewMode === 'chat' && isMobile ? chatInfo?.name : 'WhatsApp Chat'}
                            </h3>
                            {/* Badge grup di header mobile saat dalam chat */}
                            {viewMode === 'chat' && isMobile && isGroupChat && <GroupBadge />}
                        </div>
                        <button
                            onClick={() => {
                                if ((viewMode === 'chat' || viewMode === 'new_chat') && isMobile) {
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

                        {/* ── 1. LIST CHAT VIEW ── */}
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

                                {chatList.map((chat) => (
                                    <div
                                        key={chat.id}
                                        onClick={() => openChat(chat.id)}
                                        className={`p-3 hover:bg-accent/50 cursor-pointer transition-colors flex items-center gap-3 border-b border-muted
                                            ${openWindows.find(w => w.id === chat.id) ? 'bg-accent/40 ring-1 ring-inset ring-primary/20' : ''}`}
                                    >
                                        {/* Avatar dengan ikon grup jika grup */}
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border border-border text-sm shrink-0 ${
                                            chat.is_group ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {chat.is_group ? (
                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
                                                </svg>
                                            ) : (
                                                chat.name.charAt(0).toUpperCase()
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 pointer-events-none">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <span className="font-bold text-xs truncate text-foreground">{chat.name}</span>
                                                    {chat.is_group === 1 && (
                                                        <span className="text-[8px] text-emerald-600 font-bold shrink-0">· Grup</span>
                                                    )}
                                                </div>
                                                <span className="text-[9px] text-muted-foreground shrink-0 ml-1">{chat.time_ago}</span>
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

                        {/* ── 2. DAFTAR KONTAK VIEW ── */}
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

                        {/* ── 3. MOBILE CHAT VIEW ── */}
                        {viewMode === 'chat' && isMobile && (
                            <div className="absolute inset-0 z-20 flex flex-col bg-background">
                                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5" />
                                </div>

                                {/* Subheader info grup */}
                                {isGroupChat && (
                                    <div className="shrink-0 px-3 py-1.5 bg-emerald-50 border-b border-emerald-100 flex items-center gap-1.5 z-20">
                                        <svg className="w-3 h-3 text-emerald-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" />
                                        </svg>
                                        <span className="text-[9px] text-emerald-700 font-semibold">Grup WhatsApp · Nama pengirim ditampilkan di atas pesan</span>
                                    </div>
                                )}

                                {/* Area pesan */}
                                <div className="flex-1 min-h-0 overflow-y-auto p-3 relative z-10 scrollbar-none">
                                    <MessageList
                                        messages={messages}
                                        loading={loading}
                                        page={page}
                                        hasMore={hasMore}
                                        isGroup={isGroupChat}
                                        baseGowaUrl={baseGowaUrl}
                                        onLoadMore={() => loadMessages(activeChat!, page + 1)}
                                        messagesEndRef={messagesEndRef}
                                    />
                                </div>

                                {/* Form Input */}
                                <form
                                    onSubmit={sendMessage}
                                    className="shrink-0 p-3 bg-background border-t border-border relative z-20"
                                >
                                    {selectedFile && (
                                        <div className="mb-2 p-1 px-2 bg-muted rounded text-[9px] flex justify-between items-center italic">
                                            <span className="truncate">{selectedFile.name}</span>
                                            <button type="button" onClick={() => setSelectedFile(null)} className="text-destructive ml-2 shrink-0">✕</button>
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
                                            className="flex-1 min-w-0 bg-muted border-none rounded-lg px-3 py-2 outline-none shadow-inner text-foreground focus:ring-1 focus:ring-primary"
                                            placeholder={isGroupChat ? "Kirim ke grup..." : "Ketik pesan..."}
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