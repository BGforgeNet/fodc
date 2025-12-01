import { Data } from 'plotly.js';
import { ModData } from '../types';
import { getDamageWithFormula } from '../formulas';
import { modOrder, modConfigs } from '../modConfig';
import BaseDamageChart from './BaseDamageChart';

type DamageMode = 'average' | 'min' | 'max' | 'range';

interface DamageChartProps {
    weaponName: string;
    ammoName: string;
    data: ModData;
    mode: DamageMode;
    hiddenMods: Set<string>;
    onHiddenModsChange: (mods: Set<string>) => void;
    burst: boolean;
    pointBlank: boolean;
    critical: boolean;
    allCrit: boolean;
    rangedBonus: number;
}

const DamageChart = ({ weaponName, ammoName, data, mode, hiddenMods, onHiddenModsChange, burst, pointBlank, critical, allCrit, rangedBonus }: DamageChartProps) => {
    const vanillaMod = data.mods['vanilla'];
    if (!vanillaMod) return null;
    const armorList = vanillaMod.armor;
    const weapon = vanillaMod.weapons.find((w) => w.name === weaponName);
    if (!weapon) return null;

    const traces: Data[] = [];
    const armorNames = armorList.map((a) => a.name);
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

    modOrder.forEach((modId, modIndex) => {
        const mod = data.mods[modId];
        const config = modConfigs[modId];
        if (!mod || !config) return;

        const ammo = mod.ammo.find((a) => a.name === ammoName && a.caliber === weapon.caliber);
        if (!ammo) return;

        const burstRounds = burst && weapon.burst ? weapon.burst : 1;
        const hitsMultiplier = burst ? (pointBlank ? burstRounds : Math.round(burstRounds / 3)) : 1;
        const damageData = armorList.map((armor) => {
            const modArmor = mod.armor.find((a) => a.name === armor.name) ?? armor;
            const damageStr = getDamageWithFormula(config.formula, weapon, ammo, modArmor, critical, burst, allCrit, rangedBonus);

            // Handle fo2tweaks burst critical format: "crit|noncrit-crit|noncrit"
            // Only used when burst + critical but not allCrit
            if (damageStr.includes('|')) {
                const [minPart, maxPart] = damageStr.split('-');
                const [minCrit, minNonCrit] = (minPart ?? '0|0').split('|').map(Number);
                const [maxCrit, maxNonCrit] = (maxPart ?? '0|0').split('|').map(Number);
                // 1 bullet at crit, rest at noncrit
                const nonCritHits = hitsMultiplier - 1;
                // Round to avoid floating point precision errors
                return {
                    min: Math.round(((minCrit ?? 0) + (minNonCrit ?? 0) * nonCritHits) * 10) / 10,
                    max: Math.round(((maxCrit ?? 0) + (maxNonCrit ?? 0) * nonCritHits) * 10) / 10,
                };
            }

            const parts = damageStr.split('-').map(Number);
            return { min: (parts[0] ?? 0) * hitsMultiplier, max: (parts[1] ?? 0) * hitsMultiplier };
        });

        const visible = hiddenMods.has(config.name) ? 'legendonly' : true;

        if (mode === 'range') {
            const color = colors[modIndex % colors.length] ?? '#1f77b4';
            const rangeText = damageData.map((d) => `${d.min}-${d.max}`);
            // Min line (bottom)
            traces.push({
                x: armorNames,
                y: damageData.map((d) => d.min),
                type: 'scatter',
                mode: 'lines',
                line: { color },
                name: config.name,
                legendgroup: config.name,
                hoverinfo: 'skip',
                visible,
            } as Data);
            // Max line (top) with fill to min
            traces.push({
                x: armorNames,
                y: damageData.map((d) => d.max),
                type: 'scatter',
                mode: 'lines',
                line: { color },
                fill: 'tonexty',
                fillcolor: `${color}33`,
                name: config.name,
                legendgroup: config.name,
                showlegend: false,
                text: rangeText,
                hovertemplate: '%{text}<extra>%{fullData.name}</extra>',
                visible,
            });
        } else {
            const color = colors[modIndex % colors.length] ?? '#1f77b4';
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
                name: config.name,
                legendgroup: config.name,
                hovertemplate: '%{y:.6~g}<extra>%{fullData.name}</extra>',
                visible,
            });
        }
    });

    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
    const burstLabel = burst && weapon.burst
        ? (pointBlank ? ' Point-blank burst' : ' Burst')
        : '';
    const modifiers = [
        critical && 'Critical',
        allCrit && 'Sniper 10 Luck',
        rangedBonus > 0 && `BRD ${rangedBonus}`,
    ].filter(Boolean);
    const modifiersLabel = modifiers.length > 0 ? `, ${modifiers.join(', ')}` : '';
    const title = `${weapon.name} + ${ammoName} (${modeLabel})${burstLabel}${modifiersLabel}`;

    return (
        <BaseDamageChart
            traces={traces}
            title={title}
            armorList={armorList}
            hiddenItems={hiddenMods}
            onHiddenItemsChange={onHiddenModsChange}
        />
    );
};

export default DamageChart;
export type { DamageMode };
