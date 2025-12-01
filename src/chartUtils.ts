import { Data } from 'plotly.js';

export type DamageMode = 'average' | 'min' | 'max' | 'range';

export interface DamageRange {
    min: number;
    max: number;
}

/**
 * Parse damage string from formula into min/max values, accounting for burst hits
 */
export function parseDamageString(damageStr: string, hitsMultiplier: number): DamageRange {
    // Handle fo2tweaks burst critical format: "crit|noncrit-crit|noncrit"
    if (damageStr.includes('|')) {
        const [minPart, maxPart] = damageStr.split('-');
        const [minCrit, minNonCrit] = (minPart ?? '0|0').split('|').map(Number);
        const [maxCrit, maxNonCrit] = (maxPart ?? '0|0').split('|').map(Number);
        // 1 bullet at crit, rest at noncrit
        const nonCritHits = hitsMultiplier - 1;
        return {
            min: Math.round(((minCrit ?? 0) + (minNonCrit ?? 0) * nonCritHits) * 10) / 10,
            max: Math.round(((maxCrit ?? 0) + (maxNonCrit ?? 0) * nonCritHits) * 10) / 10,
        };
    }

    const parts = damageStr.split('-').map(Number);
    return {
        min: (parts[0] ?? 0) * hitsMultiplier,
        max: (parts[1] ?? 0) * hitsMultiplier,
    };
}

/**
 * Calculate hits multiplier for burst weapons
 */
export function calculateHitsMultiplier(burst: boolean, pointBlank: boolean, burstRounds: number): number {
    if (!burst) return 1;
    return pointBlank ? burstRounds : Math.round(burstRounds / 3);
}

/**
 * Create Plotly traces for a damage series
 */
export function createDamageTraces(
    armorNames: string[],
    damageData: DamageRange[],
    mode: DamageMode,
    legendName: string,
    visible: boolean | 'legendonly'
): Data[] {
    const traces: Data[] = [];

    if (mode === 'range') {
        const rangeText = damageData.map((d) => `${d.min}-${d.max}`);
        // Min line (bottom)
        traces.push({
            x: armorNames,
            y: damageData.map((d) => d.min),
            type: 'scatter',
            mode: 'lines',
            name: legendName,
            legendgroup: legendName,
            hoverinfo: 'skip',
            visible,
        } as Data);
        // Max line (top) with fill to min
        traces.push({
            x: armorNames,
            y: damageData.map((d) => d.max),
            type: 'scatter',
            mode: 'lines',
            fill: 'tonexty',
            name: legendName,
            legendgroup: legendName,
            showlegend: false,
            text: rangeText,
            hovertemplate: '%{text}<extra>%{fullData.name}</extra>',
            visible,
        });
    } else {
        const damages = damageData.map((d) => {
            if (mode === 'min') return d.min;
            if (mode === 'max') return d.max;
            return (d.min + d.max) / 2;
        });

        traces.push({
            x: armorNames,
            y: damages,
            type: 'scatter',
            mode: 'lines',
            name: legendName,
            legendgroup: legendName,
            hovertemplate: '%{y:.6~g}<extra>%{fullData.name}</extra>',
            visible,
        });
    }

    return traces;
}

/**
 * Build chart title with modifiers
 */
export function buildChartTitle(
    baseTitle: string,
    mode: DamageMode,
    burst: boolean,
    pointBlank: boolean,
    critical: boolean,
    rangedBonus: number
): string {
    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
    const burstLabel = burst ? (pointBlank ? ' Point-blank burst' : ' Burst') : '';
    const modifiers = [critical && 'Critical', rangedBonus > 0 && `BRD ${rangedBonus}`].filter(Boolean);
    const modifiersLabel = modifiers.length > 0 ? `, ${modifiers.join(', ')}` : '';
    return `${baseTitle} (${modeLabel})${burstLabel}${modifiersLabel}`;
}

