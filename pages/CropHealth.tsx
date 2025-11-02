
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { PageWrapper } from '../components/common/PageWrapper';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { UserRole, PlantIdHealthAssessment } from '../types';
import { checkCropHealth } from '../services/plantIdService';
import { getPlantDiseaseInfo } from '../services/geminiService';
import { UploadCloud, Leaf, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const CropHealth: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<PlantIdHealthAssessment | null>(null);
    const [geminiAnalysis, setGeminiAnalysis] = useState<{ description: string, solution: string } | null>(null);
    const [isGeminiLoading, setIsGeminiLoading] = useState(false);

    const fileToBase64 = (file: File): Promise<{base64: string, mimeType: string}> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const resultStr = reader.result as string;
                const base64 = resultStr.split(',')[1];
                const mimeType = resultStr.split(',')[0].split(':')[1].split(';')[0];
                resolve({ base64, mimeType });
            };
            reader.onerror = error => reject(error);
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setResult(null); // Reset result on new image
            setGeminiAnalysis(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile) {
            toast.error('Please upload an image first.');
            return;
        }
        setLoading(true);
        setResult(null);
        setGeminiAnalysis(null);
        try {
            const analysisResult = await checkCropHealth(imageFile);
            setResult(analysisResult);
            toast.success('Initial analysis complete!');

            if (!analysisResult.is_healthy && analysisResult.disease_suggestions.length > 0) {
                toast('Getting detailed analysis from AI...');
                setIsGeminiLoading(true);
                const topSuggestion = analysisResult.disease_suggestions[0];
                const { base64, mimeType } = await fileToBase64(imageFile);
                const lang = i18n.language as 'en' | 'ur';

                const geminiData = await getPlantDiseaseInfo(base64, mimeType, topSuggestion.name, lang);
                setGeminiAnalysis(geminiData);
                toast.success('Detailed AI analysis received!');
                setIsGeminiLoading(false);
            }

        } catch (error: any) {
            console.error("Analysis failed:", error);
            toast.error(`Analysis failed: ${error.message || 'Please try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    if (user?.role !== UserRole.FARMER) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <PageWrapper title={t('cropHealth.title')}>
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-6">{t('cropHealth.description')}</p>
                    <div className="flex flex-col items-center gap-6">
                        <label htmlFor="crop-image-upload" className="cursor-pointer">
                            <div className="w-64 h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Crop preview" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <>
                                        <UploadCloud size={48} />
                                        <span className="mt-2 font-semibold">{t('cropHealth.upload')}</span>
                                    </>
                                )}
                            </div>
                            <input id="crop-image-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
                        </label>
                        <Button onClick={handleAnalyze} isLoading={loading} disabled={!imageFile}>
                            {loading ? t('cropHealth.analyzing') : t('cropHealth.analyze')}
                        </Button>
                    </div>
                </div>

                {result && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
                        {result.is_healthy ? (
                            <div className="text-center text-green-600 dark:text-green-400">
                                <ShieldCheck size={48} className="mx-auto mb-4" />
                                <h3 className="text-2xl font-bold">{t('cropHealth.healthy')}</h3>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-2xl font-bold text-center mb-6 text-red-600 dark:text-red-400 flex items-center justify-center gap-2">
                                    <AlertTriangle /> {t('cropHealth.issuesFound')}
                                </h3>
                                <div className="space-y-6">
                                    {result.disease_suggestions.map((suggestion, index) => (
                                        <div key={suggestion.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div className="flex justify-between items-center flex-wrap gap-2">
                                                <h4 className="text-xl font-semibold">{suggestion.name}</h4>
                                                <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">{t('cropHealth.probability')}: {(suggestion.probability * 100).toFixed(1)}%</span>
                                            </div>
                                            
                                            {index === 0 && (
                                                <>
                                                {isGeminiLoading && (
                                                    <div className="mt-4 text-center">
                                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                                        <p className="mt-2 text-gray-500 dark:text-gray-400">Fetching detailed analysis from AI...</p>
                                                    </div>
                                                )}
                                                {geminiAnalysis && !isGeminiLoading && (
                                                    <>
                                                        <div className="mt-6 border-t pt-4 dark:border-gray-700">
                                                            <h5 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">{t('cropHealth.description.title')}</h5>
                                                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{geminiAnalysis.description}</p>
                                                        </div>
                                                        <div className="mt-4">
                                                            <h5 className="font-semibold text-lg mb-2 text-gray-800 dark:text-gray-200">{t('cropHealth.treatment')}</h5>
                                                            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{geminiAnalysis.solution}</p>
                                                        </div>
                                                    </>
                                                )}
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </div>
        </PageWrapper>
    );
};
