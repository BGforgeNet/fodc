import { useState, useEffect } from 'react';
import { ModData } from './types';
import DamageTable from './components/DamageTable';
import DamageChart, { DamageMode } from './components/DamageChart';
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
    const [activeTab, setActiveTab] = useState<'charts' | 'tables'>('charts');
    const [damageMode, setDamageMode] = useState<DamageMode>('average');
    const [selectedWeapon, setSelectedWeapon] = useState<string>('10mm SMG');
    const [selectedAmmo, setSelectedAmmo] = useState<string>('10mm AP');
    const [hiddenMods, setHiddenMods] = useState<Set<string>>(new Set());
    const [fireMode, setFireMode] = useState<'single' | 'burst' | 'pointblank'>('single');
    const [criticalHit, setCriticalHit] = useState(false);
    const [sniperLuck, setSniperLuck] = useState(false);
    const [bonusRangedDamage, setBonusRangedDamage] = useState(0);

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
                                className={`nav-link ${activeTab === 'charts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('charts')}
                            >
                                Charts
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

                    {activeTab === 'charts' && (
                        <>
                            <div className="row mb-3 align-items-center justify-content-center">
                                <div className="col-auto d-flex align-items-center gap-2">
                                    {weaponIcons[selectedWeapon] && (
                                        <img
                                            src={weaponIcons[selectedWeapon]}
                                            alt={selectedWeapon}
                                            title={selectedWeapon}
                                            className={styles.weaponIcon}
                                        />
                                    )}
                                    <SearchableSelect
                                        options={weapons.map((w) => w.name)}
                                        value={selectedWeapon}
                                        onChange={setSelectedWeapon}
                                    />
                                </div>
                                <div className="col-auto d-flex align-items-center gap-2">
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
