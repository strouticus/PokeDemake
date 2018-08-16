var TYPE_WATER = "water";
var TYPE_EARTH = "earth";
var TYPE_FIRE = "fire";
var TYPE_AIR = "air";
var TYPE_SPIRIT = "spirit";
var TYPE_VOID = "void";

var EFFECTIVE_WEAK = 0;
var EFFECTIVE_NEUTRAL = 1;
var EFFECTIVE_SUPER = 2;

var typeInfo = {
	water: {
		displayName: "Water",
		water: EFFECTIVE_NEUTRAL,
		earth: EFFECTIVE_SUPER,
		fire: EFFECTIVE_SUPER,
		air: EFFECTIVE_NEUTRAL,
		spirit: EFFECTIVE_WEAK,
		void: EFFECTIVE_WEAK,
	},
	earth: {
		displayName: "Earth",
		water: EFFECTIVE_WEAK,
		earth: EFFECTIVE_NEUTRAL,
		fire: EFFECTIVE_SUPER,
		air: EFFECTIVE_SUPER,
		spirit: EFFECTIVE_NEUTRAL,
		void: EFFECTIVE_WEAK,
	},
	fire: {
		displayName: "Fire",
		water: EFFECTIVE_WEAK,
		earth: EFFECTIVE_WEAK,
		fire: EFFECTIVE_NEUTRAL,
		air: EFFECTIVE_SUPER,
		spirit: EFFECTIVE_SUPER,
		void: EFFECTIVE_NEUTRAL,
	},
	air: {
		displayName: "Air",
		water: EFFECTIVE_NEUTRAL,
		earth: EFFECTIVE_WEAK,
		fire: EFFECTIVE_WEAK,
		air: EFFECTIVE_NEUTRAL,
		spirit: EFFECTIVE_SUPER,
		void: EFFECTIVE_SUPER,
	},
	spirit: {
		displayName: "Spirit",
		water: EFFECTIVE_SUPER,
		earth: EFFECTIVE_NEUTRAL,
		fire: EFFECTIVE_WEAK,
		air: EFFECTIVE_WEAK,
		spirit: EFFECTIVE_NEUTRAL,
		void: EFFECTIVE_SUPER,
	},
	void: {
		displayName: "Void",
		water: EFFECTIVE_SUPER,
		earth: EFFECTIVE_SUPER,
		fire: EFFECTIVE_NEUTRAL,
		air: EFFECTIVE_WEAK,
		spirit: EFFECTIVE_WEAK,
		void: EFFECTIVE_NEUTRAL,
	},
}

var pokemonInfo = {
	"testA": {
		displayName: "Test A Mon",
		type: TYPE_WATER,
		stats: {
			hp: 12,
			atk: 4,
			def: 3,
			spd: 4
		},
		moves: [
			"strong_atk_A",
			"strong_atk_B",
			"atk_boost",
			"big_strong_atk_A"
		],
	}
}