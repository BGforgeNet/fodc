import { useState } from 'react';
import { ModData } from './types';
import { DamageMode } from './chartUtils';
import DamageTable from './components/DamageTable';
import DamageChart from './components/DamageChart';
import CompareWeaponsChart, { WeaponEntry } from './components/CompareWeaponsChart';
import CaliberChart from './components/CaliberChart';
import SearchableSelect from './components/SearchableSelect';
import { DamageModeButtons, FireModeSelector, PointBlankCheckbox, CriticalControls, BonusRangedDamage } from './components/ChartControls';
import { modOrder, modConfigs } from './modConfig';
import { weaponIcons } from './icons/weaponIcons';
import { ammoIcons } from './icons/ammoIcons';
import styles from './App.module.css';
import modData from '../data/out/data.json';

const App = () => {
    const data = modData as ModData;
    const [activeTab, setActiveTab] = useState<'mods' | 'caliber' | 'any-to-any' | 'tables'>('mods');
    const [damageMode, setDamageMode] = useState<DamageMode>('average');
    const [selectedWeapon, setSelectedWeapon] = useState<string>('10mm pistol');
    const [selectedAmmo, setSelectedAmmo] = useState<string>('10mm AP');
    const [hiddenMods, setHiddenMods] = useState<Set<string>>(new Set());
    const [burst, setBurst] = useState(false);
    const [pointBlank, setPointBlank] = useState(false);
    const [criticalHit, setCriticalHit] = useState(false);
    const [bonusRangedDamage, setBonusRangedDamage] = useState(0);

    // Compare weapons state
    const [weaponEntries, setWeaponEntries] = useState<WeaponEntry[]>([]);
    const [cwModId, setCwModId] = useState<string>('vanilla');
    const [cwWeapon, setCwWeapon] = useState<string>('');
    const [cwAmmo, setCwAmmo] = useState<string>('');
    const [cwHiddenItems, setCwHiddenItems] = useState<Set<string>>(new Set());

    // Caliber tab state
    const vanillaMod = data.mods['vanilla'];
    const defaultCaliber = vanillaMod?.weapons[0]?.caliber ?? '';
    const [calModId, setCalModId] = useState<string>('vanilla');
    const [calCaliber, setCalCaliber] = useState<string>(defaultCaliber);
    const [calHiddenItems, setCalHiddenItems] = useState<Set<string>>(new Set());
    const [calHiddenAmmo, setCalHiddenAmmo] = useState<Set<string>>(new Set());
    const [calHiddenWeapons, setCalHiddenWeapons] = useState<Set<string>>(new Set());
    const weapons = vanillaMod?.weapons ?? [];
    const weapon = weapons.find((w) => w.name === selectedWeapon);

    // Filter ammo by weapon caliber
    const compatibleAmmo = vanillaMod?.ammo.filter((a) => a.caliber === weapon?.caliber) ?? [];

    // Compute effective ammo - use selected if compatible, otherwise first compatible
    const currentAmmoValid = compatibleAmmo.some((a) => a.name === selectedAmmo);
    const effectiveAmmo = currentAmmoValid ? selectedAmmo : compatibleAmmo[0]?.name ?? '';

    // Burst: force enabled for burst-only weapons, otherwise use burst state
    const hasBurst = weapon?.burst !== undefined;
    const isBurstOnly = weapon?.burst_only === true;
    const effectiveBurst = isBurstOnly || (hasBurst && burst);

    // Handler for weapon change - also updates ammo and burst if needed
    const handleWeaponChange = (newWeapon: string) => {
        setSelectedWeapon(newWeapon);
        const newWeaponData = weapons.find((w) => w.name === newWeapon);
        if (newWeaponData) {
            // Update ammo if current selection is incompatible
            const newCompatibleAmmo = vanillaMod?.ammo.filter((a) => a.caliber === newWeaponData.caliber) ?? [];
            if (!newCompatibleAmmo.some((a) => a.name === selectedAmmo)) {
                setSelectedAmmo(newCompatibleAmmo[0]?.name ?? '');
            }
            // Update burst if needed
            const newHasBurst = newWeaponData.burst !== undefined;
            const newIsBurstOnly = newWeaponData.burst_only === true;
            if (newIsBurstOnly && !burst) {
                setBurst(true);
            } else if (!newHasBurst && burst) {
                setBurst(false);
            }
        }
    };

    // Compare weapons: get weapons and ammo for selected mod
    const cwMod = data?.mods[cwModId];
    const cwWeapons = cwMod?.weapons ?? [];
    const cwSelectedWeapon = cwWeapons.find((w) => w.name === cwWeapon);
    const cwCompatibleAmmo = cwMod?.ammo.filter((a) => a.caliber === cwSelectedWeapon?.caliber) ?? [];

    // Handler for any-to-any mod change
    const handleCwModChange = (newModId: string) => {
        setCwModId(newModId);
        const newMod = data?.mods[newModId];
        const newWeapons = newMod?.weapons ?? [];
        if (newWeapons.length > 0 && !newWeapons.some((w) => w.name === cwWeapon)) {
            // Weapon doesn't exist in new mod - switch to first weapon
            const firstWeapon = newWeapons[0];
            setCwWeapon(firstWeapon?.name ?? '');
            const newAmmo = newMod?.ammo.filter((a) => a.caliber === firstWeapon?.caliber) ?? [];
            setCwAmmo(newAmmo[0]?.name ?? '');
        } else {
            // Weapon exists - check if current ammo exists in new mod
            const currentWeapon = newWeapons.find((w) => w.name === cwWeapon);
            const compatibleAmmo = newMod?.ammo.filter((a) => a.caliber === currentWeapon?.caliber) ?? [];
            if (!compatibleAmmo.some((a) => a.name === cwAmmo)) {
                setCwAmmo(compatibleAmmo[0]?.name ?? '');
            }
        }
    };

    // Handler for any-to-any weapon change
    const handleCwWeaponChange = (newWeapon: string) => {
        setCwWeapon(newWeapon);
        const newWeaponData = cwWeapons.find((w) => w.name === newWeapon);
        if (newWeaponData) {
            const newAmmo = cwMod?.ammo.filter((a) => a.caliber === newWeaponData.caliber) ?? [];
            if (!newAmmo.some((a) => a.name === cwAmmo)) {
                setCwAmmo(newAmmo[0]?.name ?? '');
            }
        }
    };

    const isDuplicateEntry = weaponEntries.some(
        (e) => e.modId === cwModId && e.weaponName === cwWeapon && e.ammoName === cwAmmo
    );

    // Caliber tab: get calibers, weapons and ammo for selected mod
    const calMod = data?.mods[calModId];
    const calCalibers = [...new Set(calMod?.weapons.map((w) => w.caliber) ?? [])];
    const calWeaponList = calMod?.weapons.filter((w) => w.caliber === calCaliber) ?? [];
    const calAmmoList = calMod?.ammo.filter((a) => a.caliber === calCaliber) ?? [];

    // Build mapping of caliber -> ammo icons for dropdown
    const caliberAmmoIcons: Record<string, { src: string; title: string }[]> = {};
    for (const caliber of calCalibers) {
        const ammoForCaliber = calMod?.ammo.filter((a) => a.caliber === caliber) ?? [];
        const icons = ammoForCaliber
            .filter((a) => ammoIcons[a.name])
            .map((a) => {
                const drMod = a.dr_mod === 0 ? '0' : `${a.dr_mod > 0 ? '+' : ''}${a.dr_mod}%`;
                const dmgMod = a.dmg_mult === a.dmg_div ? `${a.dmg_mult}` : `${a.dmg_mult}/${a.dmg_div}`;
                const typeLine = a.dmg_type && a.dmg_type !== 'normal' ? `\nType: ${a.dmg_type}` : '';
                return { src: ammoIcons[a.name]!, title: `${a.name}\nDR mod: ${drMod}\nDMG mod: ${dmgMod}${typeLine}` };
            });
        if (icons.length > 0) {
            caliberAmmoIcons[caliber] = icons;
        }
    }

    // Handler for caliber mod change
    const handleCalModChange = (newModId: string) => {
        setCalModId(newModId);
        const newMod = data?.mods[newModId];
        const newCalibers = [...new Set(newMod?.weapons.map((w) => w.caliber) ?? [])];
        const effectiveCaliber = newCalibers.includes(calCaliber) ? calCaliber : (newCalibers[0] ?? '');
        if (effectiveCaliber !== calCaliber) {
            setCalCaliber(effectiveCaliber);
        }
        // Only remove hidden items that don't exist in new mod's caliber
        const newWeaponNames = new Set(newMod?.weapons.filter((w) => w.caliber === effectiveCaliber).map((w) => w.name) ?? []);
        const newAmmoNames = new Set(newMod?.ammo.filter((a) => a.caliber === effectiveCaliber).map((a) => a.name) ?? []);
        setCalHiddenWeapons((prev) => new Set([...prev].filter((name) => newWeaponNames.has(name))));
        setCalHiddenAmmo((prev) => new Set([...prev].filter((name) => newAmmoNames.has(name))));
    };

    // Handler for toggling ammo visibility
    const toggleCalAmmoVisibility = (ammoName: string) => {
        setCalHiddenAmmo((prev) => {
            const next = new Set(prev);
            if (next.has(ammoName)) {
                next.delete(ammoName);
            } else {
                next.add(ammoName);
            }
            return next;
        });
    };

    // Handler for toggling weapon visibility
    const toggleCalWeaponVisibility = (weaponName: string) => {
        setCalHiddenWeapons((prev) => {
            const next = new Set(prev);
            if (next.has(weaponName)) {
                next.delete(weaponName);
            } else {
                next.add(weaponName);
            }
            return next;
        });
    };

    const addWeaponEntry = () => {
        if (!cwWeapon || !cwAmmo || isDuplicateEntry) return;
        const id = `${cwModId}-${cwWeapon}-${cwAmmo}-${Date.now()}`;
        setWeaponEntries([...weaponEntries, { id, modId: cwModId, weaponName: cwWeapon, ammoName: cwAmmo }]);
    };

    const removeWeaponEntry = (id: string) => {
        setWeaponEntries(weaponEntries.filter((e) => e.id !== id));
    };

    return (
        <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center my-4">
                <div className={styles.headerSpacer}></div>
                <h1 className={`text-center mb-0 ${styles.title}`}>Fallout 2 Damage Calculator</h1>
                <div className={`d-flex align-items-center gap-1 ${styles.poweredBy}`}>
                    <span className="text-muted">Powered by</span>
                    <a href="https://bgforge.net" target="_blank" rel="noopener noreferrer" className={`d-flex align-items-center gap-1 ${styles.bgforgeLink}`}>
                        <span>BGforge</span>
                        <img src="/logo/bgforge.svg" alt="BGforge" className={styles.bgforgeLogo} />
                    </a>
                </div>
            </div>

            <ul className="nav nav-tabs mb-4 justify-content-center">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'mods' ? 'active' : ''}`}
                                onClick={() => setActiveTab('mods')}
                            >
                                Mods
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'caliber' ? 'active' : ''}`}
                                onClick={() => setActiveTab('caliber')}
                            >
                                Caliber
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'any-to-any' ? 'active' : ''}`}
                                onClick={() => setActiveTab('any-to-any')}
                            >
                                Any to any
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'tables' ? 'active' : ''}`}
                                onClick={() => setActiveTab('tables')}
                            >
                                Tables
                            </button>
                        </li>
                    </ul>

                    {activeTab === 'mods' && (
                        <>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <SearchableSelect
                                        options={weapons.map((w) => w.name)}
                                        value={selectedWeapon}
                                        onChange={handleWeaponChange}
                                    />
                                </div>
                                <div className="col-auto d-flex align-items-center gap-2">
                                    <div className={styles.weaponIconPlaceholder}>
                                        {weaponIcons[selectedWeapon] && (
                                            <img
                                                src={weaponIcons[selectedWeapon]}
                                                alt={selectedWeapon}
                                                title={selectedWeapon}
                                                className={styles.weaponIcon}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.ammoIconPlaceholder}>
                                        {ammoIcons[effectiveAmmo] && (
                                            <img
                                                src={ammoIcons[effectiveAmmo]}
                                                alt={effectiveAmmo}
                                                title={effectiveAmmo}
                                                className={styles.ammoIcon}
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <select
                                        className={`form-select ${styles.ammoSelect}`}
                                        value={effectiveAmmo}
                                        onChange={(e) => setSelectedAmmo(e.target.value)}
                                        disabled={compatibleAmmo.length <= 1}
                                    >
                                        {compatibleAmmo.map((a) => (
                                            <option key={a.name} value={a.name}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <DamageModeButtons mode={damageMode} onChange={setDamageMode} />
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <FireModeSelector
                                        burst={burst}
                                        onChange={setBurst}
                                        hasBurst={hasBurst}
                                        isBurstOnly={isBurstOnly}
                                        idPrefix="cm"
                                    />
                                </div>
                                <PointBlankCheckbox
                                    checked={pointBlank}
                                    onChange={setPointBlank}
                                    disabled={false}
                                    idPrefix="cm"
                                />
                                <CriticalControls
                                    critical={criticalHit}
                                    onCriticalChange={setCriticalHit}
                                    idPrefix="cm"
                                />
                                <BonusRangedDamage value={bonusRangedDamage} onChange={setBonusRangedDamage} />
                            </div>
                            <DamageChart
                                weaponName={selectedWeapon}
                                ammoName={effectiveAmmo}
                                data={data}
                                mode={damageMode}
                                hiddenMods={hiddenMods}
                                onHiddenModsChange={setHiddenMods}
                                burst={effectiveBurst}
                                pointBlank={pointBlank}
                                critical={criticalHit}
                                rangedBonus={bonusRangedDamage * 2}
                            />
                        </>
                    )}

                    {activeTab === 'caliber' && (
                        <>
                            <div className={`d-flex mb-3 align-items-center justify-content-center ${styles.caliberRow}`}>
                                <div className="d-flex align-items-center gap-3">
                                    <select
                                        className={`form-select ${styles.caliberModSelect}`}
                                        value={calModId}
                                        onChange={(e) => handleCalModChange(e.target.value)}
                                    >
                                        {modOrder.map((modId) => (
                                            <option key={modId} value={modId}>
                                                {modConfigs[modId]?.name}
                                            </option>
                                        ))}
                                    </select>
                                    <SearchableSelect
                                        options={calCalibers}
                                        value={calCaliber}
                                        onChange={setCalCaliber}
                                        narrow
                                        optionIcons={caliberAmmoIcons}
                                    />
                                </div>
                                <div className={`d-flex align-items-center gap-2 ${styles.caliberAmmoIcons}`}>
                                    {calAmmoList.map((a) => {
                                        const isHidden = calHiddenAmmo.has(a.name);
                                        const canToggle = calAmmoList.length > 1;
                                        const drMod = a.dr_mod === 0 ? '0' : `${a.dr_mod > 0 ? '+' : ''}${a.dr_mod}%`;
                                        const dmgMod = a.dmg_mult === a.dmg_div ? `${a.dmg_mult}` : `${a.dmg_mult}/${a.dmg_div}`;
                                        const typeLine = a.dmg_type && a.dmg_type !== 'normal' ? `\nType: ${a.dmg_type}` : '';
                                        const ammoTooltip = `${a.name}\nDR mod: ${drMod}\nDMG mod: ${dmgMod}${typeLine}`;
                                        return ammoIcons[a.name] ? (
                                            <div
                                                key={a.name}
                                                className={`${styles.ammoIconPlaceholder} ${styles.clickable} ${isHidden ? styles.hidden : ''}`}
                                                title={ammoTooltip}
                                                onClick={canToggle ? () => toggleCalAmmoVisibility(a.name) : undefined}
                                            >
                                                <img
                                                    src={ammoIcons[a.name]}
                                                    alt={a.name}
                                                    className={styles.ammoIcon}
                                                />
                                            </div>
                                        ) : (
                                            <span
                                                key={a.name}
                                                className={`badge ${isHidden ? 'bg-secondary' : 'bg-success'} ${styles.clickable} ${isHidden ? styles.hiddenBadge : ''}`}
                                                title={ammoTooltip}
                                                onClick={canToggle ? () => toggleCalAmmoVisibility(a.name) : undefined}
                                            >
                                                {a.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <DamageModeButtons mode={damageMode} onChange={setDamageMode} />
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <FireModeSelector
                                        burst={burst}
                                        onChange={setBurst}
                                        hasBurst={true}
                                        isBurstOnly={false}
                                        idPrefix="cal"
                                    />
                                </div>
                                <PointBlankCheckbox
                                    checked={pointBlank}
                                    onChange={setPointBlank}
                                    disabled={false}
                                    idPrefix="cal"
                                />
                                <CriticalControls
                                    critical={criticalHit}
                                    onCriticalChange={setCriticalHit}
                                    idPrefix="cal"
                                />
                                <BonusRangedDamage value={bonusRangedDamage} onChange={setBonusRangedDamage} />
                            </div>
                            <div className="row mb-3 justify-content-center">
                                <div className="col-auto d-flex flex-wrap align-items-center gap-2">
                                    {calWeaponList.map((w) => {
                                        const isHidden = calHiddenWeapons.has(w.name);
                                        const canToggle = calWeaponList.length > 1;
                                        const dmgType = w.dmg_type && w.dmg_type !== 'normal' ? ` ${w.dmg_type}` : '';
                                        const tooltip = `${w.name}\nDamage: ${w.min_dmg}-${w.max_dmg}${dmgType}`;
                                        return weaponIcons[w.name] ? (
                                            <div
                                                key={w.name}
                                                className={styles.weaponIconPlaceholder}
                                                title={tooltip}
                                                onClick={canToggle ? () => toggleCalWeaponVisibility(w.name) : undefined}
                                                style={{ cursor: canToggle ? 'pointer' : 'default', opacity: isHidden ? 0.3 : 1 }}
                                            >
                                                <img
                                                    src={weaponIcons[w.name]}
                                                    alt={w.name}
                                                    className={styles.weaponIcon}
                                                />
                                            </div>
                                        ) : (
                                            <span
                                                key={w.name}
                                                className={`badge ${isHidden ? 'bg-secondary' : 'bg-success'}`}
                                                title={tooltip}
                                                onClick={canToggle ? () => toggleCalWeaponVisibility(w.name) : undefined}
                                                style={{ cursor: canToggle ? 'pointer' : 'default', opacity: isHidden ? 0.5 : 1 }}
                                            >
                                                {w.name}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            <CaliberChart
                                modId={calModId}
                                caliber={calCaliber}
                                data={data}
                                mode={damageMode}
                                hiddenItems={calHiddenItems}
                                onHiddenItemsChange={setCalHiddenItems}
                                hiddenAmmo={calHiddenAmmo}
                                hiddenWeapons={calHiddenWeapons}
                                burst={burst}
                                pointBlank={pointBlank}
                                critical={criticalHit}
                                rangedBonus={bonusRangedDamage * 2}
                            />
                        </>
                    )}

                    {activeTab === 'any-to-any' && (
                        <>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <select
                                        className="form-select"
                                        value={cwModId}
                                        onChange={(e) => handleCwModChange(e.target.value)}
                                    >
                                        {modOrder.map((modId) => (
                                            <option key={modId} value={modId}>
                                                {modConfigs[modId]?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-auto">
                                    <SearchableSelect
                                        options={cwWeapons.map((w) => w.name)}
                                        value={cwWeapon}
                                        onChange={handleCwWeaponChange}
                                    />
                                </div>
                                <div className="col-auto d-flex align-items-center gap-2">
                                    <div className={styles.weaponIconPlaceholder}>
                                        {weaponIcons[cwWeapon] && cwSelectedWeapon && (
                                            <img
                                                src={weaponIcons[cwWeapon]}
                                                alt={cwWeapon}
                                                title={`${cwWeapon}\nDamage: ${cwSelectedWeapon.min_dmg}-${cwSelectedWeapon.max_dmg}${cwSelectedWeapon.dmg_type && cwSelectedWeapon.dmg_type !== 'normal' ? ` ${cwSelectedWeapon.dmg_type}` : ''}`}
                                                className={styles.weaponIcon}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.ammoIconPlaceholder}>
                                        {ammoIcons[cwAmmo] && (() => {
                                            const ammoData = cwCompatibleAmmo.find((a) => a.name === cwAmmo);
                                            const drMod = !ammoData || ammoData.dr_mod === 0 ? '0' : `${ammoData.dr_mod > 0 ? '+' : ''}${ammoData.dr_mod}%`;
                                            const dmgMod = !ammoData || ammoData.dmg_mult === ammoData.dmg_div ? `${ammoData?.dmg_mult ?? 1}` : `${ammoData.dmg_mult}/${ammoData.dmg_div}`;
                                            const typeLine = ammoData?.dmg_type && ammoData.dmg_type !== 'normal' ? `\nType: ${ammoData.dmg_type}` : '';
                                            const ammoTooltip = ammoData ? `${cwAmmo}\nDR mod: ${drMod}\nDMG mod: ${dmgMod}${typeLine}` : cwAmmo;
                                            return (
                                                <img
                                                    src={ammoIcons[cwAmmo]}
                                                    alt={cwAmmo}
                                                    title={ammoTooltip}
                                                    className={styles.ammoIcon}
                                                />
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div className="col-auto">
                                    <select
                                        className={`form-select ${styles.ammoSelect}`}
                                        value={cwAmmo}
                                        onChange={(e) => setCwAmmo(e.target.value)}
                                        disabled={cwCompatibleAmmo.length <= 1}
                                    >
                                        {cwCompatibleAmmo.map((a) => (
                                            <option key={a.name} value={a.name}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-auto">
                                    <button
                                        className="btn btn-primary"
                                        onClick={addWeaponEntry}
                                        disabled={!cwWeapon || !cwAmmo || isDuplicateEntry}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                            <div className={`row mb-3 justify-content-center ${styles.badgesRow}`}>
                                <div className="col-auto d-flex flex-wrap gap-2">
                                    {weaponEntries.map((entry) => {
                                        const mod = data?.mods[entry.modId];
                                        const weapon = mod?.weapons.find((w) => w.name === entry.weaponName);
                                        const ammoCount = mod?.ammo.filter((a) => a.caliber === weapon?.caliber).length ?? 0;
                                        const showAmmo = ammoCount > 1;
                                        return (
                                            <span key={entry.id} className={`badge bg-secondary ${styles.weaponBadge}`}>
                                                {entry.weaponName}
                                                {showAmmo && ` + ${entry.ammoName}`} ({modConfigs[entry.modId]?.name})
                                                <button
                                                    type="button"
                                                    className="btn-close btn-close-white ms-2"
                                                    onClick={() => removeWeaponEntry(entry.id)}
                                                />
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <DamageModeButtons mode={damageMode} onChange={setDamageMode} />
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <FireModeSelector
                                        burst={burst}
                                        onChange={setBurst}
                                        hasBurst={true}
                                        isBurstOnly={false}
                                        idPrefix="cw"
                                    />
                                </div>
                                <PointBlankCheckbox
                                    checked={pointBlank}
                                    onChange={setPointBlank}
                                    disabled={false}
                                    idPrefix="cw"
                                />
                                <CriticalControls
                                    critical={criticalHit}
                                    onCriticalChange={setCriticalHit}
                                    idPrefix="cw"
                                />
                                <BonusRangedDamage value={bonusRangedDamage} onChange={setBonusRangedDamage} />
                            </div>
                            <CompareWeaponsChart
                                entries={weaponEntries}
                                data={data}
                                mode={damageMode}
                                hiddenItems={cwHiddenItems}
                                onHiddenItemsChange={setCwHiddenItems}
                                burst={burst}
                                pointBlank={pointBlank}
                                critical={criticalHit}
                                rangedBonus={bonusRangedDamage * 2}
                            />
                        </>
                    )}

                    {activeTab === 'tables' &&
                        modOrder.map((modId) => {
                            const mod = data.mods[modId];
                            const config = modConfigs[modId];
                            if (!mod || !config) return null;

                            return (
                                <DamageTable
                                    key={modId}
                                    modName={config.name}
                                    weapons={mod.weapons}
                                    ammo={mod.ammo}
                                    armor={mod.armor}
                                    formula={config.formula}
                                />
                            );
                        })}
        </div>
    );
};

export default App;
