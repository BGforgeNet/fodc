import { readFileSync } from 'fs';

// Map source names to our output names
const nameMap: Record<string, string> = {
    '.223 FMJ': '.223 FMJ',
    '.223 AP': '.223 AP',
    '.44 Magnum FMJ': '.44 Magnum FMJ',
    '.44 Magnum JHP': '.44 Magnum JHP',
    '.45 Caliber': '.45 caliber',
    '2mm EC': '2mm EC',
    '4.7mm Caseless': '4.7mm caseless',
    '5mm AP': '5mm AP',
    '5mm JHP': '5mm JHP',
    '7.62mm FMJ': '7.62mm',
    '7.62mm AP': '7.62mm AP',
    '9mm AP': '9mm AP',
    '9mm ball': '9mm ball',
    '10mm AP': '10mm AP',
    '10mm JHP': '10mm JHP',
    '14mm AP': '14mm AP',
    '14mm JHP': '14mm JHP',
    "BB's": 'BBs',
    '12 ga. Buckshot': '12 gauge shotgun shells',
    '12 ga. Slugs': '12 ga. Slugs',
    '12 ga. Dragon Breath': '12 ga. Dragon Breath',
    'Explosive Rocket': 'Explosive rocket',
    'Rocket AP': 'Rocket AP',
    'Flamethrower Fuel': 'Flamethrower fuel',
    'Flamethrower Fuel MKII': 'Flamethrower fuel Mk II',
    'HN Needler Cartridge': 'HN Needler cartridge',
    'HN AP Needler Cartridge': 'HN AP Needler cartridge',
    'Micro Fusion Cell': 'Microfusion cell',
    'Small Energy Cell': 'Small energy cell',
    '.50 BMG': '.50 BMG',
    '40mm HE Grenades': '40mm HE',
    '40mm IC Grenades': '40mm IC',
};

// Caliber mapping
const caliberMap: Record<string, string> = {
    '.223 [5]': '.223',
    '.44 cal [9]': '.44',
    '.45 cal [14]': '.45',
    '2mm [15]': '2mm',
    '4.7mm caseless [16]': '4.7mm',
    '5mm [6]': '5mm',
    '7.62mm [18]': '7.62mm',
    '9mm [12]': '9mm',
    '10mm [8]': '10mm',
    '14mm [10]': '14mm',
    'None [0]': 'BBs',
    '12-gauge [11]': '12ga',
    'Rocket [1]': 'Rocket',
    'Flamethrower Fuel [2]': 'Flamer',
    'HN needler [17]': 'Needler',
    'D Energy Cell [4]': 'MFC',
    'C Energy Cell [3]': 'SEC',
    '.50 cal [19]': '.50',
    '40mm grenade [20]': '40mm',
};

// Sort order matching vanilla
const sortOrder: string[] = [
    '.223 FMJ',
    '.223 AP',
    '.44 Magnum FMJ',
    '.44 Magnum JHP',
    '.45 caliber',
    '2mm EC',
    '4.7mm caseless',
    '5mm AP',
    '5mm JHP',
    '7.62mm',
    '7.62mm AP',
    '9mm AP',
    '9mm ball',
    '10mm AP',
    '10mm JHP',
    '14mm AP',
    '14mm JHP',
    'BBs',
    '12 gauge shotgun shells',
    '12 ga. Slugs',
    '12 ga. Dragon Breath',
    'Explosive rocket',
    'Rocket AP',
    'Flamethrower fuel',
    'Flamethrower fuel Mk II',
    'HN Needler cartridge',
    'HN AP Needler cartridge',
    'Microfusion cell',
    'Small energy cell',
    '.50 BMG',
    '40mm HE',
    '40mm IC',
];

// Damage type based on caliber
const dmgTypeMap: Record<string, string> = {
    'Rocket': 'explosive',
    'Flamer': 'fire',
    'MFC': 'laser',
    'SEC': 'laser',
};

const input = readFileSync(process.argv[2] ?? '/dev/stdin', 'utf-8');
const lines = input.trim().split('\n');

interface AmmoEntry {
    name: string;
    caliber: string;
    acMod: number;
    drMod: number;
    dmgMod: number;
    dmgType: string;
}

const ammoEntries: AmmoEntry[] = [];

for (const line of lines.slice(1)) {
    const cols = line.split(';');
    if (cols.length < 9) continue;

    const srcName = cols[2] ?? '';
    const outName = nameMap[srcName];
    if (!outName) continue;

    const srcCaliber = cols[4] ?? '';
    const caliber = caliberMap[srcCaliber] ?? srcCaliber;
    const acMod = parseInt(cols[5] ?? '0', 10);
    const drMod = parseInt(cols[6] ?? '0', 10);
    const damMult = parseInt(cols[7] ?? '1', 10);
    const damDiv = parseInt(cols[8] ?? '1', 10);
    const dmgMod = damMult / damDiv;
    const dmgType = dmgTypeMap[caliber] ?? '';

    ammoEntries.push({ name: outName, caliber, acMod, drMod, dmgMod, dmgType });
}

// Sort by predefined order
ammoEntries.sort((a, b) => {
    const aIdx = sortOrder.indexOf(a.name);
    const bIdx = sortOrder.indexOf(b.name);
    if (aIdx === -1 && bIdx === -1) return 0;
    if (aIdx === -1) return 1;
    if (bIdx === -1) return -1;
    return aIdx - bIdx;
});

console.log('Name,Caliber,AC mod,DR mod,DMG mod,DMG type');
for (const ammo of ammoEntries) {
    // Format dmgMod: show as fraction or integer
    let dmgModStr: string;
    if (ammo.dmgMod === Math.floor(ammo.dmgMod)) {
        dmgModStr = ammo.dmgMod.toString();
    } else {
        dmgModStr = ammo.dmgMod.toFixed(2).replace(/\.?0+$/, '');
    }
    console.log(`${ammo.name},${ammo.caliber},${ammo.acMod},${ammo.drMod},${dmgModStr},${ammo.dmgType}`);
}
