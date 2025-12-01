import { readFileSync } from 'fs';

// Map source names to our output names and abbreviations
const nameMap: Record<string, [string, string]> = {
    'Leather Jacket': ['Leather jacket', ''],
    'Combat Leather Jacket': ['Combat leather jacket', ''],
    'Leather Armor': ['Leather armor', ''],
    'Leather Armor Mark II': ['Leather armor Mk II', 'Mk II'],
    'Metal Armor': ['Metal armor', ''],
    'Metal Armor Mark II': ['Metal armor Mk II', 'Mk II'],
    'Tesla Armor': ['Tesla armor', 'Tesla'],
    'Combat Armor': ['Combat armor', ''],
    'Combat Armor Mark II': ['Combat armor Mk II', 'Mk II'],
    'Brotherhood Armor': ['Brotherhood armor', 'Brotherhood'],
    'Power Armor': ['Power armor', ''],
    'Hardened Power Armor': ['Hardened power armor', 'Hardened'],
    'Advanced Power Armor': ['Advanced power armor', ''],
    'Adv. Power Armor MKII': ['Advanced power armor Mk II', 'Mk II'],
};

// Sort order matching vanilla
const sortOrder: string[] = [
    'No armor',
    'Leather jacket',
    'Combat leather jacket',
    'Leather armor',
    'Leather armor Mk II',
    'Metal armor',
    'Metal armor Mk II',
    'Tesla armor',
    'Combat armor',
    'Combat armor Mk II',
    'Brotherhood armor',
    'Power armor',
    'Hardened power armor',
    'Advanced power armor',
    'Advanced power armor Mk II',
];

const input = readFileSync(process.argv[2] ?? '/dev/stdin', 'utf-8');
const lines = input.trim().split('\n');

interface ArmorEntry {
    name: string;
    abbrev: string;
    dr: number;
    dt: number;
    drFire: number;
    dtFire: number;
    drPlasma: number;
    dtPlasma: number;
    drLaser: number;
    dtLaser: number;
}

const armorEntries: ArmorEntry[] = [];

// Add "No armor" entry
armorEntries.push({
    name: 'No armor',
    abbrev: '',
    dr: 0, dt: 0,
    drFire: 0, dtFire: 0,
    drPlasma: 0, dtPlasma: 0,
    drLaser: 0, dtLaser: 0,
});

for (const line of lines.slice(1)) {
    if (line.startsWith('#')) continue;

    const cols = line.split(';');
    if (cols.length < 12) continue;

    const srcName = cols[2] ?? '';
    const mapped = nameMap[srcName];
    if (!mapped) continue;

    const [outName, abbrev] = mapped;

    // Parse DT|DR pairs
    // Format: Normal DT|DR;Laser DT|DR;Fire DT|DR;Plasma DT|DR;...
    // Columns: 6=Normal, 7=Laser, 8=Fire, 9=Plasma
    const parseStats = (col: string): [number, number] => {
        const parts = col.split('|');
        return [parseInt(parts[0] ?? '0', 10), parseInt(parts[1] ?? '0', 10)];
    };

    const [dtNormal, drNormal] = parseStats(cols[6] ?? '0|0');
    const [dtLaser, drLaser] = parseStats(cols[7] ?? '0|0');
    const [dtFire, drFire] = parseStats(cols[8] ?? '0|0');
    const [dtPlasma, drPlasma] = parseStats(cols[9] ?? '0|0');

    armorEntries.push({
        name: outName,
        abbrev,
        dr: drNormal,
        dt: dtNormal,
        drFire,
        dtFire,
        drPlasma,
        dtPlasma,
        drLaser,
        dtLaser,
    });
}

// Sort by predefined order
armorEntries.sort((a, b) => {
    const aIdx = sortOrder.indexOf(a.name);
    const bIdx = sortOrder.indexOf(b.name);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
});

console.log('Name,Abbrev,DR,DT,DR fire,DT fire,DR plasma,DT plasma,DR laser,DT laser');
for (const armor of armorEntries) {
    console.log(`${armor.name},${armor.abbrev},${armor.dr},${armor.dt},${armor.drFire},${armor.dtFire},${armor.drPlasma},${armor.dtPlasma},${armor.drLaser},${armor.dtLaser}`);
}
