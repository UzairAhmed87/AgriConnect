import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Navigate } from 'react-router-dom';
import { PageWrapper } from '../components/common/PageWrapper';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { addCrop, getCropById, updateCrop } from '../services/dbService';
import { UserRole, Crop } from '../types';
import toast from 'react-hot-toast';

export const AddCrop: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cropId } = useParams<{ cropId: string }>();
    const isEditing = Boolean(cropId);
    
    // FIX: Add 'category' to the form state to satisfy the Crop type requirements.
    const [formData, setFormData] = useState({
        cropName: '',
        price: '',
        quantity: '',
        description: '',
        category: 'vegetables' as 'vegetables' | 'fruits' | 'grains' | 'spices',
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditing);

    useEffect(() => {
        if (isEditing && cropId) {
            getCropById(cropId).then(crop => {
                if (crop) {
                    // FIX: Populate the 'category' field when editing an existing crop.
                    setFormData({
                        cropName: crop.cropName,
                        price: String(crop.price),
                        quantity: String(crop.quantity),
                        description: crop.description,
                        category: crop.category,
                    });
                    setImagePreview(crop.imageUrl);
                }
                setPageLoading(false);
            });
        }
    }, [cropId, isEditing]);

    // FIX: Widen the event type to include HTMLSelectElement for the new category dropdown.
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);

        // --- Cloudinary Configuration ---
        // Your Cloud Name is pre-filled.
        // You MUST create an "unsigned" upload preset in your Cloudinary account for this to work.
        // 1. Go to your Cloudinary Dashboard -> Settings (gear icon) -> Upload
        // 2. Scroll to "Upload presets", click "Add upload preset"
        // 3. Change "Signing Mode" from "Signed" to "Unsigned"
        // 4. Use 'agriconnect_unsigned' as the preset name and Save.
        const CLOUDINARY_CLOUD_NAME = 'dfojjsfgy';
        const CLOUDINARY_UPLOAD_PRESET = 'agriconnect_unsigned';
        // --- End Configuration ---

        let imageUrl = isEditing && imagePreview ? imagePreview : '';

        // If a new image was selected, upload it to Cloudinary
        if (imageFile) {
            const uploadFormData = new FormData();
            uploadFormData.append('file', imageFile);
            uploadFormData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: uploadFormData,
                });
                const data = await response.json();
                if (data.secure_url) {
                    imageUrl = data.secure_url;
                } else {
                    throw new Error('Image URL not returned from Cloudinary');
                }
            } catch (error) {
                console.error("Cloudinary upload failed:", error);
                toast.error("Image upload failed. Please check your Cloudinary configuration and try again.");
                setLoading(false);
                return;
            }
        }
        
        if (!imageUrl) {
            toast.error('An image is required. Please select an image to upload.');
            setLoading(false);
            return;
        }

        // FIX: Include 'category' from the form data in the object sent to the database.
        const cropDetails = {
            farmerId: user.uid,
            farmerName: user.name,
            cropName: formData.cropName,
            category: formData.category,
            price: parseFloat(formData.price),
            quantity: parseInt(formData.quantity, 10),
            description: formData.description,
            location: user.location || 'Unknown',
            imageUrl: imageUrl,
        };

        try {
            if (isEditing && cropId) {
                await updateCrop(cropId, cropDetails);
                toast.success('Listing updated successfully!');
            } else {
                const newCrop = {
                    ...cropDetails,
                    status: 'available' as const,
                };
                await addCrop(newCrop);
                toast.success('Listing added successfully!');
            }
            navigate('/my-listings');
        } catch (error) {
            console.error("Failed to save crop", error);
            toast.error("An error occurred while saving the crop.");
            setLoading(false);
        }
    };
    
    if (user?.role !== UserRole.FARMER) {
        return <Navigate to="/dashboard" replace />;
    }

    if (pageLoading) {
        return <PageWrapper title={t('common.loading')}><div>Loading crop data...</div></PageWrapper>;
    }

    return (
        <PageWrapper title={isEditing ? 'Edit Crop Listing' : t('addCrop.title')}>
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input id="cropName" label={t('addCrop.name')} value={formData.cropName} onChange={handleInputChange} required />
                    {/* FIX: Add a select input for the mandatory 'category' field. */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                        <select
                            id="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600"
                            required
                        >
                            <option value="vegetables">Vegetables</option>
                            <option value="fruits">Fruits</option>
                            <option value="grains">Grains</option>
                            <option value="spices">Spices</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input id="price" label={t('addCrop.price')} type="number" step="0.01" value={formData.price} onChange={handleInputChange} required />
                        <Input id="quantity" label={t('addCrop.quantity')} type="number" value={formData.quantity} onChange={handleInputChange} required />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('addCrop.description')}</label>
                        <textarea id="description" value={formData.description} onChange={handleInputChange} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600" required></textarea>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('addCrop.image')}</label>
                         <div className="mt-1 flex items-center gap-4">
                             {imagePreview && <img src={imagePreview} alt="Crop preview" className="h-20 w-20 rounded-md object-cover" />}
                             <input type="file" onChange={handleImageChange} accept="image/*" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"/>
                         </div>
                    </div>
                    <Button type="submit" className="w-full" isLoading={loading}>{isEditing ? 'Update Listing' : t('addCrop.button')}</Button>
                </form>
            </div>
        </PageWrapper>
    );
};
