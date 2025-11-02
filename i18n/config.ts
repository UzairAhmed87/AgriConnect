import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Asynchronously load translations and initialize i18next
const initI18n = async () => {
  try {
    const [enRes, urRes] = await Promise.all([
      fetch('./i18n/locales/en.json'),
      fetch('./i18n/locales/ur.json')
    ]);

    if (!enRes.ok || !urRes.ok) {
      throw new Error('Failed to fetch translation files');
    }

    const en = await enRes.json();
    const ur = await urRes.json();

    i18n
      .use(initReactI18next)
      .init({
        resources: {
          en: { translation: en },
          ur: { translation: ur },
        },
        lng: localStorage.getItem('language') || 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
      });
  } catch (error) {
    console.error("Failed to initialize i18next:", error);
  }
};

initI18n();

export default i18n;
