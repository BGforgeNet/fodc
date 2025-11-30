import { ModData, Weapon, Ammo, Armor } from '../data/src/types';

const calculateDamage = (baseDamage: number, ammoDmgMod: number, armorDt: number, armorDr: number, ammoDrMod: number): number => {
  const effectiveDr = Math.max(0, Math.min(90, armorDr + ammoDrMod));
  return Math.floor(((baseDamage * ammoDmgMod) - armorDt) * (100 - effectiveDr) / 100);
};

export const getDamage = (data: ModData, weapon: Weapon, ammo: Ammo, armor: Armor): string => {
  const minBaseDamage = weapon.min_dmg;
  const maxBaseDamage = weapon.max_dmg;

  const minDamage = calculateDamage(minBaseDamage, ammo.dmg_mod, armor.dt, armor.dr, ammo.dr_mod);
  const maxDamage = calculateDamage(maxBaseDamage, ammo.dmg_mod, armor.dt, armor.dr, ammo.dr_mod);

  return `${minDamage}-${maxDamage}`;
};
