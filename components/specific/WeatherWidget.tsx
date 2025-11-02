
import React from 'react';
import { useTranslation } from 'react-i18next';
import { WeatherData } from '../../types';
import { Link } from 'react-router-dom';

interface WeatherWidgetProps {
    weather: WeatherData | null;
    loading: boolean;
    locationIsSet: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ weather, loading, locationIsSet }) => {
    const { t } = useTranslation();

    if (loading) {
        return <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md animate-pulse h-48"></div>;
    }
    
    if (!locationIsSet) {
        return (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-gray-800 dark:text-gray-200">
                <h3 className="text-xl font-semibold mb-2">{t('weather.title')}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                    {t('weather.setLocation')}{' '}
                    <Link to="/profile" className="text-primary underline">
                        {t('weather.profileLink')}
                    </Link>{' '}
                    {t('weather.toSeeForecast')}
                </p>
            </div>
        );
    }
    
    if (!weather) {
        return <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-gray-800 dark:text-gray-200">
            <h3 className="text-xl font-semibold mb-2">{t('weather.title')}</h3>
            <p className="text-gray-500 dark:text-gray-400">Could not load weather data.</p>
        </div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-gray-800 dark:text-gray-200">
            <h3 className="text-xl font-semibold mb-4">{t('weather.title')}</h3>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-5xl font-bold">{weather.temp}°C</div>
                    <div className="text-gray-500 dark:text-gray-400">{weather.description}</div>
                </div>
                <div className="text-5xl">{weather.icon}</div>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('weather.humidity')}: {weather.humidity}%</div>
            <div className="flex justify-between">
                {weather.forecast.map((day, index) => (
                    <div key={index} className="text-center">
                        <div className="font-semibold">{day.day}</div>
                        <div className="text-2xl my-1">{day.icon}</div>
                        <div>{day.temp}°C</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
