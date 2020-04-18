
console.log('Loading Module Fight');

FoEproxy.addMetaHandler('unit_types', (xhr, postData) => {
    Fight.Types = JSON.parse(xhr.responseText);
});

FoEproxy.addHandler('BattlefieldService', 'startByBattleType', (data, postData) => {

    Fight.Cache = data.responseData;

    Fight.Something();

    console.log('Fight Result Received');
});

FoEproxy.addHandler('ArmyUnitManagementService', 'getArmyInfo', (data, postData) => {
    Fight.Units = data.responseData.units;

});

FoEproxy.addHandler('OtherPlayerService', 'visitPlayer', (data, postData) => {
    let OtherPlayer = data.responseData.other_player;
    if (OtherPlayer.is_neighbor && !OtherPlayer.is_friend && !OtherPlayer.is_guild_member) {
        Reader.OtherPlayersBuildings(data.responseData);
        Neighbor.Show(Reader);
    }
});

let Neighbor = {
    Neighbors: {},
    Load: () => {
        let tmp = localStorage.getItem('Neighbors');
        if (tmp) {
            Neighbor.Neighbors = JSON.parse(tmp);
        }
		
        Neighbor.Clean();
    },
    Save: (neighbor) => {
        Neighbor.Load();
        Neighbor.Neighbors[neighbor.id] = {
            'result': neighbor.result,
            'army': neighbor.army,
            'last': neighbor.date,
			'DefenderBonus': neighbor.DefenderBonus
        };
        localStorage.setItem('Neighbors', JSON.stringify(Neighbor.Neighbors));

    },
    Clean: () => {
        // We have to clean history at some point in time.
    },
    DeleteAll: () => {
        localStorage.setItem('Neighbors', JSON.stringify({}));
        Neighbor.Load();
    },
    Show: (reader) => {
		
		if ($('#FightStat').length != 0) {
			$('#FightStat').remove();
		}
	
		
        if ($('#FightStat').length === 0) {
            HTML.Box({
                'id': 'FightStat',
                'title': /* i18n('Boxes.FightStat.Title') */ 'Neighbors\' relationsship with ' + '<em>' + reader.player_name + '</em>',
                'auto_close': true,
                'dragdrop': true,
                'minimize': true
            });
            HTML.AddCssFile('fight');
			HTML.AddCssFile('unit');
        }
		
        Neighbor.Load();
		

		
		let div = $('#FightStat'),
			h = [];

		
		let player_id = reader.CityEntities[0].player_id;
		let defender_army = Neighbor.Neighbors[player_id].army;
		
		if (!Neighbor.Neighbors[player_id].DefenderBonus) {
		   Neighbor.Neighbors[player_id].DefenderBonus = {'attack': "n/a", 'defense' : "n/a"};
		}
		
		let last_fight_result = (Neighbor.Neighbors[player_id].result == 1)?"Won":"Lost";
		
		h.push('<table class="foe-table" style="margin-bottom: 15px">');
		h.push('<thead>');
		h.push('<tr>');
		h.push('<th colspan="3"><strong>' + /* i18n('Boxes.FightStat.LastFight') */'Last Battle</strong> ' + Date(Neighbor.Neighbors[player_id].last) +'</th>');
		h.push('</tr>');

		h.push('</thead>');
		h.push('<tbody>');
		
		h.push("<tr><td><strong>Defender's Army:</strong> ");
		// populate defenders army

		h.push('<table><tbody><tr>');
		for (let i in Neighbor.Neighbors[player_id].army ) {
			h.push('<td><span class="units-icon '+ Neighbor.Neighbors[player_id].army[i].unitTypeId +'"></span></td>')
		}
		h.push('</tr></tbody></table>');
		
		h.push( '</td>');
		 h.push( '<td width="100"><ul class="boost"><li class="attack">'+Neighbor.Neighbors[player_id].DefenderBonus.attack+' %</li><li class="defense">'+Neighbor.Neighbors[player_id].DefenderBonus.defense+' %</li></ul></td>');
		
		h.push( '<td width="100"><span class="'+last_fight_result+'">Attacker '+last_fight_result+'</td></tr>');
		
		h.push('</tbody>');
		
		div.find('#FightStatBody').html(h.join(''));
		div.show();
    }
};

let Fight = {

    Cache: null,
    Units: null,
    Attack: null,
    AttackerBonus: {
        "attack": 0,
        "defense": 0
    },
    Damage: {
        "Attacker": 0,
        "AttackerHitPoints": 0,
        "Defender": 0,
        "DefenderHitPoints": 0
    },
    Defense: null,
    DefenderBonus: {
        "attack": 0,
        "defense": 0
    },
    Something: () => {
		Fight.DefenderBonus = {
			'attack' : 0,
			'defense' :0
		};
		Fight.AttackerBonus = {
        "attack": 0,
        "defense": 0
		};
        Fight.Attack = [];
        Fight.Defense = [];

		Fight.Damage = {
        "Attacker": 0,
        "AttackerHitPoints": 0,
        "Defender": 0,
        "DefenderHitPoints": 0
		};

        for (let i in Fight.Cache['state']['unitsOrder']) {

            if (Fight.Cache['state']['unitsOrder'][i]['teamFlag'] == 1) {
                Fight.Attack[Fight.Attack.length] = Fight.Cache['state']['unitsOrder'][i];

                if (Fight.Cache['state']['unitsOrder'][i].currentHitpoints) {
                    Fight.Damage.Attacker = Fight.Damage.Attacker + Fight.Cache['state']['unitsOrder'][i].startHitpoints - Fight.Cache['state']['unitsOrder'][i].currentHitpoints;

                } else {
                    Fight.Damage.Attacker = Fight.Damage.Attacker + Fight.Cache['state']['unitsOrder'][i].startHitpoints;
                }
                Fight.Damage.AttackerHitPoints = Fight.Damage.AttackerHitPoints + Fight.Cache['state']['unitsOrder'][i].startHitpoints;
            } else {
                Fight.Defense[Fight.Defense.length] = Fight.Cache['state']['unitsOrder'][i];
                if (Fight.Cache['state']['unitsOrder'][i].currentHitpoints) {
                    Fight.Damage.Defender = Fight.Damage.Defender + Fight.Cache['state']['unitsOrder'][i].startHitpoints - Fight.Cache['state']['unitsOrder'][i].currentHitpoints;

                } else {
                    Fight.Damage.Defender = Fight.Damage.Defender + Fight.Cache['state']['unitsOrder'][i].startHitpoints;
                }
                Fight.Damage.DefenderHitPoints = Fight.Damage.DefenderHitPoints + Fight.Cache['state']['unitsOrder'][i].startHitpoints;
            }
        }

        for (let i in Fight.Attack[0].bonuses) {
            console.log(Fight.Attack[0].bonuses[i].type);
            if (Fight.Attack[0].bonuses[i].value) {
                switch (Fight.Attack[0].bonuses[i].type) {

                case "military_boost":
                    Fight.AttackerBonus['defense'] = Fight.AttackerBonus['defense'] + Fight.Attack[0].bonuses[i].value;
                    Fight.AttackerBonus['attack'] = Fight.AttackerBonus['attack'] + Fight.Attack[0].bonuses[i].value;

                    break;

                case "attack_boost":
                    Fight.AttackerBonus['attack'] = Fight.AttackerBonus['attack'] + Fight.Attack[0].bonuses[i].value;
                    break;

                case "advanced_tactics":
                    Fight.AttackerBonus['defense'] = Fight.AttackerBonus['defense'] + Fight.Attack[0].bonuses[i].value;
                    Fight.AttackerBonus['attack'] = Fight.AttackerBonus['attack'] + Fight.Attack[0].bonuses[i].value;

                    break;

                case "attacker_defense_boost":
                    Fight.AttackerBonus['defense'] = Fight.AttackerBonus['defense'] + Fight.Attack[0].bonuses[i].value;

                    break;

                default:
                    console.log("Unknown attacker bonus: " + Fight.Attack[0].bonuses[i].type);
                    break;
                }

            }
        }

        for (let i in Fight.Defense[0].bonuses) {
            if (Fight.Defense[0].bonuses[i].value) {
                switch (Fight.Defense[0].bonuses[i].type) {

                case "military_boost":
                    Fight.DefenderBonus['defense'] = Fight.DefenderBonus['defense'] + Fight.Defense[0].bonuses[i].value;
                    Fight.DefenderBonus['attack'] = Fight.DefenderBonus['attack'] + Fight.Defense[0].bonuses[i].value;
                    break;

                case "fierce_resistance":
                    Fight.DefenderBonus['defense'] = Fight.DefenderBonus['defense'] + Fight.Defense[0].bonuses[i].value;
                    Fight.DefenderBonus['attack'] = Fight.DefenderBonus['attack'] + Fight.Defense[0].bonuses[i].value;

                    break;

                case "defense_boost":
                    Fight.DefenderBonus['defense'] = Fight.DefenderBonus['defense'] + Fight.Defense[0].bonuses[i].value;
                    break;

                case "defender_attack_boost":
                    Fight.DefenderBonus['attack'] = Fight.DefenderBonus['attack'] + Fight.Defense[0].bonuses[i].value;
                    break;
                default:
                    console.log("Unknown Defender Bonus: " + Fight.Defense[0].bonuses[i].type);
                    break;

                }

            }
        }

        if (Fight.Cache.battleType.type.match(/pvp/)) {
            let neighbor = {
                'id': Fight.Cache.defenderPlayerId,
                'army': Fight.Defense,
                'date': Date.now(),
                'result': Fight.Cache.state.winnerBit,
				'DefenderBonus': Fight.DefenderBonus
            };
            Neighbor.Save(neighbor);
        }
        console.log(Fight.Vector());
        Fight.Send(Fight.Vector());
    },

    Send: (vector) => {
        var xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:3000/result", true);
        xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

        xhr.send(JSON.stringify(vector));
    },
    Vector: () => {
        /*
        (vector = att1-8, def1-8, attbon, defbon, atthploss, type, result)
         */
        let vector = [];
        // populate Attacker
        for (let i = 0; i < 8; i++) {
            if (Fight.Attack[i]) {
                vector[vector.length] = /* Fight.UnitID[ */ Fight.Attack[i].unitTypeId /* ] */;
            } else {
                vector[vector.length] = null;
            }
        }
        // populate defffender
        for (let i = 0; i < 8; i++) {
            if (Fight.Defense[i]) {
                vector[vector.length] = /* Fight.UnitID[ */ Fight.Defense[i].unitTypeId /* ] */;

            } else {
                vector[vector.length] = null;
            }
        }
        vector[vector.length] = Fight.AttackerBonus['attack'] - Fight.DefenderBonus['defense'];
        vector[vector.length] = Fight.AttackerBonus['defense'] - Fight.DefenderBonus['attack'];
        vector[vector.length] = Fight.Cache.isAutoBattle ? 1 : 0;
        vector[vector.length] = Fight.Cache.battleType.era;
        vector[vector.length] = Fight.Damage.Attacker / Fight.Damage.AttackerHitPoints;
        vector[vector.length] = Fight.Damage.Defender / Fight.Damage.DefenderHitPoints;
        vector[vector.length] = Fight.Cache.state.winnerBit;

        return vector;
    },
    UnitID: {
        "ArcticFuture_champion": 0,
        "BronzeAge_champion": 1,
        "ColonialAge_champion": 2,
        "ContemporaryEra_champion": 3,
        "EarlyMiddleAge_champion": 4,
        "FutureEra_champion": 5,
        "HighMiddleAge_champion": 6,
        "IndustrialAge_champion": 7,
        "IronAge_champion": 8,
        "LateMiddleAge_champion": 9,
        "ModernEra_champion": 10,
        "OceanicFuture_champion": 11,
        "PostModernEra_champion": 12,
        "ProgressiveEra_champion": 13,
        "SpaceAgeAsteroidBelt_champion": 14,
        "SpaceAgeMars_champion": 15,
        "TomorrowEra_champion": 16,
        "VirtualFuture_champion": 17,
        "aa_vehicle": 18,
        "anti_material_sniper": 19,
        "archer": 20,
        "armored_car": 21,
        "armoredswordsman": 22,
        "assault_tank": 23,
        "attack_helicopter": 24,
        "augmented_samurai": 25,
        "automatic_rifleman": 26,
        "axe_hammer_warrior": 27,
        "clubman": 28,
        "balista": 29,
        "barbarian": 30,
        "barbarian_slinger": 31,
        "battle_fortress": 32,
        "battle_tank": 33,
        "bazooka": 34,
        "behemoth": 35,
        "belt": 36,
        "biedenhaender_mercenary": 37,
        "bombarde": 38,
        "brave_warrior": 39,
        "breech_loader": 40,
        "camel_archer": 41,
        "cannoniers": 42,
        "cataphract": 43,
        "catapult": 44,
        "color_guard": 45,
        "combat_drone": 46,
        "commando": 47,
        "conscript": 48,
        "crab_mech": 49,
        "crossbowman": 50,
        "dismounted_knight": 51,
        "dragon_drone": 52,
        "dragoon": 53,
        "drill_ranger": 54,
        "drone_swarm": 55,
        "exo_soldier": 56,
        "feudal_knight": 57,
        "gliders": 58,
        "grenadier": 59,
        "hoplite": 60,
        "horseman": 61,
        "hover_hammer": 62,
        "hover_tank": 63,
        "howitzer": 64,
        "hydroelectric_eel": 65,
        "imperial_knight": 66,
        "infantry_fighting_vehicle": 67,
        "jaeger": 68,
        "javeliner": 69,
        "khopesh_fighter": 70,
        "lancer": 71,
        "legionnaire": 72,
        "longbowman": 73,
        "manta": 74,
        "marksman": 75,
        "mech_artillery": 76,
        "mech_infantry": 77,
        "medusa": 78,
        "military_drummer": 79,
        "militiaman": 80,
        "missile_artillery": 81,
        "mobile_microwave_gun": 82,
        "mounted_bowman": 83,
        "mounted_brave": 84,
        "mounted_legionnaire": 85,
        "nail_storm": 86,
        "nautilus": 87,
        "ninja": 88,
        "nubian_archer": 89,
        "octopod": 90,
        "palintona": 91,
        "paratrooper": 92,
        "pikeman": 93,
        "plasma_artillery": 94,
        "rail_gun_unit": 95,
        "ranger": 96,
        "recon_raider": 97,
        "rf_cannon": 98,
        "rifleman": 99,
        "rocket_artillery": 100,
        "rocket_troop": 101,
        "rogue": 102,
        "ronin_bot": 103,
        "sat_uplink_unit": 104,
        "scimitar": 105,
        "sentinel": 106,
        "shredder": 107,
        "slinger": 108,
        "sniper": 109,
        "sniperbot": 110,
        "space_marine": 111,
        "spearman": 112,
        "stealth_tank": 113,
        "steel_warden": 114,
        "strike_team": 115,
        "sub_cruiser": 116,
        "surrogate_soldier": 117,
        "tank": 118,
        "tesla_walker": 119,
        "trebuchet": 120,
        "turturret": 121,
        "ultra_ap": 122,
        "universal_tank": 123,
        "war_chariot": 124,
        "war_elephant": 125,
        "warrior_monk": 126
    }

};
