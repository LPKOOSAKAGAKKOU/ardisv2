import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { usePage } from '@inertiajs/react';

// --- Tipe Data ---
interface ChatItem {
    id: number;
    name: string;
    last_message: string;
    time_ago: string;
    unread_count: number;
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
    const [isOpen, setIsOpen] = useState(false); // Sidebar terbuka/tertutup
    const [activeChat, setActiveChat] = useState<number | null>(null); // Chat yang sedang dibuka
    const [chatList, setChatList] = useState<ChatItem[]>([]);
    const [messages, setMessages] = useState<MessageItem[]>([]);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Ref untuk scroll otomatis ke bawah
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. Fetch Daftar Chat (Polling setiap 10 detik)
    const fetchChatList = async () => {
        try {
            // Pastikan route 'admin.whatsapp.list' sudah ada di web.php
            const response = await axios.get('/admin/whatsapp/chats'); 
            setChatList(response.data);
        } catch (error) {
            console.error("Gagal memuat chat", error);
        }
    };

    useEffect(() => {
        fetchChatList();
        const interval = setInterval(fetchChatList, 15000); // Auto refresh 15 detik
        return () => clearInterval(interval);
    }, []);

    // 2. Buka Detail Chat
    const openChat = async (chatId: number) => {
        setActiveChat(chatId);
        setLoading(true);
        try {
            const response = await axios.get(`/admin/whatsapp/chats/${chatId}/messages`);
            setMessages(response.data.messages);
            setChatInfo(response.data.chat_info);
            // Reset unread count di UI lokal
            setChatList(prev => prev.map(c => c.id === chatId ? { ...c, unread_count: 0 } : c));
        } catch (error) {
            console.error("Error load messages", error);
        } finally {
            setLoading(false);
        }
    };

    // 3. Scroll ke bawah saat pesan baru dibuka/muncul
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChat]);

    // 4. Kirim Pesan
    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !chatInfo) return;

        const tempMsg: MessageItem = {
            id: Date.now(), // ID sementara
            text: newMessage,
            direction: 'outbound',
            time: 'Just now',
            is_admin: true
        };

        // Optimistic UI update (langsung tampilkan sebelum sukses server)
        setMessages([...messages, tempMsg]);
        setNewMessage('');

        try {
            await axios.post('/admin/whatsapp/send', {
                phone_number: chatInfo.phone,
                message: tempMsg.text
            });
            // Refresh pesan untuk dapat ID asli dan status server
            openChat(chatInfo.id); 
            fetchChatList(); // Update last message di list
        } catch (error) {
            alert('Gagal mengirim pesan');
            console.error(error);
        }
    };

    // --- RENDER UI ---

    // A. Tombol Floating (Saat Sidebar Tertutup)
    if (!isOpen) {
        // Hitung total unread
        const totalUnread = chatList.reduce((sum, item) => sum + item.unread_count, 0);

        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-full shadow-lg hover:bg-green-700 transition-all"
            >
                {/* Icon WhatsApp SVG */}
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="font-bold">Chat Siswa</span>
                {totalUnread > 0 && (
                    <span className="bg-red-500 text-xs px-2 py-0.5 rounded-full">{totalUnread}</span>
                )}
            </button>
        );
    }

    // B. Sidebar (Facebook Style - Right Docked)
    return (
        <div className="fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
            
            {/* 1. Header Sidebar */}
            <div className="bg-green-600 text-white p-4 flex justify-between items-center shadow-md shrink-0">
                <h3 className="font-bold text-lg">
                    {activeChat ? chatInfo?.name : 'Daftar Chat'}
                </h3>
                <div className="flex gap-2">
                    {activeChat && (
                        <button onClick={() => setActiveChat(null)} className="text-sm hover:text-green-200">
                            Kembali
                        </button>
                    )}
                    <button onClick={() => setIsOpen(false)} className="hover:text-green-200">
                        {/* Close X Icon */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
            </div>

            {/* 2. Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
                
                {/* MODE LIST: Tampilkan Daftar Chat */}
                {!activeChat && (
                    <div className="divide-y divide-gray-100">
                        {chatList.length === 0 && (
                            <div className="p-4 text-center text-gray-500 text-sm">Belum ada percakapan.</div>
                        )}
                        {chatList.map((chat) => (
                            <div 
                                key={chat.id} 
                                onClick={() => openChat(chat.id)}
                                className="p-3 hover:bg-gray-100 cursor-pointer transition flex items-start gap-3 bg-white"
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold shrink-0">
                                    {chat.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <span className="font-semibold text-sm truncate">{chat.name}</span>
                                        <span className="text-[10px] text-gray-400 shrink-0">{chat.time_ago}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {chat.last_message}
                                    </p>
                                </div>
                                {chat.unread_count > 0 && (
                                    <div className="bg-green-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shrink-0 mt-2">
                                        {chat.unread_count}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* MODE CHAT: Tampilkan Isi Pesan */}
                {activeChat && (
                    <div className="flex flex-col min-h-full">
                        <div className="flex-1 p-3 space-y-3">
                            {loading && <div className="text-center text-xs text-gray-400">Memuat pesan...</div>}
                            
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-lg p-2 text-sm shadow-sm ${
                                        msg.is_admin 
                                            ? 'bg-green-100 text-gray-800 rounded-tr-none' 
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                                    }`}>
                                        <div>{msg.text}</div>
                                        <div className="text-[10px] text-gray-400 text-right mt-1">{msg.time}</div>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Footer Input (Hanya di Mode Chat) */}
            {activeChat && (
                <div className="p-2 bg-white border-t border-gray-200 shrink-0">
                    <form onSubmit={sendMessage} className="flex gap-2">
                        <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ketik pesan..."
                            className="flex-1 text-sm border-gray-300 rounded-full focus:border-green-500 focus:ring-green-500 px-3 py-2"
                        />
                        <button 
                            type="submit" 
                            disabled={!newMessage.trim()}
                            className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 disabled:opacity-50"
                        >
                            <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}