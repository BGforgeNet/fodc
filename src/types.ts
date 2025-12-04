export interface Ammo {
    name: string;
    caliber: string;
    ac_mod: number;
    dr_mod: number;
    dmg_mult: number;
    dmg_div: number;
    dmg_type?: string;
}

export interface Armor {
    name: string;
    abbrev: string;
    dr: number;
    dt: number;
    dr_fire: number;
    dt_fire: number;
    dr_plasma: number;
    dt_plasma: number;
    dr_laser: number;
    dt_laser: number;
    dr_explosive: number;
    dt_explosive: number;
}

export interface Weapon {
    name: string;
    caliber: string;
    min_dmg: number;
    max_dmg: number;
    dmg_type?: string;
    burst?: number;
    burst_only?: boolean;
    penetrate?: boolean;
}

export interface ModData {
    mods: {
        [modName: string]: {
            ammo: Ammo[];
            armor: Armor[];
            weapons: Weapon[];
        };
    };
}
