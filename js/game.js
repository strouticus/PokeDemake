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
	var damage = -1 * ((attacker.stats.atk + bp) - defender.stats.def);
	defender.adjustHP(damage);
}

function Pokemon (species, specialization, moves, nickname) {
	this.species = species;
	this.info = pokemonInfo[this.species];
	this.nickname = nickname || this.info.displayName;

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
	this.curHP += Math.floor(hpDiff);
	if (this.curHP < 0) {
		this.curHP = 0;
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
	if (LOGGING >= 3) {
		console.info("" + this.nickname + " used " + moveInfo[moveID].displayName + "!");
	}
	return moveInfo[moveID].moveFunc(this, defender);
}

Pokemon.prototype.handleTurnEnd = function () {
	if (this.effects.indexOf("toxic") >= 0) {
		this.adjustHP(-1 * this.toxicCounter);
		this.toxicCounter += 1;
	}
}


function Trainer (pokemonArray, userControl) {
	this.id = undefined;
	this.pokemon = pokemonArray;
	this.activePokemonIndex = 0;
	this.activePokemon = undefined;
	this.chosenAction = undefined;

	this.sideState = "normal";

	this.controlled = userControl;

	this.switchPokemon(0);
}

Trainer.prototype.switchPokemon = function (newPokemonID) {
	this.activePokemonIndex = newPokemonID;
	this.activePokemon = this.pokemon[newPokemonID];
}

Trainer.prototype.chooseAction = function (actionType, actionInfo) {
	this.chosenAction = new Action(actionType, actionInfo, this.trainerID);

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

	this.currentPhase = "";

	this.speedTieWinner = (Math.random() > 0.5) ? "trainerA" : "trainerB";
};

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
	updateUI(this);
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
	if (LOGGING >= 3) {
		console.info("---TURN END---");
	}

	this.trainerA.activePokemon.handleTurnEnd();
	this.trainerB.activePokemon.handleTurnEnd();

	this.trainerA.chosenAction = undefined;
	this.trainerB.chosenAction = undefined;
}




var curBattleState;

function main () {

	initUI();

	var testPokemon1 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu A");
	var testPokemon2 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu B");

	var testTrainerA = new Trainer([testPokemon1], true);
	var testTrainerB = new Trainer([testPokemon2], false);

	curBattleState = new BattleState(testTrainerA, testTrainerB);

	// testTrainerA.chooseAction(MOVE_ACTION, {moveID: "strong_atk_A"});
	// testTrainerB.chooseAction(MOVE_ACTION, {moveID: "strong_atk_B"});

	// testBattleState.handleTurnStart();

	updateUI(curBattleState);

}



