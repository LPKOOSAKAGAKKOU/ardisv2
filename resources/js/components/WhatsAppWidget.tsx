import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

// --- Tipe Data Tetap ---
interface ChatItem { id: number; name: string; last_message: string; time_ago: string; unread_count: number; phone: string; }
interface ContactItem { id: number; name: string; phone: string; }
interface MessageItem { id: number; text: string; direction: 'inbound' | 'outbound'; time: string; is_admin: boolean; message_type?: string; media_url?: string; file_name?: string; latitude?: string; longitude?: string; }

export default function WhatsAppWidget() {
    const { auth } = usePage().props as any; 
    const userRole = auth?.user?.role || 'admin'; 
    const basePath = `/${userRole}/whatsapp`; 
    const baseGowaUrl = 'https://gowa-iynqg2oa4rc5.waha.web.id';

    const [isOpen, setIsOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'list' | 'chat' | 'new_chat'>('list');
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [contactList, setContactList] = useState<ContactItem[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [activeChat, setActiveChat] = useState<number | null>(null);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSending, setIsSending] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Effect untuk Persistent Sidebar Desktop & Toggle Logic
    useEffect(() => {
        const handleInitialState = () => {
            if (window.innerWidth >= 1024) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        };
        handleInitialState();
        // Hanya listen resize untuk kenyamanan, tidak memaksa tutup jika user sedang pakai
        window.addEventListener('resize', handleInitialState);
        return () => window.removeEventListener('resize', handleInitialState);
    }, []);

    const fetchChatList = async () => {
        try {
            const response = await axios.get(`${basePath}/chats`); 
            setChatList(response.data.chats || []);
            setContactList(response.data.contacts || []);
        } catch (error) { console.error("Gagal memuat chat", error); }
    };

    useEffect(() => {
        fetchChatList();
        const interval = setInterval(fetchChatList, 5000); 
        return () => clearInterval(interval);
    }, []);

    const loadMessages = async (chatId: number, pageNum: number = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages?page=${pageNum}`);
            if (pageNum === 1) setMessages(response.data.messages);
            else setMessages(prev => [...response.data.messages, ...prev]);
            setChatInfo(response.data.chat_info);
            setHasMore(response.data.pagination.has_more);
            setPage(pageNum);
            setChatList(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
        } catch (error) { console.error("Error load messages", error); }
        finally { setLoading(false); }
    };

    const openChat = (chatId: number) => {
        setActiveChat(chatId);
        setViewMode('chat');
        loadMessages(chatId, 1);
    };

    const startNewChat = (contact: ContactItem) => {
        const existingChat = chatList.find(c => c.phone === contact.phone);
        if (existingChat) openChat(existingChat.id);
        else {
            setActiveChat(null);
            setMessages([]);
            setChatInfo({ name: contact.name, phone: contact.phone, isNew: true });
            setViewMode('chat');
            setHasMore(false);
        }
    };

    useEffect(() => {
        if (page === 1) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, viewMode, page]);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedFile) || !chatInfo || isSending) return;
        setIsSending(true);
        const formData = new FormData();
        formData.append('phone_number', chatInfo.phone);
        if (newMessage.trim()) formData.append('message', newMessage);
        if (selectedFile) formData.append('file', selectedFile);
        if (!selectedFile) {
            const tempMsg: MessageItem = { id: Date.now(), text: newMessage, direction: 'outbound', time: 'Just now', is_admin: true, message_type: 'chat' };
            setMessages([...messages, tempMsg]);
        }
        setNewMessage('');
        setSelectedFile(null);
        try {
            const response = await axios.post(`${basePath}/send`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (chatInfo.isNew && response.data?.chat_id) openChat(response.data.chat_id);
            else if (activeChat) loadMessages(activeChat, 1);
            fetchChatList(); 
        } catch (error) { alert('Gagal mengirim pesan'); }
        finally { setIsSending(false); }
    };

    const filteredContacts = contactList.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery));

    const totalUnread = chatList.reduce((sum, item) => sum + item.unread_count, 0);

    return (
        <div className="flex flex-col h-full">
            {/* Tombol Floating Expand (Khusus Mobile atau saat Sidebar Tertutup) */}
            {(!isOpen) && (
                <div className="fixed bottom-6 right-6 z-[9999]">
                    <button 
                        onClick={() => setIsOpen(true)}
                        className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-2xl hover:scale-110 transition-all duration-300"
                    >
                        {totalUnread > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-[11px] font-bold text-white border-2 border-white animate-bounce">
                                {totalUnread > 99 ? '99+' : totalUnread}
                            </span>
                        )}
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </button>
                </div>
            )}

            {/* Main Sidebar Container dengan Animasi */}
            <div className={`fixed lg:relative top-0 right-0 h-screen bg-background border-l border-border z-[100] flex flex-col transition-all duration-500 ease-in-out shadow-2xl lg:shadow-none
                ${isOpen ? 'w-full lg:w-[450px] translate-x-0 opacity-100' : 'w-0 translate-x-full lg:translate-x-0 lg:opacity-0 overflow-hidden pointer-events-none'}`}
            >
                {/* Header dengan Tombol Collapse */}
                <div className="h-16 bg-background text-foreground border-b border-border p-4 flex justify-between items-center shrink-0 z-20">
                    <h3 className="font-bold text-lg truncate pr-2">
                        {viewMode === 'chat' ? chatInfo?.name : viewMode === 'new_chat' ? 'Pilih Kontak' : 'Daftar Chat'}
                    </h3>
                    <div className="flex gap-3 items-center shrink-0">
                        {viewMode !== 'list' && (
                            <button onClick={() => { setViewMode('list'); setSearchQuery(''); }} className="text-sm font-medium hover:text-muted-foreground transition-colors uppercase">
                                Kembali
                            </button>
                        )}
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="p-1.5 hover:bg-accent rounded-md transition-colors text-muted-foreground"
                            title="Collapse Sidebar"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {/* 1. LIST CHAT VIEW */}
                    {viewMode === 'list' && (
                        <div className="flex-1 overflow-y-auto divide-y divide-border bg-background scrollbar-thin">
                            <div className="p-3 sticky top-0 bg-background z-10 border-b border-border shadow-sm">
                                <button onClick={() => setViewMode('new_chat')} className="w-full flex items-center justify-center gap-2 p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-all text-sm font-bold shadow-sm">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
                                    CHAT BARU
                                </button>
                            </div>
                            {chatList.map((chat) => (
                                <div key={chat.id} onClick={() => openChat(chat.id)} className="p-4 hover:bg-accent cursor-pointer transition-colors flex items-center gap-4 bg-background relative border-b border-muted">
                                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold border border-border text-lg shrink-0">
                                        {chat.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="font-bold text-[14px] truncate text-foreground pr-2">{chat.name}</span>
                                            <span className={`text-[10px] shrink-0 ${chat.unread_count > 0 ? 'text-green-600 font-bold' : 'text-muted-foreground'}`}>{chat.time_ago}</span>
                                        </div>
                                        <p className={`text-xs truncate ${chat.unread_count > 0 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{chat.last_message}</p>
                                    </div>
                                    {chat.unread_count > 0 && (
                                        <div className="bg-green-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] flex items-center justify-center rounded-full px-1 shadow-sm shrink-0">{chat.unread_count}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 2. DAFTAR KONTAK VIEW */}
                    {viewMode === 'new_chat' && (
                        <div className="flex-1 flex flex-col overflow-hidden bg-background">
                            <div className="p-3 border-b border-border bg-background shrink-0 sticky top-0 z-10">
                                <input type="text" placeholder="Cari nama atau nomor..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full text-sm bg-muted text-foreground border border-transparent rounded-full focus:border-primary focus:ring-1 focus:ring-primary px-4 py-2 outline-none transition-all" />
                            </div>
                            <div className="flex-1 overflow-y-auto divide-y divide-border">
                                {filteredContacts.map((contact) => (
                                    <div key={contact.id} onClick={() => startNewChat(contact)} className="p-3 hover:bg-accent cursor-pointer transition-colors flex items-center gap-3 bg-background">
                                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0 border border-border">{contact.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <span className="block font-semibold text-sm truncate text-foreground">{contact.name}</span>
                                            <span className="block text-xs text-muted-foreground">{contact.phone}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 3. CHAT VIEW */}
                    {viewMode === 'chat' && (
                        <div className="flex-1 flex flex-col overflow-hidden relative">
                            <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/5 dark:stroke-neutral-100/5 z-0" />
                            <div className="flex-1 overflow-y-auto p-3 space-y-4 relative z-10 scrollbar-thin">
                                {hasMore && (
                                    <div className="flex justify-center mb-2">
                                        <button onClick={() => activeChat && loadMessages(activeChat, page + 1)} disabled={loading} className="bg-white border border-border text-[10px] font-bold px-3 py-1 rounded-full shadow-sm hover:bg-muted transition text-foreground">{loading ? 'Memuat...' : 'Lihat pesan sebelumnya'}</button>
                                    </div>
                                )}

                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-2xl p-1 shadow-sm border ${msg.is_admin ? 'bg-slate-100 text-slate-800 border-slate-200 rounded-tr-none' : 'bg-white text-gray-800 border-gray-200 rounded-tl-none'}`}>
                                            
                                            {/* --- PERTAHANKAN KODE RENDER MEDIA ANDA --- */}
                                            <div className="overflow-hidden rounded-xl">
                                                {msg.message_type === 'image' && msg.media_url && (
                                                    <div className="relative group">
                                                        <img src={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} alt="WhatsApp Image" className="max-w-full h-auto object-cover cursor-zoom-in hover:brightness-90 transition-all rounded-lg min-w-[200px]" onClick={() => window.open(msg.media_url || '', '_blank')} onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x300?text=Gambar+Tidak+Tersedia'; }} />
                                                    </div>
                                                )}
                                                {msg.message_type === 'video' && msg.media_url && (
                                                    <video src={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} controls className="max-w-full rounded-lg max-h-64 bg-black" />
                                                )}
                                                {msg.message_type === 'document' && msg.media_url && (
                                                    <a href={msg.media_url.startsWith('http') ? msg.media_url : `${baseGowaUrl}/${msg.media_url}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg m-1 border border-dashed border-slate-300 hover:bg-slate-100 transition">
                                                        <div className="bg-red-100 p-2 rounded-lg"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg></div>
                                                        <div className="flex flex-col min-w-0"><span className="text-[11px] font-bold truncate text-slate-700">{msg.file_name || 'Download PDF'}</span><span className="text-[9px] text-slate-400 uppercase">Lihat Dokumen</span></div>
                                                    </a>
                                                )}
                                            </div>

                                            {(msg.text && msg.text !== '[image]' && msg.text !== '[document]') && (
                                                <div className="px-3 py-2 leading-relaxed break-words whitespace-pre-wrap text-[13px]">{msg.text}</div>
                                            )}

                                            <div className="px-3 pb-1 flex justify-end items-center gap-1">
                                                <span className="text-[9px] text-slate-400 font-medium">{msg.time}</span>
                                                {msg.is_admin && <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293l-4 4a1 1 0 01-1.414 0l-2-2a1 1 0 111.414-1.414L9 10.586l3.293-3.293a1 1 0 111.414 1.414z"></path></svg>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-3 bg-background border-t border-border shrink-0 z-20">
                                {selectedFile && <div className="mb-2 p-2 bg-muted rounded-md flex items-center justify-between text-xs"><span className="truncate flex-1 font-medium">{selectedFile.name}</span><button onClick={() => setSelectedFile(null)} className="text-destructive hover:text-red-700 p-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg></button></div>}
                                <form onSubmit={sendMessage} className="flex gap-2 items-center">
                                    <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors shrink-0"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg></button>
                                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={isSending} placeholder="Ketik pesan..." className="flex-1 text-sm bg-muted text-foreground border border-transparent rounded-full focus:border-primary focus:ring-1 focus:ring-primary px-4 py-2.5 outline-none transition-all" />
                                    <button type="submit" disabled={(!newMessage.trim() && !selectedFile) || isSending} className="bg-primary text-primary-foreground p-2.5 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"><svg className="w-5 h-5 -rotate-45 ml-1 mb-1" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}