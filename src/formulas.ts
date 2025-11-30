import { Weapon, Ammo, Armor } from './types';

type DamageCalculator = (weapon: Weapon, ammo: Ammo, armor: Armor) => string;

// Fallout 2 formula (standard rounding, damage never negative)
const fallout2Formula = (weapon: Weapon, ammo: Ammo, armor: Armor): string => {
    const calculateDamage = (baseDamage: number): number => {
        const effectiveDr = Math.max(0, Math.min(90, armor.dr + ammo.dr_mod));
        const damage = ((baseDamage * ammo.dmg_mod) - armor.dt) * (100 - effectiveDr) / 100;
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
// Simplified (no ranged bonus, no critical, normal difficulty):
//   damage = (rnd - dt) * ammo_mult * dr_mult
const fo2tweaksFormula = (weapon: Weapon, ammo: Ammo, armor: Armor): string => {
    const calculateDamage = (baseDamage: number): number => {
        // Calculate modified DT (float)
        let dt = (armor.dt * (100.0 + ammo.dr_mod)) / 100.0;
        if (dt < 0) dt = 0;

        // Calculate ammo multiplier (float)
        const ammoMult = (100.0 + ammo.dr_mod) / 100.0;

        // Calculate final DR and DR multiplier (float)
        let finalDr = (armor.dr * (100.0 + ammo.dr_mod)) / 100.0;
        if (finalDr < 0) finalDr = 0;
        if (finalDr > 90) finalDr = 90;
        const drMult = (100.0 - finalDr) / 100.0;

        // Apply damage formula (float result)
        const damage = (baseDamage - dt) * ammoMult * drMult;
        return Math.max(0, damage);
    };

    const minDamage = calculateDamage(weapon.min_dmg);
    const maxDamage = calculateDamage(weapon.max_dmg);

    const formatFloat = (n: number): string => {
        if (n % 1 === 0) return n.toString();
        return parseFloat(n.toFixed(1)).toString();
    };

    return `${formatFloat(minDamage)}-${formatFloat(maxDamage)}`;
};

const formulas: Record<string, DamageCalculator> = {
    fallout2: fallout2Formula,
    fo2tweaks: fo2tweaksFormula,
};

export const getDamageWithFormula = (formulaName: string, weapon: Weapon, ammo: Ammo, armor: Armor): string => {
    const formula = formulas[formulaName];
    if (!formula) {
        console.warn(`Unknown formula: ${formulaName}, falling back to fallout2`);
        return formulas.fallout2(weapon, ammo, armor);
    }
    return formula(weapon, ammo, armor);
};
