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
            <a
                class="switch__item {markerDisplayMode === 'name' ? 'selected' : ''}"
                on:click|stopPropagation={handleNameClick}
                role="button"
                tabindex="0"
            >
                {t.displayName}
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

    <div
        class="buoy-plugin__summary"
        class:buoy-plugin__summary--expanded={isSummaryExpanded}
        class:buoy-plugin__summary--up={summaryOpensUp}
    >
        <button
            type="button"
            class="buoy-plugin__summary-header"
            bind:this={summaryHeaderEl}
            on:click|stopPropagation={handleSummaryToggle}
            disabled={isLoadingSummary && displayTotalBuoyCount === 0}
        >
            {#if !isLoadingSummary && displayTotalBuoyCount > 0}
                <span class="buoy-plugin__live-dot" aria-hidden="true"></span>
            {/if}
            <span class="buoy-plugin__summary-title">{liveSummaryText}</span>
            {#if !isLoadingSummary && displayTotalBuoyCount > 0}
                <span class="buoy-plugin__summary-chevron" aria-hidden="true"></span>
            {/if}
        </button>

        {#if isSummaryExpanded && !isLoadingSummary && displayTotalBuoyCount > 0}
            <div class="buoy-plugin__summary-panel">
                <div class="buoy-plugin__summary-row">
                    <span class="buoy-plugin__summary-eye-slot" aria-hidden="true"></span>
                    <span class="buoy-plugin__summary-label">{t.realBuoys}</span>
                    <span class="buoy-plugin__summary-value">{displayRealBuoyCount}</span>
                </div>

                <div
                    class="buoy-plugin__summary-row buoy-plugin__summary-row--button"
                    class:buoy-plugin__summary-row--interactive={displaySatelliteBuoyCount > 0}
                    class:buoy-plugin__summary-row--disabled={displaySatelliteBuoyCount === 0}
                    role="button"
                    tabindex={displaySatelliteBuoyCount > 0 ? 0 : -1}
                    aria-disabled={displaySatelliteBuoyCount === 0}
                    on:click|stopPropagation={handleSatelliteSummaryPress}
                    on:keydown={(event) => {
                        if (displaySatelliteBuoyCount === 0) return;
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSatelliteSummaryPress(event);
                        }
                    }}
                >
                    <span class="buoy-plugin__summary-eye-slot">
                        {#if displaySatelliteBuoyCount > 0}
                            <button
                                type="button"
                                class="buoy-plugin__summary-eye"
                                class:buoy-plugin__summary-eye--hidden={!showSatelliteBuoys}
                                on:click|stopPropagation={handleToggleSatelliteVisibility}
                                title={showSatelliteBuoys ? t.hideSatelliteBuoys : t.showSatelliteBuoys}
                                aria-label={showSatelliteBuoys ? t.hideSatelliteBuoys : t.showSatelliteBuoys}
                            >
                                {#if showSatelliteBuoys}
                                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                {:else}
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                        <line x1="1" y1="1" x2="23" y2="23"/>
                                    </svg>
                                {/if}
                            </button>
                        {/if}
                    </span>
                    <span class="buoy-plugin__summary-label">{t.satelliteBuoys}</span>
                    <span class="buoy-plugin__summary-value-row">
                        <span class="buoy-plugin__summary-value">{displaySatelliteBuoyCount}</span>
                        {#if displaySatelliteBuoyCount > 0}
                            <span
                                class="buoy-plugin__summary-small-chevron"
                                class:buoy-plugin__summary-small-chevron--open={areSatellitePassesVisible}
                                aria-hidden="true"
                            ></span>
                        {/if}
                    </span>
                </div>

                {#if areSatellitePassesVisible}
                    <div class="buoy-plugin__passes">
                        <div class="buoy-plugin__passes-title">{t.satellitePasses}</div>

                        {#if isLoadingSatellitePasses}
                            <div class="buoy-plugin__passes-meta">{t.loadingSatellitePasses}</div>
                        {:else if satellitePassesError}
                            <div class="buoy-plugin__passes-error">{satellitePassesError}</div>
                        {:else if satellitePasses.length === 0}
                            <div class="buoy-plugin__passes-meta">{t.noSatellitePasses}</div>
                        {:else}
                            <div class="buoy-plugin__passes-list">
                                {#each satellitePassGroups as group (group.key)}
                                    {@const isGroupExpanded = expandedSatellitePassGroups[group.key]}
                                    <div class="buoy-plugin__pass-group">
                                        <button
                                            type="button"
                                            class="buoy-plugin__pass-group-header"
                                            on:click|stopPropagation={() => handleSatellitePassGroupToggle(group.key)}
                                            aria-expanded={isGroupExpanded}
                                        >
                                            <span class="buoy-plugin__summary-eye-slot" aria-hidden="true"></span>
                                            <span class="buoy-plugin__pass-group-title">{satellitePassGroupTitle(group.titleKey)}</span>
                                            <span class="buoy-plugin__summary-value-row">
                                                <span class="buoy-plugin__pass-group-count">{group.passes.length}</span>
                                                <span
                                                    class="buoy-plugin__summary-small-chevron"
                                                    class:buoy-plugin__summary-small-chevron--open={isGroupExpanded}
                                                    aria-hidden="true"
                                                ></span>
                                            </span>
                                        </button>
                                        {#if isGroupExpanded}
                                            <div class="buoy-plugin__passes-table-head">
                                                <span class="buoy-plugin__summary-eye-slot" aria-hidden="true"></span>
                                                <span>{t.satellitePassName}</span>
                                                <span>{t.satellitePassBuoysShort}</span>
                                                <span>{t.satellitePassObservationsShort}</span>
                                            </div>
                                            {#each group.passes as satellitePass (satellitePass.id)}
                                                <button
                                                    type="button"
                                                    class="buoy-plugin__pass-row"
                                                    on:click|stopPropagation={() => handleSatellitePassPress(satellitePass)}
                                                >
                                                    <span class="buoy-plugin__summary-eye-slot" aria-hidden="true"></span>
                                                    <span class="buoy-plugin__pass-name" title={formatSatellitePassLabel(satellitePass)}>
                                                        {formatSatellitePassLabel(satellitePass)}
                                                    </span>
                                                    <span class="buoy-plugin__pass-count">{satellitePass.buoyCount}</span>
                                                    <span class="buoy-plugin__pass-count">{satellitePass.observationCount}</span>
                                                </button>
                                            {/each}
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
    </div>
    
    <div class="buoy-plugin__footer">
        <PoweredBy variant="light" />
    </div>
</div>

<script lang="ts">
    import { map } from '@windy/map';
    import store from '@windy/store';
    import { onDestroy, onMount, tick } from 'svelte';
    import {
        chartPxToTime,
        chartYToPx,
        interpolateSeriesAt,
        nearestForecastAtTime,
        nearestReadingAtTime,
        renderForecastChartSvg,
        type ChartHoverContext,
        type ChartMarker,
        type ChartTimeRangeHours
    } from './forecastChart';
    import {
        FRESHNESS_RING_MIN_ZOOM,
        freshnessRingDisplaySize,
        freshnessRingHtmlForReading,
    } from './freshnessRing';
    import { detectLocale, getTranslations, type Locale, type Translations } from './locales';
    import PoweredBy from './PoweredBy.svelte';
    import { getPoweredByHtml } from './poweredByHtml';
    import { fetchWaveForecast, isIconEuWavesCoverage, parseWaveForecastModelId, type WaveForecastSample } from './windyForecast';

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

    type RawBuoyReading = Omit<BuoyReading, 'energy_per_wave' | 'wave_power'> & {
        energy_per_wave?: number | string | null;
        wave_power?: number | string | null;
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
        dtz?: string | null;
        slug?: string | null;
        virtual?: boolean | null;
        pass_id?: string | null;
        satellite_pass_id?: string | null;
        pass_name?: string | null;
        pass_platform?: string | null;
    };

    type RawBuoySummary = Omit<BuoySummary, 'lat' | 'lng' | 'last_reading' | 'pass_id' | 'satellite_pass_id'> & {
        lat: number | string | null;
        lng: number | string | null;
        pass_id?: number | string | null;
        satellite_pass_id?: number | string | null;
        external_id?: number | string | null;
        last_reading?: RawBuoyReading | null;
    };

    type BuoysResponse = {
        status?: string;
        data?: {
            buoys?: RawBuoySummary[];
            count?: number;
            real_count?: number;
            virtual_count?: number;
        };
        meta?: ApiMeta;
        error?: string;
        message?: string;
    };

    type PassBounds = {
        south: number | string | null;
        west: number | string | null;
        north: number | string | null;
        east: number | string | null;
    };

    type NormalizedPassBounds = {
        south: number;
        west: number;
        north: number;
        east: number;
        centerLat: number;
        centerLng: number;
        latSpan: number;
        lngSpan: number;
    };

    type RawSatellitePass = {
        id: number | string;
        name?: string | null;
        external_id?: string | null;
        satellite_pass_id?: string | null;
        platform?: string | null;
        started_at?: string | null;
        ended_at?: string | null;
        buoy_count?: number | string | null;
        observation_count?: number | string | null;
        bounds?: PassBounds | null;
    };

    type SatellitePass = {
        id: string;
        name: string;
        externalId?: string | null;
        satellitePassId: string;
        platform?: string | null;
        startedAt?: string | null;
        endedAt?: string | null;
        buoyCount: number;
        observationCount: number;
        bounds: PassBounds | null;
    };

    type SatellitePassesResponse = {
        status?: string;
        data?: {
            satellite_passes?: RawSatellitePass[];
            count?: number;
        };
        error?: string;
        message?: string;
    };

    type BuoyCluster = {
        id: string;
        buoys: BuoySummary[];
        lat: number;
        lng: number;
        bounds: L.LatLngBounds;
        realCount: number;
        satelliteCount: number;
        maxHeight: number | null;
        passId?: string | null;
        passLabel?: string | null;
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

        return 'https://api.thebuoy.app/v2';
    })();

    let apiBaseUrl = DEFAULT_BASE_URL;

    let buoys: BuoySummary[] = [];
    let markerMap = new Map<number, L.Marker>();
    let clusterMarkerMap = new Map<string, L.Marker>();
    let clusterDataMap = new Map<string, BuoyCluster>();
    let openedPopup: L.Popup | null = null;
    let currentPopupBuoy: BuoySummary | null = null;
    let fetchController: AbortController | null = null;
    let globalCountsFetchController: AbortController | null = null;
    let satellitePassesFetchController: AbortController | null = null;
    let popupChartAbort: AbortController | null = null;
    let windyTimestampListenerId: number | null = null;
    let isRefreshing = false;
    let isLoadingBuoys = false;
    let isLoadingGlobalCounts = false;
    let isSummaryExpanded = false;
    let summaryOpensUp = false;
    let summaryHeaderEl: HTMLButtonElement | undefined;
    let areSatellitePassesVisible = false;
    let showSatelliteBuoys = true;
    let expandedSatellitePassGroups: Record<SatellitePassGroupKey, boolean> = {
        spectral: false,
        altimeters: false,
    };
    let satellitePasses: SatellitePass[] = [];
    let hasLoadedSatellitePasses = false;
    let isLoadingSatellitePasses = false;
    let satellitePassesError: string | null = null;
    let totalBuoyCount: number | null = null;
    let realBuoyCount: number | null = null;
    let satelliteBuoyCount: number | null = null;
    let isUsingLocalCountFallback = false;
    let markerDisplayMode: 'height' | 'period' | 'energy' | 'name' = 'height';
    let heightUnit: 'meters' | 'feet' = 'meters';
    let visitorId: string = '';
    let currentLocale: Locale = 'en';
    let t: Translations = getTranslations();

    const VISITOR_ID_STORAGE_KEY = 'the-buoy-visitor-id';
    const SHOW_SATELLITE_BUOYS_STORAGE_KEY = 'showSatelliteBuoys';

    type SatellitePassGroupKey = 'spectral' | 'altimeters';
    const DEFAULT_THEBUOY_API_KEY = 'm5eGlGKlV3t9Mssix0TQZhq_GmrR0RCtbwdDENkc_hk';
    const WORLD_SCALE_PASS_LAT_SPAN = 80;
    const WORLD_SCALE_PASS_LNG_SPAN = 120;
    const WORLD_SCALE_PASS_ZOOM = 3.2;
    const SATELLITE_PASS_CLUSTER_MAX_ZOOM = 4.5;
    const SATELLITE_PASS_MERGE_MAX_ZOOM = 4.5;
    const SATELLITE_PASS_CLUSTER_CELL_PX = 80;
    const APP_ACCENT = '#FFF869';

    type WindyCalendarLike = {
        boundTs?: (ts: number) => number;
        step?: number;
        stepMs?: number;
        interval?: number;
        minTs?: number;
        maxTs?: number;
        start?: unknown;
        end?: unknown;
        from?: number;
        to?: number;
        midnight?: Date;
        calendarHours?: number;
    };

    type WindyTimelineAlignResult =
        | { ok: true; targetTimestamp: number }
        | { ok: false; reason: 'invalid_reading' | 'not_on_timeline'; earliestAvailable: number | null };

    type WindyStoreLike = {
        get: (name: string) => unknown;
        set: (name: string, value: number) => unknown;
        on?: (name: string, callback: () => void) => number;
        off?: (id: number) => void;
    };

    /** Purple palette aligned with La Bouée mobile app */
    const APP_PURPLE = '#7B5BB8';
    const APP_PURPLE_LIGHT = '#C4B2E0';
    const SATELLITE_AMBER = '#D97706';
    const SATELLITE_AMBER_LIGHT = '#FBBF24';

    $: localSatelliteBuoyCount = buoys.filter((buoy) => buoy.virtual === true).length;
    $: localRealBuoyCount = Math.max(0, buoys.length - localSatelliteBuoyCount);
    $: displayTotalBuoyCount = totalBuoyCount ?? buoys.length;
    $: displayRealBuoyCount = realBuoyCount ?? localRealBuoyCount;
    $: displaySatelliteBuoyCount = satelliteBuoyCount ?? localSatelliteBuoyCount;
    $: isLoadingSummary = isLoadingBuoys || (isLoadingGlobalCounts && totalBuoyCount === null);
    $: satellitePassGroups = buildSatellitePassGroups(satellitePasses);
    $: liveSummaryText =
        isLoadingSummary && displayTotalBuoyCount === 0
            ? t.mapLoading
            : formatCountTemplate(
                displayTotalBuoyCount === 1 ? t.buoysLiveSingular : t.buoysLivePlural,
                displayTotalBuoyCount,
            );

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
        loadShowSatelliteBuoysPreference();
        loadBuoys();
        loadGlobalBuoyCounts();
        map.on('moveend', onMapMoveEnd);
        map.on('zoomend', refreshAllIcons);
        windyTimestampListenerId = (store as unknown as WindyStoreLike).on?.('timestamp', rerenderOpenedSatelliteChart) ?? null;

        if (typeof window !== 'undefined') {
            (window as Window & { __buoyInspectWindyCalendar?: () => ReturnType<typeof inspectWindyCalendarForDebug> })
                .__buoyInspectWindyCalendar = () => {
                const info = inspectWindyCalendarForDebug();
                console.log('[the-buoy] Windy historical forecast window', info.historicalForecast);
                console.log('[the-buoy] Windy calendar inspect', info);
                if (info.boundTsProbes?.length) {
                    console.table(info.boundTsProbes);
                }
                if (info.calendarFields) {
                    console.log('[the-buoy] calendar fields', info.calendarFields);
                }
                return info;
            };
        }
    });

    onDestroy(() => {
        map.off('moveend', onMapMoveEnd);
        map.off('zoomend', refreshAllIcons);
        if (windyTimestampListenerId !== null) {
            (store as unknown as WindyStoreLike).off?.(windyTimestampListenerId);
            windyTimestampListenerId = null;
        }
        if (debounceTimer) clearTimeout(debounceTimer);
        fetchController?.abort();
        globalCountsFetchController?.abort();
        satellitePassesFetchController?.abort();
        popupChartAbort?.abort();
        window.removeEventListener('resize', handleSummaryWindowChange);
        delete (window as Window & { __buoyInspectWindyCalendar?: unknown }).__buoyInspectWindyCalendar;
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

        const apiKey = getApiKey();
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        // Add visitor ID header if available
        if (visitorId) {
            headers['X-Visitor-ID'] = visitorId;
        }

        return headers;
    }

    function getApiKey(): string {
        if (typeof window === 'undefined') return DEFAULT_THEBUOY_API_KEY;
        const injected = (window as unknown as { THEBUOY_API_KEY?: string }).THEBUOY_API_KEY;
        return (injected ?? DEFAULT_THEBUOY_API_KEY).trim();
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
        const json = await fetchJson<BuoysResponse>('/buoys/map', {
            ...getMapBoundsParams(),
        }, signal);

        return normalizeBuoys(json.data?.buoys ?? []);
    }

    async function fetchGlobalBuoyCounts(signal?: AbortSignal) {
        const json = await fetchJson<BuoysResponse>('/buoys/map', undefined, signal);
        const payload = json.data;
        const rawBuoys = payload?.buoys ?? [];
        const normalized = normalizeBuoys(rawBuoys);
        const fallbackSatellite = normalized.filter((buoy) => buoy.virtual === true).length;
        const fallbackTotal = normalized.length;
        const fallbackReal = Math.max(0, fallbackTotal - fallbackSatellite);

        totalBuoyCount = finiteCount(payload?.count, fallbackTotal);
        satelliteBuoyCount = finiteCount(payload?.virtual_count, fallbackSatellite);
        realBuoyCount = finiteCount(payload?.real_count, fallbackReal);
        isUsingLocalCountFallback = false;
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
        isLoadingBuoys = true;

        try {
            buoys = await fetchBuoysInBounds(controller.signal);
            await ensureSatellitePassesForClustering(buoys, controller.signal);
            updateMarkers();
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            console.error('Failed to load buoys:', error);
        } finally {
            if (fetchController === controller) {
                isLoadingBuoys = false;
            }
        }
    }

    async function loadGlobalBuoyCounts() {
        globalCountsFetchController?.abort();
        const controller = new AbortController();
        globalCountsFetchController = controller;
        isLoadingGlobalCounts = true;

        try {
            await fetchGlobalBuoyCounts(controller.signal);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            console.warn('Failed to load global buoy counts:', error);
            isUsingLocalCountFallback = true;
            updateCountsFromLocalBuoys();
        } finally {
            if (globalCountsFetchController === controller) {
                isLoadingGlobalCounts = false;
            }
        }
    }

    async function handleRefresh() {
        if (isRefreshing) return;
        isRefreshing = true;
        try {
            satellitePassesFetchController?.abort();
            satellitePasses = [];
            hasLoadedSatellitePasses = false;
            satellitePassesError = null;

            const tasks: Promise<unknown>[] = [loadBuoys(), loadGlobalBuoyCounts()];
            if (areSatellitePassesVisible) {
                tasks.push(loadSatellitePasses(true));
            }
            await Promise.all(tasks);
            refreshAllIcons();
        } finally {
            isRefreshing = false;
        }
    }

    function updateMarkers() {
        const { singleBuoys, clusters } = buildMarkerPlan();
        const visibleBuoyIds = new Set(singleBuoys.map(b => b.id));
        const visibleClusterIds = new Set(clusters.map(cluster => cluster.id));

        for (const [id, marker] of markerMap) {
            if (!visibleBuoyIds.has(id)) {
                map.removeLayer(marker);
                markerMap.delete(id);
                if (currentPopupBuoy?.id === id) {
                    openedPopup?.remove();
                    openedPopup = null;
                    currentPopupBuoy = null;
                }
            }
        }

        for (const [id, marker] of clusterMarkerMap) {
            if (!visibleClusterIds.has(id)) {
                map.removeLayer(marker);
                clusterMarkerMap.delete(id);
                clusterDataMap.delete(id);
            }
        }

        if (currentPopupBuoy && !visibleBuoyIds.has(currentPopupBuoy.id)) {
            openedPopup?.remove();
            openedPopup = null;
            currentPopupBuoy = null;
        }

        for (const buoy of singleBuoys) {
            const marker = markerMap.get(buoy.id);
            if (!marker) {
                markerMap.set(buoy.id, createMarker(buoy));
            } else {
                marker.setLatLng([buoy.lat, buoy.lng]);
                marker.setIcon(createIcon(buoy));
                if (currentPopupBuoy?.id === buoy.id) {
                    currentPopupBuoy = buoy;
                    openedPopup?.setLatLng([buoy.lat, buoy.lng]);
                }
            }
        }

        for (const cluster of clusters) {
            clusterDataMap.set(cluster.id, cluster);
            const marker = clusterMarkerMap.get(cluster.id);
            if (!marker) {
                clusterMarkerMap.set(cluster.id, createClusterMarker(cluster));
            } else {
                marker.setLatLng([cluster.lat, cluster.lng]);
                marker.setIcon(createClusterIcon(cluster));
            }
        }

        if (isUsingLocalCountFallback) {
            updateCountsFromLocalBuoys();
        }
    }

    function loadShowSatelliteBuoysPreference() {
        if (typeof window === 'undefined') return;

        try {
            const saved = localStorage.getItem(SHOW_SATELLITE_BUOYS_STORAGE_KEY);
            if (saved === 'false') {
                showSatelliteBuoys = false;
            }
        } catch {
            // ignore private browsing / blocked storage
        }
    }

    function persistShowSatelliteBuoys(show: boolean) {
        try {
            localStorage.setItem(SHOW_SATELLITE_BUOYS_STORAGE_KEY, show ? 'true' : 'false');
        } catch {
            // ignore
        }
    }

    function setShowSatelliteBuoysOnMap(show: boolean) {
        showSatelliteBuoys = show;
        persistShowSatelliteBuoys(show);
        updateMarkers();
    }

    function getMapBuoys(): BuoySummary[] {
        return showSatelliteBuoys ? buoys : buoys.filter((buoy) => buoy.virtual !== true);
    }

    function isCfosatPass(satellitePass: SatellitePass): boolean {
        return satellitePass.platform?.trim().toUpperCase() === 'CFOSAT';
    }

    type SatellitePassGroupTitleKey = 'satellitePassesWithSpectralData' | 'satellitePassesAltimeters';

    function buildSatellitePassGroups(passes: SatellitePass[]) {
        return [
            {
                key: 'spectral' as const,
                titleKey: 'satellitePassesWithSpectralData' as const,
                passes: passes.filter(isCfosatPass),
            },
            {
                key: 'altimeters' as const,
                titleKey: 'satellitePassesAltimeters' as const,
                passes: passes.filter((satellitePass) => !isCfosatPass(satellitePass)),
            },
        ].filter((group) => group.passes.length > 0);
    }

    function satellitePassGroupTitle(titleKey: SatellitePassGroupTitleKey): string {
        return t[titleKey];
    }

    function buildMarkerPlan(): { singleBuoys: BuoySummary[]; clusters: BuoyCluster[] } {
        const mapBuoys = getMapBuoys();

        if (!shouldClusterSatellitePasses()) {
            return { singleBuoys: mapBuoys, clusters: [] };
        }

        const zoom = map.getZoom();
        const mergePasses = zoom < SATELLITE_PASS_MERGE_MAX_ZOOM;
        const passGroups = new Map<string, {
            id: string;
            passId: string | null;
            passLabel: string | null;
            buoys: BuoySummary[];
            sumLat: number;
            lngSinSum: number;
            lngCosSum: number;
            bounds: L.LatLngBounds;
        }>();
        const singleBuoys: BuoySummary[] = [];

        for (const buoy of mapBuoys) {
            if (buoy.virtual !== true) {
                singleBuoys.push(buoy);
                continue;
            }

            // Skip the costly fuzzy pass match when merging — the label is generic there.
            const passCluster = getSatellitePassClusterForBuoy(buoy, !mergePasses);
            const passId = passCluster?.id ?? null;

            const point = map.project([buoy.lat, buoy.lng], zoom);
            const cellX = Math.floor(point.x / SATELLITE_PASS_CLUSTER_CELL_PX);
            const cellY = Math.floor(point.y / SATELLITE_PASS_CLUSTER_CELL_PX);
            const id = !mergePasses && passId
                ? `satellite-pass:${passId}:${cellX}:${cellY}`
                : `satellite-cell:${cellX}:${cellY}`;
            const existing = passGroups.get(id);

            if (existing) {
                existing.buoys.push(buoy);
                existing.sumLat += buoy.lat;
                existing.lngSinSum += Math.sin(degreesToRadians(buoy.lng));
                existing.lngCosSum += Math.cos(degreesToRadians(buoy.lng));
                existing.bounds.extend([buoy.lat, buoy.lng]);
                if (existing.passId !== passId) {
                    existing.passId = null;
                    existing.passLabel = null;
                }
            } else {
                passGroups.set(id, {
                    id,
                    passId,
                    passLabel: passCluster?.label ?? null,
                    buoys: [buoy],
                    sumLat: buoy.lat,
                    lngSinSum: Math.sin(degreesToRadians(buoy.lng)),
                    lngCosSum: Math.cos(degreesToRadians(buoy.lng)),
                    bounds: L.latLngBounds([buoy.lat, buoy.lng], [buoy.lat, buoy.lng]),
                });
            }
        }

        const clusters: BuoyCluster[] = [];

        for (const group of passGroups.values()) {
            if (group.buoys.length === 1) {
                singleBuoys.push(group.buoys[0]);
                continue;
            }

            const maxHeight = group.buoys.reduce<number | null>((max, buoy) => {
                const height = buoy.last_reading?.significient_height;
                if (height === null || height === undefined || !Number.isFinite(height)) return max;
                return max === null ? height : Math.max(max, height);
            }, null);
            const centerLat = group.sumLat / group.buoys.length;
            const centerLng = circularMeanLongitude(group.lngSinSum, group.lngCosSum);
            const position = getClusterRepresentativePosition(group.buoys, centerLat, centerLng);

            clusters.push({
                id: group.id,
                buoys: group.buoys,
                lat: position.lat,
                lng: position.lng,
                bounds: group.bounds,
                realCount: 0,
                satelliteCount: group.buoys.length,
                maxHeight,
                passId: group.passId,
                passLabel: group.passLabel,
            });
        }

        return { singleBuoys, clusters };
    }

    function shouldClusterSatellitePasses(): boolean {
        return map.getZoom() < SATELLITE_PASS_CLUSTER_MAX_ZOOM;
    }

    function degreesToRadians(degrees: number): number {
        return (degrees * Math.PI) / 180;
    }

    function circularMeanLongitude(sinSum: number, cosSum: number): number {
        if (Math.abs(sinSum) < 1e-9 && Math.abs(cosSum) < 1e-9) return 0;
        return normalizeLongitude((Math.atan2(sinSum, cosSum) * 180) / Math.PI);
    }

    function normalizeLongitude(longitude: number): number {
        const normalized = ((((longitude + 180) % 360) + 360) % 360) - 180;
        return normalized === -180 ? 180 : normalized;
    }

    function getClusterRepresentativePosition(
        buoys: BuoySummary[],
        centerLat: number,
        centerLng: number,
    ): { lat: number; lng: number } {
        const best = buoys.reduce<{ buoy: BuoySummary; score: number } | null>((bestMatch, buoy) => {
            const latDelta = buoy.lat - centerLat;
            const lngDelta = wrappedLongitudeDelta(buoy.lng, centerLng);
            const score = latDelta * latDelta + lngDelta * lngDelta;
            return !bestMatch || score < bestMatch.score ? { buoy, score } : bestMatch;
        }, null);

        return best ? { lat: best.buoy.lat, lng: best.buoy.lng } : { lat: centerLat, lng: centerLng };
    }

    function wrappedLongitudeDelta(a: number, b: number): number {
        return normalizeLongitude(a - b);
    }

    function getSatellitePassClusterForBuoy(
        buoy: BuoySummary,
        allowFuzzyMatch = true,
    ): { id: string; label: string } | null {
        if (buoy.virtual !== true) return null;
        const directPassId = coalesceNonEmptyString(buoy.pass_id, buoy.satellite_pass_id);
        if (directPassId) {
            return {
                id: directPassId,
                label: coalesceNonEmptyString(buoy.pass_name, directPassId, buoy.pass_platform) || directPassId,
            };
        }

        if (!allowFuzzyMatch) return null;
        const matchedPass = findMatchingSatellitePass(buoy);
        if (!matchedPass) return null;
        return {
            id: matchedPass.satellitePassId || matchedPass.externalId || matchedPass.id,
            label: matchedPass.name || matchedPass.satellitePassId || matchedPass.externalId || matchedPass.id,
        };
    }

    function findMatchingSatellitePass(buoy: BuoySummary): SatellitePass | null {
        if (!satellitePasses.length) return null;

        const readingTimestamp = parseReadingTimestamp(buoy.last_reading?.time || buoy.last_reading_time);
        let best: { pass: SatellitePass; score: number } | null = null;

        for (const satellitePass of satellitePasses) {
            const bounds = normalizedBounds(satellitePass.bounds);
            if (!bounds) continue;
            if (!isPointInsideBounds(buoy.lat, buoy.lng, bounds)) continue;

            const timeScore = getSatellitePassTimeScore(satellitePass, readingTimestamp);
            if (timeScore === null) continue;
            const areaScore = bounds.latSpan * bounds.lngSpan * 0.001;
            const centerScore =
                Math.abs(buoy.lat - bounds.centerLat) / Math.max(bounds.latSpan, 0.1) +
                Math.abs(buoy.lng - bounds.centerLng) / Math.max(bounds.lngSpan, 0.1);
            const score = timeScore + areaScore + centerScore;

            if (!best || score < best.score) {
                best = { pass: satellitePass, score };
            }
        }

        return best?.pass ?? null;
    }

    function getSatellitePassTimeScore(
        satellitePass: SatellitePass,
        readingTimestamp: number | null,
    ): number | null {
        if (readingTimestamp === null) return 0;
        const startedAt = parseReadingTimestamp(satellitePass.startedAt);
        const endedAt = parseReadingTimestamp(satellitePass.endedAt);
        if (startedAt === null || endedAt === null) return 0;

        const toleranceMs = 5 * 60_000;
        if (readingTimestamp < startedAt - toleranceMs || readingTimestamp > endedAt + toleranceMs) {
            return null;
        }

        const mid = startedAt + (endedAt - startedAt) / 2;
        return Math.abs(readingTimestamp - mid) / 60_000;
    }

    function isPointInsideBounds(lat: number, lng: number, bounds: NormalizedPassBounds): boolean {
        const epsilon = 1e-6;
        return (
            lat >= bounds.south - epsilon &&
            lat <= bounds.north + epsilon &&
            lng >= bounds.west - epsilon &&
            lng <= bounds.east + epsilon
        );
    }

    function normalizeBuoys(rawBuoys: RawBuoySummary[]): BuoySummary[] {
        return rawBuoys
            .map(normalizeBuoy)
            .filter((buoy): buoy is BuoySummary => buoy !== null);
    }

    function normalizeBuoy(raw: RawBuoySummary): BuoySummary | null {
        const lat = coalesceFiniteNumber(raw.lat);
        const lng = coalesceFiniteNumber(raw.lng);
        if (lat === null || lng === null) return null;

        return {
            ...raw,
            lat,
            lng,
            timezone: raw.timezone ?? raw.dtz ?? null,
            last_reading: normalizeReading(raw.last_reading),
            virtual: raw.virtual === true,
            pass_id: coalesceNonEmptyString(raw.pass_id, raw.satellite_pass_id, raw.external_id),
            satellite_pass_id: coalesceNonEmptyString(raw.satellite_pass_id),
        };
    }

    function normalizeReading(reading?: RawBuoyReading | null): BuoyReading | null {
        if (!reading) return null;
        return {
            ...reading,
            energy_per_wave: coalesceFiniteNumber(reading.energy_per_wave),
            wave_power: coalesceFiniteNumber(reading.wave_power),
        };
    }

    function coalesceFiniteNumber(value: number | string | null | undefined): number | null {
        if (value === null || value === undefined) return null;
        const n = typeof value === 'number' ? value : Number.parseFloat(String(value));
        return Number.isFinite(n) ? n : null;
    }

    function coalesceNonEmptyString(...values: Array<number | string | null | undefined>): string | null {
        for (const value of values) {
            if (value === null || value === undefined) continue;
            const text = String(value).trim();
            if (text.length) return text;
        }
        return null;
    }

    function finiteCount(value: number | null | undefined, fallback: number): number {
        return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    }

    function updateCountsFromLocalBuoys() {
        const satellite = buoys.filter((buoy) => buoy.virtual === true).length;
        totalBuoyCount = buoys.length;
        satelliteBuoyCount = satellite;
        realBuoyCount = Math.max(0, buoys.length - satellite);
    }

    function refreshAllIcons() {
        updateMarkers();
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

    function handleNameClick(event: MouseEvent) {
        event.preventDefault();
        markerDisplayMode = 'name';
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
        for (const marker of clusterMarkerMap.values()) map.removeLayer(marker);
        markerMap.clear();
        clusterMarkerMap.clear();
        clusterDataMap.clear();
        openedPopup = null;
        currentPopupBuoy = null;
    }

    const SUMMARY_COMFORTABLE_HEIGHT = 260;

    function updateSummaryDirection() {
        if (!summaryHeaderEl) return;
        const rect = summaryHeaderEl.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        summaryOpensUp = spaceBelow < SUMMARY_COMFORTABLE_HEIGHT && spaceAbove > spaceBelow;
    }

    async function refreshSummaryDirection() {
        await tick();
        updateSummaryDirection();
    }

    function handleSummaryWindowChange() {
        if (isSummaryExpanded) updateSummaryDirection();
    }

    async function handleSummaryToggle(event: MouseEvent) {
        event.preventDefault();
        if (displayTotalBuoyCount === 0 && isLoadingSummary) return;
        isSummaryExpanded = !isSummaryExpanded;
        if (isSummaryExpanded) {
            window.addEventListener('resize', handleSummaryWindowChange);
            await refreshSummaryDirection();
        } else {
            window.removeEventListener('resize', handleSummaryWindowChange);
            areSatellitePassesVisible = false;
        }
    }

    function handleSatelliteSummaryPress(event: MouseEvent) {
        event.preventDefault();
        if (displaySatelliteBuoyCount === 0) return;
        const nextVisible = !areSatellitePassesVisible;
        areSatellitePassesVisible = nextVisible;
        if (nextVisible) {
            void loadSatellitePasses(false);
        }
        void refreshSummaryDirection();
    }

    function handleToggleSatelliteVisibility(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        setShowSatelliteBuoysOnMap(!showSatelliteBuoys);
    }

    function handleSatellitePassGroupToggle(key: SatellitePassGroupKey) {
        expandedSatellitePassGroups = {
            ...expandedSatellitePassGroups,
            [key]: !expandedSatellitePassGroups[key],
        };
        void refreshSummaryDirection();
    }

    async function loadSatellitePasses(force = false) {
        if (!force && (hasLoadedSatellitePasses || isLoadingSatellitePasses)) return;

        satellitePassesFetchController?.abort();
        const controller = new AbortController();
        satellitePassesFetchController = controller;
        isLoadingSatellitePasses = true;
        satellitePassesError = null;

        try {
            satellitePasses = await fetchSatellitePasses(controller.signal);
            hasLoadedSatellitePasses = true;
            updateMarkers();
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            console.error('Failed to load satellite passes:', error);
            satellitePassesError = error instanceof Error ? error.message : t.satellitePassesError;
        } finally {
            if (satellitePassesFetchController === controller) {
                isLoadingSatellitePasses = false;
            }
        }
    }

    async function ensureSatellitePassesForClustering(
        visibleBuoys: BuoySummary[],
        signal?: AbortSignal,
    ) {
        if (hasLoadedSatellitePasses || isLoadingSatellitePasses) return;
        if (!shouldClusterSatellitePasses()) return;
        if (!visibleBuoys.some((buoy) => buoy.virtual === true)) return;

        try {
            satellitePasses = await fetchSatellitePasses(signal);
            hasLoadedSatellitePasses = true;
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') throw error;
            console.warn('Failed to load satellite passes for clustering:', error);
        }
    }

    async function fetchSatellitePasses(signal?: AbortSignal): Promise<SatellitePass[]> {
        const json = await fetchJson<SatellitePassesResponse>(
            '/buoys/satellite_passes',
            { limit: 100 },
            signal,
        );
        return (json.data?.satellite_passes ?? []).map(normalizeSatellitePass);
    }

    function normalizeSatellitePass(raw: RawSatellitePass): SatellitePass {
        const satellitePassId = raw.external_id || raw.satellite_pass_id || String(raw.id);
        return {
            id: String(raw.id),
            name: raw.name?.trim() || '',
            externalId: raw.external_id,
            satellitePassId,
            platform: raw.platform,
            startedAt: raw.started_at,
            endedAt: raw.ended_at,
            buoyCount: finiteCount(coalesceFiniteNumber(raw.buoy_count), 0),
            observationCount: finiteCount(coalesceFiniteNumber(raw.observation_count), 0),
            bounds: raw.bounds ?? null,
        };
    }

    function handleSatellitePassPress(satellitePass: SatellitePass) {
        const bounds = normalizedBounds(satellitePass.bounds);
        if (!bounds) return;

        if (isWorldScalePassBounds(bounds)) {
            map.flyTo([bounds.centerLat, bounds.centerLng], WORLD_SCALE_PASS_ZOOM, { duration: 0.9 });
            return;
        }

        map.fitBounds(
            [
                [bounds.south, bounds.west],
                [bounds.north, bounds.east],
            ],
            { padding: [40, 40], maxZoom: 8 },
        );
    }

    function normalizedBounds(bounds?: PassBounds | null): NormalizedPassBounds | null {
        if (!bounds) return null;

        const south = coalesceFiniteNumber(bounds.south);
        const west = coalesceFiniteNumber(bounds.west);
        const north = coalesceFiniteNumber(bounds.north);
        const east = coalesceFiniteNumber(bounds.east);
        if (south === null || west === null || north === null || east === null) return null;

        const centerLat = (south + north) / 2;
        const centerLng = (west + east) / 2;
        const minSpan = 0.2;
        const latSpan = Math.max(Math.abs(north - south), minSpan);
        const lngSpan = Math.max(Math.abs(east - west), minSpan);

        return {
            south: centerLat - latSpan / 2,
            west: centerLng - lngSpan / 2,
            north: centerLat + latSpan / 2,
            east: centerLng + lngSpan / 2,
            centerLat,
            centerLng,
            latSpan,
            lngSpan,
        };
    }

    function isWorldScalePassBounds(bounds: NormalizedPassBounds): boolean {
        return bounds.latSpan >= WORLD_SCALE_PASS_LAT_SPAN && bounds.lngSpan >= WORLD_SCALE_PASS_LNG_SPAN;
    }

    function formatSatellitePassLabel(satellitePass: SatellitePass): string {
        const index = satellitePasses.findIndex((pass) => pass.id === satellitePass.id);
        return satellitePass.name || formatCountTemplate(t.satellitePassFallback, index + 1);
    }

    function formatCountTemplate(template: string, count: number): string {
        return template
            .replace(/\{\{\s*count\s*\}\}/g, String(count))
            .replace(/\{\s*count\s*\}/g, String(count))
            .replace(/\{\{\s*index\s*\}\}/g, String(count))
            .replace(/\{\s*index\s*\}/g, String(count));
    }

    function formatDurationTemplate(template: string, durationMs: number): string {
        return template
            .replace(/\{\{\s*duration\s*\}\}/g, formatDurationShort(durationMs))
            .replace(/\{\s*duration\s*\}/g, formatDurationShort(durationMs));
    }

    function formatDurationShort(durationMs: number): string {
        const totalMinutes = Math.max(1, Math.round(durationMs / 60_000));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours <= 0) return `${minutes}${t.minutes}`;
        if (minutes === 0) return `${hours}${t.hours}`;
        return `${hours}${t.hours} ${minutes}${t.minutes}`;
    }

    function markerLabelForBuoy(buoy: BuoySummary): string | null {
        if (markerDisplayMode === 'name') {
            const name = buoy.name?.trim();
            return name ? name : null;
        }
        if (markerDisplayMode === 'period') {
            const period = buoy.last_reading?.period;
            return period !== null && period !== undefined ? `${period.toFixed(1)}s` : '—';
        }
        if (markerDisplayMode === 'energy') {
            return formatEnergyShort(getReadingEnergy(buoy.last_reading));
        }
        return formatHeightShort(
            buoy.last_reading?.significient_height,
            buoy.last_reading?.unit,
        );
    }

    function markerDirectionArrowHtml(buoy: BuoySummary): string {
        if (markerDisplayMode === 'name') return '';
        const swellFrom = buoy.last_reading?.direction;
        if (swellFrom === null || swellFrom === undefined || !Number.isFinite(swellFrom)) return '';
        const rotation = ((swellFrom % 360) + 360) % 360;
        return `<div class="iconfont buoy-marker__arrow" style="transform: rotate(${rotation}deg); -webkit-transform: rotate(${rotation}deg);" aria-hidden="true">"</div>`;
    }

    function createIcon(buoy: BuoySummary): L.DivIcon {
        const color = markerColorForHeight(buoy.last_reading?.significient_height);
        const displayLabel = markerLabelForBuoy(buoy);
        const directionArrowHtml = markerDirectionArrowHtml(buoy);
        const zoom = map.getZoom();
        const readingTime = buoy.last_reading?.time ?? '';
        const showRing = zoom >= FRESHNESS_RING_MIN_ZOOM;
        const ringHtml = showRing ? freshnessRingHtmlForReading(readingTime, zoom) : '';
        const labelHtml = displayLabel
            ? `<div class="buoy-marker__label" style="background-color:${color};"><span class="buoy-marker__label-inner">${directionArrowHtml}<span class="buoy-marker__text">${escapeHtml(displayLabel)}</span></span></div>`
            : '';
        const coreSize = showRing ? freshnessRingDisplaySize(zoom) : 14;
        const anchorY = showRing ? coreSize / 2 : 7;
        const labelExtraWidth = directionArrowHtml ? 14 : 0;
        const width = Math.max(
            coreSize,
            displayLabel ? Math.min(140, displayLabel.length * 6.5 + 16 + labelExtraWidth) : coreSize,
        );
        const height = coreSize + (displayLabel ? 14 : 0);
        const stackClass = showRing ? 'buoy-marker__stack buoy-marker__stack--ring' : 'buoy-marker__stack';

        return L.divIcon({
            className: 'buoy-marker',
            html: `<div class="${stackClass}">
                <div class="buoy-marker__core" style="width:${coreSize}px;height:${coreSize}px;">
                    ${ringHtml}
                    <div class="buoy-marker__dot" style="background-color:${color};"></div>
                </div>
                ${labelHtml}
            </div>`,
            iconSize: [width, height],
            iconAnchor: [width / 2, anchorY],
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

    function createClusterIcon(cluster: BuoyCluster): L.DivIcon {
        const count = cluster.buoys.length;
        const size = count >= 1000 ? 50 : count >= 100 ? 44 : 38;
        const fontSize = Math.round(size * 0.34);

        return L.divIcon({
            className: 'buoy-cluster',
            html: `<div class="buoy-cluster__bubble" style="width:${size}px; height:${size}px; font-size:${fontSize}px;" title="${escapeHtml(formatClusterTitle(cluster))}">
                <span class="buoy-cluster__count">${formatCompactNumber(count)}</span>
            </div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
        });
    }

    function createClusterMarker(cluster: BuoyCluster) {
        const marker = new L.Marker([cluster.lat, cluster.lng], {
            icon: createClusterIcon(cluster),
            riseOnHover: true,
        }).addTo(map);
        marker.setZIndexOffset(200);
        marker.on('click', () => {
            const latestCluster = clusterDataMap.get(cluster.id) ?? cluster;
            handleClusterClick(latestCluster);
        });
        return marker;
    }

    function handleClusterClick(cluster: BuoyCluster) {
        // Each cluster covers at most one screen cell, so fitting its bounds always
        // zooms in; it either de-clusters or splits into tighter cells on reload.
        map.fitBounds(cluster.bounds, {
            padding: [60, 60],
            maxZoom: SATELLITE_PASS_CLUSTER_MAX_ZOOM + 4,
        });
    }

    function formatClusterTitle(cluster: BuoyCluster): string {
        const total = formatCountTemplate(
            cluster.buoys.length === 1 ? t.buoysLiveSingular : t.buoysLivePlural,
            cluster.buoys.length,
        );
        const passLabel = cluster.passLabel ? `${t.satellitePassName} ${cluster.passLabel}` : t.satellitePassName;
        return `${passLabel} · ${total} · ${t.satelliteBuoys}: ${cluster.satelliteCount}`;
    }

    function formatCompactNumber(value: number): string {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
        if (value >= 10_000) return `${Math.round(value / 1000)}k`;
        if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
        return String(value);
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

    function isMobilePopupViewport(): boolean {
        if (typeof window === 'undefined') return false;
        return window.matchMedia('(max-width: 640px)').matches;
    }

    function openBuoyPopup(buoy: BuoySummary) {
        popupChartAbort?.abort();
        popupChartAbort = null;

        openedPopup?.remove();

        popupChartAbort = new AbortController();
        const chartSignal = popupChartAbort.signal;

        const content = buildBuoyPopupContent(buoy);
        if (!isMobilePopupViewport()) {
            void populateBuoyPopupChart(content, buoy, chartSignal);
        }

        const popup = new L.Popup({
            // Asymmetric clearance keeps the popup out from under Windy's top
            // overlay readout and the bottom timeline/play nav on mobile.
            // (autoPanPadding is ignored once topLeft/bottomRight are set.)
            autoPanPaddingTopLeft: [16, 72],
            autoPanPaddingBottomRight: [16, 160],
            className: 'buoy-leaflet-popup',
            closeButton: false,
        })
            .setLatLng([buoy.lat, buoy.lng])
            .setContent(content)
            .openOn(map);

        const closeButton = content.querySelector('[data-buoy-popup-close]') as HTMLButtonElement | null;
        closeButton?.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            map.closePopup(popup);
        });

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
        const isSatelliteBuoy = buoy.virtual === true;
        const alignWindyLabel = isSatelliteBuoy ? t.alignSatelliteWindyTimeline : t.alignWindyTimeline;
        const alignWindyTitle = isSatelliteBuoy ? t.alignSatelliteWindyTimelineTitle : t.alignWindyTimelineTitle;
        const alignWindyDone = isSatelliteBuoy ? t.alignSatelliteWindyTimelineDone : t.alignWindyTimelineDone;
        const chartPanelTitle = isSatelliteBuoy ? t.satelliteChartPanelToggle : t.chartPanelToggle;
        const observationLegend = isSatelliteBuoy ? t.legendSatelliteObservation : t.legendBuoySig;
        const maximumLegend = isSatelliteBuoy ? t.legendSatelliteMaximum : t.legendBuoyMax;

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
        const satelliteObservationHtml = isSatelliteBuoy
            ? `
            <div class="buoy-popup__satellite-notice">
                <div class="buoy-popup__satellite-icon" aria-hidden="true">SAT</div>
                <div class="buoy-popup__satellite-copy">
                    <div class="buoy-popup__satellite-title">${escapeHtml(t.satelliteObservation)}</div>
                    <div class="buoy-popup__satellite-description">${escapeHtml(t.satelliteObservationDescription)}</div>
                </div>
            </div>
        `
            : '';

        wrapper.innerHTML = `
            <div class="buoy-popup__header" style="background-color: ${color};">
                <div class="buoy-popup__header-main">
                    <div class="buoy-popup__title">${escapeHtml(buoy.name)}</div>
                    <div class="buoy-popup__time" data-relative="${relativeTime}" data-absolute="${absoluteTime}" style="cursor: pointer;" title="Click to toggle">${relativeTime}</div>
                </div>
                <button type="button" class="buoy-popup__close" data-buoy-popup-close aria-label="Close">
                    <svg class="buoy-popup__close-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                        <path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" />
                    </svg>
                </button>
            </div>

            ${satelliteObservationHtml}

            ${readingTime ? `
                <div class="buoy-popup__timeline-sync">
                    <button
                        type="button"
                        class="buoy-popup__timeline-sync-button"
                        data-sync-windy-time
                        data-sync-label="${escapeHtml(alignWindyLabel)}"
                        data-sync-done="${escapeHtml(alignWindyDone)}"
                        title="${escapeHtml(alignWindyTitle)}"
                    >
                        ${escapeHtml(alignWindyLabel)}
                    </button>
                    <p class="buoy-popup__timeline-sync-error" data-sync-windy-error role="alert" hidden></p>
                </div>
            ` : ''}

            <div class="buoy-popup__stats"></div>

            <div class="buoy-popup__chart-panel">
                <button type="button" class="buoy-popup__chart-panel-toggle" aria-expanded="false" aria-controls="buoy-chart-panel-${buoy.id}">
                    <span class="buoy-popup__chart-panel-title">${chartPanelTitle}</span>
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
                ${isSatelliteBuoy ? '<div class="buoy-popup__satellite-latency" data-satellite-latency></div>' : ''}
                <div class="buoy-popup__chart-wrap">
                    <div class="buoy-popup__chart-body buoy-popup__chart-body--loading">${t.forecastLoading}</div>
                </div>
                <div class="buoy-popup__legend">
                    <span class="buoy-popup__legend-row"><span class="buoy-popup__legend-line ${isSatelliteBuoy ? 'buoy-popup__legend-line--sat' : 'buoy-popup__legend-line--sig'}"></span>${observationLegend}</span>
                    <span class="buoy-popup__legend-row"><span class="buoy-popup__legend-line ${isSatelliteBuoy ? 'buoy-popup__legend-line--sat-max' : 'buoy-popup__legend-line--max'}"></span>${maximumLegend}</span>
                    <span class="buoy-popup__legend-row"><span class="buoy-popup__legend-line buoy-popup__legend-line--fc"></span>${t.legendForecast}</span>
                </div>
            </div>
                </div>
            </div>
        `;

        const titleElement = wrapper.querySelector('.buoy-popup__title') as HTMLElement | null;
        if (titleElement) wireTruncatedTextTooltip(titleElement, buoy.name);

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

        const rowDirection = createStatsRow(true);
        rowDirection.appendChild(
            createDirectionCompassStat(lastReading?.direction, color, lastReading?.period),
        );
        stats.appendChild(rowDirection);

        const footer = document.createElement('div');
        footer.className = 'buoy-popup__footer';
        const buoyPathId = buoy.slug || String(buoy.id);
        footer.innerHTML = `
            <a href="https://labouee.app/buoy/${buoyPathId}" target="_blank" rel="noreferrer noopener" class="buoy-popup__link">
                ${t.viewAllReadings} ${buoy.name}
            </a>
            ${getPoweredByHtml(currentLocale)}
        `;
        wrapper.appendChild(footer);

        wireWindyTimelineSync(wrapper, readingTime);
        wireChartPanelToggle(wrapper);
        wireForecastModelSelect(wrapper, buoy);
        wireChartRangePills(wrapper);
        return wrapper;
    }

    function parseReadingTimestamp(readingTime?: string | null): number | null {
        if (!readingTime) return null;
        const timestamp = new Date(readingTime).getTime();
        return Number.isFinite(timestamp) ? timestamp : null;
    }

    function getWindyCalendar(): WindyCalendarLike | null {
        try {
            const windyStore = store as unknown as WindyStoreLike;
            const calendar = windyStore.get('calendar');
            return calendar && typeof calendar === 'object' ? (calendar as WindyCalendarLike) : null;
        } catch {
            return null;
        }
    }

    function formatWindyTimelineTimestamp(timestamp: number): string {
        try {
            return new Intl.DateTimeFormat(localeForIntl(), {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(timestamp));
        } catch {
            return new Date(timestamp).toLocaleString();
        }
    }

    function formatWindyTimelineUnavailableMessage(earliestAvailable: number | null): string {
        if (earliestAvailable === null) return t.alignWindyTimelineUnavailableFallback;
        return t.alignWindyTimelineUnavailable.replace(
            '{time}',
            formatWindyTimelineTimestamp(earliestAvailable),
        );
    }

    function timestampDebugInfo(timestamp: number | null) {
        if (timestamp === null) return null;
        return {
            raw: timestamp,
            iso: new Date(timestamp).toISOString(),
            formatted: formatWindyTimelineTimestamp(timestamp),
        };
    }

    /** Dev helper: run `__buoyInspectWindyCalendar()` in the browser console. */
    function inspectWindyCalendarForDebug() {
        const windyStore = store as unknown as WindyStoreLike;
        const calendar = getWindyCalendar();
        const playhead = getCurrentWindyTimestamp();
        const historicalRange = getWindyHistoricalForecastRange();
        const probeTimes = [
            { label: 'playhead', ts: playhead },
            { label: '6h before playhead', ts: playhead - 6 * 3600_000 },
            { label: '24h before playhead', ts: playhead - 24 * 3600_000 },
            { label: '7d before playhead', ts: playhead - 7 * 24 * 3600_000 },
        ];

        const boundTsProbes = calendar?.boundTs
            ? probeTimes.map(({ label, ts }) => {
                  const bounded = calendar.boundTs!(ts);
                  const snapToleranceMs = getWindyTimelineSnapToleranceMs();
                  return {
                      label,
                      in: new Date(ts).toISOString(),
                      out: new Date(bounded).toISOString(),
                      deltaHours: Math.round(((bounded - ts) / 3600_000) * 100) / 100,
                      onHistoricalGrid: Math.abs(bounded - ts) <= snapToleranceMs,
                  };
              })
            : null;

        const calendarFields = calendar
            ? Object.fromEntries(
                  Object.keys(calendar as object).map((key) => {
                      const value = (calendar as Record<string, unknown>)[key];
                      if (typeof value === 'function') {
                          return [key, `[Function ${value.name || 'anonymous'}]`];
                      }
                      if (typeof value === 'number' && Number.isFinite(value) && value > 1e11) {
                          return [key, { raw: value, iso: new Date(value).toISOString() }];
                      }
                      if (value instanceof Date) {
                          return [key, { raw: value.getTime(), iso: value.toISOString() }];
                      }
                      return [key, value];
                  }),
              )
            : null;

        const timestamp = windyStore.get('timestamp');

        return {
            overlay: windyStore.get('overlay'),
            product: windyStore.get('product'),
            timestamp: typeof timestamp === 'number' ? timestampDebugInfo(timestamp) : timestamp,
            historicalForecast: {
                earliest: timestampDebugInfo(historicalRange.earliest),
                latest: timestampDebugInfo(historicalRange.latest),
            },
            calendar,
            calendarKeys: calendar ? Object.keys(calendar as object) : null,
            calendarFields,
            boundTsType: typeof calendar?.boundTs,
            boundTsSource: calendar?.boundTs?.toString?.(),
            boundTsProbes,
            stepMs: getWindyCalendarStepMs(),
            snapToleranceMs: getWindyTimelineSnapToleranceMs(),
        };
    }

    function getWindyCalendarBoundTimestamp(timestamp: number): number {
        try {
            const calendar = getWindyCalendar();
            const boundedTimestamp = calendar?.boundTs?.(timestamp);
            return typeof boundedTimestamp === 'number' && Number.isFinite(boundedTimestamp)
                ? boundedTimestamp
                : timestamp;
        } catch (error) {
            console.warn('Unable to read Windy calendar bounds', error);
            return timestamp;
        }
    }

    function calendarTimestampFromValue(value: unknown): number | null {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value < 1e12 ? value * 1000 : value;
        }
        if (value instanceof Date) {
            return value.getTime();
        }
        if (value && typeof value === 'object') {
            const record = value as { ts?: number; timestamp?: number; time?: number; getTime?: () => number };
            if (typeof record.getTime === 'function') {
                const ts = record.getTime();
                return Number.isFinite(ts) ? ts : null;
            }
            const raw = record.ts ?? record.timestamp ?? record.time;
            if (typeof raw === 'number' && Number.isFinite(raw)) {
                return raw < 1e12 ? raw * 1000 : raw;
            }
        }
        return null;
    }

    function getWindyCalendarStepMs(): number {
        const calendar = getWindyCalendar();
        const rawStep = calendar?.stepMs ?? calendar?.step ?? calendar?.interval;
        if (typeof rawStep === 'number' && Number.isFinite(rawStep) && rawStep > 0) {
            return rawStep < 1000 ? rawStep * 1000 : rawStep;
        }
        return 60 * 60_000;
    }

    function getWindyTimelineSnapToleranceMs(): number {
        const stepMs = getWindyCalendarStepMs();
        return Math.max(stepMs / 2, 15 * 60_000);
    }

    /**
     * Oldest time Windy can actually play historical forecast for: walk back from the
     * playhead while boundTs(ts) still lands on the same step (not clamped forward).
     */
    function getEarliestHistoricalForecastTimestamp(): number | null {
        const calendar = getWindyCalendar();
        if (!calendar?.boundTs) return null;

        const stepMs = getWindyCalendarStepMs();
        const snapToleranceMs = getWindyTimelineSnapToleranceMs();
        const playhead = getCurrentWindyTimestamp();
        const calendarMin = getWindyTimelineEdgeTimestamp('min');
        const calendarHours = calendar.calendarHours;
        const searchSpanMs =
            typeof calendarHours === 'number' && calendarHours > 0
                ? calendarHours * stepMs
                : 15 * 24 * 60 * 60_000;
        const searchStart = calendarMin ?? playhead - searchSpanMs;

        let earliest: number | null = null;
        for (let ts = playhead; ts >= searchStart; ts -= stepMs) {
            const bounded = calendar.boundTs(ts);
            if (Math.abs(bounded - ts) <= snapToleranceMs) {
                earliest = ts;
                continue;
            }
            if (earliest !== null) break;
        }

        return earliest;
    }

    function getLatestForecastTimestamp(): number | null {
        return getWindyTimelineEdgeTimestamp('max');
    }

    function getWindyHistoricalForecastRange(): { earliest: number | null; latest: number | null } {
        return {
            earliest: getEarliestHistoricalForecastTimestamp(),
            latest: getLatestForecastTimestamp(),
        };
    }

    function getWindyTimelineEdgeTimestamp(direction: 'min' | 'max'): number | null {
        const calendar = getWindyCalendar();
        if (!calendar) return null;

        if (direction === 'min') {
            const fromMidnight = calendarTimestampFromValue(calendar.midnight);
            if (fromMidnight !== null) return fromMidnight;
            const fromStart = calendarTimestampFromValue(calendar.start);
            if (fromStart !== null) return fromStart;
            const directMin = calendar.minTs ?? calendar.from;
            if (typeof directMin === 'number' && Number.isFinite(directMin)) {
                return directMin < 1e12 ? directMin * 1000 : directMin;
            }
        } else {
            const fromEnd = calendarTimestampFromValue(calendar.end);
            if (fromEnd !== null) return fromEnd;
            const directMax = calendar.maxTs ?? calendar.to;
            if (typeof directMax === 'number' && Number.isFinite(directMax)) {
                return directMax < 1e12 ? directMax * 1000 : directMax;
            }
        }

        const probeTimestamp = direction === 'min'
            ? Date.now() - 365 * 24 * 60 * 60_000
            : Date.now() + 365 * 24 * 60 * 60_000;
        const bounded = calendar.boundTs?.(probeTimestamp);
        return typeof bounded === 'number' && Number.isFinite(bounded) ? bounded : null;
    }

    function isReadingTimeOnWindyTimeline(readingTimestamp: number): boolean {
        const calendar = getWindyCalendar();
        if (!calendar?.boundTs) return true;

        const snapToleranceMs = getWindyTimelineSnapToleranceMs();
        const { earliest, latest } = getWindyHistoricalForecastRange();

        if (earliest !== null && readingTimestamp < earliest - snapToleranceMs) {
            return false;
        }
        if (latest !== null && readingTimestamp > latest + snapToleranceMs) {
            return false;
        }

        const boundedTimestamp = calendar.boundTs(readingTimestamp);
        return Math.abs(boundedTimestamp - readingTimestamp) <= snapToleranceMs;
    }

    function getCurrentWindyTimestamp(): number {
        try {
            const windyStore = store as unknown as WindyStoreLike;
            const timestamp = windyStore.get('timestamp');
            return typeof timestamp === 'number' && Number.isFinite(timestamp) ? timestamp : Date.now();
        } catch {
            return Date.now();
        }
    }

    function alignWindyTimelineToReading(readingTime?: string | null): WindyTimelineAlignResult {
        const readingTimestamp = parseReadingTimestamp(readingTime);
        const { earliest } = getWindyHistoricalForecastRange();
        if (readingTimestamp === null) {
            return { ok: false, reason: 'invalid_reading', earliestAvailable: earliest };
        }

        if (!isReadingTimeOnWindyTimeline(readingTimestamp)) {
            return { ok: false, reason: 'not_on_timeline', earliestAvailable: earliest };
        }

        try {
            const windyStore = store as unknown as WindyStoreLike;
            const targetTimestamp = getWindyCalendarBoundTimestamp(readingTimestamp);
            const currentTimestamp = windyStore.get('timestamp');
            const didChange = windyStore.set('timestamp', targetTimestamp) === true;
            if (!didChange && currentTimestamp !== targetTimestamp) {
                return { ok: false, reason: 'not_on_timeline', earliestAvailable: earliest };
            }
            return { ok: true, targetTimestamp };
        } catch (error) {
            console.warn('Unable to align Windy timeline to buoy reading', error);
            return { ok: false, reason: 'not_on_timeline', earliestAvailable: earliest };
        }
    }

    function showWindyTimelineSyncError(wrapper: HTMLElement, message: string) {
        const errorEl = wrapper.querySelector('[data-sync-windy-error]') as HTMLElement | null;
        if (!errorEl) return;

        errorEl.textContent = message;
        errorEl.removeAttribute('hidden');
        window.clearTimeout(
            (errorEl as HTMLElement & { __syncErrorTimeout?: number }).__syncErrorTimeout,
        );
        (errorEl as HTMLElement & { __syncErrorTimeout?: number }).__syncErrorTimeout = window.setTimeout(
            () => {
                errorEl.setAttribute('hidden', '');
                errorEl.textContent = '';
            },
            6000,
        );
    }

    function clearWindyTimelineSyncError(wrapper: HTMLElement) {
        const errorEl = wrapper.querySelector('[data-sync-windy-error]') as HTMLElement | null;
        if (!errorEl) return;
        window.clearTimeout((errorEl as HTMLElement & { __syncErrorTimeout?: number }).__syncErrorTimeout);
        errorEl.setAttribute('hidden', '');
        errorEl.textContent = '';
    }

    function wireWindyTimelineSync(wrapper: HTMLElement, readingTime?: string | null) {
        const button = wrapper.querySelector('[data-sync-windy-time]') as HTMLButtonElement | null;
        if (!button) return;

        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();

            const result = alignWindyTimelineToReading(readingTime);
            if (!result.ok) {
                if (result.reason === 'not_on_timeline') {
                    showWindyTimelineSyncError(
                        wrapper,
                        formatWindyTimelineUnavailableMessage(result.earliestAvailable),
                    );
                }
                return;
            }

            clearWindyTimelineSyncError(wrapper);

            if (getBuoyChartCache(wrapper)) {
                rerenderBuoyChartFromCache(wrapper);
            } else {
                updateSatelliteLatencyInfo(wrapper, readingTime, result.targetTimestamp);
            }

            const originalText = button.dataset.syncLabel || button.textContent || t.alignWindyTimeline;
            button.textContent = button.dataset.syncDone || t.alignWindyTimelineDone;
            button.classList.add('buoy-popup__timeline-sync-button--done');
            window.setTimeout(() => {
                button.textContent = originalText;
                button.classList.remove('buoy-popup__timeline-sync-button--done');
            }, 1400);
        });
    }

    function localeForIntl(): string {
        const m: Record<Locale, string> = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES', it: 'it-IT' };
        return m[currentLocale] || 'en-GB';
    }

    type BuoyChartCache = {
        forecastSamples: WaveForecastSample[];
        readings: BuoyReading[];
        isSatellite: boolean;
        latestReadingTime?: string | null;
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
        const windyTimestamp = getCurrentWindyTimestamp();
        const latestReadingTimestamp = parseReadingTimestamp(cache.latestReadingTime);
        const isSatellite = cache.isSatellite === true;
        const markers: ChartMarker[] = [];
        const importantTimes: number[] = [];
        if (isSatellite && latestReadingTimestamp !== null) {
            markers.push({
                time: latestReadingTimestamp,
                label: t.satelliteChartObservationMarker,
                color: SATELLITE_AMBER,
            });
            markers.push({
                time: windyTimestamp,
                label: t.satelliteChartWindyMarker,
                color: APP_PURPLE,
                dashed: true,
            });
            importantTimes.push(latestReadingTimestamp, windyTimestamp);
        }
        updateSatelliteLatencyInfo(wrapper, cache.latestReadingTime, windyTimestamp);
        const result = renderForecastChartSvg({
            forecast: cache.forecastSamples,
            readings: cache.readings ?? [],
            heightUnit,
            width,
            height: 112,
            primaryColor: APP_PURPLE,
            lightColor: APP_PURPLE_LIGHT,
            observationColor: isSatellite ? SATELLITE_AMBER : APP_PURPLE,
            observationLightColor: isSatellite ? SATELLITE_AMBER_LIGHT : APP_PURPLE_LIGHT,
            timeRangeHours: parseChartRangeHours(wrapper),
            nowMs: isSatellite ? windyTimestamp : undefined,
            locale: localeForIntl(),
            snapshotMode: isSatellite,
            markers,
            importantTimes,
            showNowLine: !isSatellite,
        });
        bodyEl.innerHTML = result.svg;

        const tooltip = document.createElement('div');
        tooltip.className = 'buoy-popup__chart-tooltip';
        tooltip.style.display = 'none';
        bodyEl.appendChild(tooltip);

        wireChartHover(bodyEl, result.ctx, tooltip, isSatellite);
    }

    function updateSatelliteLatencyInfo(
        wrapper: HTMLElement,
        readingTime?: string | null,
        windyTimestamp = getCurrentWindyTimestamp(),
    ) {
        const latencyEl = wrapper.querySelector('[data-satellite-latency]') as HTMLElement | null;
        if (!latencyEl) return;

        const readingTimestamp = parseReadingTimestamp(readingTime);
        if (readingTimestamp === null) {
            latencyEl.textContent = '';
            latencyEl.setAttribute('hidden', '');
            return;
        }

        const deltaMs = windyTimestamp - readingTimestamp;
        const absDeltaMs = Math.abs(deltaMs);
        const alignedThresholdMs = 5 * 60_000;
        const delayedThresholdMs = 2 * 60 * 60_000;
        const staleThresholdMs = 6 * 60 * 60_000;
        let modifier = 'normal';
        let text = '';

        if (absDeltaMs <= alignedThresholdMs) {
            modifier = 'aligned';
            text = t.satelliteLatencyAligned;
        } else if (deltaMs < 0) {
            modifier = 'ahead';
            text = formatDurationTemplate(t.satelliteLatencyAhead, absDeltaMs);
        } else if (deltaMs >= staleThresholdMs) {
            modifier = 'stale';
            text = formatDurationTemplate(t.satelliteLatencyStale, absDeltaMs);
        } else if (deltaMs >= delayedThresholdMs) {
            modifier = 'delayed';
            text = formatDurationTemplate(t.satelliteLatencyDelayed, absDeltaMs);
        } else {
            text = formatDurationTemplate(t.satelliteLatencyBehind, absDeltaMs);
        }

        latencyEl.removeAttribute('hidden');
        latencyEl.className = `buoy-popup__satellite-latency buoy-popup__satellite-latency--${modifier}`;
        latencyEl.textContent = text;
    }

    function rerenderOpenedSatelliteChart() {
        const content = openedPopup?.getContent();
        if (!(content instanceof HTMLElement)) return;
        const cache = getBuoyChartCache(content);
        if (cache?.isSatellite !== true) return;

        const chartInner = content.querySelector('.buoy-popup__chart-panel-inner') as HTMLElement | null;
        if (chartInner?.hasAttribute('hidden')) return;
        rerenderBuoyChartFromCache(content);
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
        isSatelliteSnapshot = false,
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
            const snapshotTime = ctx.sigPts[0]?.t ?? ctx.maxPts[0]?.t ?? null;
            const snapshotToleranceMs = Math.max((ctx.geometry.xMax - ctx.geometry.xMin) * 0.025, 30 * 60_000);
            const showSnapshot =
                !isSatelliteSnapshot ||
                snapshotTime === null ||
                Math.abs(tMs - snapshotTime) <= snapshotToleranceMs;
            const sigY = isSatelliteSnapshot
                ? showSnapshot ? ctx.sigPts[0]?.y ?? null : null
                : isPast ? interpolateSeriesAt(ctx.sigPts, tMs) : null;
            const maxY = isSatelliteSnapshot
                ? showSnapshot ? ctx.maxPts[0]?.y ?? null : null
                : isPast ? interpolateSeriesAt(ctx.maxPts, tMs) : null;
            const fcY = interpolateSeriesAt(ctx.fcPts, tMs);

            const reading = isSatelliteSnapshot
                ? showSnapshot ? ctx.readings[0] ?? null : null
                : isPast ? nearestReadingAtTime(ctx.readings, tMs) : null;
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

            tooltip.innerHTML = renderTooltipHtml(tMs, sigY, maxY, buoyDir, fcY, fcDir, isSatelliteSnapshot);
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
        isSatelliteSnapshot = false,
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
            const sig = sigY != null ? formatDisplayHeightShort(sigY) : '—';
            const mx = maxY != null ? formatDisplayHeightShort(maxY) : '—';
            const dir = fmtDir(buoyDir);
            const value = `${sig} / ${mx}${dir ? ` · ${dir}` : ''}`;
            const label = isSatelliteSnapshot ? t.satelliteChartObservationMarker : t.summaryBuoyPrefix;
            rows.push(
                `<div class="buoy-popup__chart-tooltip-row buoy-popup__chart-tooltip-row--buoy"><span class="buoy-popup__chart-tooltip-swatch ${isSatelliteSnapshot ? 'buoy-popup__chart-tooltip-swatch--sat' : 'buoy-popup__chart-tooltip-swatch--sig'}"></span><span class="buoy-popup__chart-tooltip-label">${escapeHtml(label)}</span><span class="buoy-popup__chart-tooltip-value">${escapeHtml(value)}</span></div>`,
            );
        }
        if (fcY != null) {
            const h = formatDisplayHeightShort(fcY);
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

    function wireTruncatedTextTooltip(element: HTMLElement, fullText: string) {
        const syncTitle = () => {
            const truncated = element.scrollWidth > element.clientWidth + 1;
            if (truncated) {
                element.title = fullText;
            } else {
                element.removeAttribute('title');
            }
        };
        syncTitle();
        requestAnimationFrame(syncTitle);
        if (typeof ResizeObserver !== 'undefined') {
            const observer = new ResizeObserver(syncTitle);
            observer.observe(element);
        }
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

    function createDirectionCompassStat(
        direction?: number | null,
        accentColor?: string,
        period?: number | null,
    ) {
        const item = document.createElement('div');
        item.className = 'buoy-popup__stat buoy-popup__stat--direction-compass';
        item.appendChild(createCompassDial(direction, accentColor, period));

        const copy = document.createElement('div');
        copy.className = 'buoy-popup__direction-compass-copy';
        const labelDiv = document.createElement('div');
        labelDiv.className = 'buoy-popup__stat-label';
        labelDiv.textContent = t.direction;
        const valueDiv = document.createElement('div');
        valueDiv.className = 'buoy-popup__stat-value';
        valueDiv.textContent = formatDirection(direction);
        copy.appendChild(labelDiv);
        copy.appendChild(valueDiv);
        item.appendChild(copy);
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

    function formatDisplayHeightShort(value?: number | null) {
        if (value === null || value === undefined) return '—';
        const displayUnit = heightUnit === 'feet' ? 'ft' : 'm';
        return `${value.toFixed(1)}${displayUnit}`;
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

    async function fetchRecentReadings(buoy: BuoySummary, signal?: AbortSignal): Promise<BuoyReading[]> {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 168 * 60 * 60 * 1000);
        try {
            const json = await fetchJson<ReadingsListResponse>(
                `/buoys/${encodeURIComponent(String(buoy.id))}/readings`,
                {
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    order: 'asc',
                    per_page: 100,
                },
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

    function getLatestChartReading(buoy: BuoySummary, readings: BuoyReading[]): BuoyReading | null {
        const candidates = [
            ...readings,
            ...(buoy.last_reading ? [buoy.last_reading] : []),
        ]
            .map((reading) => {
                const time = reading.time || buoy.last_reading_time;
                return time ? { ...reading, time } : reading;
            })
            .filter((reading) => reading.time && parseReadingTimestamp(reading.time) !== null);

        if (!candidates.length) return null;
        return candidates.reduce((latest, reading) => {
            const latestTs = parseReadingTimestamp(latest.time) ?? 0;
            const readingTs = parseReadingTimestamp(reading.time) ?? 0;
            return readingTs > latestTs ? reading : latest;
        });
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
            const latestReading = getLatestChartReading(buoy, readings);
            const chartReadings = buoy.virtual === true
                ? latestReading ? [latestReading] : []
                : readings;
            setBuoyChartCache(wrapper, {
                forecastSamples: samples,
                readings: chartReadings,
                isSatellite: buoy.virtual === true,
                latestReadingTime: latestReading?.time || buoy.last_reading_time,
            });

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
    @app-accent-purple: #6b55f6;
    @satellite-amber: #d97706;
    @satellite-amber-light: #fbbf24;

    :global(.buoy-marker) {
        background: transparent;
        border: none;
    }

    :global(.buoy-marker__stack) {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
        cursor: pointer;
    }

    :global(.buoy-marker__core) {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    :global(.buoy-marker__ring) {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    :global(.buoy-marker__dot) {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 14px;
        height: 14px;
        margin: -7px 0 0 -7px;
        border-radius: 50%;
        border: 2px solid #fff;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
        flex-shrink: 0;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    :global(.buoy-marker__stack:hover .buoy-marker__dot) {
        transform: scale(1.08);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.42);
    }

    :global(.buoy-marker__label) {
        margin-top: 0;
        padding: 1px 4px;
        border-radius: 7px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        max-width: 140px;
    }

    :global(.buoy-marker__stack--ring .buoy-marker__label) {
        margin-top: -6px;
    }

    :global(.buoy-marker__label-inner) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        max-width: 100%;
        min-height: 12px;
    }

    :global(.buoy-marker__arrow.iconfont) {
        display: inline-block;
        flex: 0 0 auto;
        width: auto;
        height: auto;
        line-height: 1;
        color: #fff;
        transform-origin: 50% 50%;
        -webkit-font-smoothing: antialiased;
    }

    :global(.buoy-marker__text) {
        font-size: 10px;
        font-weight: 700;
        color: #fff;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    :global(.buoy-cluster) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
    }

    :global(.buoy-cluster__bubble) {
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        border-radius: 50%;
        background: fade(@app-accent-purple, 90%);
        color: #fff;
        line-height: 1;
        border: 2px solid rgba(255, 255, 255, 0.95);
        box-shadow:
            0 2px 7px rgba(0, 0, 0, 0.32),
            0 0 0 4px fade(@app-accent-purple, 22%);
        cursor: pointer;
        font-variant-numeric: tabular-nums;
        transform: translateZ(0);
        transition: transform 0.16s ease, box-shadow 0.16s ease;
    }

    :global(.buoy-cluster__bubble:hover) {
        transform: scale(1.08);
        box-shadow:
            0 4px 13px rgba(0, 0, 0, 0.42),
            0 0 0 5px fade(@app-accent-purple, 32%);
    }

    :global(.buoy-cluster__count) {
        font-size: 1em;
        font-weight: 800;
        letter-spacing: -0.02em;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.32);
    }

    :global(.buoy-leaflet-popup .leaflet-popup-content) {
        margin: 0;
        width: min(360px, calc(100vw - 24px)) !important;
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

    :global(.buoy-popup) {
        max-width: 100%;
        background: @color-white;
        border-radius: @size-s;
        overflow: hidden;
    }

    :global(.buoy-popup__chart-panel) {
        border-top: 1px solid @color-gray-light;
    }

    @media (max-width: 640px) {
        :global(.buoy-popup__chart-panel) {
            display: none !important;
        }
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

    :global(.buoy-popup__satellite-latency) {
        margin: 0 0 6px;
        padding: 6px 8px;
        border: 1px solid #fed7aa;
        border-radius: @size-xxs;
        background: #fff7ed;
        color: #92400e;
        font-size: 10.5px;
        font-weight: 800;
        line-height: 1.25;
    }

    :global(.buoy-popup__satellite-latency[hidden]) {
        display: none !important;
    }

    :global(.buoy-popup__satellite-latency--aligned) {
        border-color: #bbf7d0;
        background: #f0fdf4;
        color: #166534;
    }

    :global(.buoy-popup__satellite-latency--delayed) {
        border-color: #fcd34d;
        background: #fffbeb;
        color: #92400e;
    }

    :global(.buoy-popup__satellite-latency--stale) {
        border-color: #fecaca;
        background: #fef2f2;
        color: #991b1b;
    }

    :global(.buoy-popup__satellite-latency--ahead) {
        border-color: #bfdbfe;
        background: #eff6ff;
        color: #1d4ed8;
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

    :global(.buoy-popup__legend-line--sat) {
        border-top: 2.5px solid @satellite-amber;
    }

    :global(.buoy-popup__legend-line--sat-max) {
        border-top: 2px solid @satellite-amber-light;
    }

    :global(.buoy-popup__legend-line--fc) {
        border-top: 2px dashed @app-purple;
        opacity: 0.7;
    }

    :global(.buoy-popup__header) {
        padding: @size-xs @size-s @size-xs @size-m;
        color: @color-white;
        position: relative;
        display: flex;
        align-items: center;
        gap: @size-s;
    }

    :global(.buoy-popup__header-main) {
        flex: 1 1 auto;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: @size-s;
    }

    :global(.buoy-popup__close) {
        flex: 0 0 auto;
        width: 32px;
        height: 32px;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        border: none;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.22);
        color: @color-white;
        cursor: pointer;
        display: grid;
        place-items: center;
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.28);
        transition: background 0.15s ease, box-shadow 0.15s ease;
        -webkit-tap-highlight-color: transparent;
    }

    :global(.buoy-popup__close-icon) {
        display: block;
        flex-shrink: 0;
    }

    :global(.buoy-popup__close:hover),
    :global(.buoy-popup__close:focus-visible) {
        background: rgba(0, 0, 0, 0.34);
        box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
        outline: none;
    }

    :global(.buoy-popup__title) {
        flex: 1 1 auto;
        min-width: 0;
        font-weight: 700;
        font-size: @size-m;
        line-height: 1.2;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    :global(.buoy-popup__time) {
        flex: 0 0 auto;
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

    :global(.buoy-popup__satellite-notice) {
        display: flex;
        align-items: flex-start;
        gap: @size-xs;
        padding: @size-s @size-m;
        background: fade(@app-purple, 10%);
        border-bottom: 1px solid fade(@app-purple, 22%);
    }

    :global(.buoy-popup__satellite-icon) {
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 28px;
        height: 20px;
        margin-top: 1px;
        padding: 0 5px;
        border-radius: 999px;
        background: @app-purple;
        color: #fff;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: 0.04em;
        line-height: 1;
    }

    :global(.buoy-popup__satellite-copy) {
        min-width: 0;
    }

    :global(.buoy-popup__satellite-title) {
        margin-bottom: 2px;
        color: @color-gray-dark;
        font-size: @size-s;
        font-weight: 800;
        line-height: 1.2;
    }

    :global(.buoy-popup__satellite-description) {
        color: @color-gray;
        font-size: @size-s;
        line-height: 1.3;
    }

    :global(.buoy-popup__timeline-sync) {
        padding: @size-xxs @size-m;
        background: @color-white;
        border-bottom: 1px solid @color-gray-light;
    }

    :global(.buoy-popup__timeline-sync-button) {
        width: 100%;
        min-height: 30px;
        padding: 0 @size-s;
        border: 1px solid fade(@app-purple, 28%);
        border-radius: @size-xs;
        background: fade(@app-purple, 9%);
        color: @app-purple;
        font-size: @size-s;
        font-weight: 800;
        line-height: 1.2;
        cursor: pointer;
        transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
    }

    :global(.buoy-popup__timeline-sync-button:hover),
    :global(.buoy-popup__timeline-sync-button:focus-visible) {
        border-color: fade(@app-purple, 48%);
        background: fade(@app-purple, 15%);
        color: darken(@app-purple, 8%);
        outline: none;
    }

    :global(.buoy-popup__timeline-sync-button--done) {
        border-color: fade(#1faa7a, 45%);
        background: fade(#1faa7a, 14%);
        color: darken(#1faa7a, 18%);
    }

    :global(.buoy-popup__timeline-sync-error) {
        margin: @size-xxs 0 0;
        padding: 6px 8px;
        border: 1px solid #fecaca;
        border-radius: @size-xxs;
        background: #fef2f2;
        color: #b91c1c;
        font-size: @size-xxs + 2px;
        font-weight: 700;
        line-height: 1.3;
        text-align: left;
    }

    :global(.buoy-popup__timeline-sync-error[hidden]) {
        display: none !important;
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

    :global(.buoy-popup__chart-tooltip-swatch--sat) {
        background: @satellite-amber;
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

    :global(.buoy-popup__stat) {
        padding: @size-xxs @size-s;
        background: @color-white;
        width: auto !important;
        float: none !important;
    }

    :global(.buoy-popup__stat--direction-compass) {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: @size-s;
        min-height: 48px;
    }

    :global(.buoy-popup__direction-compass-copy) {
        flex: 1 1 auto;
        min-width: 0;
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
        --compass-radius: 21px;
        --compass-source-radius: 19px;
        --compass-pulse-duration: 2.6s;
        position: relative;
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
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
        inset: 2px;
    }

    :global(.buoy-popup__compass-circle--middle) {
        inset: 8.5px;
    }

    :global(.buoy-popup__compass-circle--inner) {
        inset: 14.75px;
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
        font-size: 7px;
        font-weight: 800;
        color: rgba(107, 107, 107, 0.55);
        line-height: 1;
        letter-spacing: 0.02em;
        text-transform: uppercase;
        z-index: 1;
    }

    :global(.buoy-popup__compass-cardinal--n) {
        top: 2px;
        left: 50%;
        transform: translateX(-50%);
    }

    :global(.buoy-popup__compass-cardinal--e) {
        right: 3px;
        top: 50%;
        transform: translateY(-50%);
    }

    :global(.buoy-popup__compass-cardinal--s) {
        bottom: 2px;
        left: 50%;
        transform: translateX(-50%);
    }

    :global(.buoy-popup__compass-cardinal--w) {
        left: 3px;
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
        width: 4px;
        height: 4px;
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
        width: 21px;
        height: var(--compass-source-radius);
        clip-path: path('M 10.5 19 L 1.34 2.39 A 19 19 0 0 1 19.66 2.39 Z');
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
        top: 4px;
        width: 14px;
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
        width: 9px;
        height: 9px;
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
        width: 3px;
        height: 3px;
        border-radius: 999px;
        background: #2d4a54;
        box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);
        animation: buoy-popup-compass-dot-pulse var(--compass-pulse-duration) ease-in-out infinite;
    }

    :global(.buoy-popup__compass-ripple) {
        position: absolute;
        left: 50%;
        top: 50%;
        width: 12px;
        height: 12px;
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
        padding: @size-xxs @size-s;
        background: lighten(@color-gray-light, 7%);
        text-align: center;
        font-size: @size-xxs + 2px;
        color: @color-gray;
        border-top: 1px solid @color-gray-light;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: @size-xxs @size-xs;
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

    :global(#plugins) {
        z-index: 12000 !important;
    }

    :global(#plugins > *),
    :global(#plugins .plugin),
    :global(#plugins .plugin-content) {
        position: relative;
        z-index: 12000 !important;
    }

    .buoy-plugin {
        position: relative;
        z-index: 12001;
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

    .buoy-plugin__summary {
        position: relative;
        z-index: 1;
        margin-top: @size-xs;
        overflow: visible;
        border-radius: @size-s;
        background: #4b4b4b;
        box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            0 8px 18px rgba(0, 0, 0, 0.22);
    }

    .buoy-plugin__summary-header {
        display: flex;
        width: 100%;
        min-height: 36px;
        align-items: center;
        gap: @size-xs;
        padding: @size-xxs @size-s;
        box-sizing: border-box;
        border: none;
        border-radius: @size-s;
        background: transparent;
        color: rgba(255, 255, 255, 0.92);
        font-family: inherit;
        font-size: @size-s;
        font-weight: 600;
        line-height: 1.25;
        text-align: left;
        cursor: pointer;
    }

    .buoy-plugin__summary-header:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.08);
    }

    .buoy-plugin__summary-header:disabled {
        cursor: wait;
        opacity: 0.78;
    }

    .buoy-plugin__live-dot {
        flex: 0 0 8px;
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #fff869;
        box-shadow: 0 0 0 0 rgba(255, 248, 105, 0.55);
        animation: buoy-plugin-live-pulse 1.8s ease-out infinite;
    }

    .buoy-plugin__summary-title {
        flex: 1 1 auto;
        min-width: 0;
        overflow-wrap: anywhere;
    }

    .buoy-plugin__summary-chevron,
    .buoy-plugin__summary-small-chevron {
        flex: 0 0 auto;
        width: 7px;
        height: 7px;
        border-right: 2px solid #fff869;
        border-bottom: 2px solid #fff869;
        transform: rotate(45deg);
        transition: transform 0.18s ease, margin 0.18s ease;
    }

    .buoy-plugin__summary--expanded .buoy-plugin__summary-chevron,
    .buoy-plugin__summary-small-chevron--open {
        transform: rotate(-135deg);
        margin-top: 4px;
    }

    .buoy-plugin__summary-panel {
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        z-index: 30;
        margin-top: 4px;
        max-height: min(60vh, 420px);
        overflow-y: auto;
        padding: 2px 0 @size-xs;
        border-radius: @size-s;
        background: #4b4b4b;
        box-shadow:
            inset 0 0 0 1px rgba(255, 255, 255, 0.14),
            0 10px 24px rgba(0, 0, 0, 0.32);
    }

    .buoy-plugin__summary--up .buoy-plugin__summary-panel {
        top: auto;
        bottom: 100%;
        margin-top: 0;
        margin-bottom: 4px;
    }

    .buoy-plugin__summary-row,
    .buoy-plugin__pass-group-header,
    .buoy-plugin__pass-row {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr) auto;
        align-items: center;
        column-gap: @size-xs;
        width: 100%;
        min-height: 36px;
        padding: 0 @size-s;
        box-sizing: border-box;
        border: none;
        border-radius: @size-xxs;
        background: transparent;
        color: rgba(255, 255, 255, 0.86);
        font-family: inherit;
        line-height: 1.25;
    }

    .buoy-plugin__summary-row--button {
        cursor: default;
    }

    .buoy-plugin__summary-row--interactive {
        cursor: pointer;
    }

    .buoy-plugin__summary-row--interactive:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .buoy-plugin__summary-row--disabled {
        pointer-events: none;
        opacity: 1;
    }

    .buoy-plugin__summary-label,
    .buoy-plugin__pass-group-title {
        justify-self: start;
    }

    .buoy-plugin__summary-value,
    .buoy-plugin__summary-value-row,
    .buoy-plugin__pass-group-count {
        justify-self: end;
    }

    .buoy-plugin__summary-eye-slot {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 20px;
        justify-self: center;
    }

    .buoy-plugin__summary-eye {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: none;
        background: transparent;
        color: #fff;
        cursor: pointer;
        line-height: 0;
    }

    .buoy-plugin__summary-eye--hidden {
        color: rgba(255, 255, 255, 0.6);
    }

    .buoy-plugin__summary-eye:hover {
        color: #fff;
    }

    .buoy-plugin__summary-label {
        min-width: 0;
        font-size: @size-s;
        font-weight: 500;
        overflow-wrap: anywhere;
    }

    .buoy-plugin__summary-value,
    .buoy-plugin__pass-count {
        color: #fff;
        font-size: @size-s;
        font-weight: 800;
    }

    .buoy-plugin__summary-value-row {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
    }

    .buoy-plugin__summary-small-chevron {
        width: 6px;
        height: 6px;
        border-width: 1.5px;
        opacity: 0.75;
    }

    .buoy-plugin__passes {
        margin-top: @size-xxs;
        padding-top: @size-xs;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
        background: #4b4b4b;
    }

    .buoy-plugin__passes-title {
        margin: 0 0 @size-xxs;
        padding: 0 @size-s;
        color: rgba(255, 255, 255, 0.72);
        font-size: @size-xxs + 2px;
        font-weight: 700;
        line-height: 1.2;
        text-transform: uppercase;
    }

    .buoy-plugin__passes-table-head {
        display: grid;
        grid-template-columns: 20px minmax(0, 1fr) 44px 44px;
        align-items: center;
        column-gap: @size-xxs;
        width: 100%;
        min-height: 26px;
        padding: 0 @size-s 4px;
        box-sizing: border-box;
        border-top: 1px solid rgba(255, 255, 255, 0.14);
        color: rgba(255, 255, 255, 0.55);
        font-size: @size-xxs + 1px;
        font-weight: 700;
        line-height: 1.2;
        text-transform: uppercase;
    }

    .buoy-plugin__passes-table-head span:nth-child(3),
    .buoy-plugin__passes-table-head span:nth-child(4) {
        text-align: right;
    }

    .buoy-plugin__passes-list {
        max-height: 180px;
        overflow-y: auto;
        padding-right: 2px;
        background: #4b4b4b;
    }

    .buoy-plugin__pass-group {
        margin-bottom: 6px;
    }

    .buoy-plugin__pass-group-header {
        color: rgba(255, 255, 255, 0.82);
        text-align: left;
        cursor: pointer;
    }

    .buoy-plugin__pass-group-header:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .buoy-plugin__pass-group-title {
        min-width: 0;
        font-size: @size-xs + 1px;
        font-weight: 700;
        line-height: 1.25;
        overflow-wrap: anywhere;
    }

    .buoy-plugin__pass-group-count {
        color: #fff;
        font-size: @size-xs + 1px;
        font-weight: 700;
    }

    .buoy-plugin__pass-row {
        grid-template-columns: 20px minmax(0, 1fr) 44px 44px;
        min-height: 34px;
        padding-top: 4px;
        padding-bottom: 4px;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        color: #fff;
        text-align: left;
        cursor: pointer;
    }

    .buoy-plugin__pass-row:hover {
        background: rgba(255, 255, 255, 0.08);
    }

    .buoy-plugin__pass-name {
        min-width: 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: @size-xxs + 2px;
        font-weight: 600;
        line-height: 1.25;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .buoy-plugin__pass-count {
        text-align: right;
    }

    .buoy-plugin__passes-meta,
    .buoy-plugin__passes-error {
        padding: @size-xxs @size-s;
        color: rgba(255, 255, 255, 0.68);
        font-size: @size-s;
        line-height: 1.3;
    }

    .buoy-plugin__passes-error {
        color: #fecaca;
    }

    @keyframes buoy-plugin-live-pulse {
        0% {
            box-shadow: 0 0 0 0 rgba(255, 248, 105, 0.55);
        }
        70% {
            box-shadow: 0 0 0 7px rgba(255, 248, 105, 0);
        }
        100% {
            box-shadow: 0 0 0 0 rgba(255, 248, 105, 0);
        }
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

    /* Mobile / bottom-sheet pass: Windy renders the plugin as a bottom sheet and
       keeps its timeline + play nav docked below. Keep our floating panels from
       spanning the screen and clear the device safe-area so nothing tucks under
       the home indicator or the nav. autoPan padding (see openBuoyPopup) handles
       the popup's position relative to the same chrome. */
    @media (max-width: 700px) {
        .buoy-plugin {
            padding-bottom: calc(@size-m + env(safe-area-inset-bottom)) !important;
        }

        .buoy-plugin__summary-panel {
            max-height: min(50dvh, 360px);
        }

        :global(.buoy-popup) {
            max-height: min(68dvh, 560px);
            overflow-y: auto;
        }
    }
</style>
