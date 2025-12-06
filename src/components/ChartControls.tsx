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

interface FireModeSelectorProps {
    burst: boolean;
    onChange: (burst: boolean) => void;
    hasBurst: boolean;
    isBurstOnly: boolean;
    idPrefix?: string;
}

export const FireModeSelector = ({ burst, onChange, hasBurst, isBurstOnly, idPrefix = '' }: FireModeSelectorProps) => {
    const effectiveBurst = isBurstOnly || burst;

    return (
        <div className="btn-group btn-group-sm">
            <input
                type="radio"
                className="btn-check"
                id={`${idPrefix}fireSingle`}
                checked={!effectiveBurst}
                onChange={() => onChange(false)}
                disabled={isBurstOnly}
            />
            <label className="btn btn-outline-primary" htmlFor={`${idPrefix}fireSingle`}>
                Single
            </label>
            <input
                type="radio"
                className="btn-check"
                id={`${idPrefix}fireBurst`}
                checked={effectiveBurst}
                onChange={() => onChange(true)}
                disabled={!hasBurst}
                title="Assume 1/3 of rounds hit (all rounds if point-blank)"
            />
            <label
                className={`btn btn-outline-primary ${!hasBurst ? 'disabled' : ''}`}
                htmlFor={`${idPrefix}fireBurst`}
            >
                Burst
            </label>
        </div>
    );
};

interface PointBlankCheckboxProps {
    checked: boolean;
    onChange: (value: boolean) => void;
    disabled: boolean;
    idPrefix?: string;
}

export const PointBlankCheckbox = ({ checked, onChange, disabled, idPrefix = '' }: PointBlankCheckboxProps) => (
    <div className="col-auto d-flex align-items-center">
        <div
            className="form-check mb-0"
            title={
                'If burst is point-blank, assume all rounds hit. Otherwise, only 1/3.\nFor single shots, no difference.'
            }
        >
            <input
                type="checkbox"
                className="form-check-input"
                id={`${idPrefix}pointBlankToggle`}
                checked={checked}
                onChange={() => onChange(!checked)}
                disabled={disabled}
            />
            <label className="form-check-label" htmlFor={`${idPrefix}pointBlankToggle`}>
                Point-blank
            </label>
        </div>
    </div>
);

interface CriticalControlsProps {
    critical: boolean;
    onCriticalChange: (value: boolean) => void;
    idPrefix?: string;
}

export const CriticalControls = ({ critical, onCriticalChange, idPrefix = '' }: CriticalControlsProps) => (
    <div className="col-auto d-flex align-items-center">
        <div
            className="form-check mb-0"
            title={
                'Assumptions:\n - Armor bypass.\n - On single shot - damage x3, on burst - x2.\n - For bursts in FO2tweaks, assume 5 Luck.'
            }
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

interface SniperLuckCheckboxProps {
    checked: boolean;
    onChange: (value: boolean) => void;
    idPrefix?: string;
}

export const SniperLuckCheckbox = ({ checked, onChange, idPrefix = '' }: SniperLuckCheckboxProps) => (
    <div className="col-auto d-flex align-items-center">
        <div className="form-check mb-0">
            <input
                type="checkbox"
                className="form-check-input"
                id={`${idPrefix}sniperLuckToggle`}
                checked={checked}
                onChange={() => onChange(!checked)}
            />
            <label className="form-check-label" htmlFor={`${idPrefix}sniperLuckToggle`}>
                Sniper 10 Luck
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
