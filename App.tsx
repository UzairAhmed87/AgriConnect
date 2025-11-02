import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Marketplace } from './pages/Marketplace';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import { ThemeProvider } from './contexts/ThemeContext';
import { Chatbot } from './components/specific/Chatbot';
import i18n from './i18n/config';
import { Toaster } from 'react-hot-toast';

// Import new pages
import { MyListings } from './pages/MyListings';
import { AddCrop } from './pages/AddCrop';
import { Orders } from './pages/Orders';
import { Messages } from './pages/Messages';
import { Profile } from './pages/Profile';
import { Help } from './pages/Help';
import { CropDetail } from './pages/CropDetail';
import { CropHealth } from './pages/CropHealth';
import { Notifications } from './pages/Notifications';

const AppContent: React.FC = () => {
    const { user } = useAuth();
    const location = useLocation();
    const { i18n: i18nInstance } = useTranslation();
    const [isI18nInitialized, setIsI18nInitialized] = useState(i18n.isInitialized);

    useEffect(() => {
      if (isI18nInitialized) {
        const dir = i18nInstance.language === 'ur' ? 'rtl' : 'ltr';
        document.documentElement.dir = dir;
        document.documentElement.lang = i18nInstance.language;
      }
    }, [i18nInstance.language, isI18nInitialized]);

    useEffect(() => {
        const handleInitialized = () => setIsI18nInitialized(true);
        if (!i18n.isInitialized) {
            i18n.on('initialized', handleInitialized);
        }
        return () => {
            i18n.off('initialized', handleInitialized);
        };
    }, []);


    if (!isI18nInitialized) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
        </div>
      );
    }

    const isAuthPage = location.pathname === '/' || location.pathname === '/signup';

    return (
        <>
            <div className="flex flex-col min-h-screen font-sans text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900">
                <Toaster position="top-center" reverseOrder={false} />
                {!isAuthPage && <Navbar />}
                <main className="flex-grow">
                    <AnimatePresence mode="wait">
                        <Routes location={location} key={location.pathname}>
                            <Route path="/" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/help" element={<Help />} />

                            {/* Protected Routes */}
                            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                            <Route path="/marketplace" element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                            <Route path="/my-listings" element={<ProtectedRoute><MyListings /></ProtectedRoute>} />
                            <Route path="/add-crop" element={<ProtectedRoute><AddCrop /></ProtectedRoute>} />
                            <Route path="/edit-crop/:cropId" element={<ProtectedRoute><AddCrop /></ProtectedRoute>} />
                            <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                            <Route path="/crop/:cropId" element={<ProtectedRoute><CropDetail /></ProtectedRoute>} />
                            <Route path="/crop-health" element={<ProtectedRoute><CropHealth /></ProtectedRoute>} />
                            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                        </Routes>
                    </AnimatePresence>
                </main>
                {!isAuthPage && <Footer />}
            </div>
            {user && <Chatbot />}
        </>
    );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
            <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;