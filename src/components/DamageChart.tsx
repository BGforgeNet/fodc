import Plot from 'react-plotly.js';
import { Data } from 'plotly.js';
import { Weapon, ModData } from '../types';
import { getDamageWithFormula } from '../formulas';
import { modOrder, modConfigs } from '../modConfig';

type DamageMode = 'average' | 'min' | 'max';

interface DamageChartProps {
    weapon: Weapon;
    ammoName: string;
    data: ModData;
    mode: DamageMode;
}

const DamageChart = ({ weapon, ammoName, data, mode }: DamageChartProps) => {
    const vanillaMod = data.mods['vanilla'];
    if (!vanillaMod) return null;
    const armorList = vanillaMod.armor;

    const traces: Data[] = [];

    modOrder.forEach((modId) => {
        const mod = data.mods[modId];
        const config = modConfigs[modId];
        if (!mod || !config) return;

        const ammo = mod.ammo.find((a) => a.name === ammoName && a.caliber === weapon.caliber);
        if (!ammo) return;

        const damages = armorList.map((armor) => {
            const modArmor = mod.armor.find((a) => a.name === armor.name) ?? armor;
            const damageStr = getDamageWithFormula(config.formula, weapon, ammo, modArmor);
            const parts = damageStr.split('-').map(Number);
            const min = parts[0] ?? 0;
            const max = parts[1] ?? 0;

            if (mode === 'min') return min;
            if (mode === 'max') return max;
            return (min + max) / 2;
        });

        traces.push({
            x: armorList.map((a) => a.name),
            y: damages,
            type: 'scatter',
            mode: 'lines',
            name: config.name,
        });
    });

    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

    return (
        <Plot
            data={traces}
            layout={{
                title: { text: `${weapon.name} + ${ammoName} (${modeLabel})` },
                xaxis: { title: { text: 'Armor' } },
                yaxis: { title: { text: 'Damage' } },
                autosize: true,
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '500px' }}
        />
    );
};

export default DamageChart;
export type { DamageMode };
