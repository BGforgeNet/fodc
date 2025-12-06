import { Weapon, Ammo, Armor } from './types';
import { formatFloat } from './chartUtils';

// Get armor DR/DT based on damage type
const getArmorResistance = (armor: Armor, weapon: Weapon, ammo: Ammo): { dr: number; dt: number } => {
    // Determine damage type: ammo dmg_type overrides weapon dmg_type
    const dmgType = ammo.dmg_type ?? weapon.dmg_type;

    switch (dmgType) {
        case 'fire':
            return { dr: armor.dr_fire, dt: armor.dt_fire };
        case 'plasma':
            return { dr: armor.dr_plasma, dt: armor.dt_plasma };
        case 'laser':
            return { dr: armor.dr_laser, dt: armor.dt_laser };
        case 'electrical':
            // Electrical uses plasma resistance in Fallout 2
            return { dr: armor.dr_plasma, dt: armor.dt_plasma };
        case 'explosive':
            return { dr: armor.dr_explosive, dt: armor.dt_explosive };
        default:
            // Normal damage
            return { dr: armor.dr, dt: armor.dt };
    }
};

type DamageCalculator = (
    weapon: Weapon,
    ammo: Ammo,
    armor: Armor,
    critical: boolean,
    burst: boolean,
    rangedBonus: number,
    hits: number,
    sniperLuck: boolean
) => string;

// Fallout 2 formula (standard rounding, damage never negative)
// Critical: x3 multiplier (x6 total since base is x2), armor bypass (DR and DT to 20%)
// Note: Penetrate and critical armor bypass are not cumulative
const fallout2Formula = (
    weapon: Weapon,
    ammo: Ammo,
    armor: Armor,
    critical: boolean,
    burst: boolean,
    rangedBonus: number,
    hits: number,
    sniperLuck: boolean
): string => {
    const { dr: baseDr, dt: baseDt } = getArmorResistance(armor, weapon, ammo);
    // Sniper 10 Luck: all bullets crit
    const effectiveCritical = critical || sniperLuck;

    const calculateDamage = (baseDamage: number): number => {
        // Critical multiplier: x3 for single (x6 total), x2 for burst (x4 total)
        const critMultiplier = effectiveCritical ? (burst ? 2 : 3) : 1;

        // Armor bypass: critical (20%) or penetrate (20% via /5), not cumulative
        // Critical bypass applies to both DR and DT, penetrate only to DT
        let armorDr = baseDr;
        let armorDt = baseDt;
        if (effectiveCritical) {
            armorDr = baseDr * 0.2;
            armorDt = baseDt * 0.2;
        } else if (weapon.penetrate) {
            armorDt = Math.floor(baseDt / 5);
        }

        const effectiveDr = Math.max(0, Math.min(90, armorDr + ammo.dr_mod));
        const damage =
            (((((baseDamage + rangedBonus) * ammo.dmg_mult) / ammo.dmg_div) * critMultiplier - armorDt) *
                (100 - effectiveDr)) /
            100;
        return Math.max(0, Math.round(damage));
    };

    const minDamage = calculateDamage(weapon.min_dmg) * hits;
    const maxDamage = calculateDamage(weapon.max_dmg) * hits;

    return `${minDamage}-${maxDamage}`;
};

// FO2tweaks formula (all calculations and results use floats, damage never negative)
// Formula: (rnd + ranged_bonus - dt) * ammo_mult * critical_mult * difficulty_mult * dr_mult
// Where:
//   dt = target_dt * (100 + dr_mod) / 100
//   ammo_mult = (100 + dr_mod) / 100
//   dr_mult = (100 - final_dr) / 100
//   final_dr = target_dr * (100 + dr_mod) / 100, capped at 90
// Critical: bypass armor (DR and DT to 20%), critical_mult = 2 (x4 total)
// Penetrate: target_dt *= 0.2 (not cumulative with critical)
// Both applied before dr_mod
// Burst critical: 1 bullet at x4, rest at x2 (base)
// Simplified (no ranged bonus, normal difficulty):
//   damage = (rnd - dt) * ammo_mult * critical_mult * dr_mult
const fo2tweaksFormula = (
    weapon: Weapon,
    ammo: Ammo,
    armor: Armor,
    critical: boolean,
    burst: boolean,
    rangedBonus: number,
    hits: number,
    sniperLuck: boolean
): string => {
    const { dr: baseDr, dt: baseDt } = getArmorResistance(armor, weapon, ammo);

    const calculateDamage = (baseDamage: number, isCritical: boolean): number => {
        // Armor bypass: critical affects both DR and DT, penetrate only DT
        let targetDr = baseDr;
        let targetDt = baseDt;
        if (isCritical) {
            targetDr = baseDr * 0.2;
            targetDt = baseDt * 0.5;
        } else if (weapon.penetrate) {
            targetDr = baseDr * 0.2;
        }

        const ammoMult = (100.0 + ammo.dr_mod) / 100.0;

        // Calculate modified DT (float)
        let dt = targetDt * ammoMult;
        if (dt < 0) dt = 0;

        // Critical multiplier: 2 for critical (x4 total), 1 for non-critical (x2 total)
        const critMult = isCritical ? 2 : 1;

        // Calculate final DR and DR multiplier (float)
        let finalDr;
        if (ammo.dr_mod > 0) {
            finalDr = targetDr * ammoMult;
        } else {
            finalDr = targetDr + ammo.dr_mod;
        }
        if (finalDr < 0) finalDr = 0;
        if (finalDr > 90) finalDr = 90;
        const drMult = (100.0 - finalDr) / 100.0;

        // Apply damage formula (float result)
        const damage = (baseDamage + rangedBonus - dt) * ammoMult * critMult * drMult;
        return Math.max(0, damage);
    };

    // For burst: all bullets roll for crit
    // 5 Luck = 5% chance, Sniper 10 Luck = 1/3 bullets crit
    if (burst) {
        const critChance = sniperLuck ? 1 / 3 : 0.05;
        const minCrit = calculateDamage(weapon.min_dmg, true);
        const minNonCrit = calculateDamage(weapon.min_dmg, false);
        const maxCrit = calculateDamage(weapon.max_dmg, true);
        const maxNonCrit = calculateDamage(weapon.max_dmg, false);

        // Weighted per-bullet damage based on crit chance
        const minPerBullet = critChance * minCrit + (1 - critChance) * minNonCrit;
        const maxPerBullet = critChance * maxCrit + (1 - critChance) * maxNonCrit;

        let minDamage: number;
        let maxDamage: number;
        if (critical) {
            // First bullet guaranteed crit, rest have crit chance
            minDamage = minCrit + (hits - 1) * minPerBullet;
            maxDamage = maxCrit + (hits - 1) * maxPerBullet;
        } else {
            // All bullets have crit chance
            minDamage = hits * minPerBullet;
            maxDamage = hits * maxPerBullet;
        }

        return `${formatFloat(minDamage)}-${formatFloat(maxDamage)}`;
    }

    // For single shot: sniperLuck means guaranteed crit
    const effectiveCritical = critical || sniperLuck;
    const minDamage = calculateDamage(weapon.min_dmg, effectiveCritical) * hits;
    const maxDamage = calculateDamage(weapon.max_dmg, effectiveCritical) * hits;

    return `${formatFloat(minDamage)}-${formatFloat(maxDamage)}`;
};

// YAAM v1.1a formula (from sfall DamageMod.cpp)
// calcDT = armorDT - ammoDT; if negative: _calcDT *= 10, calcDT = 0
// calcDR = armorDR + _calcDT
// rawDamage = (baseDamage - calcDT) * multiplyDamage * ammoMult / ammoDiv / 2 * difficulty / 100
// resistedDamage = calcDR * rawDamage / 100
// Critical: multiplyDamage = 6 instead of 2, armor bypass (DR and DT to 20%)
// Penetrate: DT to 20% (not cumulative with critical)
// Normal difficulty (100), no perks, no ranged bonus
const yaamFormula = (
    weapon: Weapon,
    ammo: Ammo,
    armor: Armor,
    critical: boolean,
    burst: boolean,
    rangedBonus: number,
    hits: number,
    sniperLuck: boolean
): string => {
    const { dr: baseDr, dt: baseDt } = getArmorResistance(armor, weapon, ammo);
    // Sniper 10 Luck: all bullets crit
    const effectiveCritical = critical || sniperLuck;

    const calculateDamage = (baseDamage: number): number => {
        // Armor bypass: critical affects both DR and DT, penetrate only DT
        // Not cumulative - critical takes precedence
        let armorDR = baseDr;
        let armorDT = baseDt;
        if (effectiveCritical) {
            armorDR = baseDr * 0.2;
            armorDT = baseDt * 0.2;
        } else if (weapon.penetrate) {
            armorDT = baseDt * 0.2;
        }

        // calcDT = armorDT - ammoDT
        let calcDT = armorDT - ammo.dr_mod;
        let _calcDT = calcDT;

        if (calcDT >= 0) {
            _calcDT = 0; // _calcDT becomes 0, calcDT stays as original
        } else {
            _calcDT *= 10; // _calcDT = negative * 10
            calcDT = 0; // calcDT becomes 0
        }

        // calcDR = armorDR + _calcDT (note: _calcDT is 0 or negative*10)
        let calcDR = armorDR + _calcDT;
        if (calcDR < 0) calcDR = 0;
        if (calcDR >= 100) return 0;

        // multiplyDamage: 6 for single crit, 4 for burst crit, 2 for non-critical
        // multiplyDamage *= ammoMult
        const multiplyDamage = ((effectiveCritical ? (burst ? 4 : 6) : 2) * ammo.dmg_mult) / ammo.dmg_div;

        // rawDamage -= calcDT
        let rawDamage = baseDamage + rangedBonus - calcDT;
        if (rawDamage <= 0) return 0;

        // rawDamage *= multiplyDamage
        rawDamage *= multiplyDamage;
        // rawDamage /= ammoDiv (assuming 1)
        // rawDamage /= 2
        rawDamage /= 2;
        // rawDamage *= difficulty / 100 (normal = 100, so no change)

        // resistedDamage = calcDR * rawDamage / 100
        const resistedDamage = Math.floor((calcDR * rawDamage) / 100);
        rawDamage -= resistedDamage;

        return Math.max(0, Math.floor(rawDamage));
    };

    const minDamage = calculateDamage(weapon.min_dmg) * hits;
    const maxDamage = calculateDamage(weapon.max_dmg) * hits;

    return `${minDamage}-${maxDamage}`;
};

// Glovz Damage Fix v5 formula (from sfall DamageMod.cpp)
// calcDT = armorDT / ammoY (ammo divisor)
// calcDR = (armorDR + ammoDRM) / ammoX (ammo multiplier)
// rawDamage = baseDamage - calcDT
// resistedDamage = calcDR * rawDamage / 100
// rawDamage = (rawDamage - resistedDamage) * multiplyDamage / 2
// Critical: multiplyDamage = 6 instead of 2, armor bypass (DR and DT to 20%)
// Penetrate: DT to 20% (not cumulative with critical)
// Normal difficulty (100), no perks
const glovzFormula = (
    weapon: Weapon,
    ammo: Ammo,
    armor: Armor,
    critical: boolean,
    burst: boolean,
    rangedBonus: number,
    hits: number,
    sniperLuck: boolean
): string => {
    const { dr: baseDr, dt: baseDt } = getArmorResistance(armor, weapon, ammo);
    // Sniper 10 Luck: all bullets crit
    const effectiveCritical = critical || sniperLuck;

    const calculateDamage = (baseDamage: number): number => {
        // Armor bypass: critical affects both DR and DT, penetrate only DT
        // Not cumulative - critical takes precedence
        let armorDR = baseDr;
        let armorDT = baseDt;
        if (effectiveCritical) {
            armorDR = baseDr * 0.2;
            armorDT = baseDt * 0.2;
        } else if (weapon.penetrate) {
            armorDT = baseDt * 0.2;
        }

        // ammoY = divisor (dmg_div)
        // ammoX = multiplier (dmg_mult / dmg_div)
        // ammoDRM = dr_mod (if positive, flip to negative)
        const ammoY = ammo.dmg_div;
        const ammoX = ammo.dmg_mult / ammo.dmg_div;
        let ammoDRM = ammo.dr_mod;
        if (ammoDRM > 0) ammoDRM = -ammoDRM;

        // calcDT = armorDT / ammoY
        const calcDT = armorDT > 0 ? Math.round(armorDT / ammoY) : armorDT;

        // calcDR = (armorDR + ammoDRM) / ammoX
        // Normal difficulty (100), so no ±20 adjustment
        let calcDR = armorDR;
        if (armorDR > 0) {
            calcDR += ammoDRM;
            calcDR = Math.round(calcDR / ammoX);
            if (calcDR >= 100) return 0;
        }

        // rawDamage - calcDT
        let rawDamage = baseDamage + rangedBonus;
        if (armorDT > 0) {
            rawDamage -= calcDT;
            if (rawDamage <= 0) return 0;
        }

        // resistedDamage = calcDR * rawDamage / 100
        if (armorDR > 0) {
            const resistedDamage = Math.round((calcDR * rawDamage) / 100);
            rawDamage -= resistedDamage;
            if (rawDamage <= 0) return 0;
        }

        // multiplyDamage: 6 for single crit, 4 for burst crit, 2 for non-critical
        const multiplyDamage = effectiveCritical ? (burst ? 4 : 6) : 2;
        rawDamage = Math.floor((rawDamage * multiplyDamage) / 2);

        return Math.max(0, rawDamage);
    };

    const minDamage = calculateDamage(weapon.min_dmg) * hits;
    const maxDamage = calculateDamage(weapon.max_dmg) * hits;

    return `${minDamage}-${maxDamage}`;
};

// EcCo (Economy and Combat Overhaul) formula
// Source: https://github.com/phobos2077/fo2_ecco/blob/master/scripts_src/_pbs_headers/damage_mod.h
// Config: https://github.com/phobos2077/fo2_ecco/blob/master/root/mods/ecco/combat.ini
//
// Key differences from vanilla:
// 1. DT is reduced by ammo's DR adjust for AP ammo (negative dr_mod):
//    DT = armorDT + (ammoDR / 10) * dt_mult  (dt_mult = 1.3 for AP ammo)
//    JHP ammo (positive dr_mod) does NOT affect DT (dt_mode_positive = 0)
// 2. DR calculation is vanilla: DR = armorDR + ammoDR, clamped to 0-100
// 3. Burst criticals: only 50% of bullets get critical multiplier (burst_critical_fraction = 0.5)
// 4. Float calculations with probabilistic rounding per bullet
// 5. Penetrate: DT reduced to 20% (same as vanilla)
// 6. Critical: DT and DR reduced to 20%, crit multiplier x2 (x4 total)
//
// Formula per bullet:
//   effectiveDT = max(0, armorDT + ammoDR * 0.13)  // only for AP ammo (ammoDR < 0)
//   effectiveDR = clamp(armorDR + ammoDR, 0, 100)
//   damage = (baseDmg + rangedBonus - effectiveDT) * ammoMult * (1 - effectiveDR/100) * critMult
const eccoFormula = (
    weapon: Weapon,
    ammo: Ammo,
    armor: Armor,
    critical: boolean,
    burst: boolean,
    rangedBonus: number,
    hits: number,
    sniperLuck: boolean
): string => {
    const { dr: baseDr, dt: baseDt } = getArmorResistance(armor, weapon, ammo);

    // EcCo config defaults from combat.ini
    const DT_MULT_NEGATIVE = 1.3; // dt_mult_negative for AP ammo
    // BURST_CRITICAL_FRACTION = 0.5 - Only 50% of burst bullets get crit bonus
    // Sniper 10 Luck overrides this - all bullets crit

    const calculateDamage = (baseDamage: number, isCritical: boolean): number => {
        // Armor bypass: critical affects both DR and DT, penetrate only DT
        // Applied before ammo modifiers, not cumulative
        let targetDr = baseDr;
        let targetDt = baseDt;
        if (isCritical) {
            targetDr = baseDr * 0.2;
            targetDt = baseDt * 0.2;
        } else if (weapon.penetrate) {
            targetDt = baseDt * 0.2;
        }

        // DT modification by ammo DR adjust (EcCo's key difference)
        // Only AP ammo (negative dr_mod) affects DT: DT += ammoDR * 0.1 * dt_mult
        // JHP ammo (positive dr_mod) has no effect on DT (dt_mode_positive = 0)
        let effectiveDt = targetDt;
        if (ammo.dr_mod < 0) {
            // dt_mode_negative = 1 (ADD mode): DT += ammoDR / 10 * dt_mult
            effectiveDt = targetDt + (ammo.dr_mod / 10) * DT_MULT_NEGATIVE;
        }
        effectiveDt = Math.max(0, effectiveDt);

        // DR calculation is vanilla: DR = armorDR + ammoDR
        let effectiveDr = targetDr + ammo.dr_mod;
        effectiveDr = Math.max(0, Math.min(100, effectiveDr));

        // Critical multiplier: x2 for critical (x4 total with base x2), x1 for non-critical
        const critMult = isCritical ? 2 : 1;

        // Damage formula
        const rawDamage = baseDamage + rangedBonus - effectiveDt;
        if (rawDamage <= 0) return 0;

        const damage = ((rawDamage * ammo.dmg_mult) / ammo.dmg_div) * (1 - effectiveDr / 100) * critMult;
        return Math.max(0, damage);
    };

    // Sniper 10 Luck: all bullets crit
    if (sniperLuck) {
        const minDamage = calculateDamage(weapon.min_dmg, true) * hits;
        const maxDamage = calculateDamage(weapon.max_dmg, true) * hits;
        return `${formatFloat(minDamage)}-${formatFloat(maxDamage)}`;
    }

    // For burst critical: 50% of bullets get crit
    if (burst && critical) {
        const critHits = Math.ceil(hits / 2);
        const nonCritHits = Math.floor(hits / 2);
        const minDamage =
            calculateDamage(weapon.min_dmg, true) * critHits + calculateDamage(weapon.min_dmg, false) * nonCritHits;
        const maxDamage =
            calculateDamage(weapon.max_dmg, true) * critHits + calculateDamage(weapon.max_dmg, false) * nonCritHits;
        return `${formatFloat(minDamage)}-${formatFloat(maxDamage)}`;
    }

    const minDamage = calculateDamage(weapon.min_dmg, critical) * hits;
    const maxDamage = calculateDamage(weapon.max_dmg, critical) * hits;

    return `${formatFloat(minDamage)}-${formatFloat(maxDamage)}`;
};

const formulas: Record<string, DamageCalculator> = {
    fallout2: fallout2Formula,
    fo2tweaks: fo2tweaksFormula,
    yaam: yaamFormula,
    glovz: glovzFormula,
    ecco: eccoFormula,
};

export const getDamageWithFormula = (
    formulaName: string,
    weapon: Weapon,
    ammo: Ammo,
    armor: Armor,
    critical: boolean,
    burst: boolean,
    rangedBonus: number,
    hits: number = 1,
    sniperLuck: boolean = false
): string => {
    const formula = formulas[formulaName];
    let result: string;
    if (!formula) {
        console.warn(`Unknown formula: ${formulaName}, falling back to fallout2`);
        result = fallout2Formula(weapon, ammo, armor, critical, burst, rangedBonus, hits, sniperLuck);
    } else {
        result = formula(weapon, ammo, armor, critical, burst, rangedBonus, hits, sniperLuck);
    }
    return result === '0-0' ? '0' : result;
};
