import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { ModData } from './types';

const readCSV = (filePath: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};



const parseIntStrict = (value: string): number => {
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Unable to parse value: ${value}`);
  }
  return parsed;
};

const parseMods = async (modsDir: string): Promise<ModData> => {
  const modData: ModData = { mods: {} };

  const modDirs = fs.readdirSync(modsDir).filter(dir => fs.statSync(path.join(modsDir, dir)).isDirectory());

  for (const dir of modDirs) {
    const modDirPath = path.join(modsDir, dir);
    const modName = path.basename(modDirPath);

    const ammoData = await readCSV(path.join(modDirPath, 'ammo.csv'));
    const ammo = ammoData.map((item: any) => ({
      name: item.Name,
      caliber: item.Caliber,
      ac_mod: parseIntStrict(item['AC mod']),
      dr_mod: parseIntStrict(item['DR mod']),
      dmg_mod: parseFloat(item['DMG mod']),
      dmg_type: item['DMG type'] || 'normal',
    }));

    const armorData = await readCSV(path.join(modDirPath, 'armor.csv'));
    const armor = armorData.map((item: any) => ({
      name: item.Name,
      dr: parseIntStrict(item.DR),
      dt: parseIntStrict(item.DT),
      dr_fire: item['DR fire'] ? parseInt(item['DR fire']) : 0,
      dt_fire: item['DT fire'] ? parseInt(item['DT fire']) : 0,
      dr_plasma: item['DR plasma'] ? parseInt(item['DR plasma']) : 0,
      dt_plasma: item['DT plasma'] ? parseInt(item['DT plasma']) : 0,
      dr_laser: item['DR laser'] ? parseInt(item['DR laser']) : 0,
      dt_laser: item['DT laser'] ? parseInt(item['DT laser']) : 0,
    }));

    const weaponData = await readCSV(path.join(modDirPath, 'weapons.csv'));
    const weapons = weaponData.map((item: any) => ({
      name: item.Name,
      caliber: item.Caliber,
      min_dmg: parseIntStrict(item['Min DMG']),
      max_dmg: parseIntStrict(item['Max DMG']),
      dmg_type: item['DMG type'] || 'normal',
    }));

    modData.mods[modName] = { ammo, armor, weapons };
  }

  return modData;
};

const saveJSON = (data: any, outputPath: string) => {
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
