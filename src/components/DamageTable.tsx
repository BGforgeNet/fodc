import { Ammo, Armor, Weapon } from '../types';
import { getDamageWithFormula } from '../formulas';
import styles from './DamageTable.module.css';

interface DamageTableProps {
    modName: string;
    weapons: Weapon[];
    ammo: Ammo[];
    armor: Armor[];
    formula: string;
}

const DamageTable = (props: DamageTableProps) => {
    // Build rows with weapon rowspan information
    const rows: Array<{
        weapon: Weapon;
        ammo: Ammo;
        isFirstAmmoForWeapon: boolean;
        ammoCountForWeapon: number;
    }> = [];

    props.weapons.forEach((weapon) => {
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
                        <th>Weapon</th>
                        <th>Ammo</th>
                        {props.armor.map((armor) => (
                            <th key={armor.name}>{armor.name}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={`${row.weapon.name}-${row.ammo.name}`}>
                            {row.isFirstAmmoForWeapon && (
                                <td rowSpan={row.ammoCountForWeapon}>{row.weapon.name}</td>
                            )}
                            <td>{row.ammo.name}</td>
                            {props.armor.map((armor) => (
                                <td key={armor.name}>
                                    {getDamageWithFormula(props.formula, row.weapon, row.ammo, armor, false, false, 0)}
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
