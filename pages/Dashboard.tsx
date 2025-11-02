import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Crop, Order, UserRole, OrderStatus, WeatherData } from '../types';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/common/PageWrapper';
import { WeatherWidget } from '../components/specific/WeatherWidget';
import { listenForFarmerCrops, listenForFarmerOrders, getCrops } from '../services/dbService';
import { Package, DollarSign, ListOrdered, ArrowRight, Lightbulb, CheckSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { CropCard } from '../components/specific/CropCard';
import { getWeatherData } from '../services/weatherService';
import { getWeatherTip } from '../services/geminiService';

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string | number, color: string }) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md flex items-center">
        <div className={`p-3 rounded-full mr-4 ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const FarmerDashboard: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [stats, setStats] = useState({ listings: 0, sold: 0, pendingOrders: 0 });
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [farmerCrops, setFarmerCrops] = useState<Crop[]>([]);
    const [farmerOrders, setFarmerOrders] = useState<Order[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [tip, setTip] = useState<string>('');
    const [isWeatherLoading, setIsWeatherLoading] = useState(true);
    const [isTipLoading, setIsTipLoading] = useState(true);
    const navigate = useNavigate();

    // Effect for real-time data listeners
    useEffect(() => {
        if (!user) return;

        const unsubscribeCrops = listenForFarmerCrops(user.uid, setFarmerCrops);
        const unsubscribeOrders = listenForFarmerOrders(user.uid, setFarmerOrders);

        return () => {
            unsubscribeCrops();
            unsubscribeOrders();
        };
    }, [user]);

    // Effect to calculate stats and derive recent orders from real-time data
    useEffect(() => {
        const completedCount = farmerOrders.filter(o => o.status === OrderStatus.COMPLETED).length;
        const pendingCount = farmerOrders.filter(o => o.status === OrderStatus.PENDING).length;

        const revenue = farmerOrders
            .filter(o => o.status === OrderStatus.COMPLETED)
            .reduce((sum, order) => sum + (order.totalPrice || 0), 0);

        setStats({
            listings: farmerCrops.length,
            sold: completedCount,
            pendingOrders: pendingCount,
        });
        setTotalRevenue(revenue);

        setRecentOrders(farmerOrders.slice(0, 3));
    }, [farmerCrops, farmerOrders]);


    useEffect(() => {
        if (user?.location) {
            setIsWeatherLoading(true);
            setIsTipLoading(true);
            getWeatherData(user.location)
                .then(data => {
                    setWeather(data);
                    setIsWeatherLoading(false);
                    const lang = i18n.language === 'ur' ? 'ur' : 'en';
                    getWeatherTip(data, lang).then(tipData => {
                        setTip(tipData);
                        setIsTipLoading(false);
                    }).catch(err => {
                        console.error("Tip generation failed:", err);
                        setIsTipLoading(false);
                    });
                })
                .catch(err => {
                    console.error("Weather fetch failed:", err);
                    setIsWeatherLoading(false);
                    setIsTipLoading(false);
                });
        } else {
            setIsWeatherLoading(false);
            setIsTipLoading(false);
        }
    }, [user?.location, i18n.language]);

    return (
        <PageWrapper title={t('dashboard.farmer.title')}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                         <StatCard icon={<Package size={24} className="text-white"/>} title={t('dashboard.farmer.stat.listings')} value={stats.listings} color="bg-blue-500"/>
                         <StatCard icon={<ListOrdered size={24} className="text-white"/>} title={t('dashboard.farmer.stat.pending')} value={stats.pendingOrders} color="bg-yellow-500"/>
                         <StatCard icon={<CheckSquare size={24} className="text-white"/>} title={t('dashboard.farmer.stat.sold')} value={stats.sold} color="bg-green-500"/>
                         <StatCard icon={<DollarSign size={24} className="text-white"/>} title={t('dashboard.farmer.stat.revenue')} value={`PKR ${totalRevenue}`} color="bg-purple-500"/>
                    </div>
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">Recent Orders</h3>
                            <Link to="/orders" className="text-sm text-primary hover:underline flex items-center">View All <ArrowRight size={14} className="ml-1"/></Link>
                        </div>
                        <div className="space-y-4">
                            {recentOrders.length > 0 ? recentOrders.map(order => (
                                <div key={order.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div>
                                        <p className="font-semibold">{order.cropName}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {order.quantity}kg - Total: PKR {order.totalPrice.toFixed(2)}</p>
                                    </div>
                                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{order.status}</span>
                                </div>
                            )) : <p className="text-gray-500 dark:text-gray-400">No recent orders.</p>}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                    {user?.location && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <div className="flex items-center mb-3">
                                <Lightbulb size={24} className="text-yellow-400 mr-3"/>
                                <h3 className="text-xl font-semibold">{t('dashboard.tip.title')}</h3>
                            </div>
                            {isTipLoading ? (
                                <p className="text-gray-500 dark:text-gray-400 animate-pulse">{t('dashboard.tip.loading')}</p>
                            ) : (
                                <p className="text-gray-600 dark:text-gray-300">{tip}</p>
                            )}
                        </div>
                    )}
                    <WeatherWidget weather={weather} loading={isWeatherLoading} locationIsSet={!!user?.location} />
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
                        <h3 className="text-xl font-semibold mb-4">Ready to sell more?</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Add a new crop to your listings and reach more buyers.</p>
                        <Button onClick={() => navigate('/add-crop')}>Add New Crop</Button>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

const BuyerDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [recentCrops, setRecentCrops] = useState<Crop[]>([]);
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [isWeatherLoading, setIsWeatherLoading] = useState(true);

    useEffect(() => {
        // FIX: The `getCrops` function expects an options object. To get 4 crops, we pass { limit: 4 }.
        getCrops({ limit: 4 }).then(setRecentCrops);
        if (user?.location) {
            setIsWeatherLoading(true);
            getWeatherData(user.location)
                .then(data => setWeather(data))
                .catch(err => console.error(err))
                .finally(() => setIsWeatherLoading(false));
        } else {
            setIsWeatherLoading(false);
        }
    }, [user?.location]);

    return (
        <PageWrapper title={t('dashboard.buyer.title')}>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold">New in the Marketplace</h3>
                            <Link to="/marketplace" className="text-sm text-primary hover:underline flex items-center">View All <ArrowRight size={14} className="ml-1"/></Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {recentCrops.map(crop => <CropCard key={crop.id} crop={crop} />)}
                        </div>
                    </div>
                </div>
                <div className="space-y-6">
                     <WeatherWidget weather={weather} loading={isWeatherLoading} locationIsSet={!!user?.location} />
                </div>
            </div>
        </PageWrapper>
    );
};


export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === UserRole.FARMER ? <FarmerDashboard /> : <BuyerDashboard />;
};
