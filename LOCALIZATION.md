# Localization Guide

The Windy plugin now supports **French** and **English** localization.

## How It Works

### Automatic Language Detection

The plugin automatically detects the user's language preference in this order:

1. **Windy's locale** (if available via `window.windy.locale`)
2. **Browser language** (from `navigator.language`)
3. **Default to English** if neither is available

### Supported Languages

- 🇬🇧 **English (en)** - Default
- 🇫🇷 **French (fr)**

## Translation Files

Translations are stored in:
- `src/locales/en.ts` - English translations
- `src/locales/fr.ts` - French translations
- `src/locales/index.ts` - Locale detection and translation getter

## Localized Strings

All user-facing strings are now localized:

### UI Controls
- Refresh button tooltip
- "Wave Height" / "Hauteur de vague"
- "Period" / "Période"
- "Meters" / "Mètres"
- "Feet" / "Pieds"

### Popup Statistics
- "Height" / "Hauteur"
- "Hmax" / "Hmax" (same in both languages)
- "Period" / "Période"
- "Direction" / "Direction"

### Time Formatting
- "just now" / "à l'instant"
- "min ago" / "min"
- "ago" / "il y a"
- Time units (h, min, s)

### Footer
- "See more at" / "Voir plus sur"

## Adding New Languages

To add a new language:

1. Create a new translation file: `src/locales/[lang].ts`
2. Export all required keys (see `en.ts` for the structure)
3. Add the language to the `translations` object in `src/locales/index.ts`
4. Update the `Locale` type to include the new language code

Example:

```typescript
// src/locales/es.ts
export const es = {
    refresh: "Actualizar datos de boyas",
    waveHeight: "Altura de ola",
    // ... all other keys
};

// src/locales/index.ts
import { es } from './es';
export type Locale = 'en' | 'fr' | 'es';
const translations: Record<Locale, Translations> = {
    en,
    fr,
    es, // Add new language
};
```

## Testing

To test different languages:

1. **Change browser language**: Set your browser's language preference to French
2. **Use Windy's locale**: If Windy exposes `window.windy.locale`, set it to `'fr'`
3. **Manual override**: Temporarily modify `detectLocale()` to return `'fr'` for testing

## Implementation Details

- Translations are loaded once on component mount
- The `t` variable holds the current translations object
- All strings use the `t.key` pattern for access
- Time formatting functions handle language-specific formatting (e.g., French doesn't use "ago" suffix)

## Notes

- The locale is detected once when the plugin loads
- If you need to change language dynamically, you would need to add a language switcher UI and reload translations
- Cardinal directions (N, NE, E, etc.) are not localized as they're universal abbreviations

