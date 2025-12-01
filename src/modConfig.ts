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
    ecco: {
        id: 'ecco',
        name: 'EcCo',
        description: 'Economy and Combat Overhaul',
        formula: 'ecco',
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
        description: "Glovz's Damage Formula",
        formula: 'glovz',
    },
};

// Order mods will be displayed
export const modOrder = ['vanilla', 'glovz', 'yaam', 'fo2tweaks', 'ecco'];
