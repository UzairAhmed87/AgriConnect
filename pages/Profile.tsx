import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/common/PageWrapper';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import toast from 'react-hot-toast';

export const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState(user?.location || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name, location }).then(() => {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
    }).catch(() => {
        toast.error('Failed to update profile.');
    });
  };
  
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    updateUser({ preferredLanguage: lang as 'en' | 'ur' });
  };
  
  const handleThemeChange = () => {
    toggleTheme();
    updateUser({ theme: theme === 'light' ? 'dark' : 'light' });
  };

  if (!user) return null;

  return (
    <PageWrapper title={t('profile.title')}>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
            <img 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${user.name}&background=22c55e&color=fff`}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-primary/50"
            />
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
            <p className="text-gray-500 dark:text-gray-400 capitalize mt-1">{user.role}</p>
            <Button variant="outline" className="mt-4" onClick={() => setIsEditing(!isEditing)}>
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>

        {/* Settings Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleProfileUpdate} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <h3 className="text-xl font-semibold">Personal Information</h3>
            <Input id="name" label={t('common.name')} value={name} onChange={e => setName(e.target.value)} disabled={!isEditing} />
            <Input id="location" label="Location" value={location} onChange={e => setLocation(e.target.value)} disabled={!isEditing} />
            {isEditing && <Button type="submit">{t('profile.update')}</Button>}
            
            <hr className="dark:border-gray-700"/>

            <h3 className="text-xl font-semibold">Preferences</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="language" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.language')}</label>
                <select id="language" value={i18n.language} onChange={handleLanguageChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600">
                  <option value="en">English</option>
                  <option value="ur">اردو</option>
                </select>
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('profile.theme')}</label>
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
                    <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
                    <button type="button" onClick={handleThemeChange} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${theme === 'dark' ? 'bg-primary' : 'bg-gray-300'}`}>
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </PageWrapper>
  );
};