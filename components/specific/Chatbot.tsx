import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { getAiResponse } from '../../services/geminiService';

interface Message {
  text: string;
  sender: 'user' | 'ai';
}

export const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { t, i18n } = useTranslation();
  const [chatbotLang, setChatbotLang] = useState<'en' | 'ur'>(i18n.language === 'ur' ? 'ur' : 'en');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  // Sync chatbot language with global app language when it's opened
  useEffect(() => {
    if (isOpen) {
        setChatbotLang(i18n.language === 'ur' ? 'ur' : 'en');
    }
  }, [i18n.language, isOpen]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;
    
    const userMessage: Message = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const aiResponse = await getAiResponse(input, chatbotLang);
      const aiMessage: Message = { text: aiResponse, sender: 'ai' };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = { text: 'Sorry, something went wrong.', sender: 'ai' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-5 end-5 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="bg-primary text-white p-4 rounded-full shadow-lg"
        >
          {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.5 }}
            className="fixed bottom-20 end-5 w-80 h-[28rem] bg-white dark:bg-gray-800 rounded-lg shadow-xl flex flex-col origin-bottom-right z-50"
          >
            <div className="p-4 bg-primary text-white rounded-t-lg flex justify-between items-center">
              <h3 className="font-bold text-lg">{t('chatbot.title')}</h3>
              <div className="flex bg-primary-dark/50 rounded-full p-0.5 text-xs font-semibold">
                <button 
                  onClick={() => setChatbotLang('en')}
                  className={`px-3 py-1 rounded-full transition-colors ${chatbotLang === 'en' ? 'bg-white text-primary' : 'text-white/80'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setChatbotLang('ur')}
                  className={`px-3 py-1 rounded-full transition-colors ${chatbotLang === 'ur' ? 'bg-white text-primary' : 'text-white/80'}`}
                >
                  UR
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-2.5 mb-4 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                   {msg.sender === 'ai' && <div className="p-2 bg-gray-200 dark:bg-gray-900 rounded-full"><Bot size={20} className="text-primary"/></div>}
                  <div className={`p-3 rounded-lg max-w-[80%] ${msg.sender === 'user' ? 'bg-primary/20 dark:bg-primary/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    <p className="text-sm text-gray-800 dark:text-gray-200">{msg.text}</p>
                  </div>
                   {msg.sender === 'user' && <div className="p-2 bg-gray-200 dark:bg-gray-900 rounded-full"><User size={20} className="text-secondary"/></div>}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-2.5 mb-4">
                     <div className="p-2 bg-gray-200 dark:bg-gray-900 rounded-full"><Bot size={20} className="text-primary"/></div>
                    <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-primary rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t dark:border-gray-700 flex items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('chatbot.placeholder')}
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:border-gray-600"
              />
              <button onClick={handleSend} className="bg-primary text-white p-3 rounded-r-md">
                <Send size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};