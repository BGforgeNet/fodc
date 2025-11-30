import { Ammo, Armor, Weapon } from '../types';
import { getDamage } from '../utils';
import styles from './DamageTable.module.css';

interface DamageTableProps {
    modName: string;
    weapons: Weapon[];
    ammo: Ammo[];
    armor: Armor[];
}

const DamageTable = (props: DamageTableProps) => {
    return (
        <div className={styles.wrapper}>
            <h2 className={styles.title}>{props.modName}</h2>
            <h3 className={styles.subtitle}>Weapons vs Armor</h3>

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
                    {props.weapons.map((weapon) =>
                        props.ammo.map((ammo) =>
                            weapon.caliber === ammo.caliber ? (
                                <tr key={`${weapon.name}-${ammo.name}`}>
                                    <td>{weapon.name}</td>
                                    <td>{ammo.name}</td>
                                    {props.armor.map((armor) => (
                                        <td key={armor.name}>
                                            {getDamage(weapon, ammo, armor)}
                                        </td>
                                    ))}
                                </tr>
                            ) : null
                        )
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DamageTable;
