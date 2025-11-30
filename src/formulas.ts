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

// YAAM formula (damage never negative)
// damage = max[int(total_damage) - int(modified_DR * int(total_damage)), 0]
// total_damage = [(raw_damage - max(modified_DT, 0)) * modified_mult] / [dmg_div * 2 * 100]
// modified_DR = armor_DR + [10 * min(modified_DT, 0) / 100]
// modified_DT = armor_DT - ammo_DT
// Simplified (no critical, normal difficulty, no perks, no ranged bonus):
//   modified_mult = 2 * dmg_mult * 100 = 200 * dmg_mult
//   dmg_div * 2 * 100 cancels with modified_mult partially
const yaamFormula = (weapon: Weapon, ammo: Ammo, armor: Armor): string => {
    const calculateDamage = (baseDamage: number): number => {
        // Calculate modified_DT = armor_DT - ammo_DT
        // Note: ammo.dr_mod is used as ammo_DT in YAAM
        const modifiedDT = armor.dt - ammo.dr_mod;

        // Calculate modified_DR = armor_DR + [10 * min(modified_DT, 0) / 100]
        const modifiedDR = armor.dr + (10 * Math.min(modifiedDT, 0)) / 100;

        // Calculate total_damage
        // modified_mult = 2 * dmg_mult * 100 (no crit, normal difficulty)
        // total_damage = [(raw_damage - max(modified_DT, 0)) * modified_mult] / [dmg_div * 2 * 100]
        // Assuming dmg_mult is a single value (not mult/div), and dmg_div = 1:
        // total_damage = [(baseDamage - max(modifiedDT, 0)) * 2 * dmg_mult * 100] / [1 * 2 * 100]
        // total_damage = (baseDamage - max(modifiedDT, 0)) * dmg_mult
        const totalDamage = (baseDamage - Math.max(modifiedDT, 0)) * ammo.dmg_mod;

        // Calculate final damage = max[int(total_damage) - int(modified_DR * int(total_damage)), 0]
        const intTotalDamage = Math.floor(totalDamage);
        const damage = intTotalDamage - Math.floor(modifiedDR * intTotalDamage / 100);

        return Math.max(0, damage);
    };

    const minDamage = calculateDamage(weapon.min_dmg);
    const maxDamage = calculateDamage(weapon.max_dmg);

    return `${minDamage}-${maxDamage}`;
};

// Glovz formula (damage never negative)
// Simplified for normal difficulty (CD = 100, so CD' = 0)
// armDT and armDR cannot be negative
// ammo cannot add DR (if amDRM > 0, flip it to negative)
const glovzFormula = (weapon: Weapon, ammo: Ammo, armor: Armor): string => {
    const calculateDamage = (baseDamage: number): number => {
        // armDT cannot be negative
        let armDT = armor.dt < 0 ? 0 : armor.dt;

        // amY (dmg_div) - assuming it's in dmg_mod as a single value, we treat dmg_mod as amX/amY combined
        // For simplicity, we'll use dmg_mod directly as the multiplier
        // Since we don't have separate amX/amY, we skip the division step

        // ND = RD - armDT
        let ND = baseDamage - armDT;

        // armDR cannot be negative
        let armDR = armor.dr < 0 ? 0 : armor.dr;

        // amDRM - if positive, flip to negative
        let amDRM = ammo.dr_mod;
        if (amDRM > 0) amDRM = 0 - amDRM;

        // CD' for normal difficulty (CD = 100) is 0
        const CD_prime = 0;

        // armDR = armDR + amDRM + CD'
        armDR = armDR + amDRM + CD_prime;

        // amX - treat dmg_mod as amX for this calculation
        // armDR is divided by amX (if amX > 0)
        if (ammo.dmg_mod > 0) {
            armDR = armDR / ammo.dmg_mod;
        }

        // Apply DR reduction or bonus
        if (armDR > 0) {
            const temp = (ND * armDR) / 100;
            ND = ND - temp;
        } else if (armDR < 0) {
            // Small bonus - using absolute value of armDR as bonus percent
            const temp = (ND * Math.abs(armDR)) / 100;
            ND = ND + temp;
        }

        // ND cannot be negative
        if (ND < 0) ND = 0;

        return Math.round(ND);
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

export const getDamageWithFormula = (formulaName: string, weapon: Weapon, ammo: Ammo, armor: Armor): string => {
    const formula = formulas[formulaName];
    if (!formula) {
        console.warn(`Unknown formula: ${formulaName}, falling back to fallout2`);
        return formulas.fallout2(weapon, ammo, armor);
    }
    return formula(weapon, ammo, armor);
};
