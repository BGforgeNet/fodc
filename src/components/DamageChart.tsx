import Plot from 'react-plotly.js';
import { Data, Layout } from 'plotly.js';
import { Weapon, ModData } from '../types';
import { getDamageWithFormula } from '../formulas';
import { modOrder, modConfigs } from '../modConfig';
import { armorIcons } from '../armorIcons';
import { useState, useCallback } from 'react';

type DamageMode = 'average' | 'min' | 'max' | 'range';

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
    const armorNames = armorList.map((a) => a.name);

    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728'];

    modOrder.forEach((modId, modIndex) => {
        const mod = data.mods[modId];
        const config = modConfigs[modId];
        if (!mod || !config) return;

        const ammo = mod.ammo.find((a) => a.name === ammoName && a.caliber === weapon.caliber);
        if (!ammo) return;

        const damageData = armorList.map((armor) => {
            const modArmor = mod.armor.find((a) => a.name === armor.name) ?? armor;
            const damageStr = getDamageWithFormula(config.formula, weapon, ammo, modArmor);
            const parts = damageStr.split('-').map(Number);
            return { min: parts[0] ?? 0, max: parts[1] ?? 0 };
        });

        if (mode === 'range') {
            const color = colors[modIndex % colors.length] ?? '#1f77b4';
            // Min line (bottom)
            traces.push({
                x: armorNames,
                y: damageData.map((d) => d.min),
                type: 'scatter',
                mode: 'lines',
                line: { color },
                name: config.name,
                legendgroup: config.name,
                hovertemplate: 'Min: %{y:.6~g}<extra>%{fullData.name}</extra>',
            });
            // Max line (top) with fill to min
            traces.push({
                x: armorNames,
                y: damageData.map((d) => d.max),
                type: 'scatter',
                mode: 'lines',
                line: { color },
                fill: 'tonexty',
                fillcolor: `${color}33`,
                name: config.name,
                legendgroup: config.name,
                showlegend: false,
                hovertemplate: 'Max: %{y:.6~g}<extra>%{fullData.name}</extra>',
            });
        } else {
            const damages = damageData.map((d) => {
                if (mode === 'min') return d.min;
                if (mode === 'max') return d.max;
                return (d.min + d.max) / 2;
            });

            traces.push({
                x: armorNames,
                y: damages,
                type: 'scatter',
                mode: 'lines',
                name: config.name,
                hovertemplate: '%{y:.6~g}<extra>%{fullData.name}</extra>',
            });
        }
    });

    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);

    const [tooltipPositions, setTooltipPositions] = useState<{ x: number; width: number }[]>([]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePlotUpdate = useCallback((_figure: any, graphDiv: any) => {
        const xaxis = graphDiv._fullLayout?.xaxis;
        if (!xaxis) return;

        const positions = armorList.map((armor, i) => ({
            x: xaxis.d2p(armor.name) + xaxis._offset,
            width: i < armorList.length - 1
                ? xaxis.d2p(armorList[i + 1]?.name) - xaxis.d2p(armor.name)
                : xaxis.d2p(armorList[1]?.name) - xaxis.d2p(armorList[0]?.name),
        }));

        // Only update if positions actually changed
        setTooltipPositions((prev) => {
            if (prev.length === positions.length &&
                prev.every((p, i) => p.x === positions[i]?.x && p.width === positions[i]?.width)) {
                return prev;
            }
            return positions;
        });
    }, [armorList]);

    const images: Partial<Layout>['images'] = armorList.map((armor) => {
        const iconPath = armorIcons[armor.name];
        if (!iconPath) return null;
        return {
            source: iconPath,
            xref: 'x' as const,
            yref: 'paper' as const,
            x: armor.name,
            y: -0.02,
            sizex: 0.54,
            sizey: 0.108,
            xanchor: 'center' as const,
            yanchor: 'top' as const,
        };
    }).filter((img): img is NonNullable<typeof img> => img !== null);

    const annotations: Partial<Layout>['annotations'] = armorList
        .filter((armor) => armor.abbrev)
        .map((armor) => ({
            xref: 'x' as const,
            yref: 'paper' as const,
            x: armor.name,
            y: -0.20,
            text: armor.abbrev,
            showarrow: false,
            font: { size: 12, weight: 'bold' as const },
        }));

    return (
        <div style={{ position: 'relative', overflow: 'visible' }}>
            <Plot
                className="plotly-chart"
                data={traces}
                layout={{
                    title: { text: `${weapon.name} + ${ammoName} (${modeLabel})` },
                    xaxis: {
                        showticklabels: false,
                        showgrid: true,
                        categoryorder: 'array',
                        categoryarray: armorNames,
                        range: [-0.5, armorNames.length - 0.5],
                    },
                    yaxis: { title: { text: 'Damage' }, rangemode: 'tozero' },
                    hovermode: 'x unified',
                    autosize: true,
                    margin: { b: 120, r: 80 },
                    images,
                    annotations,
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '500px' }}
                onInitialized={handlePlotUpdate}
                onUpdate={handlePlotUpdate}
            />
            {/* Invisible overlay for tooltips */}
            {tooltipPositions.map((pos, i) => (
                <div
                    key={armorList[i]?.name}
                    title={armorList[i]?.name}
                    style={{
                        position: 'absolute',
                        left: pos.x - pos.width / 2,
                        bottom: 20,
                        width: pos.width,
                        height: 100,
                        cursor: 'pointer',
                        zIndex: 10,
                    }}
                />
            ))}
        </div>
    );
};

export default DamageChart;
export type { DamageMode };
