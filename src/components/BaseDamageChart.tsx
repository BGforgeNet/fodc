import Plot from 'react-plotly.js';
import { Data, Layout } from 'plotly.js';
import { Armor } from '../types';
import { armorIcons } from '../icons/armorIcons';
import styles from './DamageChart.module.css';
import React, { useState, useCallback } from 'react';

interface BaseDamageChartProps {
    traces: Data[];
    title: string;
    armorList: Armor[];
    hiddenItems: Set<string>;
    onHiddenItemsChange: (items: Set<string>) => void;
}

const BaseDamageChart = ({ traces, title, armorList, hiddenItems, onHiddenItemsChange }: BaseDamageChartProps) => {
    const armorNames = armorList.map((a) => a.name);

    const [tooltipPositions, setTooltipPositions] = useState<{ x: number; width: number }[]>([]);
    const lastPositionsRef = React.useRef<string>('');

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

        const posKey = JSON.stringify(positions);
        if (posKey !== lastPositionsRef.current) {
            lastPositionsRef.current = posKey;
            setTooltipPositions(positions);
        }
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
        <div className={styles.wrapper}>
            <Plot
                className="plotly-chart"
                data={traces}
                layout={{
                    title: { text: title },
                    xaxis: {
                        showticklabels: false,
                        showgrid: true,
                        categoryorder: 'array',
                        categoryarray: armorNames,
                        range: [-0.5, armorNames.length - 0.5],
                    },
                    yaxis: { title: { text: 'Damage' }, rangemode: 'tozero' },
                    hovermode: 'x unified',
                    uirevision: 'true',
                    autosize: true,
                    margin: { b: 120, r: 80 },
                    images,
                    annotations,
                }}
                useResizeHandler={true}
                style={{ width: '100%', height: '500px' }}
                onInitialized={handlePlotUpdate}
                onUpdate={handlePlotUpdate}
                onLegendClick={(e) => {
                    const name = e.data[e.curveNumber]?.name;
                    if (name) {
                        const next = new Set(hiddenItems);
                        if (next.has(name)) {
                            next.delete(name);
                        } else {
                            next.add(name);
                        }
                        onHiddenItemsChange(next);
                    }
                    return false;
                }}
            />
            {tooltipPositions.map((pos, i) => (
                <div
                    key={armorList[i]?.name}
                    title={armorList[i]?.name}
                    className={styles.tooltipOverlay}
                    style={{ left: pos.x - pos.width / 2, width: pos.width }}
                />
            ))}
        </div>
    );
};

export default BaseDamageChart;
