
console.log('Loading Module Fight');

FoEproxy.addMetaHandler('unit_types', (xhr, postData) => {
    Fight.Types = JSON.parse(xhr.responseText);
});

FoEproxy.addHandler('BattlefieldService', 'startByBattleType', (data, postData) => {

    Fight.Cache = data.responseData;

    Fight.Learn();

    console.log('Fight Result Received');
});

FoEproxy.addHandler('BattlefieldService', 'getArmyPreview', (data, postData) => {

    Fight.Advice(data.responseData);
    console.log('Enemy Army Info Received ');

});

//
FoEproxy.addHandler("OtherPlayerService", "getNeighborList", (data, postData) => {

    Neighbor.Seen(data.responseData);
    console.log('Neighbor list received');

});

//


FoEproxy.addHandler('OtherPlayerService', 'getEventsPaginated', (data, postData) => {

    Neighbor.Activity(data.responseData);
    console.log('Neighbors Activity Info Received ');

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
	SeenData: null,
    Load: () => {
        let tmp = localStorage.getItem('Neighbors');
        if (tmp) {
            Neighbor.Neighbors = JSON.parse(tmp);
        }

    },
	Seen: (neighbors) => {
		Neighbor.SeenData = neighbors;
		Neighbor.Load();
		neighbors.forEach(function (item,key) {
			if (Neighbor.Neighbors[item.player_id]){
				// update
			} else {
				// vytvor
			}
		});
		console.log(neighbors);
	},
	
    Activity: (activity) => {

        // console.log(activity);
    },
    Save: (neighbor) => {
        Neighbor.Load();
        Neighbor.Neighbors[neighbor.id] = {
            'result': neighbor.result,
            'army': neighbor.army,
            'last': neighbor.date,
            'DefenderBonus': neighbor.DefenderBonus,
            'last_seen': neighbor.last_seen
        };
        localStorage.setItem('Neighbors', JSON.stringify(Neighbor.Neighbors));
    },
    Clean: () => {
        // We have to clean history at some point in time.

        let LastClean = localStorage.getItem('LastClean');

        if (!LastClean) {
            LastClean = 0;
        }

        if ((Date.now() - LastClean) >=  604800000 ) { // let's cleanup every 7 days

            Object.keys(Neighbor.Neighbors).forEach(function (item, key) {
                // compare and undef if needed
                if ((Date.now() - Neighbor.Neighbors[item].last_seen) > 5169846000) {
                    // not seen more then 90 days
                    delete Neighbor.Neighbors[item];
                } else {
                    if ((Date.now() - Neighbor.Neighbors[item].last_seen) > 2584923000) {
                        // not seen more then 30 days
                        delete Neighbor.Neighbors[item].army;
                        delete Neighbor.Neighbors[item].result;
                        delete Neighbor.Neighbors[item].last;
                        delete Neighbor.Neighbors[item].DefenderBonus;
                    }
                }
            });
            localStorage.setItem('Neighbors', JSON.stringify(Neighbor.Neighbors));
            localStorage.setItem('LastClean', Date.now());
			console.log('cleaning');
        } else {
			console.log('skipping cleaning');
			
		}
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

        let player_id = reader.CityEntities[0].player_id;
        let defender_army;
        let last_fight_result;
        let last_fight_date;

        Neighbor.Load();

        if (!Neighbor.Neighbors[player_id]) {
            // There was no interaction with this Neighbor before.
            Neighbor.Neighbors[player_id] = {};
        }

        Neighbor.Neighbors[player_id].last_seen = Date.now();

        if (Neighbor.Neighbors[player_id].army) {
            defender_army = Neighbor.Neighbors[player_id].army;
            last_fight_result = (Neighbor.Neighbors[player_id].result == 1) ? "Won" : "Lost";
        } else {
            defender_army = {};
            last_fight_result = "N/A";
        }

        if (!Neighbor.Neighbors[player_id].DefenderBonus) {
            Neighbor.Neighbors[player_id].DefenderBonus = {
                'attack': "n/a",
                'defense': "n/a"
            };
        }

        if (Neighbor.Neighbors[player_id].last > 0) {
            last_fight_date = new Date(Neighbor.Neighbors[player_id].last);
        } else {
            last_fight_date = "No one can remember so!";
        }

        let div = $('#FightStat'),
        h = [];

        h.push('<table class="foe-table" style="margin-bottom: 15px">');
        h.push('<thead>');
        h.push('<tr>');
        h.push('<th colspan="3"><strong>' + /* i18n('Boxes.FightStat.LastFight') */ 'Last Battle</strong> ' + last_fight_date + '</th>');
        h.push('</tr>');

        h.push('</thead>');
        h.push('<tbody>');

        h.push('<tr><td><strong>Defender\'s Army:</strong> ');
        // populate defenders army
        if (Neighbor.Neighbors[player_id].army) {

            h.push('<table><tbody><tr>');
            for (let i in Neighbor.Neighbors[player_id].army) {
                h.push('<td><span class="units-icon ' + Neighbor.Neighbors[player_id].army[i].unitTypeId + '"></span></td>')
            }
            h.push('</tr></tbody></table>');
        } else {
            h.push('Unknown');
        }
        h.push('</td>');
        h.push('<td width="100"><ul class="boost"><li class="attack">' + Neighbor.Neighbors[player_id].DefenderBonus.attack + ' %</li><li class="defense">' + Neighbor.Neighbors[player_id].DefenderBonus.defense + ' %</li></ul></td>');

        h.push('<td width="100"><span class="' + last_fight_result + '">Attacker ' + last_fight_result + '</td></tr>');

        h.push('</tbody>');

        div.find('#FightStatBody').html(h.join(''));
        div.show();

        Neighbor.Save(Neighbor.Neighbors[player_id]);

    }
};

let Fight = {

    Cache: null,
    Enemy: null,
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
    Advice: (enemy) => {
        console.log(enemy);
    },
    Learn: () => {
        Fight.DefenderBonus = {
            'attack': 0,
            'defense': 0
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
            // console.log(Fight.Attack[0].bonuses[i].type);
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
                'last_seen': Date.now(),
                'result': Fight.Cache.state.winnerBit,
                'DefenderBonus': Fight.DefenderBonus
            };

            Neighbor.Save(neighbor);
            Neighbor.Clean();
        }
        // console.log(Fight.Vector());
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
    }

};
