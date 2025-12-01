import { Data } from 'plotly.js';
import { ModData } from '../types';
import { getDamageWithFormula } from '../formulas';
import { modOrder, modConfigs } from '../modConfig';
import BaseDamageChart from './BaseDamageChart';
import {
    DamageMode,
    parseDamageString,
    calculateHitsMultiplier,
    createDamageTraces,
    buildChartTitle,
    CHART_COLORS,
} from '../chartUtils';

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

const DamageChart = ({
    weaponName,
    ammoName,
    data,
    mode,
    hiddenMods,
    onHiddenModsChange,
    burst,
    pointBlank,
    critical,
    allCrit,
    rangedBonus,
}: DamageChartProps) => {
    const vanillaMod = data.mods['vanilla'];
    if (!vanillaMod) return null;

    const armorList = vanillaMod.armor;
    const weapon = vanillaMod.weapons.find((w) => w.name === weaponName);
    if (!weapon) return null;

    const armorNames = armorList.map((a) => a.name);
    const traces: Data[] = [];

    modOrder.forEach((modId, modIndex) => {
        const mod = data.mods[modId];
        const config = modConfigs[modId];
        if (!mod || !config) return;

        const ammo = mod.ammo.find((a) => a.name === ammoName && a.caliber === weapon.caliber);
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

        const visible = hiddenMods.has(config.name) ? 'legendonly' : true;
        const color = CHART_COLORS[modIndex % CHART_COLORS.length] ?? '#1f77b4';

        traces.push(...createDamageTraces(armorNames, damageData, mode, config.name, color, visible));
    });

    const hasBurst = burst && weapon.burst !== undefined;
    const title = buildChartTitle(
        `${weapon.name} + ${ammoName}`,
        mode,
        hasBurst,
        pointBlank,
        critical,
        allCrit,
        rangedBonus
    );

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
