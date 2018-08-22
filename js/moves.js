var MOVETYPE_ATTACK = "attack";
var MOVETYPE_SUPPORT = "support";

var moveInfo = {

	// Placeholder moves
	"strong_atk_A": {
		displayName: "Strong Attack A",
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"strong_atk_B": {
		displayName: "Strong Attack B",
		type: TYPE_VOID,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"big_strong_atk_A": {
		displayName: "Exhausting Attack A",
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
		moveType: MOVETYPE_SUPPORT,
		type: TYPE_SPIRIT,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({atk: 2});
		},
	},
	"def_boost": {
		displayName: "Defense Boost",
		moveType: MOVETYPE_SUPPORT,
		type: TYPE_VOID,

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({def: 2});
		},
	},

	// Actual moves
	"waterblast": {
		displayName: "Water Blast",
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"airshot": {
		displayName: "Air Shot",
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
		type: TYPE_WATER,
		moveType: MOVETYPE_ATTACK,

		moveFunc: function (attacker, defender) {
			// Apply a DOT on the defender
		},
	},

}