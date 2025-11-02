import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/common/PageWrapper';
import { useAuth } from '../hooks/useAuth';
import { listenForChats, listenForMessages, sendMessage, getUserById } from '../services/dbService';
import { Chat, ChatMessage, ChatWithParticipant } from '../types';
import { Send, MessageSquare, ArrowLeft } from 'lucide-react';

export const Messages: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const [chats, setChats] = useState<ChatWithParticipant[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = listenForChats(user.uid, async (fetchedChats) => {
            const chatsWithParticipants = await Promise.all(
                fetchedChats.map(async (chat) => {
                    const otherParticipantId = chat.participants.find(p => p !== user.uid);
                    if (!otherParticipantId) return null;
                    const otherParticipant = await getUserById(otherParticipantId);
                    return {
                        ...chat,
                        otherParticipant: {
                            uid: otherParticipantId,
                            name: otherParticipant?.name || 'Unknown User',
                        },
                    };
                })
            );
            setChats(chatsWithParticipants.filter(Boolean) as ChatWithParticipant[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (location.state?.chatId && chats.length > 0) {
            setSelectedChatId(location.state.chatId);
            // Clear the state to prevent re-selection on navigation
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, chats, navigate]);

    useEffect(() => {
        if (!selectedChatId) {
            setMessages([]);
            return;
        }
        const unsubscribe = listenForMessages(selectedChatId, setMessages);
        return () => unsubscribe();
    }, [selectedChatId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        const selectedChat = chats.find(c => c.id === selectedChatId);
        if (newMessage.trim() === '' || !selectedChat || !user) return;

        try {
            await sendMessage(
                selectedChat.id, 
                user.uid, 
                newMessage, 
                user.name, 
                selectedChat.otherParticipant.uid
            );
            setNewMessage('');
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };
    
    const selectedChat = chats.find(c => c.id === selectedChatId);

    return (
        <PageWrapper title={t('nav.messages')}>
            <div className="flex h-[calc(100vh-200px)] bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                {/* Contacts List */}
                <div className={`w-full md:w-1/3 border-r border-gray-200 dark:border-gray-700 flex-col ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="flex-grow overflow-y-auto">
                        {loading ? <p className="p-4">Loading chats...</p> : chats.map(chat => (
                             <div 
                                key={chat.id} 
                                className={`flex items-center p-4 cursor-pointer ${selectedChatId === chat.id ? 'bg-primary/10' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                onClick={() => setSelectedChatId(chat.id)}
                            >
                                <div className="w-12 h-12 rounded-full mr-4 bg-primary text-white flex items-center justify-center font-bold">
                                    {chat.otherParticipant.name.charAt(0)}
                                </div>
                                <div className="flex-grow">
                                    <h3 className="font-semibold">{chat.otherParticipant.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{chat.lastMessage?.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Window */}
                <div className={`w-full md:w-2/3 flex-col ${selectedChatId ? 'flex' : 'hidden md:flex'}`}>
                    {selectedChat ? (
                        <>
                            <div className="p-4 border-b dark:border-gray-700 flex items-center">
                                <button 
                                    onClick={() => setSelectedChatId(null)} 
                                    className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-10 h-10 rounded-full mr-4 bg-primary text-white flex items-center justify-center font-bold">
                                    {selectedChat.otherParticipant.name.charAt(0)}
                                </div>
                                <h3 className="font-semibold text-lg">{selectedChat.otherParticipant.name}</h3>
                            </div>
                            <div className="flex-grow p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                                {messages.length === 0 ? (
                                    <p className="text-center text-gray-500">{t('messages.noMessages')}</p>
                                ) : (
                                    messages.map((msg) => (
                                        <div key={msg.id} className={`flex mb-4 ${msg.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`py-2 px-4 rounded-2xl max-w-lg ${msg.senderId === user?.uid ? 'bg-primary text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 flex items-center">
                                <input 
                                    type="text" 
                                    placeholder={t('messages.typeMessage')}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                    className="flex-grow bg-gray-100 dark:bg-gray-700 rounded-full py-2 px-4 focus:outline-none"
                                />
                                <button onClick={handleSendMessage} className="ml-4 bg-primary text-white p-3 rounded-full hover:bg-primary-dark transition-colors">
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="hidden md:flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                           <MessageSquare size={48} className="mb-4 text-gray-400"/>
                           <p>{t('messages.selectChat')}</p>
                        </div>
                    )}
                </div>
            </div>
        </PageWrapper>
    );
};
