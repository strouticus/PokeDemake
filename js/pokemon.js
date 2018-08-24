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
};

var pokemonInfo = {
	"testA": {
		displayName: "Test A Mon",
		type: TYPE_WATER,
		stats: {
			hp: 12,
			atk: 4,
			def: 3,
			spd: 4,
		},
		moves: [
			"strong_atk_A",
			"strong_atk_B",
			"atk_boost",
			"big_strong_atk_A",
		],
		flavor: "Wait a second, this is just a temporary placeholder!",
	},

	"gunsquid": {
		displayName: "Gunsquid",
		type: TYPE_WATER,
		stats: {
			hp: 12,
			atk: 4,
			def: 2,
			spd: 8,
		},
		moves: [
			"waterblast",
			"airshot",
			"combust",
			"poisonspray",
		],
		flavor: "This squid's gun was purchased illegally.",
	},

	"rockster": {
		displayName: "Rockster",
		type: TYPE_EARTH,
		stats: {
			hp: 15,
			atk: 2,
			def: 5,
			spd: 2,
		},
		moves: [
			"digstrike",
			"rockpunch",
			"gravity",
			"ghostguard",
		],
		flavor: "Full name Rockamillion Daniel James. Hates fragile things and fragile people.",
	},

	"sparky": {
		displayName: "Sparky",
		type: TYPE_FIRE,
		stats: {
			hp: 10,
			atk: 6,
			def: 1,
			spd: 6,
		},
		moves: [
			"combust",
			"firespinner",
			"negation",
			"backwind",
		],
		flavor: "Sparky wanted to join the police, but failed the entrance exam. Now he lives to fight to the death.",
	},

	"cloudfigure": {
		displayName: "Cloudfigure",
		type: TYPE_AIR,
		stats: {
			hp: 13,
			atk: 4,
			def: 4,
			spd: 6,
		},
		moves: [
			"airshot",
			"backwind",
			"ghostpunch",
			"ghostguard",
			"cloudbarrier",
		],
		flavor: "A cloud who passed away long ago, but lives on as a cloud ghost.",
	},

	"bottlespirit": {
		displayName: "Bottlespirit",
		type: TYPE_SPIRIT,
		stats: {
			hp: 11,
			atk: 3,
			def: 3,
			spd: 7,
		},
		moves: [
			"spiketrap",
			"drain",
			"poisonspray",
			"inverttempo",
		],
		flavor: "He dreamed of becoming a ghost. He's achieved that, but he doesn't know what to do now.",
	},

	"blackhole": {
		displayName: "Black Hole",
		type: TYPE_VOID,
		stats: {
			hp: 14,
			atk: 5,
			def: 3,
			spd: 5,
		},
		moves: [
			"gravity",
			"negation",
			"eventhorizon",
			"radiation",
		],
		flavor: "A living black hole that can obey basic commands. Keep it on a tight leash.",
	},

	"doublemedusa": {
		displayName: "Double Medusa",
		type: TYPE_EARTH,
		stats: {
			hp: 12,
			atk: 3,
			def: 3,
			spd: 5,
		},
		moves: [
			"petrify",
			"digstrike",
			"poisonspray",
			"doublejeopardy",
			"panicbite",
		],
		flavor: "The body of a snake with the head of a snake. Has snakes for hair and a deadly gaze.",
	},

	"airachnid": {
		displayName: "Airachnid",
		type: TYPE_AIR,
		stats: {
			hp: 11,
			atk: 5,
			def: 2,
			spd: 7,
		},
		moves: [
			"airshot",
			"backwind",
			"panicbite",
			"flyingstrike",
			"cobweb",
			"featherduster",
		],
		flavor: "After wishing for the ability to fly, this spider became a horrible abomination that should not exist.",
	},

	"sameguy": {
		displayName: "Sameguy",
		type: TYPE_VOID,
		stats: {
			hp: 14,
			atk: 5,
			def: 3,
			spd: 5,
		},
		moves: [
			"doppelganger",
			"gravity",
			"ghostpunch",
			"digstrike",
		],
		flavor: "We didn't write a description for this creature. Click here to edit.",
	},

	"harmlessjoe": {
		displayName: "Harmless Joe",
		type: TYPE_WATER,
		stats: {
			hp: 14,
			atk: 3,
			def: 3,
			spd: 6,
		},
		moves: [
			"panicbite",
			"waterblast",
			"lure",
			"featherduster",
		],
		flavor: "Harmless Joe is a nice fish who doesn't hurt anyone... usually.",
	},

	"catfirewall": {
		displayName: "Catfirewall",
		type: TYPE_FIRE,
		stats: {
			hp: 12,
			atk: 3,
			def: 5,
			spd: 3,
		},
		moves: [
			"airshot",
			"combust",
			"firespinner",
			"ghostguard",
			"inverttempo",
			"radiation",
		],
		flavor: "A bizzare creature. 50% cat, 50% fire, 50% wall. Hates water immensely.",
	},

	"ghostpuncher": {
		displayName: "Ghostpuncher",
		type: TYPE_SPIRIT,
		stats: {
			hp: 13,
			atk: 4,
			def: 3,
			spd: 6,
		},
		moves: [
			"ghostpunch",
			"ghostguard",
			"drain",
			"airshot",
			"backwind",
			"flyingstrike",
		],
		flavor: "He doesn't discriminate between ghosts and non-ghosts. Anyone can be a recipient of The Fist.",
	},
};
