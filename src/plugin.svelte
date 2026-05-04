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
    import { fetchWaveForecast, parseWaveForecastModelId, isIconEuWavesCoverage, type WaveForecastSample } from './windyForecast';
    import {
        renderForecastChartSvg,
        chartPxToTime,
        chartTimeToPx,
        chartYToPx,
        interpolateSeriesAt,
        nearestReadingAtTime,
        nearestForecastAtTime,
        type ChartTimeRangeHours,
        type ChartHoverContext,
    } from './forecastChart';

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

    type ReadingsListResponse = {
        status?: string;
        data?: { readings?: BuoyReading[] };
        readings?: BuoyReading[];
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
    let popupChartAbort: AbortController | null = null;
    let isRefreshing = false;
    let markerDisplayMode: 'height' | 'period' | 'energy' = 'height';
    let heightUnit: 'meters' | 'feet' = 'meters';
    let visitorId: string = '';
    let currentLocale: Locale = 'en';
    let t: Translations = getTranslations();

    const VISITOR_ID_STORAGE_KEY = 'the-buoy-visitor-id';

    /** Purple palette aligned with La Bouée mobile app */
    const APP_PURPLE = '#7B5BB8';
    const APP_PURPLE_LIGHT = '#C4B2E0';

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
        popupChartAbort?.abort();
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
        popupChartAbort?.abort();
        popupChartAbort = null;
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
        popupChartAbort?.abort();
        popupChartAbort = null;

        openedPopup?.remove();

        popupChartAbort = new AbortController();
        const chartSignal = popupChartAbort.signal;

        const content = buildBuoyPopupContent(buoy);
        void populateBuoyPopupChart(content, buoy, chartSignal);

        const popup = new L.Popup({
            autoPanPadding: [20, 30],
            className: 'buoy-leaflet-popup',
            closeButton: true,
        })
            .setLatLng([buoy.lat, buoy.lng])
            .setContent(content)
            .openOn(map);

        popup.on('remove', () => {
            if (openedPopup !== popup) return;
            popupChartAbort?.abort();
            popupChartAbort = null;
            openedPopup = null;
            currentPopupBuoy = null;
        });
        openedPopup = popup;
        currentPopupBuoy = buoy;
    }

    function buildBuoyPopupContent(buoy: BuoySummary) {
        const wrapper = document.createElement('div');
        wrapper.className = 'buoy-popup';
        wrapper.dataset.chartRange = '24';
        wrapper.dataset.forecastModel = 'ecmwfWaves';

        const lastReading = buoy.last_reading;
        const readingTime = lastReading?.time || buoy.last_reading_time;
        const relativeTime = formatRelativeTime(readingTime);
        const absoluteTime = formatAbsoluteTime(readingTime, buoy.timezone);
        const color = markerColorForHeight(lastReading?.significient_height);

        const rangeHours = [6, 12, 24, 48, 168] as const;
        const rangeBtns = rangeHours
            .map((h) => {
                const active = h === 24 ? ' buoy-popup__range-pill--active' : '';
                const lab = h === 168 ? t.timeRange7d : `${h}${t.timeRangeH}`;
                return `<button type="button" class="buoy-popup__range-pill${active}" data-hours="${h}">${lab}</button>`;
            })
            .join('');

        const showIconEu = isIconEuWavesCoverage(buoy.lat, buoy.lng);
        const forecastModelOptionsHtml = `
                                <option value="ecmwfWaves">${t.forecastModelEcmwf}</option>
                                <option value="gfsWaves">${t.forecastModelGfs}</option>
                                ${showIconEu ? `<option value="iconEuWaves">${t.forecastModelIcon}</option>` : ''}
        `;

        wrapper.innerHTML = `
            <div class="buoy-popup__header" style="background-color: ${color};">
                <div class="buoy-popup__title">${buoy.name}</div>
                <div class="buoy-popup__time" data-relative="${relativeTime}" data-absolute="${absoluteTime}" style="cursor: pointer;" title="Click to toggle">${relativeTime}</div>
            </div>

            <div class="buoy-popup__stats"></div>

            <div class="buoy-popup__chart-panel">
                <button type="button" class="buoy-popup__chart-panel-toggle" aria-expanded="false" aria-controls="buoy-chart-panel-${buoy.id}">
                    <span class="buoy-popup__chart-panel-title">${t.chartPanelToggle}</span>
                    <span class="buoy-popup__chart-panel-chevron" aria-hidden="true"></span>
                </button>
                <div id="buoy-chart-panel-${buoy.id}" class="buoy-popup__chart-panel-inner" hidden>
            <div class="buoy-popup__chart buoy-popup__chart--app">
                <div class="buoy-popup__chart-head">
                    <div class="buoy-popup__forecast-heading">
                        <span class="buoy-popup__forecast-waves-label">${t.forecastWavesShort}</span>
                        <div class="buoy-popup__forecast-model-wrap">
                            <select id="buoy-forecast-model-${buoy.id}" class="buoy-popup__forecast-model" aria-label="${t.forecastModelAria}" title="${t.forecastModelAria}">
                                ${forecastModelOptionsHtml}
                            </select>
                        </div>
                    </div>
                    <div class="buoy-popup__range" role="group" aria-label="Time range">${rangeBtns}</div>
                </div>
                <div class="buoy-popup__chart-wrap">
                    <div class="buoy-popup__chart-body buoy-popup__chart-body--loading">${t.forecastLoading}</div>
                </div>
                <div class="buoy-popup__legend">
                    <span class="buoy-popup__legend-row"><span class="buoy-popup__legend-line buoy-popup__legend-line--sig"></span>${t.legendBuoySig}</span>
                    <span class="buoy-popup__legend-row"><span class="buoy-popup__legend-line buoy-popup__legend-line--max"></span>${t.legendBuoyMax}</span>
                    <span class="buoy-popup__legend-row"><span class="buoy-popup__legend-line buoy-popup__legend-line--fc"></span>${t.legendForecast}</span>
                </div>
            </div>
                </div>
            </div>
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

        wireChartPanelToggle(wrapper);
        wireForecastModelSelect(wrapper, buoy);
        wireChartRangePills(wrapper);
        return wrapper;
    }

    function localeForIntl(): string {
        const m: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT' };
        return m[currentLocale] || 'en-GB';
    }

    type BuoyChartCache = {
        forecastSamples: WaveForecastSample[];
        readings: BuoyReading[];
    };

    function setBuoyChartCache(el: HTMLElement, data: BuoyChartCache) {
        (el as HTMLElement & { __buoyChartCache?: BuoyChartCache }).__buoyChartCache = data;
    }

    function getBuoyChartCache(el: HTMLElement): BuoyChartCache | undefined {
        return (el as HTMLElement & { __buoyChartCache?: BuoyChartCache }).__buoyChartCache;
    }

    function parseChartRangeHours(wrapper: HTMLElement): ChartTimeRangeHours {
        const n = parseInt(wrapper.dataset.chartRange || '24', 10);
        const allowed: ChartTimeRangeHours[] = [6, 12, 24, 48, 168];
        return (allowed.includes(n as ChartTimeRangeHours) ? n : 24) as ChartTimeRangeHours;
    }

    function wireChartPanelToggle(wrapper: HTMLElement) {
        const toggle = wrapper.querySelector('.buoy-popup__chart-panel-toggle') as HTMLButtonElement | null;
        const inner = wrapper.querySelector('.buoy-popup__chart-panel-inner') as HTMLElement | null;
        const root = wrapper.querySelector('.buoy-popup__chart-panel') as HTMLElement | null;
        if (!toggle || !inner || !root) return;

        toggle.addEventListener('click', () => {
            const isOpen = !inner.hasAttribute('hidden');
            if (isOpen) {
                inner.setAttribute('hidden', '');
                toggle.setAttribute('aria-expanded', 'false');
                root.classList.remove('buoy-popup__chart-panel--open');
            } else {
                inner.removeAttribute('hidden');
                toggle.setAttribute('aria-expanded', 'true');
                root.classList.add('buoy-popup__chart-panel--open');
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => rerenderBuoyChartFromCache(wrapper));
                });
            }
        });
    }

    function wireForecastModelSelect(wrapper: HTMLElement, buoy: BuoySummary) {
        const sel = wrapper.querySelector('.buoy-popup__forecast-model') as HTMLSelectElement | null;
        if (!sel) return;
        sel.value = parseWaveForecastModelId(wrapper.dataset.forecastModel);

        sel.addEventListener('change', () => {
            wrapper.dataset.forecastModel = sel.value;
            popupChartAbort?.abort();
            popupChartAbort = new AbortController();
            const bodyEl = wrapper.querySelector('.buoy-popup__chart-body') as HTMLElement | null;
            if (bodyEl) {
                bodyEl.className = 'buoy-popup__chart-body buoy-popup__chart-body--loading';
                bodyEl.textContent = t.forecastLoading;
                cleanupChartHover(bodyEl);
            }
            void populateBuoyPopupChart(wrapper, buoy, popupChartAbort.signal);
        });
    }

    function wireChartRangePills(wrapper: HTMLElement) {
        wrapper.querySelectorAll('.buoy-popup__range-pill').forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const h = (btn as HTMLElement).dataset.hours;
                if (!h) return;
                wrapper.querySelectorAll('.buoy-popup__range-pill').forEach((b) => {
                    b.classList.toggle('buoy-popup__range-pill--active', b === btn);
                });
                wrapper.dataset.chartRange = h;
                rerenderBuoyChartFromCache(wrapper);
            });
        });
    }

    function rerenderBuoyChartFromCache(wrapper: HTMLElement) {
        const bodyEl = wrapper.querySelector('.buoy-popup__chart-body') as HTMLElement | null;
        const cache = getBuoyChartCache(wrapper);
        if (!bodyEl) return;

        if (!cache?.forecastSamples?.length) {
            bodyEl.className = 'buoy-popup__chart-body buoy-popup__chart-body--empty';
            bodyEl.textContent = t.forecastUnavailable;
            cleanupChartHover(bodyEl);
            return;
        }

        const measured = bodyEl.clientWidth || (bodyEl.parentElement?.clientWidth ?? 0);
        const width = Math.max(260, Math.min(measured || 320, 360));

        bodyEl.className = 'buoy-popup__chart-body';
        cleanupChartHover(bodyEl);
        const result = renderForecastChartSvg({
            forecast: cache.forecastSamples,
            readings: cache.readings ?? [],
            heightUnit,
            width,
            height: 112,
            primaryColor: APP_PURPLE,
            lightColor: APP_PURPLE_LIGHT,
            timeRangeHours: parseChartRangeHours(wrapper),
            locale: localeForIntl(),
        });
        bodyEl.innerHTML = result.svg;

        const tooltip = document.createElement('div');
        tooltip.className = 'buoy-popup__chart-tooltip';
        tooltip.style.display = 'none';
        bodyEl.appendChild(tooltip);

        wireChartHover(bodyEl, result.ctx, tooltip);
    }

    type ChartHoverHandle = HTMLElement & {
        __buoyChartHoverCleanup?: () => void;
    };

    function cleanupChartHover(bodyEl: HTMLElement) {
        const handle = bodyEl as ChartHoverHandle;
        handle.__buoyChartHoverCleanup?.();
        handle.__buoyChartHoverCleanup = undefined;
        bodyEl.style.touchAction = '';
    }

    function wireChartHover(
        bodyEl: HTMLElement,
        ctx: ChartHoverContext,
        tooltip: HTMLElement,
    ) {
        cleanupChartHover(bodyEl);
        const svg = bodyEl.querySelector('svg') as SVGSVGElement | null;
        if (!svg) return;
        const hoverGroup = svg.querySelector('.buoy-chart-hover') as SVGGElement | null;
        const lineEl = hoverGroup?.querySelector(
            '.buoy-chart-hover__line',
        ) as SVGLineElement | null;
        const dotSig = hoverGroup?.querySelector(
            '.buoy-chart-hover__dot--sig',
        ) as SVGCircleElement | null;
        const dotMax = hoverGroup?.querySelector(
            '.buoy-chart-hover__dot--max',
        ) as SVGCircleElement | null;
        const dotFc = hoverGroup?.querySelector(
            '.buoy-chart-hover__dot--fc',
        ) as SVGCircleElement | null;

        const update = (clientX: number) => {
            const rect = svg.getBoundingClientRect();
            if (rect.width === 0) return hide();
            const scale = ctx.geometry.W / rect.width;
            const pxInSvg = (clientX - rect.left) * scale;
            const minPx = ctx.geometry.padL;
            const maxPx = ctx.geometry.padL + ctx.geometry.innerW;
            const clampedPx = Math.max(minPx, Math.min(pxInSvg, maxPx));
            const tMs = chartPxToTime(ctx.geometry, clampedPx);

            const isPast = tMs <= ctx.geometry.nowMs;
            const sigY = isPast ? interpolateSeriesAt(ctx.sigPts, tMs) : null;
            const maxY = isPast ? interpolateSeriesAt(ctx.maxPts, tMs) : null;
            const fcY = interpolateSeriesAt(ctx.fcPts, tMs);

            const reading = isPast ? nearestReadingAtTime(ctx.readings, tMs) : null;
            const buoyDir = reading?.direction;
            const fcSample = nearestForecastAtTime(ctx.forecast, tMs);
            const fcDir = fcSample?.direction;

            if (hoverGroup && lineEl) {
                hoverGroup.style.display = '';
                const x = clampedPx.toFixed(1);
                lineEl.setAttribute('x1', x);
                lineEl.setAttribute('x2', x);
                positionDot(dotSig, clampedPx, sigY, ctx);
                positionDot(dotMax, clampedPx, maxY, ctx);
                positionDot(dotFc, clampedPx, fcY, ctx);
            }

            tooltip.innerHTML = renderTooltipHtml(tMs, sigY, maxY, buoyDir, fcY, fcDir);
            tooltip.style.display = '';

            positionTooltipNearX(bodyEl, tooltip, clientX);
        };

        function positionTooltipNearX(bodyEl: HTMLElement, tooltip: HTMLElement, clientX: number) {
            const bodyRect = bodyEl.getBoundingClientRect();
            const cursorXInBody = clientX - bodyRect.left;
            const tooltipW = tooltip.offsetWidth;
            const bodyW = bodyEl.clientWidth;
            let left = cursorXInBody - tooltipW / 2;
            const PAD = 4;
            if (left < PAD) left = PAD;
            if (left + tooltipW > bodyW - PAD) left = bodyW - tooltipW - PAD;
            tooltip.style.left = `${left}px`;
            const coarse =
                typeof window !== 'undefined' &&
                window.matchMedia('(hover: none), (pointer: coarse)').matches;
            tooltip.classList.toggle('buoy-popup__chart-tooltip--coarse', coarse);
            tooltip.style.top = coarse ? `${Math.min(bodyEl.clientHeight * 0.08, 10)}px` : '2px';
        }

        const hide = () => {
            if (hoverGroup) hoverGroup.style.display = 'none';
            tooltip.style.display = 'none';
        };

        const onPointerMove = (e: PointerEvent) => {
            update(e.clientX);
        };

        const onPointerDown = (e: PointerEvent) => {
            update(e.clientX);
        };

        /** Desktop: scrubber disappears when cursor leaves chart. Touch/pen kept until tap elsewhere. */
        const onPointerLeave = (e: PointerEvent) => {
            if (e.pointerType === 'mouse') hide();
        };

        const onDocPointerDown = (e: PointerEvent) => {
            if (!bodyEl.contains(e.target as Node)) hide();
        };

        bodyEl.style.touchAction = 'none';

        bodyEl.addEventListener('pointerdown', onPointerDown);
        bodyEl.addEventListener('pointermove', onPointerMove);
        bodyEl.addEventListener('pointerleave', onPointerLeave);
        document.addEventListener('pointerdown', onDocPointerDown, true);

        (bodyEl as ChartHoverHandle).__buoyChartHoverCleanup = () => {
            bodyEl.removeEventListener('pointerdown', onPointerDown);
            bodyEl.removeEventListener('pointermove', onPointerMove);
            bodyEl.removeEventListener('pointerleave', onPointerLeave);
            document.removeEventListener('pointerdown', onDocPointerDown, true);
        };
    }

    function positionDot(
        dot: SVGCircleElement | null,
        cxInSvg: number,
        y: number | null,
        ctx: ChartHoverContext,
    ) {
        if (!dot) return;
        if (y == null || !Number.isFinite(y)) {
            dot.setAttribute('cx', '-10');
            dot.setAttribute('cy', '-10');
            return;
        }
        dot.setAttribute('cx', cxInSvg.toFixed(1));
        dot.setAttribute('cy', chartYToPx(ctx.geometry, y).toFixed(1));
    }

    function renderTooltipHtml(
        tMs: number,
        sigY: number | null,
        maxY: number | null,
        buoyDir: number | null | undefined,
        fcY: number | null,
        fcDir: number | null | undefined,
    ): string {
        const time = new Date(tMs).toLocaleString(localeForIntl(), {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
        const fmtDir = (d: number | null | undefined) =>
            d != null && Number.isFinite(d) ? `${Math.round(d)}°` : '';

        const rows: string[] = [`<div class="buoy-popup__chart-tooltip-time">${escapeHtml(time)}</div>`];
        if (sigY != null || maxY != null) {
            const sig = sigY != null ? formatHeightShort(sigY, 'm') : '—';
            const mx = maxY != null ? formatHeightShort(maxY, 'm') : '—';
            const dir = fmtDir(buoyDir);
            const value = `${sig} / ${mx}${dir ? ` · ${dir}` : ''}`;
            rows.push(
                `<div class="buoy-popup__chart-tooltip-row buoy-popup__chart-tooltip-row--buoy"><span class="buoy-popup__chart-tooltip-swatch buoy-popup__chart-tooltip-swatch--sig"></span><span class="buoy-popup__chart-tooltip-label">${escapeHtml(t.summaryBuoyPrefix)}</span><span class="buoy-popup__chart-tooltip-value">${escapeHtml(value)}</span></div>`,
            );
        }
        if (fcY != null) {
            const h = formatHeightShort(fcY, 'm');
            const dir = fmtDir(fcDir);
            const value = `${h}${dir ? ` · ${dir}` : ''}`;
            rows.push(
                `<div class="buoy-popup__chart-tooltip-row buoy-popup__chart-tooltip-row--fc"><span class="buoy-popup__chart-tooltip-swatch buoy-popup__chart-tooltip-swatch--fc"></span><span class="buoy-popup__chart-tooltip-label">${escapeHtml(t.summaryForecastPrefix)}</span><span class="buoy-popup__chart-tooltip-value">${escapeHtml(value)}</span></div>`,
            );
        }
        return rows.join('');
    }

    function escapeHtml(s: string): string {
        return s.replace(/[&<>"]/g, (c) =>
            c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&quot;',
        );
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

    async function fetchRecentReadings(buoy: BuoySummary, signal?: AbortSignal): Promise<BuoyReading[]> {
        const slug = buoy.slug || generateSlug(buoy.name);
        try {
            const json = await fetchJson<ReadingsListResponse>(
                `/buoys/${encodeURIComponent(slug)}/readings`,
                { hours: 168 },
                signal,
            );
            const list = json.data?.readings ?? json.readings;
            if (Array.isArray(list) && list.length) return list;
        } catch {
            // Endpoint may be unavailable — use last reading only
        }
        if (buoy.last_reading) return [buoy.last_reading];
        return [];
    }

    async function populateBuoyPopupChart(
        wrapper: HTMLElement,
        buoy: BuoySummary,
        signal: AbortSignal,
    ) {
        const bodyEl = wrapper.querySelector('.buoy-popup__chart-body') as HTMLElement | null;
        if (!bodyEl) return;

        try {
            const model = parseWaveForecastModelId(wrapper.dataset.forecastModel);
            const [fcst, readings] = await Promise.all([
                fetchWaveForecast(buoy.lat, buoy.lng, model, signal),
                fetchRecentReadings(buoy, signal),
            ]);
            if (signal.aborted) return;

            const samples = fcst?.samples ?? [];
            setBuoyChartCache(wrapper, { forecastSamples: samples, readings });

            if (!samples.length) {
                bodyEl.className = 'buoy-popup__chart-body buoy-popup__chart-body--empty';
                bodyEl.textContent = t.forecastUnavailable;
                return;
            }

            rerenderBuoyChartFromCache(wrapper);
        } catch (e) {
            if (signal.aborted || (e instanceof DOMException && e.name === 'AbortError')) return;
            bodyEl.className = 'buoy-popup__chart-body buoy-popup__chart-body--empty';
            bodyEl.textContent = t.forecastUnavailable;
        }
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
    @app-purple: #7b5bb8;
    @app-purple-light: #c4b2e0;

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
        width: 384px !important;
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
        color: rgba(50, 50, 50, 0.55);
        text-decoration: none;
        font-size: 18px;
        font-weight: 300;
        background: rgba(0, 0, 0, 0.05);
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
        max-width: 384px;
        background: @color-white;
        border-radius: @size-s;
        overflow: hidden;
    }

    :global(.buoy-popup__chart-panel) {
        border-top: 1px solid @color-gray-light;
    }

    :global(.buoy-popup__chart-panel-toggle) {
        display: flex;
        width: 100%;
        box-sizing: border-box;
        align-items: center;
        justify-content: space-between;
        gap: @size-s;
        padding: @size-s @size-m;
        margin: 0;
        border: none;
        background: #f7f4fb;
        cursor: pointer;
        font-family: inherit;
        text-align: left;
        transition: background 0.15s ease;
    }

    :global(.buoy-popup__chart-panel-toggle:hover) {
        background: #f0ecf6;
    }

    :global(.buoy-popup__chart-panel-toggle:focus-visible) {
        outline: 2px solid @app-purple;
        outline-offset: -2px;
    }

    :global(.buoy-popup__chart-panel-title) {
        font-size: @size-xs + 1px;
        font-weight: 700;
        color: @color-gray-dark;
        letter-spacing: -0.02em;
        line-height: 1.25;
    }

    :global(.buoy-popup__chart-panel-chevron) {
        flex-shrink: 0;
        width: 7px;
        height: 7px;
        border-right: 2px solid @app-purple;
        border-bottom: 2px solid @app-purple;
        transform: rotate(45deg);
        margin-top: -3px;
        transition: transform 0.18s ease, margin 0.18s ease;
        opacity: 0.85;
    }

    :global(.buoy-popup__chart-panel--open .buoy-popup__chart-panel-chevron) {
        transform: rotate(-135deg);
        margin-top: 4px;
    }

    :global(.buoy-popup__chart-panel-inner[hidden]) {
        display: none !important;
    }

    :global(.buoy-popup__chart-panel-inner:not([hidden])) {
        animation: buoy-chart-panel-expand 0.2s ease;
    }

    @keyframes buoy-chart-panel-expand {
        from {
            opacity: 0.85;
        }
        to {
            opacity: 1;
        }
    }

    :global(.buoy-popup__chart--app) {
        padding: @size-xs @size-s @size-xs;
    }

    :global(.buoy-popup__chart-head) {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: @size-xs;
        flex-wrap: wrap;
        margin-bottom: 4px;
    }

    :global(.buoy-popup__forecast-heading) {
        display: flex;
        align-items: center;
        gap: @size-xs;
        flex: 1 1 auto;
        min-width: 0;
    }

    :global(.buoy-popup__forecast-waves-label) {
        font-size: @size-xxs + 1px;
        font-weight: 700;
        color: @color-gray;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        flex-shrink: 0;
    }

    :global(.buoy-popup__forecast-model-wrap) {
        position: relative;
        display: inline-flex;
        align-items: center;
        min-width: 0;
    }

    :global(.buoy-popup__forecast-model) {
        appearance: none;
        -webkit-appearance: none;
        margin: 0;
        min-width: 76px;
        max-width: 100%;
        padding: 6px 26px 6px 10px;
        font-size: @size-s;
        font-weight: 800;
        font-family: inherit;
        letter-spacing: -0.03em;
        color: #fff;
        background-color: @app-purple;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 8L1 3h10z' opacity='0.92'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 8px center;
        background-size: 10px 10px;
        border: none;
        border-radius: @size-xs;
        box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.2) inset,
            0 1px 3px rgba(93, 61, 148, 0.28);
        cursor: pointer;
        line-height: 1.2;
        transition:
            background-color 0.15s ease,
            box-shadow 0.15s ease;
    }

    :global(.buoy-popup__forecast-model:hover) {
        background-color: darken(@app-purple, 7%);
        box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.28) inset,
            0 2px 5px rgba(93, 61, 148, 0.32);
    }

    :global(.buoy-popup__forecast-model:focus) {
        outline: none;
    }

    :global(.buoy-popup__forecast-model:focus-visible) {
        outline: 2px solid #fff;
        outline-offset: 2px;
        box-shadow: 0 0 0 3px fade(@app-purple, 50%);
    }

    :global(.buoy-popup__chart-wrap) {
        padding: 2px 2px 0;
        background: transparent;
        border: none;
    }

    :global(.buoy-popup__range) {
        display: flex;
        flex: 0 0 auto;
        gap: 2px;
        padding: 2px;
        background: #f0ecf6;
        border-radius: 999px;
    }

    :global(.buoy-popup__range-pill) {
        border: none;
        margin: 0;
        padding: 3px 7px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 600;
        cursor: pointer;
        background: transparent;
        color: @color-gray;
        line-height: 1.2;
    }

    :global(.buoy-popup__range-pill--active) {
        background: @app-purple;
        color: #fff;
    }

    :global(.buoy-popup__legend) {
        display: flex;
        flex-wrap: wrap;
        gap: @size-xs;
        margin-top: 6px;
        font-size: 10px;
        color: @color-gray;
        line-height: 1.2;
    }

    :global(.buoy-popup__legend-row) {
        display: inline-flex;
        align-items: center;
        gap: 5px;
    }

    :global(.buoy-popup__legend-line) {
        display: inline-block;
        width: 14px;
        height: 0;
        border: none;
    }

    :global(.buoy-popup__legend-line--sig) {
        border-top: 2.5px solid @app-purple;
    }

    :global(.buoy-popup__legend-line--max) {
        border-top: 2px solid @app-purple-light;
    }

    :global(.buoy-popup__legend-line--fc) {
        border-top: 2px dashed @app-purple;
        opacity: 0.7;
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

    :global(.buoy-popup__chart-body) {
        min-height: 112px;
        display: block;
        position: relative;
        cursor: crosshair;
        isolation: isolate;
        touch-action: none;
        -webkit-user-select: none;
        user-select: none;
    }

    :global(.buoy-popup__chart-body svg) {
        display: block;
        max-width: 100%;
        height: auto;
        margin: 0 auto;
        position: relative;
        z-index: 0;
    }

    :global(.buoy-popup__chart-tooltip) {
        position: absolute;
        left: 0;
        top: 0;
        pointer-events: none;
        background: rgba(255, 255, 255, 0.97);
        border: 1px solid rgba(123, 91, 184, 0.18);
        border-radius: @size-xs;
        padding: 5px 7px;
        font-size: 10.5px;
        line-height: 1.35;
        color: @color-gray-dark;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        white-space: nowrap;
        z-index: 2;
        max-width: calc(100% - 8px);
        transform: translateZ(0);
    }

    :global(.buoy-popup__chart-tooltip-time) {
        font-size: 9.5px;
        color: @color-gray;
        margin-bottom: 3px;
        font-weight: 500;
    }

    :global(.buoy-popup__chart-tooltip-row) {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    :global(.buoy-popup__chart-tooltip-swatch) {
        flex: 0 0 6px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
    }

    :global(.buoy-popup__chart-tooltip-swatch--sig) {
        background: @app-purple;
    }

    :global(.buoy-popup__chart-tooltip-swatch--fc) {
        background: @app-purple;
        opacity: 0.55;
    }

    :global(.buoy-popup__chart-tooltip-label) {
        color: @color-gray;
        font-weight: 500;
    }

    :global(.buoy-popup__chart-tooltip-value) {
        font-weight: 700;
        margin-left: auto;
    }

    :global(.buoy-popup__chart-tooltip--coarse) {
        font-size: 11px;
        white-space: normal;
        max-width: calc(100% - 6px);
        padding: 6px 8px;
    }

    :global(.buoy-popup__chart-tooltip--coarse .buoy-popup__chart-tooltip-time) {
        font-size: 10px;
    }

    @media (hover: none), (pointer: coarse) {
        :global(.buoy-popup__chart-body:not(.buoy-popup__chart-body--loading):not(.buoy-popup__chart-body--empty)) {
            cursor: grab;
        }
        :global(.buoy-popup__chart-body:not(.buoy-popup__chart-body--loading):not(.buoy-popup__chart-body--empty):active) {
            cursor: grabbing;
        }
    }

    :global(.buoy-popup__chart-body--loading),
    :global(.buoy-popup__chart-body--empty) {
        font-size: @size-xxs + 1px;
        color: @color-gray;
        text-align: center;
        padding: @size-xs @size-xxs;
        min-height: 80px;
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
