import type { ExternalPluginConfig } from '@windy/interfaces';

const config: ExternalPluginConfig = {
    name: 'windy-plugin-the-buoy',
    version: '0.1.11',
    icon: '🌊',
    title: 'The Buoy',
    description:
        'Wave buoys from trusted sources (Candhis, NOAA NDBC) with live readings — Powered by The Buoy (labouee.app).',
    author: 'The Buoy',
    repository: 'https://github.com/thomascailhol/the-buoy-windy-plugin',
    desktopUI: 'embedded',
    mobileUI: 'small',
    routerPath: '/the-buoy',
    private: false,
};

export default config;
