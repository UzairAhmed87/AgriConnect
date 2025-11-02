import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '../components/common/PageWrapper';
import { useAuth } from '../hooks/useAuth';
import { Notification } from '../types';
import { getAllNotificationsForUser } from '../services/dbService';
import { Bell } from 'lucide-react';

export const Notifications: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getAllNotificationsForUser(user.uid)
                .then(setNotifications)
                .finally(() => setLoading(false));
        }
    }, [user]);

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
    
    const handleNotificationClick = (notification: Notification) => {
        navigate(notification.link);
    };

    return (
        <PageWrapper title={t('notifications.allNotifications')}>
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg">
                {loading ? (
                    <div className="p-8 text-center">{t('common.loading')}</div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        <Bell size={48} className="mx-auto mb-4" />
                        <p>{t('notifications.noNotifications')}</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map(notification => (
                             <li 
                                key={notification.id} 
                                onClick={() => handleNotificationClick(notification)}
                                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">
                                        {t(notification.message, notification.messageParams || {}) as string}
                                    </p>
                                    {!notification.isRead && (
                                        <span className="h-2.5 w-2.5 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {formatTime(notification.timestamp)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </PageWrapper>
    );
};