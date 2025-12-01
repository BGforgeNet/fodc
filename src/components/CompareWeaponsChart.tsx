import { Data } from 'plotly.js';
import { ModData } from '../types';
import { getDamageWithFormula } from '../formulas';
import { modConfigs } from '../modConfig';
import BaseDamageChart from './BaseDamageChart';
import { DamageMode } from './DamageChart';

export interface WeaponEntry {
    id: string;
    modId: string;
    weaponName: string;
    ammoName: string;
}

interface CompareWeaponsChartProps {
    entries: WeaponEntry[];
    data: ModData;
    mode: DamageMode;
    hiddenItems: Set<string>;
    onHiddenItemsChange: (items: Set<string>) => void;
    burst: boolean;
    pointBlank: boolean;
    critical: boolean;
    allCrit: boolean;
    rangedBonus: number;
}

const extendedColors = [
    '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
    '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
];

const CompareWeaponsChart = ({
    entries,
    data,
    mode,
    hiddenItems,
    onHiddenItemsChange,
    burst,
    pointBlank,
    critical,
    allCrit,
    rangedBonus,
}: CompareWeaponsChartProps) => {
    const vanillaMod = data.mods['vanilla'];
    if (!vanillaMod) return null;
    const armorList = vanillaMod.armor;
    const armorNames = armorList.map((a) => a.name);

    const traces: Data[] = [];

    entries.forEach((entry, entryIndex) => {
        const mod = data.mods[entry.modId];
        const config = modConfigs[entry.modId];
        if (!mod || !config) return;

        const weapon = mod.weapons.find((w) => w.name === entry.weaponName);
        if (!weapon) return;

        const ammo = mod.ammo.find((a) => a.name === entry.ammoName && a.caliber === weapon.caliber);
        if (!ammo) return;

        const burstRounds = burst && weapon.burst ? weapon.burst : 1;
        const hitsMultiplier = burst ? (pointBlank ? burstRounds : burstRounds / 3) : 1;

        const damageData = armorList.map((armor) => {
            const modArmor = mod.armor.find((a) => a.name === armor.name) ?? armor;
            const damageStr = getDamageWithFormula(config.formula, weapon, ammo, modArmor, critical, burst, allCrit, rangedBonus);

            if (damageStr.includes('|')) {
                const [minPart, maxPart] = damageStr.split('-');
                const [minCrit, minNonCrit] = (minPart ?? '0|0').split('|').map(Number);
                const [maxCrit, maxNonCrit] = (maxPart ?? '0|0').split('|').map(Number);
                const nonCritHits = hitsMultiplier - 1;
                return {
                    min: Math.round(((minCrit ?? 0) + (minNonCrit ?? 0) * nonCritHits) * 10) / 10,
                    max: Math.round(((maxCrit ?? 0) + (maxNonCrit ?? 0) * nonCritHits) * 10) / 10,
                };
            }

            const parts = damageStr.split('-').map(Number);
            return { min: (parts[0] ?? 0) * hitsMultiplier, max: (parts[1] ?? 0) * hitsMultiplier };
        });

        const compatibleAmmoCount = mod.ammo.filter((a) => a.caliber === weapon.caliber).length;
        const legendName = compatibleAmmoCount > 1
            ? `${entry.weaponName} + ${entry.ammoName} (${config.name})`
            : `${entry.weaponName} (${config.name})`;
        const visible = hiddenItems.has(legendName) ? 'legendonly' : true;
        const color = extendedColors[entryIndex % extendedColors.length] ?? '#1f77b4';

        if (mode === 'range') {
            const rangeText = damageData.map((d) => `${d.min}-${d.max}`);
            traces.push({
                x: armorNames,
                y: damageData.map((d) => d.min),
                type: 'scatter',
                mode: 'lines',
                line: { color },
                name: legendName,
                legendgroup: legendName,
                hoverinfo: 'skip',
                visible,
            } as Data);
            traces.push({
                x: armorNames,
                y: damageData.map((d) => d.max),
                type: 'scatter',
                mode: 'lines',
                line: { color },
                fill: 'tonexty',
                fillcolor: `${color}33`,
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
                line: { color },
                name: legendName,
                legendgroup: legendName,
                hovertemplate: '%{y:.6~g}<extra>%{fullData.name}</extra>',
                visible,
            });
        }
    });

    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
    const burstLabel = burst ? (pointBlank ? ' Point-blank burst' : ' Burst') : '';
    const modifiers = [
        critical && 'Critical',
        allCrit && 'Sniper 10 Luck',
        rangedBonus > 0 && `BRD ${rangedBonus}`,
    ].filter(Boolean);
    const modifiersLabel = modifiers.length > 0 ? `, ${modifiers.join(', ')}` : '';
    const title = `Compare Weapons (${modeLabel})${burstLabel}${modifiersLabel}`;

    return (
        <BaseDamageChart
            traces={traces}
            title={title}
            armorList={armorList}
            hiddenItems={hiddenItems}
            onHiddenItemsChange={onHiddenItemsChange}
        />
    );
};

export default CompareWeaponsChart;
