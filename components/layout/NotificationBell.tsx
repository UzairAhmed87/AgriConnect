import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { Notification } from '../../types';
import { listenForNotifications, markNotificationsAsRead } from '../../services/dbService';

export const NotificationBell: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const unreadCount = notifications.filter(n => !n.isRead).length;
    const bellRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = listenForNotifications(user.uid, setNotifications);

        return () => unsubscribe();
    }, [user]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleBellClick = () => {
        setIsOpen(!isOpen);
        if (!isOpen && unreadCount > 0) {
            const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
            markNotificationsAsRead(user!.uid, unreadIds);
        }
    };
    
    const handleNotificationClick = (notification: Notification) => {
        setIsOpen(false);
        navigate(notification.link);
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);
        if (diffSeconds < 60) return `${diffSeconds}s ago`;
        const diffMinutes = Math.round(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        const diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={bellRef}>
            <button onClick={handleBellClick} className="relative p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 block h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-gray-800"></span>
                )}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute top-full -right-4 mt-2 w-80 bg-white dark:bg-gray-800 rounded-md shadow-lg border dark:border-gray-700 z-20 flex flex-col"
                    >
                        <div className="p-3 border-b dark:border-gray-700">
                            <h3 className="font-semibold">{t('notifications.title')}</h3>
                        </div>
                        <div className="flex-grow">
                            {notifications.length === 0 ? (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-6">{t('notifications.noNotifications')}</p>
                            ) : (
                                notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${!notification.isRead ? 'bg-primary/5 dark:bg-primary/10' : ''}`}
                                    >
                                        <div className={`mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0 ${!notification.isRead ? 'bg-primary' : 'bg-transparent'}`}></div>
                                        <div className="flex-grow">
                                            <p className="text-sm text-gray-800 dark:text-gray-200">
                                                {t(notification.message, notification.messageParams || {}) as string}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {formatTime(notification.timestamp)}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-2 border-t dark:border-gray-700 text-center">
                            <Link to="/notifications" onClick={() => setIsOpen(false)} className="text-sm font-semibold text-primary hover:underline">
                                {t('notifications.viewAll')}
                            </Link>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};