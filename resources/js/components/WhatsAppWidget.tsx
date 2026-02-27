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
}

export default function WhatsAppWidget() {
    const { auth } = usePage().props as any; 
    const userRole = auth?.user?.role || 'admin'; 
    const basePath = `/${userRole}/whatsapp`; 

    const [isOpen, setIsOpen] = useState(false);
    
    // State UI untuk pindah layar tanpa merusak routing
    const [viewMode, setViewMode] = useState<'list' | 'chat' | 'new_chat'>('list');
    
    // State Data
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [contactList, setContactList] = useState<ContactItem[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    
    // State Aktif
    const [activeChat, setActiveChat] = useState<number | null>(null);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Daftar Chat & Kontak
    const fetchChatList = async () => {
        try {
            const response = await axios.get(`${basePath}/chats`); 
            // Karena backend sekarang mereturn object { chats, contacts }
            setChatList(response.data.chats || []);
            setContactList(response.data.contacts || []);
        } catch (error) {
            console.error("Gagal memuat chat", error);
        }
    };

    // Auto refresh tiap 1 menit (60000ms)
    useEffect(() => {
        fetchChatList();
        const interval = setInterval(fetchChatList, 60000); 
        return () => clearInterval(interval);
    }, []);

    // 2. Buka Detail Chat
    const openChat = async (chatId: number) => {
        setActiveChat(chatId);
        setViewMode('chat');
        setLoading(true);
        try {
            const response = await axios.get(`${basePath}/chats/${chatId}/messages`);
            setMessages(response.data.messages);
            setChatInfo(response.data.chat_info);
            setChatList(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
        } catch (error) {
            console.error("Error load messages", error);
        } finally {
            setLoading(false);
        }
    };

    // 3. Mulai Chat Baru (Ke Siswa yang belum pernah dichat)
    const startNewChat = (contact: ContactItem) => {
        const existingChat = chatList.find(c => c.phone === contact.phone);
        if (existingChat) {
            openChat(existingChat.id); // Buka chat lama kalau udah ada
        } else {
            setActiveChat(null);
            setMessages([]);
            setChatInfo({ name: contact.name, phone: contact.phone, isNew: true });
            setViewMode('chat');
        }
    };

    // Scroll otomatis ke bawah
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, viewMode]);

    // 4. Kirim Pesan
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatInfo) return;

        const tempMsg: MessageItem = {
            id: Date.now(),
            text: newMessage,
            direction: 'outbound',
            time: 'Just now',
            is_admin: true
        };

        setMessages([...messages, tempMsg]);
        setNewMessage('');

        try {
            const response = await axios.post(`${basePath}/send`, {
                phone_number: chatInfo.phone,
                message: tempMsg.text
            });
            
            // Reload isi chat biar dapat ID asli
            if (chatInfo.isNew && response.data?.chat_id) {
                openChat(response.data.chat_id);
            } else if (activeChat) {
                openChat(activeChat); 
            }
            fetchChatList(); 
        } catch (error) {
            alert('Gagal mengirim pesan');
            console.error(error);
        }
    };

    // --- RENDER UI ---

    // A. Tombol Floating
    if (!isOpen) {
        const totalUnread = chatList.reduce((sum, item) => sum + item.unread_count, 0);
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-primary text-primary-foreground px-4 py-3 rounded-full shadow-lg hover:bg-primary/90 transition-all"
            >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-bold">Chat Siswa</span>
                {totalUnread > 0 && (
                    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">{totalUnread}</span>
                )}
            </button>
        );
    }

    // B. Sidebar Panel
    return (
        <div className="fixed top-0 right-0 bottom-0 w-full sm:w-96 bg-background shadow-2xl border-l border-border z-50 flex flex-col transform transition-transform">
            
            {/* Header */}
            <div className="bg-background text-foreground border-b border-border p-4 flex justify-between items-center shadow-sm shrink-0">
                <h3 className="font-bold text-lg">
                    {viewMode === 'chat' ? chatInfo?.name : viewMode === 'new_chat' ? 'Pilih Kontak' : 'Daftar Chat'}
                </h3>
                <div className="flex gap-3 items-center">
                    {viewMode !== 'list' && (
                        <button onClick={() => setViewMode('list')} className="text-sm font-medium hover:text-muted-foreground transition-colors">
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

                {/* 2. DAFTAR KONTAK */}
                {viewMode === 'new_chat' && (
                    <div className="divide-y divide-border">
                        {contactList.map((contact) => (
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
                )}

                {/* 3. CHAT AREA */}
                {viewMode === 'chat' && (
                    <div className="relative flex flex-col min-h-full">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/10 dark:stroke-neutral-100/10 z-0" />
                        <div className="relative z-10 flex-1 p-3 space-y-3">
                            {loading && <div className="text-center text-xs text-muted-foreground">Memuat pesan...</div>}
                            
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-2 text-sm shadow-sm ${
                                        msg.is_admin 
                                            ? 'bg-primary text-primary-foreground rounded-tr-none' 
                                            : 'bg-card text-card-foreground border border-border rounded-tl-none'
                                    }`}>
                                        <div>{msg.text}</div>
                                        <div className={`text-[10px] text-right mt-1 ${msg.is_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
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
                    <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ketik pesan..."
                            className="flex-1 text-sm bg-background text-foreground border border-input rounded-full focus:border-primary focus:ring-1 focus:ring-primary px-4 py-2 outline-none transition-all"
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center shrink-0"
                        >
                            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}