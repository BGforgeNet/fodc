import { Data } from 'plotly.js';
import { ModData } from '../types';
import { getDamageWithFormula } from '../formulas';
import { modConfigs } from '../modConfig';
import BaseDamageChart from './BaseDamageChart';
import {
    DamageMode,
    parseDamageString,
    calculateHitsMultiplier,
    createDamageTraces,
    buildChartTitle,
    EXTENDED_COLORS,
} from '../chartUtils';

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
        const hitsMultiplier = calculateHitsMultiplier(burst, pointBlank, burstRounds);

        const damageData = armorList.map((armor) => {
            const modArmor = mod.armor.find((a) => a.name === armor.name) ?? armor;
            const damageStr = getDamageWithFormula(
                config.formula,
                weapon,
                ammo,
                modArmor,
                critical,
                burst,
                allCrit,
                rangedBonus
            );
            return parseDamageString(damageStr, hitsMultiplier);
        });

        const compatibleAmmoCount = mod.ammo.filter((a) => a.caliber === weapon.caliber).length;
        const legendName =
            compatibleAmmoCount > 1
                ? `${entry.weaponName} + ${entry.ammoName} (${config.name})`
                : `${entry.weaponName} (${config.name})`;

        const visible = hiddenItems.has(legendName) ? 'legendonly' : true;
        const color = EXTENDED_COLORS[entryIndex % EXTENDED_COLORS.length] ?? '#1f77b4';

        traces.push(...createDamageTraces(armorNames, damageData, mode, legendName, color, visible));
    });

    const title = buildChartTitle('Compare Weapons', mode, burst, pointBlank, critical, allCrit, rangedBonus);

    // Add invisible trace to establish x-axis categories when no entries
    if (traces.length === 0) {
        traces.push({
            x: armorNames,
            y: armorNames.map(() => null),
            type: 'scatter',
            mode: 'lines',
            showlegend: false,
            hoverinfo: 'skip',
        });
    }

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
