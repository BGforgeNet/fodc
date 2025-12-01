import { useState } from 'react';
import { Ammo, Armor, Weapon } from '../types';
import { getDamageWithFormula } from '../formulas';
import { armorIcons } from '../icons/armorIcons';
import { ammoIcons } from '../icons/ammoIcons';
import styles from './DamageTable.module.css';

interface DamageTableProps {
    modName: string;
    weapons: Weapon[];
    ammo: Ammo[];
    armor: Armor[];
    formula: string;
}

const DamageTable = (props: DamageTableProps) => {
    const [filter, setFilter] = useState('');

    const filteredWeapons = props.weapons.filter((weapon) => weapon.name.toLowerCase().includes(filter.toLowerCase()));

    // Build rows with weapon rowspan information
    const rows: Array<{
        weapon: Weapon;
        ammo: Ammo;
        isFirstAmmoForWeapon: boolean;
        ammoCountForWeapon: number;
    }> = [];

    filteredWeapons.forEach((weapon) => {
        const matchingAmmo = props.ammo.filter((ammo) => weapon.caliber === ammo.caliber);
        matchingAmmo.forEach((ammo, index) => {
            rows.push({
                weapon,
                ammo,
                isFirstAmmoForWeapon: index === 0,
                ammoCountForWeapon: matchingAmmo.length,
            });
        });
    });

    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>{props.modName}</h2>

            <table className={`table table-striped table-bordered ${styles.table}`}>
                <thead className="table-light">
                    <tr>
                        <th>
                            <input
                                type="text"
                                className={`form-control form-control-sm ${styles.filter}`}
                                placeholder="Weapon"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            />
                        </th>
                        <th>Ammo</th>
                        {props.armor.map((armor) => {
                            const iconPath = armorIcons[armor.name];
                            return (
                                <th key={armor.name} title={armor.name}>
                                    {iconPath ? (
                                        <img src={iconPath} alt={armor.name} className={styles.armorIcon} />
                                    ) : (
                                        armor.name
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={`${row.weapon.name}-${row.ammo.name}`}>
                            {row.isFirstAmmoForWeapon && <td rowSpan={row.ammoCountForWeapon}>{row.weapon.name}</td>}
                            <td title={row.ammo.name}>
                                {ammoIcons[row.ammo.name] ? (
                                    <img
                                        src={ammoIcons[row.ammo.name]}
                                        alt={row.ammo.name}
                                        className={styles.ammoIcon}
                                    />
                                ) : (
                                    row.ammo.name
                                )}
                            </td>
                            {props.armor.map((armor) => (
                                <td key={armor.name}>
                                    {getDamageWithFormula(
                                        props.formula,
                                        row.weapon,
                                        row.ammo,
                                        armor,
                                        false,
                                        false,
                                        0
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DamageTable;
