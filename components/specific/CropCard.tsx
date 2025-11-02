import React from 'react';
import { Crop, UserRole } from '../../types';
import { useTranslation } from 'react-i18next';
import { MapPin, ShoppingCart, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../common/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getOrCreateChat } from '../../services/dbService';

interface CropCardProps {
  crop: Crop;
}

export const CropCard: React.FC<CropCardProps> = ({ crop }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const handleMessageFarmer = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking the message button
    if (!user || user.uid === crop.farmerId) return;
    try {
      const chatId = await getOrCreateChat(user.uid, crop.farmerId);
      navigate('/messages', { state: { chatId } });
    } catch (error) {
      console.error("Failed to start chat:", error);
    }
  };

  return (
    <motion.div 
      variants={cardVariants}
      onClick={() => navigate(`/crop/${crop.id}`)}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-105 hover:shadow-xl flex flex-col cursor-pointer"
    >
      <img src={crop.imageUrl} alt={crop.cropName} className="w-full h-48 object-cover" />
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{crop.cropName}</h3>
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
          <MapPin size={14} className="me-2" />
          <span>{crop.location}</span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm flex-grow line-clamp-2">{crop.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <p className="text-lg font-bold text-primary">
            PKR {crop.price} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">/{t('crop.pricePerKg')}</span>
          </p>
          <div className="flex items-center gap-2">
            {user?.role === UserRole.BUYER && (
              <Button onClick={handleMessageFarmer} size="sm" variant="outline" className="!p-2">
                 <MessageCircle size={16} />
              </Button>
            )}
            <Button onClick={(e) => { e.stopPropagation(); navigate(`/crop/${crop.id}`)}} size="sm">
               <ShoppingCart size={16} />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};