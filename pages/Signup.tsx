import React, { useState } from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { motion } from 'framer-motion';
import { UserRole } from '../types';

export const Signup: React.FC = () => {
  const { t } = useTranslation();
  const { signup, loading, user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.FARMER);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await signup(name, email, password, role);
    } catch (err: any) {
        setError(err.message || 'Failed to create an account.');
    }
  };

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary mb-2">{t('signup.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('signup.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('signup.role')}</span>
                <div className="flex gap-4">
                    <button type="button" onClick={() => setRole(UserRole.FARMER)} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${role === UserRole.FARMER ? 'bg-primary text-white shadow' : 'bg-gray-200 dark:bg-gray-700'}`}>{t('signup.farmer')}</button>
                    <button type="button" onClick={() => setRole(UserRole.BUYER)} className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${role === UserRole.BUYER ? 'bg-primary text-white shadow' : 'bg-gray-200 dark:bg-gray-700'}`}>{t('signup.buyer')}</button>
                </div>
            </div>
            <Input id="name" label={t('common.name')} type="text" value={name} onChange={e => setName(e.target.value)} required autoComplete="name" />
            <Input id="email" label={t('common.email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            <Input id="password" label={t('common.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="new-password" />
            
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <Button type="submit" className="w-full" isLoading={loading}>{t('signup.button')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('signup.haveAccount')}{' '}
          <NavLink to="/" className="font-medium text-primary hover:underline">
            {t('signup.login')}
          </NavLink>
        </p>
      </motion.div>
    </div>
  );
};
