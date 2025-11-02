import React, { useState } from 'react';
import { NavLink, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const { login, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
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
          <h1 className="text-3xl font-bold text-primary mb-2">{t('login.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('login.subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <Input id="email" label={t('common.email')} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          <Input id="password" label={t('common.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
          
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          
          <Button type="submit" className="w-full" isLoading={loading}>{t('login.button')}</Button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('login.noAccount')}{' '}
          <NavLink to="/signup" className="font-medium text-primary hover:underline">
            {t('login.signup')}
          </NavLink>
        </p>
      </motion.div>
    </div>
  );
};
