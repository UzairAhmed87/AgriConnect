import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/common/PageWrapper';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-200 dark:border-gray-700">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full py-5 text-left font-semibold text-lg text-gray-800 dark:text-gray-200"
            >
                <span>{title}</span>
                <ChevronDown className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-5 text-gray-600 dark:text-gray-400">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const Help: React.FC = () => {
  const { t } = useTranslation();

  const faqs = [
    {
      q: "How do I sell my crops as a farmer?",
      a: "Navigate to 'My Listings' from the dashboard and click 'Add Crop'. Fill in the details about your crop, including name, price, quantity, and an image. Once submitted, your listing will be visible to all buyers on the Marketplace."
    },
    {
      q: "How can I buy crops?",
      a: "Go to the 'Marketplace' to browse all available crop listings. You can search and filter to find what you need. Click on a listing to view details, then enter the quantity you wish to purchase and click 'Place Order'. The farmer will be notified of your order."
    },
    {
      q: "How does the AI Assistant work?",
      a: "The AI Assistant is available on every page. Click the chat icon to open it. You can ask questions in English or Urdu about farming techniques, market prices, irrigation, and more. The assistant will provide you with helpful and relevant information."
    },
    {
      q: "How do I manage my orders?",
      a: "Visit the 'Orders' page. As a buyer, you can track the status of your orders. As a farmer, you will see orders placed by buyers and can choose to accept or reject them."
    },
    {
      q: "Can I change my profile information?",
      a: "Yes. Go to the 'Profile' page to update your name and location. You can also change your preferred language and switch between light and dark themes."
    }
  ];

  return (
    <PageWrapper title={`${t('nav.help')} & FAQ`}>
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        {faqs.map((faq, index) => (
            <AccordionItem key={index} title={faq.q}>
                <p>{faq.a}</p>
            </AccordionItem>
        ))}
      </div>
    </PageWrapper>
  );
};
