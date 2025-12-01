import { useState, useEffect } from 'react';
import { ModData } from './types';
import DamageTable from './components/DamageTable';
import DamageChart, { DamageMode } from './components/DamageChart';
import CompareWeaponsChart, { WeaponEntry } from './components/CompareWeaponsChart';
import SearchableSelect from './components/SearchableSelect';
import { modOrder, modConfigs } from './modConfig';
import { weaponIcons } from './icons/weaponIcons';
import { ammoIcons } from './icons/ammoIcons';
import styles from './App.module.css';

const fetchModData = async (): Promise<ModData> => {
    const response = await fetch('/data/out/data.json');
    if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
    }
    return response.json();
};

const App = () => {
    const [data, setData] = useState<ModData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const [activeTab, setActiveTab] = useState<'compare-mods' | 'compare-weapons' | 'tables'>('compare-mods');
    const [damageMode, setDamageMode] = useState<DamageMode>('average');
    const [selectedWeapon, setSelectedWeapon] = useState<string>('10mm SMG');
    const [selectedAmmo, setSelectedAmmo] = useState<string>('10mm AP');
    const [hiddenMods, setHiddenMods] = useState<Set<string>>(new Set());
    const [fireMode, setFireMode] = useState<'single' | 'burst' | 'pointblank'>('single');
    const [criticalHit, setCriticalHit] = useState(false);
    const [sniperLuck, setSniperLuck] = useState(false);
    const [bonusRangedDamage, setBonusRangedDamage] = useState(0);

    // Compare weapons state
    const [weaponEntries, setWeaponEntries] = useState<WeaponEntry[]>([]);
    const [cwModId, setCwModId] = useState<string>('vanilla');
    const [cwWeapon, setCwWeapon] = useState<string>('');
    const [cwAmmo, setCwAmmo] = useState<string>('');
    const [cwHiddenItems, setCwHiddenItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchModData()
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

    const vanillaMod = data?.mods['vanilla'];
    const weapons = vanillaMod?.weapons ?? [];
    const weapon = weapons.find((w) => w.name === selectedWeapon);

    // Filter ammo by weapon caliber
    const compatibleAmmo = vanillaMod?.ammo.filter((a) => a.caliber === weapon?.caliber) ?? [];

    // Compute effective ammo - use selected if compatible, otherwise first compatible
    const currentAmmoValid = compatibleAmmo.some((a) => a.name === selectedAmmo);
    const effectiveAmmo = currentAmmoValid ? selectedAmmo : (compatibleAmmo[0]?.name ?? '');

    // Sync state when effective differs from selected (deferred to avoid render loop)
    useEffect(() => {
        if (effectiveAmmo !== selectedAmmo) {
            setSelectedAmmo(effectiveAmmo);
        }
    }, [effectiveAmmo, selectedAmmo]);

    // Burst: force enabled for burst-only weapons, otherwise use fire mode
    const hasBurst = weapon?.burst !== undefined;
    const isBurstOnly = weapon?.burst_only === true;
    const effectiveBurst = isBurstOnly || (hasBurst && fireMode !== 'single');
    const pointBlank = fireMode === 'pointblank';
    const effectiveFireMode = isBurstOnly && fireMode === 'single' ? 'burst' : fireMode;

    // Switch to valid fire mode when weapon changes
    useEffect(() => {
        if (isBurstOnly && fireMode === 'single') {
            setFireMode('burst');
        } else if (!hasBurst && fireMode !== 'single') {
            setFireMode('single');
        }
    }, [hasBurst, isBurstOnly, fireMode]);

    // Compare weapons: get weapons and ammo for selected mod
    const cwMod = data?.mods[cwModId];
    const cwWeapons = cwMod?.weapons ?? [];
    const cwSelectedWeapon = cwWeapons.find((w) => w.name === cwWeapon);
    const cwCompatibleAmmo = cwMod?.ammo.filter((a) => a.caliber === cwSelectedWeapon?.caliber) ?? [];

    // Auto-select first weapon/ammo when mod changes
    useEffect(() => {
        if (cwWeapons.length > 0 && !cwWeapons.some((w) => w.name === cwWeapon)) {
            setCwWeapon(cwWeapons[0]?.name ?? '');
        }
    }, [cwModId, cwWeapons, cwWeapon]);

    useEffect(() => {
        if (cwCompatibleAmmo.length > 0 && !cwCompatibleAmmo.some((a) => a.name === cwAmmo)) {
            setCwAmmo(cwCompatibleAmmo[0]?.name ?? '');
        }
    }, [cwWeapon, cwCompatibleAmmo, cwAmmo]);

    const isDuplicateEntry = weaponEntries.some(
        (e) => e.modId === cwModId && e.weaponName === cwWeapon && e.ammoName === cwAmmo
    );

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
            <h1 className="text-center my-4">Fallout 2 Damage Calculator</h1>

            {loading && (
                <div className="text-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger" role="alert">
                    <h4 className="alert-heading">Error loading data</h4>
                    <p>{error.message || 'Unknown error occurred'}</p>
                </div>
            )}

            {data && (
                <>
                    <ul className="nav nav-tabs mb-4 justify-content-center">
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'compare-mods' ? 'active' : ''}`}
                                onClick={() => setActiveTab('compare-mods')}
                            >
                                Compare mods
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                className={`nav-link ${activeTab === 'compare-weapons' ? 'active' : ''}`}
                                onClick={() => setActiveTab('compare-weapons')}
                            >
                                Compare weapons
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

                    {activeTab === 'compare-mods' && (
                        <>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <SearchableSelect
                                        options={weapons.map((w) => w.name)}
                                        value={selectedWeapon}
                                        onChange={setSelectedWeapon}
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
                                    <div className="btn-group" role="group">
                                        <button
                                            className={`btn ${damageMode === 'min' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('min')}
                                        >
                                            Min
                                        </button>
                                        <button
                                            className={`btn ${damageMode === 'average' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('average')}
                                        >
                                            Average
                                        </button>
                                        <button
                                            className={`btn ${damageMode === 'max' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('max')}
                                        >
                                            Max
                                        </button>
                                        <button
                                            className={`btn ${damageMode === 'range' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('range')}
                                        >
                                            Range
                                        </button>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <div className="btn-group btn-group-sm">
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            id="fireSingle"
                                            checked={effectiveFireMode === 'single'}
                                            onChange={() => setFireMode('single')}
                                            disabled={isBurstOnly}
                                        />
                                        <label className="btn btn-outline-primary" htmlFor="fireSingle">
                                            Single
                                        </label>
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            id="fireBurst"
                                            checked={effectiveFireMode === 'burst'}
                                            onChange={() => setFireMode('burst')}
                                            disabled={!hasBurst}
                                            title="Assume 1/3 of rounds hit"
                                        />
                                        <label className={`btn btn-outline-primary ${!hasBurst ? 'disabled' : ''}`} htmlFor="fireBurst">
                                            Burst
                                        </label>
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            id="firePointblank"
                                            checked={effectiveFireMode === 'pointblank'}
                                            onChange={() => setFireMode('pointblank')}
                                            disabled={!hasBurst}
                                            title="Assume all rounds hit"
                                        />
                                        <label className={`btn btn-outline-primary ${!hasBurst ? 'disabled' : ''}`} htmlFor="firePointblank">
                                            Point-blank burst
                                        </label>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <div className="form-check mb-0" title="Assume armor bypass. On single shot, assume damage x3, on burst - x2">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="criticalToggle"
                                            checked={criticalHit}
                                            onChange={() => setCriticalHit(!criticalHit)}
                                        />
                                        <label className="form-check-label" htmlFor="criticalToggle">
                                            Critical
                                        </label>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <div className="form-check mb-0" title="Every round is a critical hit">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="sniperLuckToggle"
                                            checked={sniperLuck}
                                            onChange={() => {
                                                const newValue = !sniperLuck;
                                                setSniperLuck(newValue);
                                                if (newValue) setCriticalHit(true);
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor="sniperLuckToggle">
                                            Sniper 10 Luck
                                        </label>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <span className="me-2">Bonus Ranged Damage</span>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => setBonusRangedDamage(Math.max(0, bonusRangedDamage - 1))}
                                            disabled={bonusRangedDamage === 0}
                                        >
                                            −
                                        </button>
                                        <span className={`btn btn-outline-secondary ${styles.bonusRangeValue}`}>
                                            {bonusRangedDamage * 2}
                                        </span>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => setBonusRangedDamage(Math.min(2, bonusRangedDamage + 1))}
                                            disabled={bonusRangedDamage === 2}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
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
                                    allCrit={sniperLuck}
                                    rangedBonus={bonusRangedDamage * 2}
                                />
                        </>
                    )}

                    {activeTab === 'compare-weapons' && (
                        <>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <select
                                        className="form-select"
                                        value={cwModId}
                                        onChange={(e) => setCwModId(e.target.value)}
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
                                        onChange={setCwWeapon}
                                    />
                                </div>
                                <div className="col-auto d-flex align-items-center gap-2">
                                    <div className={styles.weaponIconPlaceholder}>
                                        {weaponIcons[cwWeapon] && (
                                            <img
                                                src={weaponIcons[cwWeapon]}
                                                alt={cwWeapon}
                                                title={cwWeapon}
                                                className={styles.weaponIcon}
                                            />
                                        )}
                                    </div>
                                    <div className={styles.ammoIconPlaceholder}>
                                        {ammoIcons[cwAmmo] && (
                                            <img
                                                src={ammoIcons[cwAmmo]}
                                                alt={cwAmmo}
                                                title={cwAmmo}
                                                className={styles.ammoIcon}
                                            />
                                        )}
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
                                    {weaponEntries.map((entry) => (
                                        <span key={entry.id} className={`badge bg-secondary ${styles.weaponBadge}`}>
                                            {entry.weaponName} ({modConfigs[entry.modId]?.name})
                                            <button
                                                type="button"
                                                className="btn-close btn-close-white ms-2"
                                                onClick={() => removeWeaponEntry(entry.id)}
                                            />
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto">
                                    <div className="btn-group" role="group">
                                        <button
                                            className={`btn ${damageMode === 'min' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('min')}
                                        >
                                            Min
                                        </button>
                                        <button
                                            className={`btn ${damageMode === 'average' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('average')}
                                        >
                                            Average
                                        </button>
                                        <button
                                            className={`btn ${damageMode === 'max' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('max')}
                                        >
                                            Max
                                        </button>
                                        <button
                                            className={`btn ${damageMode === 'range' ? 'btn-primary' : 'btn-outline-primary'}`}
                                            onClick={() => setDamageMode('range')}
                                        >
                                            Range
                                        </button>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <div className="btn-group btn-group-sm">
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            id="cwFireSingle"
                                            checked={fireMode === 'single'}
                                            onChange={() => setFireMode('single')}
                                        />
                                        <label className="btn btn-outline-primary" htmlFor="cwFireSingle">
                                            Single
                                        </label>
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            id="cwFireBurst"
                                            checked={fireMode === 'burst'}
                                            onChange={() => setFireMode('burst')}
                                            title="Assume 1/3 of rounds hit"
                                        />
                                        <label className="btn btn-outline-primary" htmlFor="cwFireBurst">
                                            Burst
                                        </label>
                                        <input
                                            type="radio"
                                            className="btn-check"
                                            id="cwFirePointblank"
                                            checked={fireMode === 'pointblank'}
                                            onChange={() => setFireMode('pointblank')}
                                            title="Assume all rounds hit"
                                        />
                                        <label className="btn btn-outline-primary" htmlFor="cwFirePointblank">
                                            Point-blank burst
                                        </label>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <div className="form-check mb-0" title="Assume armor bypass. On single shot, assume damage x3, on burst - x2">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="cwCriticalToggle"
                                            checked={criticalHit}
                                            onChange={() => setCriticalHit(!criticalHit)}
                                        />
                                        <label className="form-check-label" htmlFor="cwCriticalToggle">
                                            Critical
                                        </label>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <div className="form-check mb-0" title="Every round is a critical hit">
                                        <input
                                            type="checkbox"
                                            className="form-check-input"
                                            id="cwSniperLuckToggle"
                                            checked={sniperLuck}
                                            onChange={() => {
                                                const newValue = !sniperLuck;
                                                setSniperLuck(newValue);
                                                if (newValue) setCriticalHit(true);
                                            }}
                                        />
                                        <label className="form-check-label" htmlFor="cwSniperLuckToggle">
                                            Sniper 10 Luck
                                        </label>
                                    </div>
                                </div>
                                <div className="col-auto d-flex align-items-center">
                                    <span className="me-2">Bonus Ranged Damage</span>
                                    <div className="btn-group btn-group-sm">
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => setBonusRangedDamage(Math.max(0, bonusRangedDamage - 1))}
                                            disabled={bonusRangedDamage === 0}
                                        >
                                            −
                                        </button>
                                        <span className={`btn btn-outline-secondary ${styles.bonusRangeValue}`}>
                                            {bonusRangedDamage * 2}
                                        </span>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => setBonusRangedDamage(Math.min(2, bonusRangedDamage + 1))}
                                            disabled={bonusRangedDamage === 2}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <CompareWeaponsChart
                                entries={weaponEntries}
                                data={data}
                                mode={damageMode}
                                hiddenItems={cwHiddenItems}
                                onHiddenItemsChange={setCwHiddenItems}
                                burst={fireMode !== 'single'}
                                pointBlank={fireMode === 'pointblank'}
                                critical={criticalHit}
                                allCrit={sniperLuck}
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
                </>
            )}
        </div>
    );
};

export default App;
