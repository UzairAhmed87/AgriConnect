
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageWrapper } from '../components/common/PageWrapper';
import { useAuth } from '../hooks/useAuth';
import { getOrdersForUser, updateOrderStatus, completeOrder } from '../services/dbService';
import { Order, UserRole, OrderStatus, AugmentedOrder } from '../types';
import { Button } from '../components/common/Button';
import toast from 'react-hot-toast';

export const Orders: React.FC = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [orders, setOrders] = useState<AugmentedOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = () => {
        if (user) {
            setLoading(true);
            getOrdersForUser(user.uid, user.role)
                .then(data => {
                    setOrders(data);
                    setLoading(false);
                })
                .catch(console.error);
        }
    };

    useEffect(fetchOrders, [user]);
    
    const handleStatusUpdate = (order: AugmentedOrder, status: OrderStatus) => {
        updateOrderStatus(order, status).then(() => {
            toast.success(`Order ${status.toLowerCase()}!`);
            fetchOrders(); // Refresh the list
        });
    };

    const handleCompleteOrder = (order: AugmentedOrder) => {
        const promise = completeOrder(order);
        toast.promise(promise, {
            loading: 'Completing order...',
            success: () => {
                fetchOrders(); // Refresh the list after success
                return 'Order completed successfully!';
            },
            error: (err) => `Failed to complete order: ${err.toString()}`,
        });
    };
    
    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
            case OrderStatus.ACCEPTED: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300';
            case OrderStatus.COMPLETED: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
            case OrderStatus.REJECTED: return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    const renderFarmerView = () => (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crop</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Buyer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {orders.map(order => (
                        <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{order.cropName || 'N/A'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Qty: {order.quantity || 0}kg</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.buyerName || '...'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">PKR {order.totalPrice?.toFixed(2) ?? '0.00'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                    {t(`orders.status.${order.status.toLowerCase()}`)}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                {order.status === OrderStatus.PENDING && (
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={() => handleStatusUpdate(order, OrderStatus.ACCEPTED)}>Accept</Button>
                                        <Button size="sm" variant="secondary" onClick={() => handleStatusUpdate(order, OrderStatus.REJECTED)}>Reject</Button>
                                    </div>
                                )}
                                {order.status === OrderStatus.ACCEPTED && (
                                    <Button size="sm" onClick={() => handleCompleteOrder(order)}>
                                        {t('orders.completeOrder')}
                                    </Button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
    const renderBuyerView = () => (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Crop</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Farmer</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                     {orders.map(order => (
                        <tr key={order.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">{order.cropName || 'N/A'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Qty: {order.quantity || 0}kg</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.farmerName || '...'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">PKR {order.totalPrice?.toFixed(2) ?? '0.00'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                     {t(`orders.status.${order.status.toLowerCase()}`)}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const title = user?.role === UserRole.FARMER ? t('orders.received') : t('orders.myOrders');

    return (
        <PageWrapper title={title}>
            {loading ? (
                <div className="text-center">{t('common.loading')}</div>
            ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No orders found.</div>
            ) : user?.role === UserRole.FARMER ? (
                renderFarmerView()
            ) : (
                renderBuyerView()
            )}
        </PageWrapper>
    );
};
