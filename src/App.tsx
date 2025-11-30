import { useState, useEffect } from 'react';
import { ModData } from './types';
import DamageTable from './components/DamageTable';
import DamageChart, { DamageMode } from './components/DamageChart';
import SearchableSelect from './components/SearchableSelect';
import { modOrder, modConfigs } from './modConfig';

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
    const [selectedWeapon, setSelectedWeapon] = useState<string>('10mm pistol');
    const [selectedAmmo, setSelectedAmmo] = useState<string>('10mm AP');

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

    // Reset ammo when weapon changes and current ammo is incompatible
    useEffect(() => {
        if (weapon && compatibleAmmo.length > 0) {
            const currentAmmoValid = compatibleAmmo.some((a) => a.name === selectedAmmo);
            if (!currentAmmoValid) {
                setSelectedAmmo(compatibleAmmo[0]?.name ?? '');
            }
        }
    }, [weapon, compatibleAmmo, selectedAmmo]);

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
                    <ul className="nav nav-tabs mb-4">
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
                            <div className="row mb-3 align-items-center">
                                <div className="col-auto">
                                    <SearchableSelect
                                        options={weapons.map((w) => w.name)}
                                        value={selectedWeapon}
                                        onChange={setSelectedWeapon}
                                    />
                                </div>
                                <div className="col-auto">
                                    <select
                                        className="form-select"
                                        value={selectedAmmo}
                                        onChange={(e) => setSelectedAmmo(e.target.value)}
                                    >
                                        {compatibleAmmo.map((a) => (
                                            <option key={a.name} value={a.name}>
                                                {a.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
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
                            </div>
                            {weapon && (
                                <DamageChart
                                    weapon={weapon}
                                    ammoName={selectedAmmo}
                                    data={data}
                                    mode={damageMode}
                                />
                            )}
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
