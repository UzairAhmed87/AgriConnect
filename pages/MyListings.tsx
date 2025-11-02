import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import { PageWrapper } from '../components/common/PageWrapper';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { getCropsByFarmer, deleteCrop } from '../services/dbService';
import { Crop, UserRole } from '../types';
import { Plus, Edit, Trash2, Wheat } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const MyListings: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [listings, setListings] = useState<Crop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getCropsByFarmer(user.uid)
                .then(data => {
                    setListings(data);
                    setLoading(false);
                })
                .catch(console.error);
        }
    }, [user]);
    
    if (user?.role !== UserRole.FARMER) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleDelete = (cropId: string) => {
        toast((toastInstance) => (
            <div className="flex flex-col gap-2">
                <p>Are you sure you want to delete this listing?</p>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                            deleteCrop(cropId).then(() => {
                                setListings(prev => prev.filter(c => c.id !== cropId));
                                toast.success('Listing deleted!');
                            });
                            toast.dismiss(toastInstance.id);
                        }}
                    >
                        Delete
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toast.dismiss(toastInstance.id)}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        ), { duration: 5000 });
    };
    
    if (loading) {
      return <PageWrapper title={t('myListings.title')}><div className="text-center">{t('common.loading')}</div></PageWrapper>;
    }

    return (
        <PageWrapper title={t('myListings.title')}>
            <div className="flex justify-end mb-6">
                <Button onClick={() => navigate('/add-crop')}>
                    <Plus size={20} className="me-2" />
                    {t('nav.addCrop')}
                </Button>
            </div>

            {listings.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <Wheat size={48} className="mx-auto text-primary mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No listings yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">Get started by adding your first crop to the marketplace.</p>
                    <Button onClick={() => navigate('/add-crop')}>
                         {t('nav.addCrop')}
                    </Button>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Crop</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Price</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Quantity</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {listings.map(crop => (
                                    <motion.tr key={crop.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-cover" src={crop.imageUrl} alt={crop.cropName} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{crop.cropName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">PKR {crop.price} /kg</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{crop.quantity} kg</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${crop.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {crop.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex gap-2 justify-end">
                                                <Button variant="outline" size="sm" onClick={() => navigate(`/edit-crop/${crop.id}`)}><Edit size={16} /></Button>
                                                <Button variant="secondary" size="sm" onClick={() => handleDelete(crop.id)}><Trash2 size={16} /></Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
};