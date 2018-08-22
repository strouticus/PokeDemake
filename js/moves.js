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
			new Animation("drawText", "" + attacker.nickname + " cleared obstacles and field effects with Fire Spinner!");
		},
	},
	"negation": {
		displayName: "Negation",
		description: "Removes opponent's stat boosts and deals 1 damage for each boost removed. (Does not affect specializations)",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			defender.adjustHP(-1);
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
			new Animation("drawText", "Slower pokemon act first!");
		},
	},
	"eventhorizon": {
		displayName: "Event Horizon",
		description: "Strong void attack, but reduces own defense by 1.",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
			attacker.adjustStats({def: -1});
		},
	},
	"radiation": {
		displayName: "Radiation",
		description: "Deals increasing damage for each consecutive use, starting at 1.",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			defender.adjustHP(-1);
			new Animation("drawText", "As the radiation grows stronger, the pain gets worse. " + defender.nickname + " feels their energy draining, and begins to lose the will to fight. Please, save " + defender.nickname + " from this misery.");
		},
	},
	"petrify": {
		displayName: "Petrify",
		description: "Reduces enemy speed, then deals damage for each point of speed missing from the opponent.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({spd: -1});
			new Animation("drawText", "" + defender.nickname + " is getting petrified!");
			defender.adjustHP(-1);
		},
	},
	"doublejeopardy": {
		displayName: "Double Jeopardy",
		description: "Prevent the opponent from using the same move twice, until they switch out.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			new Animation("drawText", "" + defender.nickname + " cannot use the same move twice in a row!");
		},
	},
	"doppelganger": {
		displayName: "Doppelganger",
		description: "Change into a copy of the enemy pokemon, taking their appearance, type, moves, and stats. Keep your HP and specialty, adding on to the copied specialty.",
		type: TYPE_VOID,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
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
			dealDamage(attacker, defender, this.type, this.bp); 
		},
	},
	"panicbite": {
		displayName: "Panic Bite",
		description: "Strong spirit attack, but fails if the opponent doesn't attack.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_ATTACK,
		bp: 5,
		priority: 1,

		moveFunc: function (attacker, defender) {
			// Hide for 1 turn then turn and deal damage next turn
			dealDamage(attacker, defender, this.type, this.bp); 
		},
	},
	"cobweb": {
		displayName: "Cobweb",
		description: "Entry hazard that reduces speed by 2 for enemy pokemon swapping in.",
		type: TYPE_AIR,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			new Animation("drawText", "A slowing cobweb was set up on the opponent's field!");
		},
	},
	"firespinner": {
		displayName: "Fire Spinner",
		description: "Reduce enemy defense and clears entry hazards and field effects.",
		type: TYPE_AIR,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			// Clears entry hazards
			new Animation("drawText", "" + attacker.nickname + " cleared obstacles and field effects with Featherduster!");
			attacker.adjustStats({def: -1});
		},
	},
	"cloudbarrier": {
		displayName: "Cloud Barrier",
		description: "Field effect that reduces all incoming damage by 1. Lasts for 3 turns and stays after swapping pokemon.",
		type: TYPE_EARTH,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			new Animation("drawText", "" + attacker.nickname + " created a cloud barrier! Incoming damage reduced for 3 turns!");
		},
	},
	"lure": {
		displayName: "Lure",
		description: "Force enemy pokemon to only use attack moves, preventing support moves for 3 turns.",
		type: TYPE_SPIRIT,
		moveType: MOVETYPE_SUPPORT,

		moveFunc: function (attacker, defender) {
			new Animation("drawText", "" + attacker.nickname + " lured " + defender.nickname + "! Support moves are prevented for 3 turns!");
		},
	},
}