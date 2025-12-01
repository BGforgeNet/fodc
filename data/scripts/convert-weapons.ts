import { readFileSync } from 'fs';

// Map source names to our output names (only include weapons we want)
const nameMap: Record<string, string> = {
    '10mm SMG': '10mm SMG',
    '.223 Pistol': '.223 pistol',
    '9mm Mauser': '9mm Mauser',
    '10mm Pistol': '10mm pistol',
    '14mm Pistol': '14mm pistol',
    'Desert Eagle .44': 'Desert Eagle .44',
    '.44 Magnum Revolver': '.44 Magnum revolver',
    'Needler Pistol': 'Needler pistol',
    'PPK12 Gauss Pistol': 'Gauss pistol',
    'Zip Gun': 'Zip gun',
    'Tommy Gun': 'Tommy gun',
    'M3A1 "Grease Gun" SMG': 'M3A1 Grease Gun SMG',
    'H&K P90c': 'H&K P90c',
    'H&K G11': 'H&K G11',
    'H&K G11E': 'H&K G11E',
    'Assault Rifle': 'Assault rifle',
    'XL70E3': 'XL70E3',
    'FN FAL': 'FN FAL',
    'FN FAL HPFA': 'FN FAL HPFA',
    'Hunting Rifle': 'Hunting rifle',
    'Pipe Rifle': 'Pipe rifle',
    'Red Ryder BB Gun': 'Red Ryder BB gun',
    'Red Ryder LE BB Gun': 'Red Ryder LE BB gun',
    'Sniper Rifle': 'Sniper rifle',
    'M72 Gauss Rifle': 'Gauss rifle',
    'Combat Shotgun': 'Combat shotgun',
    'H&K CAWS': 'H&K CAWS',
    'Pancor Jackhammer': 'Pancor Jackhammer',
    'Shotgun': 'Shotgun',
    'Sawed-Off Shotgun': 'Sawed-off shotgun',
    'Minigun': 'Minigun',
    'Avenger Minigun': 'Avenger minigun',
    'Vindicator Minigun': 'Vindicator minigun',
    'Bozar': 'Bozar',
    'Bozar AMR': 'Bozar', // EcCo renamed
    'Light Support Weapon': 'Light support weapon',
    'M60': 'M60',
    'Flamer': 'Flamer',
    'Rocket Launcher': 'Rocket launcher',
    'Alien Blaster': 'Alien blaster',
    'Laser Pistol': 'Laser pistol',
    'Magneto-Laser Pistol': 'Magneto-laser pistol',
    'Plasma Pistol': 'Plasma pistol',
    'YK32 Pulse Pistol': 'Pulse pistol',
    'Gatling Laser': 'Gatling laser',
    'Laser Rifle': 'Laser rifle',
    'Plasma Rifle': 'Plasma rifle',
    'Turbo Plasma Rifle': 'Turbo plasma rifle',
    'YK42B Pulse Rifle': 'Pulse rifle',
    // EcCo variants
    '.44 Magnum (Speed Load)': '.44 Magnum (Speed Load)',
    'Desert Eagle (Exp. Mag.)': 'Desert Eagle (Exp. Mag.)',
    'Assault Rifle (Exp. Mag.)': 'Assault rifle (Exp. Mag.)',
    'FN FAL (Night Sight)': 'FN FAL (Night Sight)',
    'Scoped Hunting Rifle': 'Scoped Hunting rifle',
    'Laser Rifle (Ext. Cap.)': 'Laser rifle (Ext. Cap.)',
    'Plasma Pistol (Ext. Cap.)': 'Plasma pistol (Ext. Cap.)',
    'Improved Flamer': 'Improved Flamer',
    // EcCo new weapons
    '9mm SMG': '9mm SMG',
    'Grenade Launcher': 'Grenade launcher',
    'MGL': 'MGL',
    'Cowboy Repeater': 'Cowboy repeater',
    '14mm SMG': '14mm SMG',
    'Incinerator': 'Incinerator',
    'Makeshift Laser Pistol': 'Makeshift laser pistol',
};

// Caliber mapping
const caliberMap: Record<string, string> = {
    '10mm': '10mm',
    '10mm [8]': '10mm',
    '.223': '.223',
    '.223 [5]': '.223',
    'Flamethrower Fuel': 'Flamer',
    'Flamethrower Fuel [2]': 'Flamer',
    '5mm': '5mm',
    '5mm [6]': '5mm',
    'Rocket': 'Rocket',
    'Rocket [1]': 'Rocket',
    'D Energy Cell': 'MFC',
    'D Energy Cell [4]': 'MFC',
    'C Energy Cell': 'SEC',
    'C Energy Cell [3]': 'SEC',
    '.44 cal': '.44',
    '.44 cal [9]': '.44',
    '14mm': '14mm',
    '14mm [10]': '14mm',
    '12-gauge': '12ga',
    '12-gauge [11]': '12ga',
    '9mm': '9mm',
    '9mm [12]': '9mm',
    '.45 cal': '.45',
    '.45 cal [14]': '.45',
    '4.7mm caseless': '4.7mm',
    '4.7mm caseless [16]': '4.7mm',
    '7.62mm': '7.62mm',
    '7.62mm [18]': '7.62mm',
    'HN needler': 'Needler',
    'HN needler [17]': 'Needler',
    '2mm': '2mm',
    '2mm [15]': '2mm',
    'None': 'BBs',
    'None [0]': 'BBs',
    '.50 cal [19]': '.50',
    '40mm grenade [20]': '40mm',
};

// Damage type mapping
const dmgTypeMap: Record<string, string> = {
    'Normal': '',
    'Fire': 'fire',
    'Explode': 'explosive',
    'Plasma': 'plasma',
    'Laser': 'laser',
    'Electrical': 'electrical',
    'EMP': 'emp',
};

// Weapons that are burst-only (hardcoded since CSV doesn't reliably indicate this)
const burstOnlyWeapons = new Set([
    'Minigun',
    'Avenger Minigun',
    'Vindicator Minigun',
    'Gatling Laser',
    'Bozar',
    'Light Support Weapon',
    'M60',
]);

// Weapons that DON'T have burst (even if CSV shows rounds > 1 for secondary attack)
const noBurstWeapons = new Set([
    'Laser Rifle',
    'Laser Rifle (Ext. Cap.)',
    'Shotgun',
]);

const input = readFileSync(process.argv[2] ?? 'weapon_vanilla.csv', 'utf-8');
const lines = input.trim().split('\n');
const header = lines[0] ?? '';

// Detect format: EcCo has "Attack Primary" column, vanilla has "Range Primary Attack"
const isEcCoFormat = header.includes(';Attack Primary;');

console.log('Name,Caliber,Min DMG,Max DMG,DMG type,Burst,Burst only,Penetrate');

for (const line of lines.slice(1)) {
    // Skip fully commented lines (those starting with # without data)
    // Lines like "#;00000004.pro;..." are valid data rows in vanilla format
    if (line.startsWith('#') && !line.startsWith('#;')) continue;

    const cols = line.split(';');

    let name: string, dmgType: string, minDmg: string, maxDmg: string;
    let burstRounds: number, caliber: string, perk: string;
    let attackPrimary: string, attackSecondary: string;

    if (isEcCoFormat) {
        // EcCo format: Import;ProFILE;NAME;PID;Damage Type;Min Damage;Max Damage;Attack Primary;Attack Secondary;Range Primary;...;Burst Rounds;Caliber;...;Perk
        // Data rows start with ; so first column (Import) is empty
        // Indices (0-based): 0=Import, 1=ProFILE, 2=NAME, 3=PID, 4=DamageType, 5=MinDmg, 6=MaxDmg, 7=AttackPri, 8=AttackSec,
        //                    9=RangePri, 10=RangeSec, 11=APPri, 12=APSec, 13=MaxAmmo, 14=BurstRounds, 15=Caliber, 16=AmmoPID,
        //                    17=MinStr, 18=Cost, 19=Weight, 20=Perk
        // But data rows have ; at start, so they're shifted by 1
        const shift = cols[0] === '' ? 0 : -1; // If first col is empty, we're aligned with header
        name = cols[2 + shift] ?? '';
        dmgType = cols[4 + shift] ?? '';
        minDmg = cols[5 + shift] ?? '';
        maxDmg = cols[6 + shift] ?? '';
        attackPrimary = cols[7 + shift] ?? '';
        attackSecondary = cols[8 + shift] ?? '';
        burstRounds = parseInt(cols[14 + shift] ?? '0', 10);
        caliber = cols[15 + shift] ?? '';
        perk = cols[20 + shift] ?? '';
    } else {
        // Vanilla format: Import;ProFILE;NAME;Damage Type;Min Damage;Max Damage;Range Primary;...;Rounds Brust;Caliber;...;Perk
        name = cols[2] ?? '';
        dmgType = cols[3] ?? '';
        minDmg = cols[4] ?? '';
        maxDmg = cols[5] ?? '';
        attackPrimary = ''; // Not available in vanilla format
        attackSecondary = '';
        burstRounds = parseInt(cols[11] ?? '0', 10);
        caliber = cols[12] ?? '';
        perk = cols[16] ?? '';
    }

    const outName = nameMap[name];
    if (!outName) continue; // Skip weapons not in our map

    const outCaliber = caliberMap[caliber] ?? caliber;
    const outDmgType = dmgTypeMap[dmgType] ?? '';

    // Handle burst - weapon has burst if primary or secondary attack is "Burst"
    let hasBurst: boolean;
    if (isEcCoFormat) {
        hasBurst = burstRounds > 1 && (attackPrimary === 'Burst' || attackSecondary === 'Burst');
    } else {
        hasBurst = burstRounds > 1 && !noBurstWeapons.has(name);
    }
    const burst = hasBurst ? burstRounds.toString() : '';

    // Burst-only: in EcCo format, check if primary attack is Burst (means no single-shot option)
    let burstOnly: string;
    if (isEcCoFormat) {
        burstOnly = attackPrimary === 'Burst' ? 'true' : '';
    } else {
        burstOnly = burstOnlyWeapons.has(name) ? 'true' : '';
    }

    const penetrate = perk.includes('Penetrate') ? 'true' : '';

    console.log(`${outName},${outCaliber},${minDmg},${maxDmg},${outDmgType},${burst},${burstOnly},${penetrate}`);
}
