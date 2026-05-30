/**
 * Data-freshness gauge for map markers — ported from la-bouee
 * `lib/formatters.ts` and `scripts/generate-ring-assets.mjs`.
 */

export const FRESHNESS_MAX_BARS = 8;
export const FRESHNESS_RING_MIN_ZOOM = 6;

const RING_VIEW_SIZE = 96;
const RING_CX = 48;
const RING_CY = 48;

const SEGMENTS = 10;
const SEG_PER_LEVEL = SEGMENTS / FRESHNESS_MAX_BARS;

const ARC_SPAN = 270;
const ARC_START = 225;
const SLOT = ARC_SPAN / SEGMENTS;
const GAP = 3;
const HALF = (SLOT - GAP) / 2;

const R_INNER = 22;
const R_OUTER = 33;
const LIT_COLOR = '#34C759';
const UNLIT_COLOR = '#7C8794';

/** Same as `getFreshnessGaugeLevel` in la-bouee `lib/formatters.ts`. */
export function getFreshnessGaugeLevel(time: string, now: number = Date.now()): number {
    const t = new Date(time).getTime();
    if (Number.isNaN(t)) return 0;
    const ageHours = (now - t) / 3_600_000;
    if (ageHours < 1) return FRESHNESS_MAX_BARS;
    return Math.max(0, FRESHNESS_MAX_BARS - Math.floor(ageHours));
}

/** Same as `getFreshnessRingImage` in la-bouee `lib/formatters.ts`. */
export function getFreshnessRingImage(time: string, now?: number): string {
    return `ring_${getFreshnessGaugeLevel(time, now)}`;
}

/** Mapbox iconSize interpolation from `BuoyMap.tsx` buoys-freshness-ring layer. */
export function freshnessRingScale(zoom: number): number {
    const z = Math.max(4, Math.min(12, zoom));
    if (z <= 4) return 0.28;
    if (z <= 8) return 0.28 + ((0.36 - 0.28) * (z - 4)) / 4;
    return 0.36 + ((0.46 - 0.36) * (z - 8)) / 4;
}

export function freshnessRingDisplaySize(zoom: number): number {
    return Math.round(RING_VIEW_SIZE * freshnessRingScale(zoom));
}

const rad = (deg: number) => (deg * Math.PI) / 180;
const round = (n: number) => Math.round(n * 100) / 100;
const pt = (r: number, a: number): [number, number] => [
    round(RING_CX + r * Math.sin(rad(a))),
    round(RING_CY - r * Math.cos(rad(a))),
];

function segmentPath(i: number): string {
    const center = ARC_START + (i + 0.5) * SLOT;
    const a0 = center - HALF;
    const a1 = center + HALF;
    const [ox0, oy0] = pt(R_OUTER, a0);
    const [ox1, oy1] = pt(R_OUTER, a1);
    const [ix1, iy1] = pt(R_INNER, a1);
    const [ix0, iy0] = pt(R_INNER, a0);
    return (
        `M ${ox0} ${oy0} A ${R_OUTER} ${R_OUTER} 0 0 1 ${ox1} ${oy1} ` +
        `L ${ix1} ${iy1} A ${R_INNER} ${R_INNER} 0 0 0 ${ix0} ${iy0} Z`
    );
}

/** Inline SVG matching `ring_0` … `ring_8` PNG assets from the mobile app. */
export function freshnessRingSvg(level: number, displaySize = RING_VIEW_SIZE): string {
    const litSegments = level * SEG_PER_LEVEL;
    const segments: string[] = [];
    for (let i = 0; i < SEGMENTS; i++) {
        const fill = i < litSegments ? LIT_COLOR : UNLIT_COLOR;
        segments.push(
            `<path d="${segmentPath(i)}" fill="${fill}" stroke="#06121a" stroke-opacity="0.45" stroke-width="0.75" stroke-linejoin="round"/>`,
        );
    }
    return `<svg class="buoy-marker__ring" width="${displaySize}" height="${displaySize}" viewBox="0 0 ${RING_VIEW_SIZE} ${RING_VIEW_SIZE}" aria-hidden="true">${segments.join('')}</svg>`;
}

export function freshnessRingHtmlForReading(time: string, zoom: number, now?: number): string {
    if (zoom < FRESHNESS_RING_MIN_ZOOM) return '';
    const level = getFreshnessGaugeLevel(time, now);
    const size = freshnessRingDisplaySize(zoom);
    return freshnessRingSvg(level, size);
}
