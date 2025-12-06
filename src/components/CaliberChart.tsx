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
} from '../chartUtils';

interface CaliberChartProps {
    modId: string;
    caliber: string;
    data: ModData;
    mode: DamageMode;
    hiddenItems: Set<string>;
    onHiddenItemsChange: (items: Set<string>) => void;
    hiddenAmmo: Set<string>;
    hiddenWeapons: Set<string>;
    burst: boolean;
    pointBlank: boolean;
    critical: boolean;
    rangedBonus: number;
    sniperLuck: boolean;
}

const CaliberChart = ({
    modId,
    caliber,
    data,
    mode,
    hiddenItems,
    onHiddenItemsChange,
    hiddenAmmo,
    hiddenWeapons,
    burst,
    pointBlank,
    critical,
    rangedBonus,
    sniperLuck,
}: CaliberChartProps) => {
    const vanillaMod = data.mods['vanilla'];
    if (!vanillaMod) return null;

    const mod = data.mods[modId];
    const config = modConfigs[modId];
    if (!mod || !config) return null;

    const armorList = vanillaMod.armor;
    const armorNames = armorList.map((a) => a.name);
    const traces: Data[] = [];

    // Get all weapons and ammo in this mod that use the selected caliber
    const weapons = mod.weapons.filter((w) => w.caliber === caliber);
    const ammoList = mod.ammo.filter((a) => a.caliber === caliber);
    if (ammoList.length === 0) return null;

    // Create traces for each weapon+ammo combination
    let colorIndex = 0;
    weapons.forEach((weapon) => {
        const weaponHasBurst = !!weapon.burst;
        const effectiveBurst = burst && weaponHasBurst;
        const burstRounds = effectiveBurst && weapon.burst ? weapon.burst : 1;
        const hitsMultiplier = calculateHitsMultiplier(effectiveBurst, pointBlank, burstRounds);

        ammoList.forEach((ammo) => {
            const damageData = armorList.map((armor) => {
                const modArmor = mod.armor.find((a) => a.name === armor.name) ?? armor;
                const damageStr = getDamageWithFormula(
                    config.formula,
                    weapon,
                    ammo,
                    modArmor,
                    critical,
                    effectiveBurst,
                    rangedBonus,
                    hitsMultiplier,
                    sniperLuck
                );
                return parseDamageString(damageStr);
            });

            const traceName = ammoList.length > 1 ? `${weapon.name} + ${ammo.name}` : weapon.name;
            const visible =
                hiddenItems.has(traceName) || hiddenAmmo.has(ammo.name) || hiddenWeapons.has(weapon.name)
                    ? 'legendonly'
                    : true;

            traces.push(...createDamageTraces(armorNames, damageData, mode, traceName, visible, colorIndex));
            colorIndex++;
        });
    });

    const ammoNames = ammoList.map((a) => a.name).join(', ');
    const title = buildChartTitle(`${caliber} weapons (${ammoNames})`, mode, burst, pointBlank, critical, rangedBonus);

    // Add invisible trace to establish x-axis categories when no weapons
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

export default CaliberChart;
