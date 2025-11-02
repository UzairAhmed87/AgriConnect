
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/common/PageWrapper';
import { getCrops } from '../services/dbService';
import { Crop } from '../types';
import { CropCard } from '../components/specific/CropCard';
import { motion, AnimatePresence } from 'framer-motion';

export const Marketplace: React.FC = () => {
    const { t } = useTranslation();
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        getCrops().then(data => {
            setCrops(data);
            setLoading(false);
        });
    }, []);

    const filteredCrops = crops.filter(crop =>
        crop.cropName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

    return (
        <PageWrapper title={t('marketplace.title')}>
            <div className="mb-6">
                <input
                    type="text"
                    placeholder={t('marketplace.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-lg px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
                />
            </div>

            {loading ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-80 animate-pulse"></div>
                    ))}
                 </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    <AnimatePresence>
                        {filteredCrops.map(crop => (
                           <CropCard key={crop.id} crop={crop} />
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </PageWrapper>
    );
};
