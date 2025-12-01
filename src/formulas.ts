import { Weapon, Ammo, Armor } from './types';

type DamageCalculator = (weapon: Weapon, ammo: Ammo, armor: Armor, critical: boolean, burst: boolean, allCrit: boolean, rangedBonus: number) => string;

// Fallout 2 formula (standard rounding, damage never negative)
// Critical: x3 multiplier (x6 total since base is x2), armor bypass (DR and DT to 20%)
// Note: Penetrate and critical armor bypass are not cumulative
const fallout2Formula = (weapon: Weapon, ammo: Ammo, armor: Armor, critical: boolean, burst: boolean, _allCrit: boolean, rangedBonus: number): string => {
    const calculateDamage = (baseDamage: number): number => {
        // Critical multiplier: x3 for single (x6 total), x2 for burst (x4 total)
        const critMultiplier = critical ? (burst ? 2 : 3) : 1;

        // Armor bypass: critical (20%) or penetrate (20% via /5), not cumulative
        // Critical bypass applies to both DR and DT, penetrate only to DT
        let armorDr = armor.dr;
        let armorDt = armor.dt;
        if (critical) {
            armorDr = armor.dr * 0.2;
            armorDt = armor.dt * 0.2;
        } else if (weapon.penetrate) {
            armorDt = Math.floor(armor.dt / 5);
        }

        const effectiveDr = Math.max(0, Math.min(90, armorDr + ammo.dr_mod));
        const damage = ((baseDamage + rangedBonus) * ammo.dmg_mod * critMultiplier - armorDt) * (100 - effectiveDr) / 100;
        return Math.max(0, Math.round(damage));
    };

    const minDamage = calculateDamage(weapon.min_dmg);
    const maxDamage = calculateDamage(weapon.max_dmg);

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
const fo2tweaksFormula = (weapon: Weapon, ammo: Ammo, armor: Armor, critical: boolean, burst: boolean, allCrit: boolean, rangedBonus: number): string => {
    const calculateDamage = (baseDamage: number, isCritical: boolean): number => {
        // Armor bypass: critical affects both DR and DT, penetrate only DT
        // Applied before dr_mod, not cumulative
        let targetDr = armor.dr;
        let targetDt = armor.dt;
        if (isCritical) {
            targetDr = armor.dr * 0.2;
            targetDt = armor.dt * 0.2;
        } else if (weapon.penetrate) {
            targetDt = armor.dt * 0.2;
        }

        // Calculate modified DT (float)
        let dt = (targetDt * (100.0 + ammo.dr_mod)) / 100.0;
        if (dt < 0) dt = 0;

        // Calculate ammo multiplier (float)
        const ammoMult = (100.0 + ammo.dr_mod) / 100.0;

        // Critical multiplier: 2 for critical (x4 total), 1 for non-critical (x2 total)
        const critMult = isCritical ? 2 : 1;

        // Calculate final DR and DR multiplier (float)
        let finalDr = (targetDr * (100.0 + ammo.dr_mod)) / 100.0;
        if (finalDr < 0) finalDr = 0;
        if (finalDr > 90) finalDr = 90;
        const drMult = (100.0 - finalDr) / 100.0;

        // Apply damage formula (float result)
        const damage = (baseDamage + rangedBonus - dt) * ammoMult * critMult * drMult;
        return Math.max(0, damage);
    };

    // For burst critical: 1 bullet at x4, rest at x2
    // With allCrit (Sniper + 10 Luck): all bullets at x4
    // For single critical: x4
    // For non-critical: x2
    if (burst && critical && !allCrit) {
        const minCrit = calculateDamage(weapon.min_dmg, true);
        const maxCrit = calculateDamage(weapon.max_dmg, true);
        const minNonCrit = calculateDamage(weapon.min_dmg, false);
        const maxNonCrit = calculateDamage(weapon.max_dmg, false);
        // Return "critDamage + nonCritDamage" format for DamageChart to handle
        const formatFloat = (n: number): string => {
            if (n % 1 === 0) return n.toString();
            return parseFloat(n.toFixed(1)).toString();
        };
        // Encode both values: crit|noncrit
        return `${formatFloat(minCrit)}|${formatFloat(minNonCrit)}-${formatFloat(maxCrit)}|${formatFloat(maxNonCrit)}`;
    }

    const minDamage = calculateDamage(weapon.min_dmg, critical);
    const maxDamage = calculateDamage(weapon.max_dmg, critical);

    const formatFloat = (n: number): string => {
        if (n % 1 === 0) return n.toString();
        return parseFloat(n.toFixed(1)).toString();
    };

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
const yaamFormula = (weapon: Weapon, ammo: Ammo, armor: Armor, critical: boolean, burst: boolean, _allCrit: boolean, rangedBonus: number): string => {
    const calculateDamage = (baseDamage: number): number => {
        // Armor bypass: critical affects both DR and DT, penetrate only DT
        // Not cumulative - critical takes precedence
        let armorDR = armor.dr;
        let armorDT = armor.dt;
        if (critical) {
            armorDR = armor.dr * 0.2;
            armorDT = armor.dt * 0.2;
        } else if (weapon.penetrate) {
            armorDT = armor.dt * 0.2;
        }

        // calcDT = armorDT - ammoDT
        let calcDT = armorDT - ammo.dr_mod;
        let _calcDT = calcDT;

        if (calcDT >= 0) {
            _calcDT = 0;  // _calcDT becomes 0, calcDT stays as original
        } else {
            _calcDT *= 10;  // _calcDT = negative * 10
            calcDT = 0;     // calcDT becomes 0
        }

        // calcDR = armorDR + _calcDT (note: _calcDT is 0 or negative*10)
        let calcDR = armorDR + _calcDT;
        if (calcDR < 0) calcDR = 0;
        if (calcDR >= 100) return 0;

        // multiplyDamage: 6 for single crit, 4 for burst crit, 2 for non-critical
        // multiplyDamage *= ammoMult
        const multiplyDamage = (critical ? (burst ? 4 : 6) : 2) * ammo.dmg_mod;

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
        const resistedDamage = Math.floor(calcDR * rawDamage / 100);
        rawDamage -= resistedDamage;

        return Math.max(0, Math.floor(rawDamage));
    };

    const minDamage = calculateDamage(weapon.min_dmg);
    const maxDamage = calculateDamage(weapon.max_dmg);

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
const glovzFormula = (weapon: Weapon, ammo: Ammo, armor: Armor, critical: boolean, burst: boolean, _allCrit: boolean, rangedBonus: number): string => {
    const calculateDamage = (baseDamage: number): number => {
        // Armor bypass: critical affects both DR and DT, penetrate only DT
        // Not cumulative - critical takes precedence
        let armorDR = armor.dr;
        let armorDT = armor.dt;
        if (critical) {
            armorDR = armor.dr * 0.2;
            armorDT = armor.dt * 0.2;
        } else if (weapon.penetrate) {
            armorDT = armor.dt * 0.2;
        }

        // ammoY = divisor (we use dmg_mod as multiplier, so Y = 1)
        // ammoX = multiplier (dmg_mod)
        // ammoDRM = dr_mod (if positive, flip to negative)
        const ammoY = 1;
        const ammoX = ammo.dmg_mod;
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
            const resistedDamage = Math.round(calcDR * rawDamage / 100);
            rawDamage -= resistedDamage;
            if (rawDamage <= 0) return 0;
        }

        // multiplyDamage: 6 for single crit, 4 for burst crit, 2 for non-critical
        const multiplyDamage = critical ? (burst ? 4 : 6) : 2;
        rawDamage = Math.floor((rawDamage * multiplyDamage) / 2);

        return Math.max(0, rawDamage);
    };

    const minDamage = calculateDamage(weapon.min_dmg);
    const maxDamage = calculateDamage(weapon.max_dmg);

    return `${minDamage}-${maxDamage}`;
};

const formulas: Record<string, DamageCalculator> = {
    fallout2: fallout2Formula,
    fo2tweaks: fo2tweaksFormula,
    yaam: yaamFormula,
    glovz: glovzFormula,
};

export const getDamageWithFormula = (formulaName: string, weapon: Weapon, ammo: Ammo, armor: Armor, critical: boolean, burst: boolean, allCrit: boolean, rangedBonus: number): string => {
    const formula = formulas[formulaName];
    let result: string;
    if (!formula) {
        console.warn(`Unknown formula: ${formulaName}, falling back to fallout2`);
        result = fallout2Formula(weapon, ammo, armor, critical, burst, allCrit, rangedBonus);
    } else {
        result = formula(weapon, ammo, armor, critical, burst, allCrit, rangedBonus);
    }
    return result === '0-0' ? '0' : result;
};
