<div class="buoy-plugin">
    <div class="buoy-plugin__header">
        <h2 class="buoy-plugin__title">{title}</h2>
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
    
    <nav class="switch switch--uiswitch switch--stretch size-s mb-10" data-tooltip="Marker Display">
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
    </nav>
    
    <nav class="switch switch--uiswitch switch--stretch size-s mb-10" data-tooltip="Unit">
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

<script lang="ts">
    import { map } from '@windy/map';
    import { onDestroy, onMount } from 'svelte';
    import config from './pluginConfig';
    import { getTranslations, type Translations } from './locales';

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

    const { title } = config;
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
    let markers: L.Marker[] = [];
    let openedPopup: L.Popup | null = null;
    let isRefreshing = false;
    let markerDisplayMode: 'height' | 'period' = 'height';
    let heightUnit: 'meters' | 'feet' = 'meters';
    let visitorId: string = '';
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

    onMount(() => {
        // Initialize locale and translations
        t = getTranslations();
        visitorId = getOrCreateVisitorId();
        loadBuoys();
    });

    onDestroy(() => {
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

    async function fetchJson<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
        const url = buildApiUrl(path, params);
        const headers = buildHeaders();
        const response = await fetch(url, { headers });

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

    async function fetchAllBuoys(): Promise<BuoySummary[]> {
        const perPage = 100;
        let page = 1;
        let totalPages = 1;
        const all: BuoySummary[] = [];

        while (page <= totalPages) {
            const json = await fetchJson<BuoysResponse>('/buoys', {
                page,
                per_page: perPage,
                active_only: 'true',
            });

            const pageBuoys = json.data?.buoys ?? [];
            all.push(...pageBuoys);
            totalPages = json.meta?.total_pages ?? 1;
            page += 1;
        }

        return all;
    }


    async function loadBuoys() {
        try {
            buoys = await fetchAllBuoys();
            rebuildMarkers();
        } catch (error) {
            console.error('Failed to load buoys:', error);
            clearMarkers();
        }
    }

    async function handleRefresh() {
        if (isRefreshing) return;
        isRefreshing = true;
        try {
            await loadBuoys();
        } finally {
            isRefreshing = false;
        }
    }

    function rebuildMarkers() {
        clearMarkers();
        markers = buoys.map(buoy => createMarker(buoy));
    }

    function handleDisplayModeChange() {
        rebuildMarkers();
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

    function handleUnitChange() {
        // Rebuild markers and update popups if any are open
        rebuildMarkers();
        // If a popup is open, refresh it to show updated units
        if (openedPopup) {
            const marker = markers.find(m => {
                const latlng = m.getLatLng();
                const popupLatlng = openedPopup?.getLatLng();
                return popupLatlng && latlng.lat === popupLatlng.lat && latlng.lng === popupLatlng.lng;
            });
            if (marker) {
                const buoy = buoys.find(b => {
                    const markerLatlng = marker.getLatLng();
                    return Math.abs(b.lat - markerLatlng.lat) < 0.0001 && Math.abs(b.lng - markerLatlng.lng) < 0.0001;
                });
                if (buoy) {
                    openBuoyPopup(buoy);
                }
            }
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
        markers.forEach(m => map.removeLayer(m));
        markers = [];
        openedPopup = null;
    }

    function createMarker(buoy: BuoySummary) {
        const color = markerColorForHeight(buoy.last_reading?.significient_height);
        
        let displayLabel: string;
        if (markerDisplayMode === 'period') {
            const period = buoy.last_reading?.period;
            displayLabel = period !== null && period !== undefined ? `${period.toFixed(1)}s` : '—';
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
        
        const icon = L.divIcon({
            className: 'buoy-marker',
            html: `<div class="buoy-marker__badge" style="--badge-color:${color};">
                ${arrowHtml}
                <span class="buoy-marker__text">${displayLabel}</span>
            </div>`,
            iconSize: [60, 24],
            iconAnchor: [30, 12],
        });

        const marker = new L.Marker([buoy.lat, buoy.lng], { icon }).addTo(map);
        marker.on('click', () => openBuoyPopup(buoy));
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
            if (openedPopup === popup) openedPopup = null;
        });
        openedPopup = popup;
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
        stats.appendChild(createStat(t.height, formatHeight(lastReading?.significient_height, lastReading?.unit)));
        stats.appendChild(createStat(t.hmax, formatHeight(lastReading?.maximum_height, lastReading?.unit)));
        stats.appendChild(createStat(t.period, formatPeriod(lastReading?.period)));
        stats.appendChild(createStat(t.direction, formatDirection(lastReading?.direction)));

        const footer = document.createElement('div');
        footer.className = 'buoy-popup__footer';
        const buoySlug = buoy.slug || generateSlug(buoy.name);
        footer.innerHTML = `
            <a href="https://labouee.app/buoy/${buoySlug}" target="_blank" rel="noreferrer noopener" class="buoy-popup__link">
                ${t.viewAllReadings} ${buoy.name}
            </a>
            <div class="buoy-popup__powered">
                <span>${t.poweredBy}</span>
                <a href="https://labouee.app" target="_blank" rel="noreferrer noopener" class="buoy-popup__footer-logo">
                <svg width="60" height="16" viewBox="0 0 1024 273" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M952.371 171.594C967.344 175.072 982.093 179.2 996.618 183.98L985.106 209.988L969.313 245.868H944.135L964.971 201.926L952.371 171.594ZM572.064 188.122C575.763 190.213 580.095 191.259 585.059 191.259C589.45 191.259 593.466 190.499 597.106 188.979C600.746 187.46 603.89 185.196 606.537 182.187L620.435 196.178C616.163 201.142 610.989 204.888 604.913 207.416C598.836 209.943 592.263 211.207 585.194 211.207C576.109 211.207 567.995 209.251 560.85 205.34C553.706 201.428 548.073 196.02 543.952 189.115C542.457 186.61 541.234 183.988 540.281 181.247C542.132 181.256 543.998 181.26 545.878 181.26C552.24 181.26 558.486 181.204 564.636 181.094C566.531 184.052 569.007 186.395 572.064 188.122ZM827.587 157.66C834.086 157.66 840.548 157.765 846.975 157.976V172.709C846.975 180.352 845.305 187.061 841.966 192.838C838.626 198.615 833.999 203.121 828.081 206.355C822.163 209.59 815.33 211.207 807.583 211.207C799.948 211.207 793.143 209.567 787.169 206.288C781.195 203.008 776.531 198.479 773.176 192.701C769.822 186.924 768.145 180.259 768.145 172.706V160.584L770.544 160.355L772.671 160.159L773.73 160.064L775.839 159.88L777.938 159.703L780.027 159.534L782.108 159.372L784.18 159.218L785.214 159.143L786.246 159.071L788.306 158.932L789.335 158.865L791.879 158.707L791.88 172.122C791.88 175.737 792.495 178.826 793.724 181.392C794.954 183.957 796.758 185.926 799.137 187.301C801.517 188.676 804.347 189.363 807.627 189.363C812.561 189.363 816.396 187.858 819.134 184.847C821.871 181.836 823.24 177.595 823.24 172.122L823.239 157.674L825.46 157.664L827.587 157.66ZM850.414 158.098C858.574 158.414 866.675 158.899 874.718 159.555C874.301 161.458 874.093 163.48 874.093 165.624C874.093 170.167 875.041 174.221 876.936 177.786C878.831 181.352 881.478 184.128 884.878 186.114C888.277 188.099 892.142 189.092 896.474 189.092C900.926 189.092 904.851 188.099 908.251 186.114C911.65 184.128 914.29 181.352 916.17 177.786C918.05 174.221 918.99 170.152 918.99 165.579C918.99 165.378 918.988 165.178 918.984 164.98C927.074 166.312 935.102 167.826 943.067 169.523C942.52 176.502 940.519 182.904 937.062 188.731C932.955 195.651 927.383 201.127 920.344 205.159C913.305 209.191 905.363 211.207 896.519 211.207C887.765 211.207 879.861 209.191 872.807 205.159C865.753 201.127 860.165 195.651 856.044 188.731C851.923 181.811 849.862 174.079 849.862 165.533C849.862 163.092 850.03 160.722 850.365 158.423L850.414 158.098ZM385.351 160.674C392.324 163.853 400.52 166.658 409.942 169.094L409.944 209.311H385.352L385.351 160.674ZM512.409 180.788C520.041 181.014 527.953 181.159 536.145 181.223L536.146 209.311H512.411L512.409 180.788ZM453.75 176.826C461.232 177.691 469.144 178.429 477.485 179.04L477.487 209.311H453.752L453.75 176.826ZM765.368 172.89C765.368 179.63 763.706 185.745 760.382 191.236C757.058 196.727 752.237 201.112 745.92 204.392C739.603 207.672 731.947 209.311 722.953 209.311H670.926V173.236L674.836 172.734L679.69 172.096L684.722 171.421L690.849 170.583L695.337 169.96L695.338 189.273H722.05C727.976 189.273 732.594 187.475 735.903 183.88C739.212 180.284 740.867 176.004 740.867 171.04C740.867 168.477 740.428 166.078 739.552 163.843L741.38 163.61L743.748 163.312L746.092 163.022L748.412 162.74L751.851 162.333L754.681 162.006L757.48 161.692L758.591 161.57L760.801 161.332L763.459 161.053C764.732 164.694 765.368 168.639 765.368 172.89ZM1024 122.116L999.97 176.408C993.405 174.236 986.795 172.196 980.14 170.286L998.146 122.116H1024ZM583.66 120.221C592.022 120.221 599.415 122.094 605.837 125.84C612.26 129.586 617.306 134.738 620.976 141.298C624.646 147.856 626.481 155.333 626.481 163.728C626.481 165.262 626.391 166.842 626.21 168.467C626.165 168.877 626.112 169.299 626.051 169.734C600.406 171.896 574.322 173.019 545.878 173.019C543.319 173.019 540.788 173.012 538.282 172.996C537.941 170.643 537.77 168.215 537.77 165.714C537.77 157.049 539.793 149.294 543.839 142.448C547.885 135.603 553.39 130.187 560.354 126.201C567.318 122.214 575.087 120.221 583.66 120.221ZM477.487 82.4004V130.156C479.566 128.02 481.953 126.19 484.647 124.666C489.781 121.763 495.64 120.311 502.223 120.311C508.865 120.311 514.743 121.748 519.856 124.621C524.971 127.495 528.964 131.459 531.837 136.514C534.709 141.568 536.146 147.42 536.146 154.07L536.145 172.982C527.944 172.917 520.032 172.77 512.41 172.541L512.411 159.35C512.411 154.145 510.787 149.91 507.538 146.645C504.289 143.381 500.135 141.749 495.073 141.749C491.629 141.749 488.581 142.486 485.93 143.96C483.279 145.434 481.209 147.503 479.72 150.166C478.231 152.828 477.487 155.89 477.487 159.35L477.485 170.771C469.119 170.15 461.208 169.402 453.752 168.526V82.4004H477.487ZM957.581 122.116L974.287 168.644C965.763 166.305 957.166 164.18 948.496 162.268L931.816 122.116H957.581ZM722.276 82.4004C730.638 82.4004 737.671 83.9422 743.371 87.0265C749.071 90.1102 753.366 94.1424 756.253 99.1217C759.141 104.101 760.585 109.54 760.585 115.437C760.585 122.688 758.397 128.931 754.019 134.167C751.678 136.968 748.752 139.386 745.242 141.421C750.235 143.902 754.372 147.08 757.652 150.956C758.269 151.684 758.849 152.431 759.391 153.195L756.633 153.495L754.373 153.748L752.094 154.008L749.216 154.345L746.305 154.695L745.131 154.838L742.764 155.13L740.374 155.431L737.958 155.74L735.517 156.057L733.784 156.284C733.276 155.914 732.741 155.567 732.181 155.243C729.368 153.618 725.991 152.806 722.05 152.806H695.338L695.337 161.639L690.531 162.309L685.179 163.043L681.732 163.509L678.373 163.958L674.289 164.495L670.926 164.927V82.4004H722.276ZM896.474 120.221C905.318 120.221 913.259 122.214 920.299 126.201C927.338 130.187 932.918 135.603 937.039 142.448C940.433 148.086 942.43 154.301 943.028 161.092C934.559 159.319 926.021 157.747 917.415 156.378C917.038 155.382 916.593 154.425 916.08 153.506C914.139 150.03 911.499 147.3 908.161 145.314C904.822 143.328 900.926 142.336 896.474 142.336C892.142 142.336 888.277 143.336 884.878 145.337C882.151 146.942 879.908 149.021 878.149 151.574C869.657 150.839 861.101 150.293 852.48 149.934C853.412 147.356 854.592 144.883 856.022 142.516C860.128 135.716 865.708 130.3 872.762 126.269C879.816 122.237 887.72 120.221 896.474 120.221ZM450.464 82.4004V104.289H409.944L409.943 160.584C400.261 157.973 392.062 154.956 385.351 151.537L385.352 104.289H344.877V82.4004H450.464ZM583.57 139.899C578.877 139.899 574.801 140.937 571.342 143.012C567.882 145.088 565.212 148.015 563.332 151.791C562.686 153.088 562.151 154.474 561.727 155.947L561.59 156.441L603.799 156.35C603.345 154.234 602.717 152.323 601.912 150.617C600.272 147.142 597.926 144.487 594.872 142.651C591.82 140.816 588.051 139.899 583.57 139.899ZM791.88 122.116L791.879 150.451L790.883 150.511L789.886 150.572L787.806 150.706L785.721 150.847L783.631 150.995L781.534 151.151L779.429 151.314L778.373 151.399L776.256 151.574L774.128 151.756L771.989 151.946L769.838 152.144L768.145 152.305L768.146 122.116H791.88ZM846.975 122.116L846.974 149.731C840.547 149.523 834.085 149.42 827.587 149.42L826.508 149.421L824.358 149.428L823.239 149.434L823.24 122.116H846.975ZM719.343 102.439H695.338V133.039H719.343C724.367 133.039 728.413 131.76 731.481 129.202C734.549 126.644 736.084 122.823 736.084 117.739C736.084 112.653 734.549 108.832 731.481 106.275C728.413 103.718 724.367 102.439 719.343 102.439Z" fill="#030310"/>
                  <path d="M211.312 0H61.1343C27.3708 0 0 27.3708 0 61.1343V211.312C0 245.076 27.3708 272.447 61.1343 272.447H211.312C245.076 272.447 272.447 245.076 272.447 211.312V61.1343C272.447 27.3708 245.076 0 211.312 0Z" fill="#030310"/>
                  <mask id="mask0_3246_423" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="273" height="273">
                  <path d="M211.312 0H61.1343C27.3708 0 0 27.3708 0 61.1343V211.312C0 245.076 27.3708 272.447 61.1343 272.447H211.312C245.076 272.447 272.447 245.076 272.447 211.312V61.1343C272.447 27.3708 245.076 0 211.312 0Z" fill="white"/>
                  </mask>
                  <g mask="url(#mask0_3246_423)">
                  <path d="M272.447 0H0V272.447H272.447V0Z" fill="#030310"/>
                  </g>
                  <mask id="mask1_3246_423" style="mask-type:luminance" maskUnits="userSpaceOnUse" x="0" y="0" width="273" height="273">
                  <path d="M211.312 0H61.1343C27.3708 0 0 27.3708 0 61.1343V211.312C0 245.076 27.3708 272.447 61.1343 272.447H211.312C245.076 272.447 272.447 245.076 272.447 211.312V61.1343C272.447 27.3708 245.076 0 211.312 0Z" fill="white"/>
                  </mask>
                  <g mask="url(#mask1_3246_423)">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M152.971 56.6709C187.187 56.6709 215.012 84.1064 215.76 118.235L215.017 118.515C206.259 121.75 196.792 123.517 186.914 123.517C167.035 123.517 148.823 116.363 134.698 104.483C153.645 108.042 170.974 100.78 173.988 87.6913C176.761 75.6475 166.482 62.7093 150.342 56.724C151.214 56.6891 152.09 56.6709 152.971 56.6709Z" fill="#6B55F6"/>
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M56.7016 130.163C86.1959 161.46 127.98 180.989 174.313 180.989C178.898 180.989 183.438 180.797 187.926 180.422C173.949 192.461 155.771 199.738 135.898 199.738C95.7538 199.738 62.5261 170.043 56.8703 131.365L56.7016 130.163ZM114.684 79.0439C128.212 105.222 155.48 123.11 186.914 123.11C197.07 123.11 206.791 121.243 215.754 117.832C215.769 118.433 215.775 119.038 215.775 119.645C215.775 137.317 210.067 153.653 200.399 166.899C191.928 168.391 183.211 169.168 174.313 169.168C126.476 169.168 83.8704 146.715 56.4048 111.746C57.3673 101.888 60.1125 92.5531 64.3128 84.0713C69.3007 84.8172 74.4045 85.2032 79.5982 85.2032C91.9201 85.2032 103.736 83.0304 114.684 79.0439Z" fill="#FFF869"/>
                  <path d="M112.41 184.121C106.88 181.998 100.686 184.036 98.723 189.149L96.1086 195.96C94.1457 201.073 97.3858 206.732 102.915 208.855C108.444 210.977 114.639 208.94 116.602 203.826L119.216 197.016C121.179 191.902 117.939 186.243 112.41 184.121ZM109.926 190.59C112.152 191.444 113.23 193.327 112.765 194.539L110.15 201.35C109.685 202.563 107.624 203.24 105.398 202.386C103.173 201.532 102.095 199.649 102.56 198.436L105.175 191.626C105.64 190.413 107.701 189.735 109.926 190.59Z" fill="#FFF869"/>
                  <path d="M106.63 196.476C108.504 196.476 110.029 197.971 110.084 199.836L110.085 199.94V212.576C110.085 214.489 108.538 216.04 106.63 216.04C104.756 216.04 103.231 214.545 103.176 212.68L103.175 212.576V199.94C103.175 198.027 104.722 196.476 106.63 196.476Z" fill="#FFF869"/>
                  </g>
                </svg>
                </a>
            </div>
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
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1px;
        background: @color-gray-light;
    }

    :global(.buoy-popup__stat) {
        padding: @size-xs @size-s;
        background: @color-white;
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

    .buoy-plugin {
        padding: @size-m !important;
        color: #fff !important;
        background: transparent !important;
        min-height: 50px;
    }

    .buoy-plugin__header {
        display: flex !important;
        align-items: center;
        justify-content: space-between;
        margin-bottom: @size-m;
        padding-bottom: @size-s;
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
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
</style>
