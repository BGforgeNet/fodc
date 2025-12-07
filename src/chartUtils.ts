import { Data } from 'plotly.js';

export type DamageMode = 'average' | 'min' | 'max' | 'range';

// Plotly default colorway
const PLOTLY_COLORS = [
    '#1f77b4',
    '#ff7f0e',
    '#2ca02c',
    '#d62728',
    '#9467bd',
    '#8c564b',
    '#e377c2',
    '#7f7f7f',
    '#bcbd22',
    '#17becf',
];

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getPlotlyColor(index: number): string {
    return PLOTLY_COLORS[index % PLOTLY_COLORS.length] ?? PLOTLY_COLORS[0]!;
}

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
    visible: boolean | 'legendonly',
    colorIndex: number
): Data[] {
    const traces: Data[] = [];
    const color = getPlotlyColor(colorIndex);

    if (mode === 'range') {
        const rangeText = damageData.map((d) => `${formatFloat(d.min)}-${formatFloat(d.max)}`);
        // Two traces with fill between them - works with unified hover
        // Bottom line (min values) - no fill, no hover
        traces.push({
            x: armorNames,
            y: damageData.map((d) => d.min),
            type: 'scatter',
            mode: 'lines',
            line: { color: 'transparent' },
            name: legendName,
            legendgroup: legendName,
            showlegend: false,
            hoverinfo: 'skip',
            visible,
        });
        // Top line (max values) - fill to previous trace
        traces.push({
            x: armorNames,
            y: damageData.map((d) => d.max),
            type: 'scatter',
            mode: 'lines',
            fill: 'tonexty',
            fillcolor: hexToRgba(color, 0.3),
            line: { color: hexToRgba(color, 0.8) },
            name: legendName,
            legendgroup: legendName,
            showlegend: true,
            customdata: rangeText,
            hovertemplate: '%{customdata}<extra>%{fullData.name}</extra>',
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
            line: { color },
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
