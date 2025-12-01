import { DamageMode } from '../chartUtils';
import styles from '../App.module.css';

interface DamageModeButtonsProps {
    mode: DamageMode;
    onChange: (mode: DamageMode) => void;
}

export const DamageModeButtons = ({ mode, onChange }: DamageModeButtonsProps) => (
    <div className="btn-group" role="group">
        <button
            className={`btn ${mode === 'min' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onChange('min')}
        >
            Min
        </button>
        <button
            className={`btn ${mode === 'average' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onChange('average')}
        >
            Average
        </button>
        <button
            className={`btn ${mode === 'max' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onChange('max')}
        >
            Max
        </button>
        <button
            className={`btn ${mode === 'range' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => onChange('range')}
        >
            Range
        </button>
    </div>
);

type FireMode = 'single' | 'burst' | 'pointblank';

interface FireModeSelectorProps {
    mode: FireMode;
    onChange: (mode: FireMode) => void;
    hasBurst: boolean;
    isBurstOnly: boolean;
    idPrefix?: string;
}

export const FireModeSelector = ({ mode, onChange, hasBurst, isBurstOnly, idPrefix = '' }: FireModeSelectorProps) => {
    const effectiveMode = isBurstOnly && mode === 'single' ? 'burst' : mode;

    return (
        <div className="btn-group btn-group-sm">
            <input
                type="radio"
                className="btn-check"
                id={`${idPrefix}fireSingle`}
                checked={effectiveMode === 'single'}
                onChange={() => onChange('single')}
                disabled={isBurstOnly}
            />
            <label className="btn btn-outline-primary" htmlFor={`${idPrefix}fireSingle`}>
                Single
            </label>
            <input
                type="radio"
                className="btn-check"
                id={`${idPrefix}fireBurst`}
                checked={effectiveMode === 'burst'}
                onChange={() => onChange('burst')}
                disabled={!hasBurst}
                title="Assume 1/3 of rounds hit"
            />
            <label
                className={`btn btn-outline-primary ${!hasBurst ? 'disabled' : ''}`}
                htmlFor={`${idPrefix}fireBurst`}
            >
                Burst
            </label>
            <input
                type="radio"
                className="btn-check"
                id={`${idPrefix}firePointblank`}
                checked={effectiveMode === 'pointblank'}
                onChange={() => onChange('pointblank')}
                disabled={!hasBurst}
                title="Assume all rounds hit"
            />
            <label
                className={`btn btn-outline-primary ${!hasBurst ? 'disabled' : ''}`}
                htmlFor={`${idPrefix}firePointblank`}
            >
                Point-blank burst
            </label>
        </div>
    );
};

interface CriticalControlsProps {
    critical: boolean;
    onCriticalChange: (value: boolean) => void;
    idPrefix?: string;
}

export const CriticalControls = ({ critical, onCriticalChange, idPrefix = '' }: CriticalControlsProps) => (
    <div className="col-auto d-flex align-items-center">
        <div
            className="form-check mb-0"
            title="Assume armor bypass. On single shot, assume damage x3, on burst - x2"
        >
            <input
                type="checkbox"
                className="form-check-input"
                id={`${idPrefix}criticalToggle`}
                checked={critical}
                onChange={() => onCriticalChange(!critical)}
            />
            <label className="form-check-label" htmlFor={`${idPrefix}criticalToggle`}>
                Critical
            </label>
        </div>
    </div>
);

interface BonusRangedDamageProps {
    value: number;
    onChange: (value: number) => void;
}

export const BonusRangedDamage = ({ value, onChange }: BonusRangedDamageProps) => (
    <div className="col-auto d-flex align-items-center">
        <span className="me-2">Bonus Ranged Damage</span>
        <div className="btn-group btn-group-sm">
            <button
                className="btn btn-outline-secondary"
                onClick={() => onChange(Math.max(0, value - 1))}
                disabled={value === 0}
            >
                −
            </button>
            <span className={`btn btn-outline-secondary ${styles.bonusRangeValue}`}>{value * 2}</span>
            <button
                className="btn btn-outline-secondary"
                onClick={() => onChange(Math.min(2, value + 1))}
                disabled={value === 2}
            >
                +
            </button>
        </div>
    </div>
);
