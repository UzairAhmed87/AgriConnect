import { WeatherData } from '../types';

const API_KEY = '06b72c92869c17c791f5a0dce4b009fd';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/direct';

// Helper to get a simple icon
const getWeatherIcon = (iconCode: string): string => {
    const firstDigit = iconCode.charAt(0);
    switch (firstDigit) {
        case '0': return '☀️'; // Clear
        case '1': return iconCode.endsWith('n') ? '🌙' : '☀️';
        case '2': return '⛈️'; // Thunderstorm
        case '3': return '🌦️'; // Drizzle
        case '5': return '🌧️'; // Rain
        case '6': return '❄️'; // Snow
        case '7': return '🌫️'; // Atmosphere
        case '8': return iconCode === '800' ? '☀️' : '☁️'; // Clouds
        default: return '🤷';
    }
};

export const getWeatherData = async (location: string): Promise<WeatherData> => {
    try {
        // 1. Geocode location string to get lat/lon
        const geoResponse = await fetch(`${GEO_URL}?q=${location}&limit=1&appid=${API_KEY}`);
        if (!geoResponse.ok) throw new Error('Failed to geocode location');
        const geoData = await geoResponse.json();
        if (!geoData || geoData.length === 0) throw new Error('Location not found');
        
        const { lat, lon } = geoData[0];

        // 2. Fetch current weather and forecast data
        const weatherResponse = await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
        const forecastResponse = await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);

        if (!weatherResponse.ok || !forecastResponse.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const currentData = await weatherResponse.json();
        const forecastData = await forecastResponse.json();

        // Process forecast data to get one forecast per day for the next 5 days
        const dailyForecasts: any[] = [];
        const forecastList = forecastData.list.filter((item: any) => {
             // Get forecast for midday
            return item.dt_txt.includes("12:00:00");
        });
        
        for (let i = 0; i < 5 && i < forecastList.length; i++) {
            const dayData = forecastList[i];
            dailyForecasts.push({
                day: new Date(dayData.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
                temp: Math.round(dayData.main.temp),
                icon: getWeatherIcon(dayData.weather[0].icon),
            });
        }
        
        return {
            temp: Math.round(currentData.main.temp),
            humidity: currentData.main.humidity,
            description: currentData.weather[0].description,
            icon: getWeatherIcon(currentData.weather[0].icon),
            forecast: dailyForecasts,
        };

    } catch (error) {
        console.error("Error fetching weather data:", error);
        // Return a default/error state
        throw error;
    }
};
