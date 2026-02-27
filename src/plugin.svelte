<div class="buoy-plugin">
    <div class="buoy-plugin__header">
        <h2 class="buoy-plugin__title">{t.title}</h2>
        <button 
            class="buoy-plugin__refresh" 
            on:click={handleRefresh}
            disabled={isRefreshing}
            title={t.refresh}
        >
            <svg 
                class="buoy-plugin__refresh-icon" 
                class:buoy-plugin__refresh-icon--spinning={isRefreshing}
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2"
            >
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
        </button>
    </div>
    
    <div class="buoy-plugin__controls">
        <nav class="switch switch--uiswitch switch--stretch size-s" data-tooltip="Marker Display">
            <a 
                class="switch__item {markerDisplayMode === 'height' ? 'selected' : ''}"
                on:click|stopPropagation={handleHeightClick}
                role="button"
                tabindex="0"
            >
                {t.waveHeight}
            </a>
            <a 
                class="switch__item {markerDisplayMode === 'period' ? 'selected' : ''}"
                on:click|stopPropagation={handlePeriodClick}
                role="button"
                tabindex="0"
            >
                {t.period}
            </a>
            <a
                class="switch__item {markerDisplayMode === 'energy' ? 'selected' : ''}"
                on:click|stopPropagation={handleEnergyClick}
                role="button"
                tabindex="0"
            >
                {t.energy}
            </a>
        </nav>
        
        <nav class="switch switch--uiswitch switch--stretch size-s" data-tooltip="Unit">
            <a 
                class="switch__item {heightUnit === 'meters' ? 'selected' : ''}"
                on:click|stopPropagation={handleMetersClick}
                role="button"
                tabindex="0"
            >
                {t.meters}
            </a>
            <a 
                class="switch__item {heightUnit === 'feet' ? 'selected' : ''}"
                on:click|stopPropagation={handleFeetClick}
                role="button"
                tabindex="0"
            >
                {t.feet}
            </a>
        </nav>
    </div>
    
    <div class="buoy-plugin__footer">
        <PoweredBy variant="light" />
    </div>
</div>

<script lang="ts">
    import { map } from '@windy/map';
    import { onDestroy, onMount } from 'svelte';
    import { getTranslations, detectLocale, type Translations, type Locale } from './locales';
    import PoweredBy from './PoweredBy.svelte';
    import { getPoweredByHtml } from './poweredByHtml';

    declare const L: typeof import('leaflet');

    type ApiMeta = {
        page?: number;
        per_page?: number;
        total_pages?: number;
        timestamp?: string;
    };

    type BuoyReading = {
        id?: number;
        uuid?: string;
        significient_height?: number | null;
        maximum_height?: number | null;
        period?: number | null;
        time?: string;
        water_temperature?: number | null;
        direction?: number | null;
        direction_compass?: string | null;
        unit?: string | null;
        energy_per_wave?: number | null;
        wave_power?: number | null;
    };

    type BuoySummary = {
        id: number;
        name: string;
        lat: number;
        lng: number;
        source?: string | null;
        source_identifier?: string | null;
        last_reading_time?: string | null;
        readings_count?: number;
        last_reading?: BuoyReading | null;
        timezone?: string | null;
        slug?: string | null;
    };

    type BuoysResponse = {
        status?: string;
        data?: {
            buoys?: BuoySummary[];
            count?: number;
        };
        meta?: ApiMeta;
        error?: string;
        message?: string;
    };

    const DEFAULT_BASE_URL = (() => {
        const injected =
            (typeof window !== 'undefined' &&
                ((window as unknown as { WINDY_API_BASE?: string }).WINDY_API_BASE ||
                    (window as unknown as { THEBUOY_API_BASE?: string }).THEBUOY_API_BASE ||
                    (window as unknown as { BUOY_API_BASE?: string }).BUOY_API_BASE)) ||
            null;

        if (injected) return injected;

        const localHostnames = ['localhost', '127.0.0.1', '0.0.0.0'];
        if (typeof window !== 'undefined' && localHostnames.includes(window.location.hostname)) {
            return 'http://localhost:3000/api/windy';
        }

        return 'https://thesurfkit.com/api/windy';
    })();

    let apiBaseUrl = DEFAULT_BASE_URL;

    let buoys: BuoySummary[] = [];
    let markerMap = new Map<number, L.Marker>();
    let openedPopup: L.Popup | null = null;
    let currentPopupBuoy: BuoySummary | null = null;
    let fetchController: AbortController | null = null;
    let isRefreshing = false;
    let markerDisplayMode: 'height' | 'period' | 'energy' = 'height';
    let heightUnit: 'meters' | 'feet' = 'meters';
    let visitorId: string = '';
    let currentLocale: Locale = 'en';
    let t: Translations = getTranslations();

    const VISITOR_ID_STORAGE_KEY = 'the-buoy-visitor-id';

    function getOrCreateVisitorId(): string {
        if (typeof window === 'undefined') {
            return '';
        }

        try {
            // Try to get existing visitor ID from localStorage
            const stored = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
            if (stored) {
                return stored;
            }

            // Generate a new visitor ID
            // Format: timestamp-random (e.g., "1234567890-abc123def456")
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            const newVisitorId = `${timestamp}-${random}`;

            // Store it in localStorage
            localStorage.setItem(VISITOR_ID_STORAGE_KEY, newVisitorId);
            return newVisitorId;
        } catch (error) {
            // If localStorage is not available (e.g., private browsing), generate a temporary ID
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
            return `${timestamp}-${random}`;
        }
    }

    function onMapMoveEnd() {
        debouncedLoadBuoys();
    }

    onMount(() => {
        currentLocale = detectLocale();
        t = getTranslations(currentLocale);
        visitorId = getOrCreateVisitorId();
        loadBuoys();
        map.on('moveend', onMapMoveEnd);
    });

    onDestroy(() => {
        map.off('moveend', onMapMoveEnd);
        if (debounceTimer) clearTimeout(debounceTimer);
        fetchController?.abort();
        clearMarkers();
    });

    function buildApiUrl(path: string, params?: Record<string, string | number | boolean | undefined>) {
        const cleanBase = apiBaseUrl.replace(/\/$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        const url = new URL(`${cleanBase}${cleanPath}`);

        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value === undefined || value === null) continue;
                url.searchParams.set(key, String(value));
            }
        }

        return url.toString();
    }

    function buildHeaders() {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        // Add visitor ID header if available
        if (visitorId) {
            headers['X-Visitor-ID'] = visitorId;
        }

        return headers;
    }

    async function fetchJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) {
        const url = buildApiUrl(path, params);
        const headers = buildHeaders();
        const response = await fetch(url, { headers, signal });

        if (!response.ok) {
            let detail = response.statusText;

            try {
                const body = await response.json();
                detail = body.message || body.error || detail;
            } catch {
                detail = (await response.text()) || detail;
            }

            throw new Error(`Request failed (${response.status}): ${detail}`);
        }

        return (await response.json()) as T;
    }

    function getMapBoundsParams(): Record<string, string> {
        const b = map.getBounds().pad(0.3);
        return {
            bounds: JSON.stringify({
                south: b.getSouth(),
                west: b.getWest(),
                north: b.getNorth(),
                east: b.getEast(),
            }),
        };
    }

    async function fetchBuoysInBounds(signal?: AbortSignal): Promise<BuoySummary[]> {
        const json = await fetchJson<BuoysResponse>('/buoys', {
            ...getMapBoundsParams(),
            per_page: 500,
            active_only: 'true',
        }, signal);

        return json.data?.buoys ?? [];
    }

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    function debouncedLoadBuoys(delay = 300) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            loadBuoys();
        }, delay);
    }

    async function loadBuoys() {
        fetchController?.abort();
        const controller = new AbortController();
        fetchController = controller;

        try {
            buoys = await fetchBuoysInBounds(controller.signal);
            updateMarkers();
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            console.error('Failed to load buoys:', error);
        }
    }

    async function handleRefresh() {
        if (isRefreshing) return;
        isRefreshing = true;
        try {
            await loadBuoys();
            refreshAllIcons();
        } finally {
            isRefreshing = false;
        }
    }

    function updateMarkers() {
        const newBuoyIds = new Set(buoys.map(b => b.id));

        for (const [id, marker] of markerMap) {
            if (!newBuoyIds.has(id)) {
                map.removeLayer(marker);
                markerMap.delete(id);
                if (currentPopupBuoy?.id === id) {
                    openedPopup?.remove();
                    openedPopup = null;
                    currentPopupBuoy = null;
                }
            }
        }

        for (const buoy of buoys) {
            if (!markerMap.has(buoy.id)) {
                markerMap.set(buoy.id, createMarker(buoy));
            }
        }
    }

    function refreshAllIcons() {
        for (const buoy of buoys) {
            const marker = markerMap.get(buoy.id);
            if (marker) marker.setIcon(createIcon(buoy));
        }
    }

    function handleDisplayModeChange() {
        refreshAllIcons();
    }

    function handleHeightClick(event: MouseEvent) {
        event.preventDefault();
        markerDisplayMode = 'height';
        handleDisplayModeChange();
    }

    function handlePeriodClick(event: MouseEvent) {
        event.preventDefault();
        markerDisplayMode = 'period';
        handleDisplayModeChange();
    }

    function handleEnergyClick(event: MouseEvent) {
        event.preventDefault();
        markerDisplayMode = 'energy';
        handleDisplayModeChange();
    }

    function handleUnitChange() {
        refreshAllIcons();
        if (currentPopupBuoy) {
            const freshBuoy = buoys.find(b => b.id === currentPopupBuoy!.id);
            if (freshBuoy) openBuoyPopup(freshBuoy);
        }
    }

    function handleMetersClick(event: MouseEvent) {
        event.preventDefault();
        heightUnit = 'meters';
        handleUnitChange();
    }

    function handleFeetClick(event: MouseEvent) {
        event.preventDefault();
        heightUnit = 'feet';
        handleUnitChange();
    }

    function clearMarkers() {
        openedPopup?.remove();
        for (const marker of markerMap.values()) map.removeLayer(marker);
        markerMap.clear();
        openedPopup = null;
        currentPopupBuoy = null;
    }

    function createIcon(buoy: BuoySummary): L.DivIcon {
        const color = markerColorForHeight(buoy.last_reading?.significient_height);
        
        let displayLabel: string;
        if (markerDisplayMode === 'period') {
            const period = buoy.last_reading?.period;
            displayLabel = period !== null && period !== undefined ? `${period.toFixed(1)}s` : '—';
        } else if (markerDisplayMode === 'energy') {
            displayLabel = formatEnergyShort(getReadingEnergy(buoy.last_reading));
        } else {
            displayLabel = formatHeightShort(
                buoy.last_reading?.significient_height,
                buoy.last_reading?.unit
            );
        }
        
        const hasDirection = buoy.last_reading?.direction !== null && buoy.last_reading?.direction !== undefined;
        const arrowHtml = hasDirection ? (() => {
            const swellFrom = buoy.last_reading!.direction!;
            const direction = (swellFrom + 270) % 360;
            return `<span class="buoy-marker__arrow" style="transform: rotate(${direction}deg);">◄</span>`;
        })() : '';
        
        return L.divIcon({
            className: 'buoy-marker',
            html: `<div class="buoy-marker__badge" style="--badge-color:${color};">
                ${arrowHtml}
                <span class="buoy-marker__text">${displayLabel}</span>
            </div>`,
            iconSize: [60, 24],
            iconAnchor: [30, 12],
        });
    }

    function createMarker(buoy: BuoySummary) {
        const marker = new L.Marker([buoy.lat, buoy.lng], { icon: createIcon(buoy) }).addTo(map);
        const buoyId = buoy.id;
        marker.on('click', () => {
            const latestBuoy = buoys.find(b => b.id === buoyId);
            if (latestBuoy) openBuoyPopup(latestBuoy);
        });
        return marker;
    }

    function markerColorForHeight(height?: number | null) {
        if (height === null || height === undefined) return '#9fb9bf';
        
        if (height >= 12) return '#9a7f9b';
        if (height >= 10) return '#bfbfbf';
        if (height >= 7) return '#bf6757';
        if (height >= 5) return '#bf335f';
        if (height >= 4) return '#853030';
        if (height >= 3) return '#9a3097';
        if (height >= 2.5) return '#bb5abf';
        if (height >= 2) return '#393c8e';
        if (height >= 1.5) return '#3868bf';
        if (height >= 1) return '#30628d';
        if (height >= 0.5) return '#309db9';
        return '#9fb9bf';
    }

    function openBuoyPopup(buoy: BuoySummary) {
        openedPopup?.remove();

        const content = buildBuoyPopupContent(buoy);
        const popup = new L.Popup({
            autoPanPadding: [20, 30],
            className: 'buoy-leaflet-popup',
            closeButton: true,
        })
            .setLatLng([buoy.lat, buoy.lng])
            .setContent(content)
            .openOn(map);

        popup.on('remove', () => {
            if (openedPopup === popup) {
                openedPopup = null;
                currentPopupBuoy = null;
            }
        });
        openedPopup = popup;
        currentPopupBuoy = buoy;
    }

    function buildBuoyPopupContent(buoy: BuoySummary) {
        const wrapper = document.createElement('div');
        wrapper.className = 'buoy-popup';

        const lastReading = buoy.last_reading;
        const readingTime = lastReading?.time || buoy.last_reading_time;
        const relativeTime = formatRelativeTime(readingTime);
        const absoluteTime = formatAbsoluteTime(readingTime, buoy.timezone);
        const color = markerColorForHeight(lastReading?.significient_height);

        wrapper.innerHTML = `
            <div class="buoy-popup__header" style="background-color: ${color};">
                <div class="buoy-popup__title">${buoy.name}</div>
                <div class="buoy-popup__time" data-relative="${relativeTime}" data-absolute="${absoluteTime}" style="cursor: pointer;" title="Click to toggle">${relativeTime}</div>
            </div>

            <div class="buoy-popup__stats"></div>
        `;

        const timeElement = wrapper.querySelector('.buoy-popup__time') as HTMLElement;
        let showingRelative = true;
        timeElement.addEventListener('click', () => {
            showingRelative = !showingRelative;
            timeElement.textContent = showingRelative ? relativeTime : absoluteTime;
        });

        const stats = wrapper.querySelector('.buoy-popup__stats') as HTMLElement;
        const rowTop = createStatsRow();
        rowTop.appendChild(createStat(t.height, formatHeight(lastReading?.significient_height, lastReading?.unit)));
        rowTop.appendChild(createStat(t.hmax, formatHeight(lastReading?.maximum_height, lastReading?.unit)));
        stats.appendChild(rowTop);

        const rowMiddle = createStatsRow();
        rowMiddle.appendChild(createStat(t.period, formatPeriod(lastReading?.period)));
        rowMiddle.appendChild(createStat(t.energy, formatEnergy(getReadingEnergy(lastReading))));
        stats.appendChild(rowMiddle);

        const rowBottom = createStatsRow();
        rowBottom.classList.add('buoy-popup__stats-row--joined');
        rowBottom.appendChild(createDirectionStat(lastReading?.direction));
        rowBottom.appendChild(createCompassStat(lastReading?.direction, color, lastReading?.period));
        stats.appendChild(rowBottom);

        const footer = document.createElement('div');
        footer.className = 'buoy-popup__footer';
        const buoySlug = buoy.slug || generateSlug(buoy.name);
        footer.innerHTML = `
            <a href="https://labouee.app/buoy/${buoySlug}" target="_blank" rel="noreferrer noopener" class="buoy-popup__link">
                ${t.viewAllReadings} ${buoy.name}
            </a>
            ${getPoweredByHtml(currentLocale)}
        `;
        wrapper.appendChild(footer);

        return wrapper;
    }

    function createStat(label: string, value: string) {
        const item = document.createElement('div');
        item.className = 'buoy-popup__stat';
        const labelDiv = document.createElement('div');
        labelDiv.className = 'buoy-popup__stat-label';
        labelDiv.textContent = label;
        const valueDiv = document.createElement('div');
        valueDiv.className = 'buoy-popup__stat-value';
        valueDiv.textContent = value;
        item.appendChild(labelDiv);
        item.appendChild(valueDiv);
        return item;
    }

    function createStatsRow(fullWidth = false) {
        const row = document.createElement('div');
        row.className = fullWidth ? 'buoy-popup__stats-row buoy-popup__stats-row--full' : 'buoy-popup__stats-row';
        return row;
    }

    function normalizeHexColor(value?: string | null) {
        if (!value) return null;
        const trimmed = value.trim();
        const hex = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;
        if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) return null;
        return `#${hex}`;
    }

    function hexToRgba(hexColor: string, alpha: number) {
        const hex = hexColor.replace('#', '');
        const fullHex = hex.length === 3 ? hex.split('').map((c) => `${c}${c}`).join('') : hex;
        const r = parseInt(fullHex.slice(0, 2), 16);
        const g = parseInt(fullHex.slice(2, 4), 16);
        const b = parseInt(fullHex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    function createDirectionStat(direction?: number | null) {
        const item = createStat(t.direction, formatDirection(direction));
        item.classList.add('buoy-popup__stat--direction');
        return item;
    }

    function createCompassStat(direction?: number | null, accentColor?: string, period?: number | null) {
        const item = document.createElement('div');
        item.className = 'buoy-popup__stat buoy-popup__stat--compass';
        item.appendChild(createCompassDial(direction, accentColor, period));
        return item;
    }

    function pulseDurationFromPeriod(period?: number | null): number {
        if (period == null || !Number.isFinite(period) || period <= 0) return 2.6;
        return Math.max(1.5, Math.min(period * 0.5, 12));
    }

    function createCompassDial(direction?: number | null, accentColor?: string, period?: number | null) {
        const hasDirection = direction !== null && direction !== undefined && Number.isFinite(direction);
        const compass = document.createElement('div');
        compass.className = hasDirection ? 'buoy-popup__compass' : 'buoy-popup__compass buoy-popup__compass--missing';

        const resolvedAccent = normalizeHexColor(accentColor) || '#4f8ca6';
        const pulseDuration = pulseDurationFromPeriod(period);
        compass.style.setProperty('--compass-accent', resolvedAccent);
        compass.style.setProperty('--compass-accent-soft', hexToRgba(resolvedAccent, 0.22));
        compass.style.setProperty('--compass-accent-sweep', hexToRgba(resolvedAccent, 0.16));
        compass.style.setProperty('--compass-accent-wave', hexToRgba(resolvedAccent, 0.35));
        compass.style.setProperty('--compass-accent-ripple', hexToRgba(resolvedAccent, 0.28));
        compass.style.setProperty('--compass-pulse-duration', `${pulseDuration}s`);

        const radar = document.createElement('div');
        radar.className = 'buoy-popup__compass-radar';
        compass.appendChild(radar);

        const circleOuter = document.createElement('div');
        circleOuter.className = 'buoy-popup__compass-circle buoy-popup__compass-circle--outer';
        radar.appendChild(circleOuter);

        const circleMiddle = document.createElement('div');
        circleMiddle.className = 'buoy-popup__compass-circle buoy-popup__compass-circle--middle';
        radar.appendChild(circleMiddle);

        const circleInner = document.createElement('div');
        circleInner.className = 'buoy-popup__compass-circle buoy-popup__compass-circle--inner';
        radar.appendChild(circleInner);

        if (hasDirection) {
            const sweep = document.createElement('div');
            sweep.className = 'buoy-popup__compass-sweep';
            radar.appendChild(sweep);
        }

        const cardinals = document.createElement('div');
        cardinals.className = 'buoy-popup__compass-cardinals';
        const north = document.createElement('span');
        north.className = 'buoy-popup__compass-cardinal buoy-popup__compass-cardinal--n';
        north.textContent = 'N';
        const east = document.createElement('span');
        east.className = 'buoy-popup__compass-cardinal buoy-popup__compass-cardinal--e';
        east.textContent = 'E';
        const south = document.createElement('span');
        south.className = 'buoy-popup__compass-cardinal buoy-popup__compass-cardinal--s';
        south.textContent = 'S';
        const west = document.createElement('span');
        west.className = 'buoy-popup__compass-cardinal buoy-popup__compass-cardinal--w';
        west.textContent = 'W';
        cardinals.appendChild(north);
        cardinals.appendChild(east);
        cardinals.appendChild(south);
        cardinals.appendChild(west);
        compass.appendChild(cardinals);

        if (hasDirection) {
            const directionLayer = document.createElement('div');
            directionLayer.className = 'buoy-popup__compass-direction';
            directionLayer.style.transform = `rotate(${direction}deg)`;

            const cone = document.createElement('div');
            cone.className = 'buoy-popup__compass-cone';
            directionLayer.appendChild(cone);

            const source = document.createElement('div');
            source.className = 'buoy-popup__compass-source';
            directionLayer.appendChild(source);

            const waves = document.createElement('div');
            waves.className = 'buoy-popup__compass-waves';
            [0, 1, 2].forEach((index) => {
                const wave = document.createElement('div');
                wave.className = 'buoy-popup__compass-wave';
                wave.style.animationDelay = `${index * pulseDuration * 0.25}s`;
                waves.appendChild(wave);
            });
            directionLayer.appendChild(waves);

            compass.appendChild(directionLayer);
        }

        const buoyCenter = document.createElement('div');
        buoyCenter.className = 'buoy-popup__compass-buoy';
        const buoyDot = document.createElement('div');
        buoyDot.className = 'buoy-popup__compass-buoy-dot';
        buoyCenter.appendChild(buoyDot);
        if (hasDirection) {
            const ripple = document.createElement('div');
            ripple.className = 'buoy-popup__compass-ripple';
            buoyCenter.appendChild(ripple);
        }
        compass.appendChild(buoyCenter);
        return compass;
    }

    function convertToFeet(meters: number): number {
        return meters * 3.28084;
    }

    function formatHeight(value?: number | null, unit?: string | null) {
        if (value === null || value === undefined) return '—';
        
        let displayValue = value;
        let displayUnit = unit || 'm';
        
        // Convert to feet if needed (assuming input is always in meters)
        if (heightUnit === 'feet' && displayUnit === 'm') {
            displayValue = convertToFeet(value);
            displayUnit = 'ft';
        }
        
        const suffix = ` ${displayUnit}`;
        const formatted = displayValue.toFixed(1);
        return `${formatted}${suffix}`;
    }

    function formatHeightShort(value?: number | null, unit?: string | null) {
        if (value === null || value === undefined) return '—';
        
        let displayValue = value;
        let displayUnit = unit || 'm';
        
        // Convert to feet if needed (assuming input is always in meters)
        if (heightUnit === 'feet' && displayUnit === 'm') {
            displayValue = convertToFeet(value);
            displayUnit = 'ft';
        }
        
        const formatted = displayValue.toFixed(1);
        return `${formatted}${displayUnit}`;
    }

    function formatPeriod(value?: number | null) {
        if (value === null || value === undefined) return '—';
        return `${value.toFixed(1)} ${t.seconds}`;
    }

    function formatEnergy(value?: number | null) {
        if (value === null || value === undefined) return '—';
        return `${Math.round(value)} kJ`;
    }

    function formatEnergyShort(value?: number | null) {
        if (value === null || value === undefined) return '—';
        return `${Math.round(value)}kJ`;
    }

    function calculateEnergyFromReading(height?: number | null, period?: number | null) {
        if (height === null || height === undefined || period === null || period === undefined) return null;

        const h = Number(height);
        const p = Number(period);
        if (!Number.isFinite(h) || !Number.isFinite(p) || h <= 0 || p <= 0) return null;

        const seawaterDensity = 1025.0;
        const gravity = 9.81;
        const energyPerMeter = (1 / 8) * seawaterDensity * gravity * h * h;
        const wavelength = (gravity * p * p) / (2 * Math.PI);
        const energyPerWaveKj = (energyPerMeter * wavelength) / 1000.0;

        if (!Number.isFinite(energyPerWaveKj)) return null;
        return Math.round(energyPerWaveKj);
    }

    function getReadingEnergy(reading?: BuoyReading | null) {
        if (!reading) return null;
        if (reading.wave_power !== null && reading.wave_power !== undefined) return reading.wave_power;
        if (reading.energy_per_wave !== null && reading.energy_per_wave !== undefined) return reading.energy_per_wave;
        return calculateEnergyFromReading(reading.significient_height, reading.period);
    }

    function formatDirection(value?: number | null) {
        if (value === null || value === undefined) return '—';
        return `${Math.round(value)}° ${degreesToCardinal(value)}`;
    }

    function degreesToCardinal(deg: number) {
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        return directions[Math.round(deg / 45) % 8];
    }

    function formatRelativeTime(time?: string | null) {
        if (!time) return t.timeUnknown;
        const now = Date.now();
        const target = new Date(time).getTime();
        const diffMinutes = Math.round((now - target) / 60000);

        if (diffMinutes <= 1) return t.justNow;
        if (diffMinutes < 60) {
            // For French: "5 min" (no "ago"), for English: "5 min ago"
            if (t.ago === "il y a") {
                return `${diffMinutes} ${t.minAgo}`;
            }
            return `${diffMinutes} ${t.minAgo} ${t.ago}`;
        }

        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        // For French: "2h 30min", for English: "2h 30m ago"
        if (t.ago === "il y a") {
            return `${hours}${t.hours}${minutes ? ` ${minutes}${t.minutes}` : ''}`;
        }
        return `${hours}${t.hours}${minutes ? ` ${minutes}${t.minutes}` : ''} ${t.ago}`;
    }

    function formatAbsoluteTime(time?: string | null, timezone?: string | null) {
        if (!time) return t.timeUnknown;
        const date = new Date(time);
        const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        
        try {
            const formatter = new Intl.DateTimeFormat(undefined, {
                timeZone: tz,
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            return formatter.format(date);
        } catch {
            return date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        }
    }

    function generateSlug(name: string): string {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }
</script>

<style lang="less">
    @size-xxs: 8px;
    @size-xs: 10px;
    @size-s: 12px;
    @size-m: 14px;
    @size-l: 16px;
    @size-xl: 18px;
    @size-xxl: 20px;
    @size-xxxl: 24px;
    @size-xxxxl: 30px;
    @size-ultra: 40px;

    @color-white: #f8f8f8;
    @color-gray: #6b6b6b;
    @color-gray-dark: #4d4d4d;
    @color-gray-light: #e5e5e5;

    :global(.buoy-marker) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    :global(.buoy-marker__badge) {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px 3px 6px;
        background: var(--badge-color, #d49500);
        color: @color-white;
        border-radius: 12px;
        font-weight: 600;
        font-size: 11px;
        line-height: 1;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3), 0 0 0 2px rgba(255, 255, 255, 0.9);
        white-space: nowrap;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    :global(.buoy-marker__badge:hover) {
        transform: scale(1.05);
        box-shadow: 0 3px 12px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 1);
    }

    :global(.buoy-marker__arrow) {
        display: inline-block;
        font-size: 13px;
        line-height: 1;
        transform-origin: center;
        transition: transform 0.3s ease;
    }

    :global(.buoy-marker__text) {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.01em;
    }

    :global(.buoy-leaflet-popup .leaflet-popup-content) {
        margin: 0;
        width: 280px !important;
    }

    :global(.buoy-leaflet-popup .leaflet-popup-content-wrapper) {
        border-radius: @size-s;
        padding: 0;
        box-shadow: 0 @size-m @size-xxxl rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.1);
        border: none;
        overflow: hidden;
        position: relative;
    }

    :global(.buoy-leaflet-popup .leaflet-popup-tip) {
        background: @color-white;
    }

    :global(.buoy-leaflet-popup .leaflet-popup-close-button) {
        position: absolute;
        top: 1px;
        right: 1px;
        width: 28px;
        height: 100%;
        max-height: 38px;
        padding: 0;
        margin: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 18px;
        font-weight: 300;
        background: rgba(0, 0, 0, 0.1);
        border: none;
        border-radius: 0;
        border-top-right-radius: @size-s;
        box-sizing: border-box;
        overflow: hidden;
        z-index: 2;
        line-height: 1;
    }
    :global(.buoy-leaflet-popup .leaflet-popup-close-button span) {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :global(.buoy-popup) {
        max-width: 280px;
        background: @color-white;
        border-radius: @size-s;
        overflow: hidden;
    }

    :global(.buoy-popup__header) {
        padding: @size-s @size-xxxl @size-s @size-m;
        color: @color-white;
        position: relative;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    :global(.buoy-popup__title) {
        font-weight: 700;
        font-size: @size-m;
    }

    :global(.buoy-popup__time) {
        font-size: @size-xxs + 3px;
        opacity: 0.9;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.2s ease;
    }

    :global(.buoy-popup__time:hover) {
        opacity: 1;
        text-decoration: underline;
    }

    :global(.buoy-popup__stats) {
        display: flex;
        flex-direction: column;
        gap: 1px;
        background: @color-gray-light;
    }

    :global(.buoy-popup__stats-row) {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1px;
    }

    :global(.buoy-popup__stats-row--full) {
        grid-template-columns: minmax(0, 1fr);
    }

    :global(.buoy-popup__stats-row--joined) {
        gap: 0;
    }

    :global(.buoy-popup__stat) {
        padding: @size-xs @size-s;
        background: @color-white;
        width: auto !important;
        float: none !important;
    }

    :global(.buoy-popup__stat--direction) {
        min-height: 56px;
    }

    :global(.buoy-popup__stat--compass) {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: @size-xxs @size-s;
        min-height: 56px;
    }

    :global(.buoy-popup__stat-label) {
        color: @color-gray;
        font-size: @size-xxs + 2px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 2px;
        font-weight: 600;
    }

    :global(.buoy-popup__stat-value) {
        font-weight: 700;
        color: @color-gray-dark;
        font-size: @size-m;
        line-height: 1.2;
    }

    :global(.buoy-popup__compass) {
        --compass-accent: #4f8ca6;
        --compass-accent-soft: rgba(79, 140, 166, 0.22);
        --compass-accent-sweep: rgba(79, 140, 166, 0.16);
        --compass-accent-wave: rgba(79, 140, 166, 0.35);
        --compass-accent-ripple: rgba(79, 140, 166, 0.28);
        --compass-radius: 28px;
        --compass-source-radius: 25px;
        --compass-pulse-duration: 2.6s;
        position: relative;
        width: 56px;
        height: 56px;
        flex: 0 0 56px;
        border-radius: 999px;
        overflow: hidden;
        clip-path: circle(50% at 50% 50%);
        background: radial-gradient(circle at 35% 35%, #ffffff 0%, #f4f6f8 58%, #ebeef2 100%);
        box-shadow: inset 0 -1px 1px rgba(0, 0, 0, 0.04);
    }

    :global(.buoy-popup__compass-radar) {
        position: absolute;
        inset: 0;
    }

    :global(.buoy-popup__compass-circle) {
        position: absolute;
        border-radius: 999px;
        border: 1px solid rgba(107, 107, 107, 0.15);
        pointer-events: none;
    }

    :global(.buoy-popup__compass-circle--outer) {
        inset: 3px;
    }

    :global(.buoy-popup__compass-circle--middle) {
        inset: 11.34px;
    }

    :global(.buoy-popup__compass-circle--inner) {
        inset: 19.67px;
    }

    :global(.buoy-popup__compass-sweep) {
        position: absolute;
        inset: 0;
        border-radius: 999px;
        background: conic-gradient(from 180deg, var(--compass-accent-sweep), rgba(0, 0, 0, 0) 75deg);
        animation: buoy-popup-compass-spin 6s linear infinite;
        opacity: 0.16;
        pointer-events: none;
    }

    :global(.buoy-popup__compass-cardinals) {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 7;
    }

    :global(.buoy-popup__compass-cardinal) {
        position: absolute;
        font-size: 8px;
        font-weight: 800;
        color: rgba(107, 107, 107, 0.55);
        line-height: 1;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        z-index: 1;
    }

    :global(.buoy-popup__compass-cardinal--n) {
        top: 3px;
        left: 50%;
        transform: translateX(-50%);
    }

    :global(.buoy-popup__compass-cardinal--e) {
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
    }

    :global(.buoy-popup__compass-cardinal--s) {
        bottom: 3px;
        left: 50%;
        transform: translateX(-50%);
    }

    :global(.buoy-popup__compass-cardinal--w) {
        left: 4px;
        top: 50%;
        transform: translateY(-50%);
    }

    :global(.buoy-popup__compass-direction) {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        overflow: hidden;
        clip-path: circle(50% at 50% 50%);
        transition: transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
        z-index: 3;
        pointer-events: none;
    }

    :global(.buoy-popup__compass-source) {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) translateY(calc(-1 * var(--compass-source-radius)));
        width: 5px;
        height: 5px;
        border-radius: 999px;
        background: var(--compass-accent);
        box-shadow: 0 0 6px var(--compass-accent-wave);
        z-index: 3;
    }

    :global(.buoy-popup__compass-cone) {
        position: absolute;
        left: 50%;
        bottom: 50%;
        transform: translateX(-50%);
        width: 28px;
        height: var(--compass-source-radius);
        clip-path: path('M 14 25 L 1.78 3.18 A 25 25 0 0 1 26.22 3.18 Z');
        background: linear-gradient(to bottom, var(--compass-accent-soft), rgba(0, 0, 0, 0));
        filter: blur(0.4px);
        z-index: 2;
    }

    :global(.buoy-popup__compass-waves) {
        position: absolute;
        inset: 0;
        overflow: hidden;
        z-index: 1;
    }

    :global(.buoy-popup__compass-wave) {
        position: absolute;
        left: 50%;
        top: 6px;
        width: 18px;
        height: 2px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: var(--compass-accent-wave);
        filter: blur(0.2px);
        opacity: 0;
        animation: buoy-popup-compass-wave var(--compass-pulse-duration) linear infinite;
    }

    :global(.buoy-popup__compass-buoy) {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: 12px;
        height: 12px;
        border-radius: 999px;
        border: 2px solid var(--compass-accent);
        background: #e8f1f5;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
        animation: buoy-popup-compass-bob calc(var(--compass-pulse-duration) * 1.5) ease-in-out infinite;
    }

    :global(.buoy-popup__compass-buoy-dot) {
        width: 4px;
        height: 4px;
        border-radius: 999px;
        background: #2d4a54;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
        animation: buoy-popup-compass-dot-pulse var(--compass-pulse-duration) ease-in-out infinite;
    }

    :global(.buoy-popup__compass-ripple) {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 16px;
        height: 16px;
        border-radius: 999px;
        border: 1px solid var(--compass-accent-ripple);
        transform: translate(-50%, -50%);
        animation: buoy-popup-compass-ripple calc(var(--compass-pulse-duration) * 1.1) ease-out infinite;
    }

    :global(.buoy-popup__compass--missing) {
        opacity: 1;
        background: radial-gradient(circle at 35% 35%, #f6f7f9 0%, #eef1f4 100%);
        box-shadow: inset 0 0 0 1px #dce1e6;
    }

    :global(.buoy-popup__compass--missing .buoy-popup__compass-buoy) {
        border-color: #a7b0b8;
        background: #f1f3f5;
    }

    :global(.buoy-popup__compass--missing .buoy-popup__compass-buoy-dot) {
        background: #95a0aa;
        animation: none;
    }

    :global(.buoy-popup__compass--missing .buoy-popup__compass-cardinal) {
        color: rgba(107, 107, 107, 0.4);
    }

    :global(.buoy-popup__compass--missing .buoy-popup__compass-circle) {
        border-color: rgba(107, 107, 107, 0.12);
    }

    @media (prefers-reduced-motion: reduce) {
        :global(.buoy-popup__compass-sweep),
        :global(.buoy-popup__compass-wave),
        :global(.buoy-popup__compass-buoy),
        :global(.buoy-popup__compass-buoy-dot),
        :global(.buoy-popup__compass-ripple) {
            animation: none !important;
        }
    }

    @keyframes buoy-popup-compass-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    @keyframes buoy-popup-compass-wave {
        0% {
            transform: translate(-50%, 0) scaleX(0.6);
            opacity: 0;
        }
        35% {
            opacity: 0.75;
        }
        100% {
            transform: translate(-50%, 38px) scaleX(1.2);
            opacity: 0;
        }
    }

    @keyframes buoy-popup-compass-bob {
        0%, 100% { transform: translate(-50%, -50%) translateY(0) rotate(0deg); }
        25% { transform: translate(-50%, -50%) translateY(-1.5px) rotate(7deg); }
        50% { transform: translate(-50%, -50%) translateY(-2px) rotate(0deg); }
        75% { transform: translate(-50%, -50%) translateY(-1.5px) rotate(-7deg); }
    }

    @keyframes buoy-popup-compass-dot-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    @keyframes buoy-popup-compass-ripple {
        0% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0.4;
        }
        100% {
            transform: translate(-50%, -50%) scale(1.9);
            opacity: 0;
        }
    }

    :global(.buoy-popup__footer) {
        padding: @size-xs @size-s;
        background: lighten(@color-gray-light, 7%);
        text-align: center;
        font-size: @size-xxs + 3px;
        color: @color-gray;
        border-top: 1px solid @color-gray-light;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: @size-xxs;
    }

    :global(.buoy-popup__link) {
        color: @color-gray;
        text-decoration: none;
        font-weight: normal;
        transition: opacity 0.2s ease;
    }

    :global(.buoy-popup__link:hover) {
        opacity: 0.8;
        text-decoration: underline;
    }

    :global(.buoy-popup__powered) {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: @size-xxs + 2px;
    }

    :global(.buoy-popup__footer-logo) {
        display: inline-flex;
        align-items: center;
        text-decoration: none;
        transition: opacity 0.2s ease;
    }

    :global(.buoy-popup__footer-logo:hover) {
        opacity: 0.8;
    }

    :global(.buoy-popup__footer-logo svg) {
        display: block;
    }

    :global(.buoy-popup__powered.powered-by--dark) {
        color: #6b6b6b;
    }

    :global(.buoy-popup__powered.powered-by--dark .powered-by__link) {
        color: #030310;
    }

    .buoy-plugin {
        padding: @size-xs !important;
        color: #fff !important;
        background: transparent !important;
        min-height: 50px;
    }

    .buoy-plugin__header {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        margin-bottom: @size-xxs;
        padding-bottom: @size-xxs;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    }

    .buoy-plugin__controls {
        display: flex;
        flex-direction: column;
        gap: @size-xxs;
    }

    .buoy-plugin__title {
        margin: 0 !important;
        font-size: @size-l !important;
        font-weight: 700 !important;
        color: #fff !important;
        display: block !important;
    }


    .buoy-plugin__refresh {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px;
        background: transparent;
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 4px;
        cursor: pointer;
        color: #fff;
        transition: all 0.2s ease;
        line-height: 1;
    }

    .buoy-plugin__refresh:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.8);
        color: #fff;
    }

    .buoy-plugin__refresh:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .buoy-plugin__refresh-icon {
        display: block;
        width: 14px;
        height: 14px;
        transition: transform 0.3s ease;
    }

    .buoy-plugin__refresh-icon--spinning {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .buoy-plugin__footer {
        display: flex;
        justify-content: flex-end;
        margin-top: @size-xs;
    }

    .buoy-plugin__footer-link {
        display: inline-flex;
        align-items: center;
        color: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        transition: color 0.2s ease;
    }

    .buoy-plugin__footer-link:hover {
        color: rgba(255, 255, 255, 0.9);
    }

    .buoy-plugin__footer-link svg {
        display: block;
    }
</style>
