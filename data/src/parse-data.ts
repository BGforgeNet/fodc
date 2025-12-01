import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { ModData } from './types';

// CSV row type - all values are strings from the parser
type CsvRow = Record<string, string>;

const readCSV = (filePath: string): Promise<CsvRow[]> => {
    return new Promise((resolve, reject) => {
        const results: CsvRow[] = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data: CsvRow) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
};

const readCSVIfExists = async (filePath: string): Promise<CsvRow[] | null> => {
    if (fs.existsSync(filePath)) {
        return await readCSV(filePath);
    }
    return null;
};

const parseIntStrict = (value: string): number => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        throw new Error(`Unable to parse value: ${value}`);
    }
    return parsed;
};

const parseAmmo = (item: CsvRow) => ({
    name: item['Name'] ?? '',
    caliber: item['Caliber'] ?? '',
    ac_mod: parseIntStrict(item['AC mod'] ?? '0'),
    dr_mod: parseIntStrict(item['DR mod'] ?? '0'),
    dmg_mod: parseFloat(item['DMG mod'] ?? '1'),
    dmg_type: item['DMG type'] || 'normal',
});

const parseArmor = (item: CsvRow) => ({
    name: item['Name'] ?? '',
    abbrev: item['Abbrev'] || '',
    dr: parseIntStrict(item['DR'] ?? '0'),
    dt: parseIntStrict(item['DT'] ?? '0'),
    dr_fire: item['DR fire'] ? parseInt(item['DR fire']) : 0,
    dt_fire: item['DT fire'] ? parseInt(item['DT fire']) : 0,
    dr_plasma: item['DR plasma'] ? parseInt(item['DR plasma']) : 0,
    dt_plasma: item['DT plasma'] ? parseInt(item['DT plasma']) : 0,
    dr_laser: item['DR laser'] ? parseInt(item['DR laser']) : 0,
    dt_laser: item['DT laser'] ? parseInt(item['DT laser']) : 0,
});

const parseWeapon = (item: CsvRow) => ({
    name: item['Name'] ?? '',
    caliber: item['Caliber'] ?? '',
    min_dmg: parseIntStrict(item['Min DMG'] ?? '0'),
    max_dmg: parseIntStrict(item['Max DMG'] ?? '0'),
    dmg_type: item['DMG type'] || 'normal',
    burst: item['Burst'] ? parseInt(item['Burst']) : undefined,
    burst_only: item['Burst only'] === 'true',
    penetrate: item['Penetrate'] === 'true',
});

const parseMods = async (modsDir: string): Promise<ModData> => {
    const modData: ModData = { mods: {} };

    const modDirs = fs.readdirSync(modsDir).filter((dir) => fs.statSync(path.join(modsDir, dir)).isDirectory());

    // Parse vanilla first (required)
    const vanillaPath = path.join(modsDir, 'vanilla');
    if (!fs.existsSync(vanillaPath)) {
        throw new Error('vanilla mod directory is required');
    }

    const vanillaAmmoData = await readCSV(path.join(vanillaPath, 'ammo.csv'));
    const vanillaAmmo = vanillaAmmoData.map(parseAmmo);

    const vanillaArmorData = await readCSV(path.join(vanillaPath, 'armor.csv'));
    const vanillaArmor = vanillaArmorData.map(parseArmor);

    const vanillaWeaponData = await readCSV(path.join(vanillaPath, 'weapons.csv'));
    const vanillaWeapons = vanillaWeaponData.map(parseWeapon);

    modData.mods['vanilla'] = { ammo: vanillaAmmo, armor: vanillaArmor, weapons: vanillaWeapons };

    // Parse other mods with fallback to vanilla
    for (const dir of modDirs) {
        const modName = path.basename(dir);
        if (modName === 'vanilla') continue;

        const modDirPath = path.join(modsDir, dir);

        // Try to read each CSV, fallback to vanilla if missing
        const ammoData = await readCSVIfExists(path.join(modDirPath, 'ammo.csv'));
        const ammo = ammoData ? ammoData.map(parseAmmo) : vanillaAmmo;

        const armorData = await readCSVIfExists(path.join(modDirPath, 'armor.csv'));
        const armor = armorData ? armorData.map(parseArmor) : vanillaArmor;

        const weaponData = await readCSVIfExists(path.join(modDirPath, 'weapons.csv'));
        const weapons = weaponData ? weaponData.map(parseWeapon) : vanillaWeapons;

        modData.mods[modName] = { ammo, armor, weapons };
    }

    return modData;
};

const saveJSON = (data: ModData, outputPath: string) => {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
};

const main = async () => {
    const modsDir = process.argv[2];
    const outputDir = process.argv[3];

    if (!modsDir || !outputDir) {
        console.error('Usage: node parse-data.js <modsDir> <outputDir>');
        process.exit(1);
    }

    const outputPath = path.join(outputDir, 'data.json');

    const modData = await parseMods(modsDir);
    saveJSON(modData, outputPath);

    console.log('Data saved to', outputPath);
};

main().catch((error) => console.error('Error:', error));
