import { Ammo, Weapon } from './types';

export const formatAmmoTooltip = (ammo: Ammo): string => {
    const drMod = ammo.dr_mod === 0 ? '0' : `${ammo.dr_mod > 0 ? '+' : ''}${ammo.dr_mod}%`;
    const dmgMod = ammo.dmg_mult === ammo.dmg_div ? `${ammo.dmg_mult}` : `${ammo.dmg_mult}/${ammo.dmg_div}`;
    const typeLine = ammo.dmg_type && ammo.dmg_type !== 'normal' ? `\nType: ${ammo.dmg_type}` : '';
    return `${ammo.name}\nDR mod: ${drMod}\nDMG mod: ${dmgMod}${typeLine}`;
};

export const formatWeaponTooltip = (weapon: Weapon): string => {
    const dmgType = weapon.dmg_type && weapon.dmg_type !== 'normal' ? ` ${weapon.dmg_type}` : '';
    const burstLine = weapon.burst ? `\nBurst: ${weapon.burst}` : '';
    return `${weapon.name}\nDamage: ${weapon.min_dmg}-${weapon.max_dmg}${dmgType}${burstLine}`;
};

export const createSetToggler = <T>(setState: React.Dispatch<React.SetStateAction<Set<T>>>) => {
    return (item: T) => {
        setState((prev) => {
            const next = new Set(prev);
            if (next.has(item)) {
                next.delete(item);
            } else {
                next.add(item);
            }
            return next;
        });
    };
};
