
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/common/PageWrapper';
import { getCropById, placeOrder, getOrCreateChat } from '../services/dbService';
import { Crop, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { MapPin, User, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export const CropDetail: React.FC = () => {
    const { t } = useTranslation();
    const { cropId } = useParams<{ cropId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [crop, setCrop] = useState<Crop | null | undefined>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [isOrdering, setIsOrdering] = useState(false);

    useEffect(() => {
        if (cropId) {
            getCropById(cropId).then(data => {
                setCrop(data);
                setLoading(false);
            });
        }
    }, [cropId]);

    const handlePlaceOrder = async () => {
        if (!user || !crop) return;
        setIsOrdering(true);
        try {
            const orderDetails = {
                buyerId: user.uid,
                farmerId: crop.farmerId,
                cropId: crop.id,
                cropName: crop.cropName,
                quantity: quantity,
                totalPrice: quantity * crop.price,
            };
            await placeOrder(orderDetails, user.name);
            toast.success('Order placed successfully!');
            navigate('/orders');
        } catch (error) {
            toast.error('Failed to place order.');
            console.error(error);
        } finally {
            setIsOrdering(false);
        }
    };

    const handleMessageFarmer = async () => {
        if (!user || !crop || user.uid === crop.farmerId) return;
        try {
            const chatId = await getOrCreateChat(user.uid, crop.farmerId);
            navigate('/messages', { state: { chatId } });
        } catch (error) {
            console.error("Failed to start chat:", error);
            toast.error("Could not start a conversation.");
        }
    };

    if (loading) return <PageWrapper title=""><div className="text-center">{t('common.loading')}</div></PageWrapper>;
    if (!crop) return <PageWrapper title="Error"><div className="text-center">Crop not found.</div></PageWrapper>;

    return (
        <PageWrapper title={crop.cropName}>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    <img src={crop.imageUrl} alt={crop.cropName} className="w-full h-96 object-cover"/>
                    <div className="p-8 flex flex-col">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{crop.cropName}</h2>
                        <p className="text-gray-600 dark:text-gray-300 mt-4">{crop.description}</p>
                        
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center text-gray-700 dark:text-gray-200">
                                <User size={20} className="me-3 text-primary" />
                                <span>Sold by: <strong>{crop.farmerName}</strong></span>
                            </div>
                            <div className="flex items-center text-gray-700 dark:text-gray-200">
                                <MapPin size={20} className="me-3 text-primary" />
                                <span>Location: <strong>{crop.location}</strong></span>
                            </div>
                            <div className="flex items-center text-gray-700 dark:text-gray-200">
                                <Package size={20} className="me-3 text-primary" />
                                <span>Available: <strong>{crop.quantity} {t('crop.quantity')}</strong></span>
                            </div>
                        </div>

                        <div className="mt-8 flex-grow flex flex-col justify-end">
                            <p className="text-4xl font-bold text-primary mb-6">
                                PKR {crop.price} <span className="text-lg font-normal text-gray-500 dark:text-gray-400">/ {t('crop.pricePerKg')}</span>
                            </p>

                            {user?.role === UserRole.BUYER && (
                                <>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-grow">
                                            <label htmlFor="quantity" className="sr-only">{t('crop.quantity')}</label>
                                            <input
                                                type="number"
                                                id="quantity"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value)))}
                                                min="1"
                                                max={crop.quantity}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                        <Button onClick={handlePlaceOrder} isLoading={isOrdering} className="w-48">
                                            {t('crop.placeOrder')}
                                        </Button>
                                    </div>
                                    <Button onClick={handleMessageFarmer} variant="outline" className="w-full mt-4">
                                        {t('crop.messageFarmer')}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};
