import { createSignal, createEffect } from "solid-js";
import { Ammo, Armor, Weapon, ModData } from "../data/src/types";
import { getDamage } from "./utils";

const App = () => {
    const [data, setData] = createSignal<any>(null);

    createEffect(() => {
        fetch("/data/out/data.json")
            .then((response) => response.json())
            .then(setData)
            .catch(console.error);
    });

    return (
        <div class="container">
            <h1 class="text-center my-4">Mod Data</h1>
            {data() ? (
                <>
                    {/* <h2>Weapons</h2>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Min DMG</th>
                                <th>Max DMG</th>
                                <th>DMG Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data().mods.vanilla.weapons.map(
                                (weapon: Weapon) => (
                                    <tr>
                                        <td>{weapon.name}</td>
                                        <td>{weapon.min_dmg}</td>
                                        <td>{weapon.max_dmg}</td>
                                        <td>{weapon.dmg_type}</td>
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>

                    <h2>Ammo</h2>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Caliber</th>
                                <th>AC Mod</th>
                                <th>DR Mod</th>
                                <th>DMG Mod</th>
                                <th>DMG Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data().mods.vanilla.ammo.map((ammo: Ammo) => (
                                <tr>
                                    <td>{ammo.name}</td>
                                    <td>{ammo.caliber}</td>
                                    <td>{ammo.ac_mod}</td>
                                    <td>{ammo.dr_mod}</td>
                                    <td>{ammo.dmg_mod}</td>
                                    <td>{ammo.dmg_type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <h2>Armor</h2>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>DR</th>
                                <th>DT</th>
                                <th>DR Fire</th>
                                <th>DT Fire</th>
                                <th>DR Plasma</th>
                                <th>DT Plasma</th>
                                <th>DR Laser</th>
                                <th>DT Laser</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data().mods.vanilla.armor.map((armor: Armor) => (
                                <tr>
                                    <td>{armor.name}</td>
                                    <td>{armor.dr}</td>
                                    <td>{armor.dt}</td>
                                    <td>{armor.dr_fire}</td>
                                    <td>{armor.dt_fire}</td>
                                    <td>{armor.dr_plasma}</td>
                                    <td>{armor.dt_plasma}</td>
                                    <td>{armor.dr_laser}</td>
                                    <td>{armor.dt_laser}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table> */}

                    <h2>Weapons vs Armor</h2>

                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Weapon</th>
                                <th>Ammo</th>
                                {data().mods.vanilla.armor.map(
                                    (armor: Armor) => (
                                        <th>{armor.name}</th>
                                    ),
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {data().mods.vanilla.weapons.map((weapon: Weapon) =>
                                data().mods.vanilla.ammo.map(
                                    (ammo: Ammo) =>
                                        weapon.caliber === ammo.caliber && (
                                            <tr>
                                                <td>{weapon.name}</td>
                                                <td>{ammo.name}</td>
                                                {data().mods.vanilla.armor.map(
                                                    (armor: Armor) => {
                                                        return (
                                                            <td>
                                                                {getDamage(
                                                                    data(),
                                                                    weapon,
                                                                    ammo,
                                                                    armor,
                                                                )}
                                                            </td>
                                                        );
                                                    },
                                                )}
                                            </tr>
                                        ),
                                ),
                            )}
                        </tbody>
                    </table>
                </>
            ) : (
                <p>Loading data...</p>
            )}
        </div>
    );
};

export default App;
