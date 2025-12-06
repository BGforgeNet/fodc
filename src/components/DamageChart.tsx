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
    rangedBonus: number;
    sniperLuck: boolean;
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
    rangedBonus,
    sniperLuck,
}: DamageChartProps) => {
    const vanillaMod = data.mods['vanilla'];
    if (!vanillaMod) return null;

    const armorList = vanillaMod.armor;
    const vanillaWeapon = vanillaMod.weapons.find((w) => w.name === weaponName);
    if (!vanillaWeapon) return null;

    const armorNames = armorList.map((a) => a.name);
    const traces: Data[] = [];

    let colorIndex = 0;
    modOrder.forEach((modId) => {
        const mod = data.mods[modId];
        const config = modConfigs[modId];
        if (!mod || !config) return;

        const weapon = mod.weapons.find((w) => w.name === weaponName) ?? vanillaWeapon;
        const ammo = mod.ammo.find((a) => a.name === ammoName && a.caliber === weapon.caliber);
        if (!ammo) return;

        const weaponHasBurst = !!weapon.burst;
        const effectiveBurst = burst && weaponHasBurst;
        const burstRounds = effectiveBurst && weapon.burst ? weapon.burst : 1;
        const hitsMultiplier = calculateHitsMultiplier(effectiveBurst, pointBlank, burstRounds);

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

        const visible = hiddenMods.has(config.name) ? 'legendonly' : true;

        traces.push(...createDamageTraces(armorNames, damageData, mode, config.name, visible, colorIndex));
        colorIndex++;
    });

    const hasBurst = burst && vanillaWeapon.burst !== undefined;
    const title = buildChartTitle(
        `${vanillaWeapon.name} + ${ammoName}`,
        mode,
        hasBurst,
        pointBlank,
        critical,
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
