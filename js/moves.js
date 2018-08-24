var MOVETYPE_ATTACK = "attack";
var MOVETYPE_SUPPORT = "support";

var moveInfo = {

	// Placeholder moves
	"strong_atk_A": {
		displayName: "Strong Attack A",
		description: "",
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"strong_atk_B": {
		displayName: "Strong Attack B",
		description: "",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"big_strong_atk_A": {
		displayName: "Exhausting Attack A",
		description: "",
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,
		bp: 5,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
			attacker.adjustStats({atk: -2});
		},
	},
	"atk_boost": {
		displayName: "Attack Boost",
		description: "",
		moveType: MOVETYPE_SUPPORT,
		type: TYPE_SPIRIT,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({atk: 2});
		},
	},
	"def_boost": {
		displayName: "Defense Boost",
		description: "",
		moveType: MOVETYPE_SUPPORT,
		type: TYPE_VOID,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({def: 2});
		},
	},

	// Actual moves
	"waterblast": {
		displayName: "Water Blast",
		description: "Medium strength water attack.",
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"airshot": {
		displayName: "Air Shot",
		description: "Weak air attack, but hits first.",
		type: TYPE_AIR,
		moveType: MOVETYPE_ATTACK,
		bp: 1,
		priority: 1,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"combust": {
		displayName: "Combust",
		description: "Strong fire attack, but take damage when using it.",
		type: TYPE_FIRE,
		moveType: MOVETYPE_ATTACK,
		bp: 5,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
			attacker.adjustHP(-3);
			new Animation("drawText", "" + attacker.nickname + " is hurt by recoil!");
		},
	},
	"poisonspray": {
		displayName: "Poison Spray",
		description: "Damage the opponent over time.",
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			// Apply a DOT on the defender
			defender.addEffect("poison");
		},
	},
	"digstrike": {
		displayName: "Dig Strike",
		description: "Hide for 1 turn, then return and attack the next turn.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			// Hide for 1 turn then turn and deal damage next turn
			// dealDamage(attacker, defender, this.type, this.bp);
			new Animation("drawText", "" + attacker.nickname + " burrows underground!");
			attacker.addEffect("hidden");
			attacker.lockInMove("digstrike_2");
		},
	},
	"digstrike_2": {
		displayName: "Dig Strike",
		description: "Hide for 1 turn, then return and attack the next turn.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_ATTACK,
		bp: 3,
		noDisplayMoveName: true,

		moveFunc: function (attacker, defender) {
			new Animation("drawText", "" + attacker.nickname + " emerges from the ground and strikes!");
			attacker.removeEffect("hidden");
			dealDamage(attacker, defender, this.type, this.bp); 

		},
	},
	"rockpunch": {
		displayName: "Rock Punch",
		description: "Medium strength earth attack.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"gravity": {
		displayName: "Gravity",
		description: "Weak attack, but prevents swapping this turn.",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,
		bp: 1,

		moveFunc: function (attacker, defender) {
			// Prevent swap this turn
			dealDamage(attacker, defender, this.type, this.bp);
			new Animation("drawText", "" + attacker.nickname + " is preventing " + defender.nickname + " from swapping this turn!");
		},
	},
	"ghostguard": {
		displayName: "Ghost Guard",
		description: "Pay 1 health to gain 2 defense.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({def: 2});
			attacker.adjustHP(-1);
			new Animation("drawText", "" + attacker.nickname + " lost 1 health to activate Ghost Guard!");
		},
	},
	"firespinner": {
		displayName: "Fire Spinner",
		description: "Weak attack, but clears entry hazards and field effects.",
		type: TYPE_FIRE,
		moveType: MOVETYPE_ATTACK,
		bp: 1,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
			// Clears entry hazards
			attacker.getTrainer().removeAllEffects();
			new Animation("drawText", "" + attacker.nickname + " cleared obstacles and field effects with Fire Spinner!");
		},
	},
	"negation": {
		displayName: "Negation",
		description: "Removes opponent's stat boosts and deals damage equal to the total of the stat boosts removed. (Does not affect specializations)",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			var moveDamage = 0;
			for (var statName in defender.stats) {
				var statDiff = defender.stats[statName] - (defender.info.stats[statName] + (defender.specialization[statName] || 0));
				if (statDiff > 0) {
					moveDamage -= statDiff;
				}
			}
			defender.adjustHP(moveDamage);
			defender.removeStatBoosts();
			new Animation("drawText", "" + attacker.nickname + " negates all of " + defender.nickname + "'s stat boosts!");
		},
	},
	"backwind": {
		displayName: "Backwind",
		description: "Boost attack and speed by 1 each.",
		type: TYPE_AIR,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({atk: 1, spd: 1});
		},
	},
	"ghostpunch": {
		displayName: "Ghost Punch",
		description: "Medium strength spirit attack.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"spiketrap": {
		displayName: "Spike Trap",
		description: "Entry hazard that deals 2 damage to enemy pokemon swapping in.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			defender.getTrainer().addEffect("spikes");
			new Animation("drawText", "Spike traps are set up on the opponent's field!");
		},
	},
	"drain": {
		displayName: "Drain",
		description: "Reduce enemy attack by 2.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({atk: -2});
		},
	},
	"inverttempo": {
		displayName: "Invert Tempo",
		description: "Reverse the order that pokemon act in. Lasts 5 turns. (Slower first)",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			attacker.getTrainer().addEffect("invert_tempo");
			defender.getTrainer().addEffect("invert_tempo");
			new Animation("drawText", "Slower pokemon now act first!");
		},
	},
	"eventhorizon": {
		displayName: "Event Horizon",
		description: "Strong void attack, but reduces own defense by 2.",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,
		bp: 5,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
			attacker.adjustStats({def: -2});
		},
	},
	"radiation": {
		displayName: "Radiation",
		description: "Deals increasing damage for each use, starting at 1.",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			defender.radiationCounter += 1;
			defender.adjustHP(-1 * defender.radiationCounter);
			new Animation("drawText", "" + defender.nickname + "'s radiation is building!");
		},
	},
	"petrify": {
		displayName: "Petrify",
		description: "Reduces enemy speed, then deals damage for each point of speed missing from the opponent.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({spd: -1});
			var moveDamage = 0;
			var statDiff = defender.stats.spd - (defender.info.stats.spd + (defender.specialization.spd || 0));
			if (statDiff > 0) {
				moveDamage -= statDiff;
			}
			new Animation("drawText", "" + defender.nickname + " is getting petrified!");
			defender.adjustHP(moveDamage);
		},
	},
	"doublejeopardy": {
		displayName: "Double Jeopardy",
		description: "Prevent the opponent from using the same move twice, until they switch out.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			defender.addEffect("double_jeopardy");
			new Animation("drawText", "" + defender.nickname + " cannot use the same move twice in a row!");
		},
	},
	"doppelganger": {
		displayName: "Doppelganger",
		description: "Change into a copy of the enemy pokemon, taking their appearance, type, moves, and stats. Keep your HP and specialty, adding on to the copied specialty.",
		type: TYPE_VOID,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			attacker.stats.atk = defender.stats.atk + (attacker.specialization.atk || 0);
			attacker.stats.def = defender.stats.def + (attacker.specialization.def || 0);
			attacker.stats.spd = defender.stats.spd + (attacker.specialization.spd || 0);
			attacker.type = defender.type;
			// updatePokemonStatsUI(attacker.getTrainer(), attacker.stats.atk, attacker.stats.def, attacker.stats.spd);
			attacker.moves = defender.moves.slice(0);
			// updatePokemonMovesUI(defender.getTrainer());
			new Animation("updatePokemon", {trainerObj: attacker.getTrainer(), forceHPNum: attacker.curHP});
			// updatePokemonUI(attacker.getTrainer(), attacker.curHP);
			new Animation("drawText", "" + attacker.nickname + " changes into a copy of " + defender.nickname + "!");
		},
	},
	"flyingstrike": {
		displayName: "Flying Strike",
		description: "Fly up high for 1 turn, then return and attack the next turn.",
		type: TYPE_AIR,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			// Hide for 1 turn then turn and deal damage next turn
			new Animation("drawText", "" + attacker.nickname + " flies high in the air!");
			attacker.addEffect("hidden");
			attacker.lockInMove("flyingstrike_2");
		},
	},
	"flyingstrike_2": {
		displayName: "Flying Strike",
		description: "Fly up high for 1 turn, then return and attack the next turn.",
		type: TYPE_AIR,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			new Animation("drawText", "" + attacker.nickname + " descends and strikes!");
			attacker.removeEffect("hidden");
			dealDamage(attacker, defender, this.type, this.bp); 
		},
	},
	"panicbite": {
		displayName: "Panic Bite",
		description: "Strong spirit attack, but fails if the opponent doesn't attack.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_ATTACK,
		bp: 3,
		priority: 1,

		moveFunc: function (attacker, defender) {
			var defenderAction = defender.getTrainer().chosenAction;
			if (defenderAction.actionType === MOVE_ACTION && moveInfo[defenderAction.actionInfo.moveID].moveType === MOVETYPE_ATTACK) {
				dealDamage(attacker, defender, this.type, this.bp);
			} else {
				new Animation("drawText", "But it failed!");
			}
		},
	},
	"cobweb": {
		displayName: "Cobweb",
		description: "Entry hazard that reduces speed by 2 for enemy pokemon swapping in.",
		type: TYPE_AIR,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			defender.getTrainer().addEffect("cobweb");
			new Animation("drawText", "A slowing cobweb was set up on the opponent's field!");
		},
	},
	"featherduster": {
		displayName: "Featherduster",
		description: "Reduce enemy defense and clears entry hazards and field effects.",
		type: TYPE_AIR,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			// Clears entry hazards
			defender.adjustStats({def: -1});
			attacker.getTrainer().removeAllEffects();
			new Animation("drawText", "" + attacker.nickname + " cleared obstacles and field effects with Featherduster!");
		},
	},
	"cloudbarrier": {
		displayName: "Cloud Barrier",
		description: "Field effect that reduces all incoming damage by 2. Lasts for 5 turns and stays after swapping pokemon.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			attacker.getTrainer().addEffect("barrier");
			new Animation("drawText", "" + attacker.nickname + " created a cloud barrier! Incoming damage reduced for 5 turns!");
		},
	},
	"lure": {
		displayName: "Lure",
		description: "Force enemy pokemon to only use attack moves, preventing support moves until they switch out.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			defender.addEffect("lure");
			new Animation("drawText", "" + attacker.nickname + " lured " + defender.nickname + "! Support moves are prevented!");
		},
	},
	"rinse": {
		displayName: "Rinse",
		description: "Remove negative effects from the user.",
		type: TYPE_WATER,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			attacker.removeNegativeEffects();
			new Animation("drawText", "" + attacker.nickname + " removed their negative effects!");
		},
	},
	"aerialsurprise": {
		displayName: "Aerial Surprise",
		description: "Weak air attack, but deals high damage to an opponent that just swapped in.",
		type: TYPE_AIR,
		moveType: MOVETYPE_ATTACK,
		bp: 2,

		moveFunc: function (attacker, defender) {
			var atkBP = this.bp;
			if (defender.getTrainer().chosenAction.actionType === SWITCH_ACTION) {
				atkBP *= 2;
			}
			dealDamage(attacker, defender, this.type, atkBP); 
		},
	},
	"ignitioncharge": {
		displayName: "Ignition Charge",
		// description: "Somewhat weak fire attack, but adds 2 fixed damage to the user's next move.",
		description: "Medium strength fire attack.",
		type: TYPE_FIRE,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp); 
		},
	},
	"torrent": {
		displayName: "Torrent",
		description: "Weak water attack, but reduces the opponent's defense by 1.",
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,
		bp: 1,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp); 
			defender.adjustStats({def: -1});
		},
	},
};

var effectsInfo = {
	"poison": {
		displayName: "Poison",
		negativeEffect: true,

		initFunc: function (pokemon) {
			new Animation("drawText", "" + pokemon.nickname + " has been poisoned!");
		},
		turnEndFunc: function (pokemon) {
			new Animation("drawText", "" + pokemon.nickname + " takes damage from its poison!");
			pokemon.adjustHP(-1);
		},
	},
	"hidden": {
		displayName: "Hidden",
	},
	"lure": {
		displayName: "Lured",
		removeOnSwitch: true,
	},


	// TRAINER EFFECTS
	"spikes": {
		displayName: "Spike Traps",
		switchInFunc: function (trainer) {
			new Animation("drawText", "" + trainer.activePokemon.nickname + " takes damage from the spike traps!");
			trainer.activePokemon.adjustHP(-2);
		},
	},
	"cobweb": {
		displayName: "Cobweb",
		switchInFunc: function (trainer) {
			new Animation("drawText", "" + trainer.activePokemon.nickname + " gets caught in the cobweb!");
			trainer.activePokemon.adjustStats({spd: -2});
		},
	},
	"barrier": {
		displayName: "Barrier",
		initFunc: function (trainer) {
			trainer.barrierCounter = 0;
		},
		turnEndFunc: function (trainer) {
			trainer.barrierCounter += 1;
			if (trainer.barrierCounter >= 6) {
				trainer.removeEffect("barrier");
			}
		},
		removeFunc: function (trainer) {
			new Animation("drawText", "The cloud barrier has dissolved!");
			trainer.barrierCounter = 0;
		}
	},

	"invert_tempo": {
		displayName: "Invert Tempo",
		turnEndFunc: function (trainer) {
			trainer.invertTempoCounter += 1;
		},
		removeFunc: function (trainer) {
			trainer.invertTempoCounter = 0;
		}
	},

};
