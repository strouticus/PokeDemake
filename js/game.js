document.addEventListener("DOMContentLoaded", function() {
	main();
});

var LOGGING = 3;

var SWITCH_ACTION = "SWITCH_ACTION";
var MOVE_ACTION = "MOVE_ACTION";

var curPokemon;
var curOpponent;

var animationQueue = [];

function dealDamage (attacker, defender, type, bp) {
	var isStab = (attacker.info.type === type);
	var moveEffectiveness = (typeInfo[type][defender.info.type]);
	var damage = (attacker.stats.atk + bp + (isStab ? 2 : 0)) - defender.stats.def;
	if (moveEffectiveness === EFFECTIVE_SUPER) {
		damage *= 2;
	} else if (moveEffectiveness === EFFECTIVE_WEAK) {
		damage *= 0.5;
	}
	damage = Math.ceil(damage);
	damage = Math.max(1, damage);
	defender.adjustHP(-1 * damage);

	if (LOGGING >= 3) {
		if (moveEffectiveness === EFFECTIVE_SUPER) {
			console.info("It's super effective!");
		} else if (moveEffectiveness === EFFECTIVE_WEAK) {
			console.info("It's not very effective...");
		}
	}
}

function Pokemon (species, specialization, moves, nickname) {
	this.species = species;
	this.info = pokemonInfo[this.species];
	this.nickname = nickname || this.info.displayName;

	this.alive = true;

	this.stats = {
		hp: this.info.stats.hp,
		atk: this.info.stats.atk,
		def: this.info.stats.def,
		spd: this.info.stats.spd,
	}

	for (var statName in specialization) {
		this.stats[statName] += specialization[statName];
	}

	this.moves = moves;

	this.curHP = this.stats.hp;

	this.effects = [];
	this.toxicCounter = 0;
}

Pokemon.prototype.adjustHP = function (hpDiff) {
	this.curHP += Math.ceil(hpDiff);
	if (this.curHP <= 0) {
		this.curHP = 0;
		this.alive = false;
		return;
	}
	if (this.curHP > this.stats.hp) {
		this.curHP = this.stats.hp;
	}
	if (LOGGING >= 3) {
		console.info("" + this.nickname + "'s HP is now " + this.curHP);
	}
}

Pokemon.prototype.adjustStats = function (statAdj) {
	for (var statName in statAdj) {
		this.stats[statName] += statAdj[statName];
	}
}

Pokemon.prototype.useMove = function (moveID, defender) {
	if (!this.alive) {
		return;
	}

	if (LOGGING >= 3) {
		console.info("" + this.nickname + " used " + moveInfo[moveID].displayName + "!");
	}
	moveInfo[moveID].moveFunc(this, defender);
}

Pokemon.prototype.handleTurnEnd = function () {
	if (this.alive) {
		if (this.effects.indexOf("toxic") >= 0) {
			this.adjustHP(-1 * this.toxicCounter);
			this.toxicCounter += 1;
		}
	}

	if (!this.alive) {
		if (LOGGING >= 3) {
			console.info("" + this.nickname + " has fainted!");
		}
	}
}


function Trainer (pokemonArray, userControl) {
	this.id = undefined;
	this.pokemon = pokemonArray;
	this.activePokemonIndex = 0;
	this.activePokemon = undefined;
	this.chosenAction = undefined;

	this.mustSwitch = false;

	this.sideState = "normal";

	this.controlled = userControl;
}

Trainer.prototype.switchPokemon = function (newPokemonID) {
	var prevNickname;
	if (this.activePokemon) {
		prevNickname = this.activePokemon.nickname;
	}

	this.activePokemonIndex = newPokemonID;
	this.activePokemon = this.pokemon[newPokemonID];

	updatePokemonUI(this);

	if (LOGGING >= 3) {
		if (prevNickname) {
			console.info("" + prevNickname + " was swapped out for " + this.activePokemon.nickname + "!");
		} else {
			console.info("Go! " + this.activePokemon.nickname + "!");
		}
	}
}

Trainer.prototype.chooseAction = function (actionType, actionInfo) {
	this.chosenAction = new Action(actionType, actionInfo, this.trainerID);

	// If this trainer needs to switch, and other trainer either: (doesn't need to switch) or (needs to switch and has chosen pokemon to switch to): Do mini switch turn
	if (this.mustSwitch) {
		if (actionType === SWITCH_ACTION) {
			var otherTrainerObj = curBattleState.getOtherTrainer(this);
			if (!otherTrainerObj.mustSwitch || otherTrainerObj.chosenAction.actionType === SWITCH_ACTION) {
				curBattleState.handlePokemonSwitch();
			}
		} else {
			this.chosenAction = undefined;
		}
		return;
	}

	if (curBattleState.trainerA.chosenAction && curBattleState.trainerB.chosenAction) {
		curBattleState.handleTurnStart();
	}
}


function Action (actionType, actionInfo, trainerID) {
	this.actionType = actionType;
	this.actionInfo = actionInfo;
	this.trainerID = trainerID;
}

function BattleState (trainerA, trainerB) {
	this.trainerA = trainerA;
	this.trainerB = trainerB;

	this.trainerA.id = "trainerA";
	this.trainerB.id = "trainerB";

	this.fieldState = "normal";

	this.speedTieWinner = (Math.random() > 0.5) ? "trainerA" : "trainerB";

	this.trainerA.switchPokemon(0);
	this.trainerB.switchPokemon(0);

	populatePokemonSwitchUI(this.getControlledTrainer());
};

BattleState.prototype.getControlledTrainer = function () {
	if (this.trainerA.controlled) {
		return this.trainerA;
	} else if (this.trainerB.controlled) {
		return this.trainerB;
	}
}

BattleState.prototype.getOtherTrainer = function (trainerIdentifier) {
	if (typeof trainerIdentifier === "string") {
		if (trainerIdentifier === "trainerA") {
			return this.trainerB;
		} else if (trainerIdentifier === "trainerB") {
			return this.trainerA;
		} else {
			console.info("Can't get other trainer; invalid trainer ID");
		}
	} else {
		if (trainerIdentifier === this.trainerA) {
			return this.trainerB;
		} else if (trainerIdentifier === this.trainerB) {
			return this.trainerA;
		} else {
			console.info("Can't get other trainer; invalid trainer ID");
		}
	}
}

BattleState.prototype.handleTurnStart = function () {
	if (LOGGING >= 3) {
		console.info("---TURN START---");
	}

	var trainerAAction = this.trainerA.chosenAction;
	var trainerBAction = this.trainerB.chosenAction;

	var trainerAFirst = true;

	if (trainerAAction.actionType === SWITCH_ACTION) {
		// If both switch out, order doesn't matter
		trainerAFirst = true;
	} else if (trainerBAction.actionType === SWITCH_ACTION) {
		trainerAFirst = false;
	} else {
		var trainerAMovePriority = moveInfo[trainerAAction.actionInfo.moveID].priority || 0;
		var trainerBMovePriority = moveInfo[trainerBAction.actionInfo.moveID].priority || 0;
		if (trainerAMovePriority > trainerBMovePriority) {
			trainerAFirst = true;
		} else if (trainerAMovePriority < trainerBMovePriority) {
			trainerAFirst = false;
		} else {
			var trainerASpeed = this.trainerA.activePokemon.stats.spd;
			var trainerBSpeed = this.trainerB.activePokemon.stats.spd;
			if (trainerASpeed > trainerBSpeed) {
				trainerAFirst = true;
			} else if (trainerASpeed < trainerBSpeed) {
				trainerAFirst = false;
			} else {
				var trainerABaseSpeed = this.trainerA.activePokemon.info.stats.spd;
				var trainerBBaseSpeed = this.trainerB.activePokemon.info.stats.spd;
				if (trainerABaseSpeed > trainerBBaseSpeed) {
					trainerAFirst = true;
				} else if (trainerABaseSpeed < trainerBBaseSpeed) {
					trainerAFirst = false;
				} else {
					if (this.speedTieWinner === "trainerA") {
						trainerAFirst = true;
						this.speedTieWinner = "trainerB";
					} else {
						trainerAFirst = false;
						this.speedTieWinner = "trainerA";
					}
				}
			}
		}
	}

	if (trainerAFirst) {
		this.handleAction(trainerAAction, "trainerA");
		this.handleAction(trainerBAction, "trainerB");
	} else {
		this.handleAction(trainerBAction, "trainerB");
		this.handleAction(trainerAAction, "trainerA");
	}

	this.handleTurnEnd();
	// updateUI(this);
}

BattleState.prototype.handleAction = function (actionToHandle, trainerID) {
	var trainerObj = this[trainerID];
	if (actionToHandle.actionType === SWITCH_ACTION) {
		trainerObj.switchPokemon(actionToHandle.actionInfo.newPokemonIndex);
	} else if (actionToHandle.actionType === MOVE_ACTION) {
		trainerObj.activePokemon.useMove(actionToHandle.actionInfo.moveID, this.getOtherTrainer(trainerObj).activePokemon);
	}
}

BattleState.prototype.handleTurnEnd = function () {
	this.trainerA.activePokemon.handleTurnEnd();
	this.trainerB.activePokemon.handleTurnEnd();

	this.trainerA.chosenAction = undefined;
	this.trainerB.chosenAction = undefined;

	if (!this.trainerA.activePokemon.alive) {
		this.trainerA.mustSwitch = true;
	}
	if (!this.trainerB.activePokemon.alive) {
		this.trainerB.mustSwitch = true;
	}

	if (LOGGING >= 3) {
		console.info("---TURN END---");
	}
}

BattleState.prototype.handlePokemonSwitch = function () {
	if (this.trainerA.mustSwitch) {
		this.handleAction(this.trainerA.chosenAction, "trainerA");
		this.trainerA.mustSwitch = false;
	}
	if (this.trainerB.mustSwitch) {
		this.handleAction(this.trainerB.chosenAction, "trainerB");
		this.trainerB.mustSwitch = false;
	}

	this.trainerA.chosenAction = undefined;
	this.trainerB.chosenAction = undefined;

	// updateUI(this);
}




var curBattleState;

function main () {

	initUI();

	var testPokemon1 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu A");
	var testPokemon2 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu B");

	var testPokemon3 = new Pokemon("testA", {spd: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu C");
	var testPokemon4 = new Pokemon("testA", {def: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu D");

	var testTrainerA = new Trainer([testPokemon1, testPokemon3], true);
	var testTrainerB = new Trainer([testPokemon2, testPokemon4], false);

	curBattleState = new BattleState(testTrainerA, testTrainerB);

	// testTrainerA.chooseAction(MOVE_ACTION, {moveID: "strong_atk_A"});
	// testTrainerB.chooseAction(MOVE_ACTION, {moveID: "strong_atk_B"});

	// testBattleState.handleTurnStart();

	// updateUI(curBattleState);

}



