var moveInfo = {
	"strong_atk_A": {
		displayName: "Strong Attack A",
		type: "A",
		moveType: "attack",
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"strong_atk_B": {
		displayName: "Strong Attack B",
		type: "B",
		moveType: "attack",
		bp: 3,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
		},
	},
	"big_strong_atk_A": {
		displayName: "Exhausting Attack A",
		type: "A",
		moveType: "attack",
		bp: 5,

		moveFunc: function (attacker, defender) {
			dealDamage(attacker, defender, this.type, this.bp);
			attacker.adjustStats({atk: -2});
		},
	},
	"atk_boost": {
		displayName: "Attack Boost",
		moveType: "support",

		moveFunc: function (attacker, defender) {
			attacker.adjustStats({atk: 2});
		}
	},
}