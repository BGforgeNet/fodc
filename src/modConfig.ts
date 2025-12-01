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
        description: 'FO2tweaks (vanilla data)',
        formula: 'fo2tweaks',
    },
    yaam: {
        id: 'yaam',
        name: 'YAAM',
        description: 'Yet Another Ammo Mod (vanilla data)',
        formula: 'yaam',
    },
    glovz: {
        id: 'glovz',
        name: 'Glovz',
        description: 'Glovz Damage Formula (vanilla data)',
        formula: 'glovz',
    },
};

// Order mods will be displayed
export const modOrder = ['vanilla', 'ecco', 'fo2tweaks', 'yaam', 'glovz'];
