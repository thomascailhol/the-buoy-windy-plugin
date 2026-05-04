import { getPointForecastData } from '@windy/fetch';

export type WaveForecastSample = {
    ts: number;
    height: number | null;
    period: number | null;
    direction: number | null;
};

/** Windy `@windy/fetch` product ids for wave point forecasts supported in this plugin. */
export type WaveForecastModelId = 'ecmwfWaves' | 'gfsWaves' | 'iconEuWaves';

/**
 * Approximate domain where Windy exposes `iconEuWaves` point forecasts (Europe + adjacent Atlantic).
 * Outside this box we omit ICON from the model dropdown — the API typically has no coverage.
 */
export function isIconEuWavesCoverage(lat: number, lon: number): boolean {
    return lat >= 33 && lat <= 72 && lon >= -32 && lon <= 48;
}

/**
 * Fetch point wave forecast at a location (Windy `@windy/fetch`).
 * Models: ECMWF Waves, GFS Waves, ICON EU Waves (European domain).
 */
export async function fetchWaveForecast(
    lat: number,
    lon: number,
    model: WaveForecastModelId = 'ecmwfWaves',
    signal?: AbortSignal,
): Promise<{ samples: WaveForecastSample[]; modelRunTs?: number } | null> {
    try {
        const opts = signal ? { signal } : undefined;
        const resp = await getPointForecastData(model as never, { lat, lon }, undefined, opts);
        const d = resp.data?.data as {
            ts?: number[];
            waves?: (number | null)[];
            swell?: (number | null)[];
            wavesPeriod?: (number | null)[];
            swellPeriod?: (number | null)[];
            wavesDir?: (number | null)[];
            swellDir?: (number | null)[];
        };
        if (!d?.ts?.length) return null;

        const n = d.ts.length;
        const h =
            d.waves && d.waves.length === n
                ? d.waves
                : d.swell && d.swell.length === n
                  ? d.swell
                  : (d.waves ?? d.swell ?? []);
        const p =
            d.wavesPeriod && d.wavesPeriod.length === n
                ? d.wavesPeriod
                : d.swellPeriod && d.swellPeriod.length === n
                  ? d.swellPeriod
                  : (d.wavesPeriod ?? d.swellPeriod ?? []);
        const dir =
            d.wavesDir && d.wavesDir.length === n
                ? d.wavesDir
                : d.swellDir && d.swellDir.length === n
                  ? d.swellDir
                  : (d.wavesDir ?? d.swellDir ?? []);

        const header = resp.data?.header as { refTimeOrig?: number } | undefined;

        return {
            samples: d.ts.map((t, i) => ({
                ts: t,
                height: h[i] ?? null,
                period: p[i] ?? null,
                direction: dir[i] ?? null,
            })),
            modelRunTs: header?.refTimeOrig,
        };
    } catch (err) {
        if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) {
            throw err;
        }
        console.warn('[the-buoy] forecast fetch failed', err);
        return null;
    }
}

export function parseWaveForecastModelId(value: string | undefined): WaveForecastModelId {
    if (value === 'gfsWaves') return 'gfsWaves';
    if (value === 'iconEuWaves') return 'iconEuWaves';
    return 'ecmwfWaves';
}
