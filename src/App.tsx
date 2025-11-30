import { useState, useEffect } from 'react';
import { ModData } from './types';
import DamageTable from './components/DamageTable';

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

    useEffect(() => {
        fetchModData()
            .then(setData)
            .catch(setError)
            .finally(() => setLoading(false));
    }, []);

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

            {data &&
                Object.keys(data.mods).map((modName) => {
                    const mod = data.mods[modName];
                    if (!mod) return null;

                    return (
                        <DamageTable
                            key={modName}
                            modName={modName}
                            weapons={mod.weapons}
                            ammo={mod.ammo}
                            armor={mod.armor}
                        />
                    );
                })}
        </div>
    );
};

export default App;
