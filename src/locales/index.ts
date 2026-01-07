import { en } from './en';
import { fr } from './fr';

export type Locale = 'en' | 'fr';
export type Translations = typeof en;

const translations: Record<Locale, Translations> = {
    en,
    fr,
};

/**
 * Detect user's preferred language
 * Checks Windy's locale first, then browser language
 */
export function detectLocale(): Locale {
    // Try to get locale from Windy if available
    if (typeof window !== 'undefined') {
        const windy = (window as any).windy;
        if (windy?.locale) {
            const windyLang = windy.locale.toLowerCase();
            if (windyLang.startsWith('fr')) return 'fr';
            if (windyLang.startsWith('en')) return 'en';
        }
        
        // Fall back to browser language
        const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
        const lang = browserLang.toLowerCase();
        if (lang.startsWith('fr')) return 'fr';
    }
    
    // Default to English
    return 'en';
}

/**
 * Get translations for the current locale
 */
export function getTranslations(locale?: Locale): Translations {
    const targetLocale = locale || detectLocale();
    return translations[targetLocale] || translations.en;
}

