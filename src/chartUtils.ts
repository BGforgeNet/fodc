import { Data } from 'plotly.js';

export type DamageMode = 'average' | 'min' | 'max' | 'range';

/**
 * Format a float for display - show as integer if whole, otherwise 1 decimal
 */
export const formatFloat = (n: number): string => {
    if (n % 1 === 0) return n.toString();
    return parseFloat(n.toFixed(1)).toString();
};

export interface DamageRange {
    min: number;
    max: number;
}

/**
 * Parse damage string from formula into min/max values
 * Formulas now return total damage including burst hits
 */
export function parseDamageString(damageStr: string): DamageRange {
    const parts = damageStr.split('-').map(Number);
    return {
        min: parts[0] ?? 0,
        max: parts[1] ?? parts[0] ?? 0,
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
        // Single trace with fill between min and max using null gap
        const xValues = [...armorNames, ...armorNames.slice().reverse()];
        const yValues = [...damageData.map((d) => d.min), ...damageData.map((d) => d.max).reverse()];
        traces.push({
            x: xValues,
            y: yValues,
            type: 'scatter',
            mode: 'lines',
            fill: 'toself',
            name: legendName,
            legendgroup: legendName,
            text: [...rangeText, ...rangeText.slice().reverse()],
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
