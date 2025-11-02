
import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface PageWrapperProps {
  children: ReactNode;
  title: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, title }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{title}</h1>
        {children}
    </motion.div>
  );
};
