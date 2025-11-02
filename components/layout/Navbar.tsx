
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sun, Moon, LogOut, Menu, X, Globe } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { NotificationBell } from './NotificationBell';

export const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Logout failed", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const changeLanguage = (lng: 'en' | 'ur') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('language', lng);
  };
  
  const navLinks = user ? (
    user.role === UserRole.FARMER ? [
      { to: '/dashboard', label: t('nav.dashboard') },
      { to: '/my-listings', label: t('nav.myListings') },
      { to: '/add-crop', label: t('nav.addCrop') },
      { to: '/crop-health', label: t('nav.cropHealth') },
      { to: '/orders', label: t('nav.orders') },
      { to: '/messages', label: t('nav.messages') },
      { to: '/profile', label: t('nav.profile') },
    ] : [
      { to: '/dashboard', label: t('nav.dashboard') },
      { to: '/marketplace', label: t('nav.marketplace') },
      { to: '/orders', label: t('nav.orders') },
      { to: '/messages', label: t('nav.messages') },
      { to: '/profile', label: t('nav.profile') },
    ]
  ) : [];

  const NavLinksComponent = ({className}: {className?: string}) => (
    <div className={className}>
      {navLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-medium ${
              isActive ? 'bg-primary-light/20 text-primary dark:text-primary-light' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`
          }
          onClick={() => setIsOpen(false)}
        >
          {link.label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 text-2xl font-bold text-primary">
              {t('appName')}
            </NavLink>
          </div>
          <div className="hidden md:block">
            <NavLinksComponent className="ml-10 flex items-baseline space-x-4"/>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
               <button className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <Globe size={20} />
               </button>
               <div className="absolute top-full -right-2 mt-2 w-24 bg-white dark:bg-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 invisible group-hover:visible z-10">
                  <button onClick={() => changeLanguage('en')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">English</button>
                  <button onClick={() => changeLanguage('ur')} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">اردو</button>
               </div>
            </div>
            <button onClick={toggleTheme} className="p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {user && (
              <>
                 <NotificationBell />
                 <button onClick={handleLogout} className="hidden md:block p-2 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                  <LogOut size={20} />
                </button>
                <div className="md:hidden">
                  <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">
                    {isOpen ? <X size={20}/> : <Menu size={20} />}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {isOpen && (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <NavLinksComponent className="flex flex-col space-y-2"/>
          {user && (
            <button
                onClick={handleLogout}
                className="w-full text-left mt-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
            >
                <LogOut size={16} /> {t('nav.logout')}
            </button>
          )}
        </motion.div>
      )}
    </nav>
  );
};
