
import React from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

export const Footer: React.FC = () => {
    const { t } = useTranslation();
    return (
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center flex-col sm:flex-row">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        &copy; {new Date().getFullYear()} {t('appName')}. All Rights Reserved.
                    </p>
                    <div className="flex space-x-6 mt-4 sm:mt-0">
                        <NavLink to="/help" className="text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary-light">
                            {t('nav.help')}
                        </NavLink>
                    </div>
                </div>
            </div>
        </footer>
    );
};
