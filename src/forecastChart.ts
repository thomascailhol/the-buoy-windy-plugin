import type { WaveForecastSample } from './windyForecast';

/** Minimal reading shape for charting (matches buoy API fields). */
export type ChartReading = {
    time?: string;
    significient_height?: number | null;
    maximum_height?: number | null;
    direction?: number | null;
    unit?: string | null;
};

export type ChartTimeRangeHours = 6 | 12 | 24 | 48 | 168;

export type ChartTimeSeriesPoint = { t: number; y: number };

export type ChartMarker = {
    time: number;
    label: string;
    color: string;
    dashed?: boolean;
};

export type ChartGeometry = {
    W: number;
    H: number;
    padL: number;
    padR: number;
    padT: number;
    padB: number;
    innerW: number;
    innerH: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    nowMs: number;
};

export type ChartHoverContext = {
    geometry: ChartGeometry;
    sigPts: ChartTimeSeriesPoint[];
    maxPts: ChartTimeSeriesPoint[];
    fcPts: ChartTimeSeriesPoint[];
    forecast: WaveForecastSample[];
    readings: ChartReading[];
    heightUnit: 'meters' | 'feet';
};

export type ChartRenderResult = {
    svg: string;
    ctx: ChartHoverContext;
};

/** Convert a chart-x pixel (in viewBox coords) into a timestamp. */
export function chartPxToTime(g: ChartGeometry, px: number): number {
    if (g.innerW <= 0) return g.xMin;
    const u = (px - g.padL) / g.innerW;
    return g.xMin + u * (g.xMax - g.xMin);
}

/** Convert a timestamp into chart-x pixel coords (viewBox). */
export function chartTimeToPx(g: ChartGeometry, t: number): number {
    return g.padL + ((t - g.xMin) / (g.xMax - g.xMin)) * g.innerW;
}

/** Convert a y value (height) into chart-y pixel coords (viewBox). */
export function chartYToPx(g: ChartGeometry, y: number): number {
    return g.padT + g.innerH - ((y - g.yMin) / (g.yMax - g.yMin)) * g.innerH;
}

/** Linear interpolate y at `t` along an ascending-by-time series. */
export function interpolateSeriesAt(
    pts: ChartTimeSeriesPoint[],
    t: number,
): number | null {
    if (!pts.length) return null;
    if (t <= pts[0].t) return pts[0].y;
    if (t >= pts[pts.length - 1].t) return pts[pts.length - 1].y;
    let i = 0;
    while (i < pts.length - 1 && pts[i + 1].t < t) i++;
    const a = pts[i];
    const b = pts[i + 1];
    if (b.t === a.t) return a.y;
    const u = (t - a.t) / (b.t - a.t);
    return a.y + u * (b.y - a.y);
}

/** Pick the reading nearest in time. */
export function nearestReadingAtTime(
    readings: ChartReading[],
    t: number,
): ChartReading | null {
    let best: ChartReading | null = null;
    let bestDelta = Infinity;
    for (const r of readings) {
        if (!r.time) continue;
        const ts = new Date(r.time).getTime();
        if (!Number.isFinite(ts)) continue;
        const d = Math.abs(ts - t);
        if (d < bestDelta) {
            bestDelta = d;
            best = r;
        }
    }
    return best;
}

/** Pick the forecast sample nearest in time (avoids angular interpolation around 0/360°). */
export function nearestForecastAtTime(
    forecast: WaveForecastSample[],
    t: number,
): WaveForecastSample | null {
    let best: WaveForecastSample | null = null;
    let bestDelta = Infinity;
    for (const s of forecast) {
        const d = Math.abs(s.ts - t);
        if (d < bestDelta) {
            bestDelta = d;
            best = s;
        }
    }
    return best;
}

const MS_PER_H = 3600_000;

function toDisplayHeight(
    raw: number | null | undefined,
    unit: string | null | undefined,
    heightUnit: 'meters' | 'feet',
): number | null {
    if (raw == null || !Number.isFinite(raw)) return null;
    const u = (unit || 'm').toLowerCase();
    if (heightUnit === 'feet') {
        if (u === 'ft' || u === 'feet') return raw;
        return raw * 3.28084;
    }
    if (u === 'ft' || u === 'feet') return raw / 3.28084;
    return raw;
}

function forecastHeightToDisplay(h: number | null, heightUnit: 'meters' | 'feet'): number | null {
    if (h == null || !Number.isFinite(h)) return null;
    return heightUnit === 'feet' ? h * 3.28084 : h;
}

function fmtAxisValue(v: number, heightUnit: 'meters' | 'feet'): string {
    const u = heightUnit === 'feet' ? 'ft' : 'm';
    return `${v.toFixed(1)}${u}`;
}

/** Linear interpolation of forecast height / direction at time `atMs`. */
export function interpolateWaveAtTime(
    forecast: WaveForecastSample[],
    atMs: number,
): { height: number | null; direction: number | null } {
    if (!forecast.length) return { height: null, direction: null };
    const s = [...forecast].sort((a, b) => a.ts - b.ts);
    if (atMs <= s[0].ts) {
        return { height: s[0].height, direction: s[0].direction };
    }
    if (atMs >= s[s.length - 1].ts) {
        const last = s[s.length - 1];
        return { height: last.height, direction: last.direction };
    }
    let i = 0;
    while (i < s.length - 1 && s[i + 1].ts < atMs) i++;
    const a = s[i];
    const b = s[i + 1];
    const t = (atMs - a.ts) / (b.ts - a.ts);
    const h =
        a.height != null && b.height != null ? a.height + t * (b.height - a.height) : a.height ?? b.height;
    const dir =
        a.direction != null && b.direction != null
            ? a.direction + t * (b.direction - a.direction)
            : a.direction ?? b.direction;
    return { height: h, direction: dir };
}

function sortReadings(readings: ChartReading[]): ChartReading[] {
    return [...readings].sort((a, b) => {
        const ta = a.time ? new Date(a.time).getTime() : 0;
        const tb = b.time ? new Date(b.time).getTime() : 0;
        return ta - tb;
    });
}

type Pt = { t: number; y: number };

/** Path for polyline clipped to t <= nowClipMs (oceanographic "past only" buoy trace). */
function buildClippedPath(points: Pt[], xToPx: (t: number) => number, yToPx: (y: number) => number, nowClipMs: number): string {
    if (points.length < 2) return '';
    const seg: Pt[] = [];
    for (let i = 0; i < points.length; i++) {
        const p = points[i];
        if (p.t <= nowClipMs) {
            seg.push(p);
        } else {
            if (i > 0 && points[i - 1].t < nowClipMs) {
                const p0 = points[i - 1];
                const u = (nowClipMs - p0.t) / (p.t - p0.t);
                seg.push({ t: nowClipMs, y: p0.y + u * (p.y - p0.y) });
            }
            break;
        }
    }
    if (seg.length < 2) return '';
    let d = `M ${xToPx(seg[0].t).toFixed(1)} ${yToPx(seg[0].y).toFixed(1)}`;
    for (let k = 1; k < seg.length; k++) {
        d += ` L ${xToPx(seg[k].t).toFixed(1)} ${yToPx(seg[k].y).toFixed(1)}`;
    }
    return d;
}

function buildFullPath(points: Pt[], xToPx: (t: number) => number, yToPx: (y: number) => number): string {
    const ok = points.filter(p => Number.isFinite(p.t) && Number.isFinite(p.y));
    if (!ok.length) return '';
    let d = `M ${xToPx(ok[0].t).toFixed(1)} ${yToPx(ok[0].y).toFixed(1)}`;
    for (let i = 1; i < ok.length; i++) {
        d += ` L ${xToPx(ok[i].t).toFixed(1)} ${yToPx(ok[i].y).toFixed(1)}`;
    }
    return d;
}

function niceStep(range: number): number {
    const rough = range / 4 || 0.1;
    const pow10 = 10 ** Math.floor(Math.log10(rough));
    const f = rough / pow10;
    if (f <= 1) return pow10 * 0.25;
    if (f <= 2) return pow10 * 0.5;
    if (f <= 5) return pow10;
    return pow10 * 2;
}

/** Prefer ~5 horizontal grid lines — avoids 0.2 m steps on a 0–3 m popover scale. */
function yGridStep(yMin: number, yMax: number): number {
    const span = Math.max(yMax - yMin, 1e-9);
    let step = niceStep(span);
    while (span / step > 6) {
        step *= 2;
    }
    return step;
}

/**
 * Mobile-app style chart: solid buoy lines (sig + max, clipped at now), dashed forecast, Y-axis on the right, grid.
 * Returns both the SVG markup and a hover context for wiring tooltips.
 */
export function renderForecastChartSvg(opts: {
    forecast: WaveForecastSample[];
    readings: ChartReading[];
    heightUnit: 'meters' | 'feet';
    width: number;
    height: number;
    primaryColor: string;
    lightColor: string;
    observationColor?: string;
    observationLightColor?: string;
    timeRangeHours: ChartTimeRangeHours;
    nowMs?: number;
    locale?: string;
    snapshotMode?: boolean;
    markers?: ChartMarker[];
    importantTimes?: number[];
    showNowLine?: boolean;
}): ChartRenderResult {
    const {
        forecast,
        readings,
        heightUnit,
        width: W,
        height: H,
        primaryColor,
        lightColor,
        observationColor = primaryColor,
        observationLightColor = lightColor,
        timeRangeHours,
        nowMs = Date.now(),
        locale,
        snapshotMode = false,
        markers = [],
        importantTimes = [],
        showNowLine = true,
    } = opts;

    const padL = 6;
    const padR = 34;
    const padT = 8;
    const padB = 18;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;

    const rangeMs = timeRangeHours * MS_PER_H;

    const sorted = sortReadings(readings);
    const sigPts: Pt[] = [];
    const maxPts: Pt[] = [];
    for (const r of sorted) {
        if (!r.time) continue;
        const t = new Date(r.time).getTime();
        if (!Number.isFinite(t)) continue;
        const ys = toDisplayHeight(r.significient_height, r.unit ?? null, heightUnit);
        const ym = toDisplayHeight(r.maximum_height, r.unit ?? null, heightUnit);
        if (ys != null) sigPts.push({ t, y: ys });
        if (ym != null) maxPts.push({ t, y: ym });
    }

    const fcPts: Pt[] = [];
    for (const s of forecast) {
        const y = forecastHeightToDisplay(s.height, heightUnit);
        if (y == null) continue;
        fcPts.push({ t: s.ts, y });
    }

    let xMin = nowMs - rangeMs * 0.55;
    let xMax = nowMs + rangeMs * 0.45;
    const buoyTimes = [...sigPts, ...maxPts].map((p) => p.t);
    const fcTimes = fcPts.map((p) => p.t);
    const margin = rangeMs * 0.03;
    const minPastWindow = rangeMs * 0.05;
    const minFutureWindow = rangeMs * 0.05;
    if (buoyTimes.length) {
        const dataMin = Math.min(...buoyTimes);
        if (dataMin > xMin) {
            xMin = Math.min(dataMin - margin, nowMs - minPastWindow);
        }
    }
    if (fcTimes.length) {
        const dataMax = Math.max(...fcTimes);
        if (dataMax < xMax) {
            xMax = Math.max(dataMax + margin, nowMs + minFutureWindow);
        }
    }
    for (const t of importantTimes) {
        if (!Number.isFinite(t)) continue;
        if (t < xMin) xMin = t - margin;
        if (t > xMax) xMax = t + margin;
    }

    const chartSigPts = snapshotMode && sigPts.length ? [sigPts[sigPts.length - 1]] : sigPts;
    const chartMaxPts = snapshotMode && maxPts.length ? [maxPts[maxPts.length - 1]] : maxPts;

    const allY: number[] = [
        ...chartSigPts.map(p => p.y),
        ...chartMaxPts.map(p => p.y),
        ...fcPts.map(p => p.y),
    ];
    /** Y-axis always includes 0 (wave height is a magnitude from the baseline). */
    const yMin = 0;
    let yMax = heightUnit === 'feet' ? 10 : 3;
    if (allY.length) {
        const yDataMax = Math.max(...allY);
        const pad = Math.max(yDataMax * 0.12, yDataMax * 0.05 + 0.05);
        yMax = yDataMax + pad;
    }
    if (yMax <= yMin) yMax = yMin + 0.25;

    const xToPx = (t: number) => padL + ((t - xMin) / (xMax - xMin)) * innerW;
    const yToPx = (y: number) => padT + innerH - ((y - yMin) / (yMax - yMin)) * innerH;

    const step = yGridStep(yMin, yMax);
    const gridStart = Math.floor(yMin / step) * step;
    const gridLines: { y: number; py: number }[] = [];
    for (let g = gridStart; g <= yMax + step * 0.01; g += step) {
        if (g < yMin - 1e-6) continue;
        if (g > yMax + 1e-6) continue;
        gridLines.push({ y: g, py: yToPx(g) });
    }

    const nowX = xToPx(nowMs);
    const showNow = showNowLine && nowX >= padL - 2 && nowX <= padL + innerW + 2;

    const pathSig =
        !snapshotMode && chartSigPts.length >= 2 ? buildClippedPath(chartSigPts, xToPx, yToPx, nowMs) : '';
    const pathMax =
        !snapshotMode && chartMaxPts.length >= 2 ? buildClippedPath(chartMaxPts, xToPx, yToPx, nowMs) : '';
    const pathFc = fcPts.length >= 2 ? buildFullPath(fcPts, xToPx, yToPx) : '';

    const gridColor = 'rgba(0,0,0,0.06)';
    const labelColor = '#888888';

    const fmtTime = (t: number) =>
        new Date(t).toLocaleString(locale || undefined, { hour: '2-digit', minute: '2-digit' });
    const fmtDate = (t: number) =>
        new Date(t).toLocaleString(locale || undefined, { month: '2-digit', day: '2-digit' });
    const fmtTickLabel = (t: number, isFirstOrDayBreak: boolean): string => {
        if (timeRangeHours >= 168) return fmtDate(t);
        return isFirstOrDayBreak ? `${fmtDate(t)} ${fmtTime(t)}` : fmtTime(t);
    };

    const xTickCount = Math.min(5, Math.max(3, Math.floor(innerW / 64)));
    const xTicks: number[] = [];
    const xd = Math.max(xTickCount - 1, 1);
    for (let i = 0; i < xTickCount; i++) {
        xTicks.push(xMin + ((xMax - xMin) * i) / xd);
    }

    const gridH = gridLines
        .map(({ py }) => `<line x1="${padL}" y1="${py.toFixed(1)}" x2="${(padL + innerW).toFixed(0)}" y2="${py.toFixed(1)}" stroke="${gridColor}"/>`)
        .join('');

    const yLabels = gridLines
        .map(
            ({ y, py }) =>
                `<text x="${(padL + innerW + 4).toFixed(0)}" y="${(py + 3.2).toFixed(1)}" fill="${labelColor}" font-size="9" text-anchor="start">${fmtAxisValue(y, heightUnit)}</text>`,
        )
        .join('');

    let prevDay = '';
    const xLabels = xTicks
        .map((tx, i) => {
            const px = xToPx(tx);
            const day = new Date(tx).toDateString();
            const dayBreak = day !== prevDay;
            prevDay = day;
            const showDate = i === 0 || dayBreak || timeRangeHours >= 168;
            const label = fmtTickLabel(tx, showDate);
            const isFirst = i === 0;
            const isLast = i === xTicks.length - 1;
            const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
            const xOff = isFirst ? padL : isLast ? padL + innerW : px;
            return `<text x="${xOff.toFixed(1)}" y="${(H - 5).toFixed(0)}" fill="${labelColor}" font-size="8.5" text-anchor="${anchor}">${escapeXml(label)}</text>`;
        })
        .join('');

    const dotsSig =
        chartSigPts.length === 1 && !pathSig
            ? snapshotMode
                ? `<circle cx="${xToPx(chartSigPts[0].t).toFixed(1)}" cy="${yToPx(chartSigPts[0].y).toFixed(1)}" r="6" fill="${observationColor}" fill-opacity="0.16" stroke="${observationColor}" stroke-width="1.5"/><circle cx="${xToPx(chartSigPts[0].t).toFixed(1)}" cy="${yToPx(chartSigPts[0].y).toFixed(1)}" r="3.7" fill="${observationColor}" stroke="#fff" stroke-width="1.4"/>`
                : `<circle cx="${xToPx(chartSigPts[0].t).toFixed(1)}" cy="${yToPx(chartSigPts[0].y).toFixed(1)}" r="3.5" fill="${observationColor}" stroke="#fff" stroke-width="1.25"/>`
            : '';
    const dotsMax =
        chartMaxPts.length === 1 && !pathMax
            ? `<circle cx="${xToPx(chartMaxPts[0].t).toFixed(1)}" cy="${yToPx(chartMaxPts[0].y).toFixed(1)}" r="3" fill="${observationLightColor}" stroke="#fff" stroke-width="1"/>`
            : '';

    const empty = !pathFc && !pathSig && !pathMax && !dotsSig && !dotsMax;

    const markerLayer = markers
        .filter((marker) => Number.isFinite(marker.time))
        .map((marker, index) => {
            const x = xToPx(marker.time);
            if (x < padL - 2 || x > padL + innerW + 2) return '';
            const labelY = padT + 8 + (index % 2) * 11;
            const nearRight = x > padL + innerW - 64;
            const textAnchor = nearRight ? 'end' : 'start';
            const textX = x + (nearRight ? -4 : 4);
            const dash = marker.dashed ? ' stroke-dasharray="3 3"' : '';
            return `<g class="buoy-chart-marker" pointer-events="none">
    <line x1="${x.toFixed(1)}" y1="${padT}" x2="${x.toFixed(1)}" y2="${padT + innerH}" stroke="${marker.color}" stroke-opacity="0.72" stroke-width="1.25"${dash}/>
    <text x="${textX.toFixed(1)}" y="${labelY.toFixed(1)}" fill="${marker.color}" font-size="8.5" font-weight="700" text-anchor="${textAnchor}" paint-order="stroke" stroke="#fff" stroke-width="3" stroke-linejoin="round">${escapeXml(marker.label)}</text>
  </g>`;
        })
        .join('');

    const hoverLayer = `<g class="buoy-chart-hover" pointer-events="none" style="display:none">
    <line class="buoy-chart-hover__line" x1="0" y1="${padT}" x2="0" y2="${padT + innerH}" stroke="${primaryColor}" stroke-width="1" stroke-dasharray="2 2"/>
    <circle class="buoy-chart-hover__dot buoy-chart-hover__dot--max" cx="-10" cy="-10" r="3" fill="${observationLightColor}" stroke="#fff" stroke-width="1.25"/>
    <circle class="buoy-chart-hover__dot buoy-chart-hover__dot--fc" cx="-10" cy="-10" r="3" fill="${primaryColor}" fill-opacity="0.7" stroke="#fff" stroke-width="1.25"/>
    <circle class="buoy-chart-hover__dot buoy-chart-hover__dot--sig" cx="-10" cy="-10" r="3.5" fill="${observationColor}" stroke="#fff" stroke-width="1.5"/>
  </g>`;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Wave chart">
  ${gridH}
  ${yLabels}
  ${pathFc ? `<path d="${pathFc}" fill="none" stroke="${primaryColor}" stroke-opacity="0.55" stroke-width="1.75" stroke-dasharray="4 3" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
  ${pathMax ? `<path d="${pathMax}" fill="none" stroke="${observationLightColor}" stroke-width="1.4" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
  ${pathSig ? `<path d="${pathSig}" fill="none" stroke="${observationColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
  ${markerLayer}
  ${dotsSig}
  ${dotsMax}
  ${showNow ? `<line x1="${nowX.toFixed(1)}" y1="${padT}" x2="${nowX.toFixed(1)}" y2="${padT + innerH}" stroke="${primaryColor}" stroke-opacity="0.5" stroke-width="1" stroke-dasharray="2 2"/>` : ''}
  ${xLabels}
  ${hoverLayer}
  ${empty ? `<text x="${(W / 2).toFixed(0)}" y="${(padT + innerH / 2).toFixed(0)}" fill="${labelColor}" font-size="11" text-anchor="middle">—</text>` : ''}
</svg>`;

    return {
        svg,
        ctx: {
            geometry: { W, H, padL, padR, padT, padB, innerW, innerH, xMin, xMax, yMin, yMax, nowMs },
            sigPts: chartSigPts,
            maxPts: chartMaxPts,
            fcPts,
            forecast,
            readings,
            heightUnit,
        },
    };
}

function escapeXml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
