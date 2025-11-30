export interface ModConfig {
    id: string;
    name: string;
    description: string;
    formula: string;
}

export const modConfigs: Record<string, ModConfig> = {
    vanilla: {
        id: 'vanilla',
        name: 'Vanilla',
        description: 'Original Fallout 2 game data',
        formula: 'fallout2',
    },
    fo2tweaks: {
        id: 'fo2tweaks',
        name: 'FO2tweaks',
        description: 'FO2tweaks',
        formula: 'fo2tweaks',
    },
    yaam: {
        id: 'yaam',
        name: 'YAAM',
        description: 'Yet Another Ammo Mod',
        formula: 'yaam',
    },
    glovz: {
        id: 'glovz',
        name: 'Glovz',
        description: 'Glovz Damage Formula',
        formula: 'glovz',
    },
};

// Order mods will be displayed
export const modOrder = ['vanilla', 'fo2tweaks', 'yaam', 'glovz'];
