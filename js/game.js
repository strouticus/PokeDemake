document.addEventListener("DOMContentLoaded", function() {
	main();
});

var LOGGING = 3;

var SWITCH_ACTION = "SWITCH_ACTION";
var MOVE_ACTION = "MOVE_ACTION";
var WAIT_ACTION = "WAIT_ACTION";

var curPokemon;
var curOpponent;

var animationQueue = [];

var clientTeams = {};

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

	if (moveEffectiveness === EFFECTIVE_SUPER) {
		new Animation("drawText", "It's super effective!");
	} else if (moveEffectiveness === EFFECTIVE_WEAK) {
		new Animation("drawText", "It's not very effective...");
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

	this.specialization = specialization;

	for (var statName in specialization) {
		this.stats[statName] += specialization[statName];
	}

	this.moves = moves;

	this.curHP = this.stats.hp;

	this.effects = [];
	this.toxicCounter = 0;
}

Pokemon.prototype.export = function () {
	return {
		species: this.species,
		specialization: this.specialization,
		moves: this.moves,
		nickname: this.nickname,
	};
}

function importPokemon (pokemonData) {
	return new Pokemon(
		pokemonData.species,
		pokemonData.specialization,
		pokemonData.moves,
		pokemonData.nickname,
	);
}

Pokemon.prototype.adjustHP = function (hpDiff) {
	this.curHP += Math.ceil(hpDiff);
	if (this.curHP > this.stats.hp) {
		this.curHP = this.stats.hp;
	}
	if (this.curHP <= 0) {
		this.curHP = 0;
		this.alive = false;
	}
	var ownerTrainer = curBattleState.getTrainerFromPokemon(this);
	new Animation("updateHP", {trainerObj: ownerTrainer, forceHPNum: this.curHP});
	if (LOGGING >= 3) {
		console.info("" + this.nickname + "'s HP is now " + this.curHP);
	}
}

Pokemon.prototype.adjustStats = function (statAdj) {
	var ownerTrainer = curBattleState.getTrainerFromPokemon(this);
	for (var statName in statAdj) {
		this.stats[statName] += statAdj[statName];
		new Animation("updateStats", {trainerObj: ownerTrainer});
		new Animation("drawText", "" + this.nickname + "'s " + statName.toUpperCase() + " was raised by " + statAdj[statName] + "!");
	}
}

Pokemon.prototype.useMove = function (moveID, defender) {
	if (!this.alive) {
		return;
	}

	new Animation("drawText", "" + this.nickname + " used " + moveInfo[moveID].displayName + "!");

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
		new Animation("drawText", "" + this.nickname + " has fainted!");
		new Animation("recallPokemon", {trainerObj: curBattleState.getTrainerFromPokemon(this)});
	}
}


function Trainer (nickname, pokemonArray, userControl) {
	this.id = undefined;
	this.nickname = nickname;
	this.pokemon = pokemonArray;
	this.activePokemonIndex = undefined;
	this.activePokemon = undefined;
	this.chosenAction = undefined;

	this.mustSwitch = true;

	this.sideState = "normal";

	this.controlled = userControl;
}

Trainer.prototype.switchPokemon = function (newPokemonID) {
	var prevNickname;
	var prevWasAlive = false;
	if (this.activePokemon) {
		prevNickname = this.activePokemon.nickname;
		if (this.activePokemon.alive) {
			prevWasAlive = true;
		}
	}

	this.activePokemonIndex = newPokemonID;
	this.activePokemon = this.pokemon[newPokemonID];

	// updatePokemonUI(this);

	if (prevNickname && prevWasAlive) {
		new Animation("drawText", "Come back, " + prevNickname + "!");
		new Animation("recallPokemon", {trainerObj: this});
	}
	new Animation("drawText", "Go! " + this.activePokemon.nickname + "!");
	new Animation("updatePokemon", {trainerObj: this, forceHPNum: this.activePokemon.curHP});
}

Trainer.prototype.chooseAction = function (actionType, actionInfo) {
	this.chosenAction = new Action(actionType, actionInfo, this.trainerID);

	if (this.controlled) {
		nav.go(["wait_for_opponent"], "battle_ui");
		sendActionData(actionType, actionInfo, this.trainerID);
	}


	if (curBattleState.trainerA.chosenAction && curBattleState.trainerB.chosenAction) {
		if (curBattleState.trainerA.mustSwitch || curBattleState.trainerB.mustSwitch) {
			curBattleState.handlePokemonSwitch();
		} else {
			curBattleState.handleTurnStart();
		}
	}

	return;

	// If this trainer needs to switch, and other trainer either: (doesn't need to switch) or (needs to switch and has chosen pokemon to switch to): Do mini switch turn
	// if (this.mustSwitch) {
	// 	if (actionType === SWITCH_ACTION) {
	// 		var otherTrainerObj = curBattleState.getOtherTrainer(this);
	// 		if (!otherTrainerObj.mustSwitch || (otherTrainerObj.chosenAction && otherTrainerObj.chosenAction.actionType === SWITCH_ACTION)) {
	// 			curBattleState.handlePokemonSwitch();
	// 		}
	// 	} else {
	// 		this.chosenAction = undefined;
	// 	}
	// } else {
	// 	if (curBattleState.trainerA.chosenAction && curBattleState.trainerB.chosenAction) {
	// 		curBattleState.handleTurnStart();
	// 	}
	// }

}


function Action (actionType, actionInfo, trainerID) {
	this.actionType = actionType;
	this.actionInfo = actionInfo;
	this.trainerID = trainerID;
}

function handleOtherActionData (data) {
	var opponentTrainerObj = curBattleState.getOpponentTrainer();
	opponentTrainerObj.chooseAction(data.actionType, data.actionInfo, opponentTrainerObj.id);
}

function BattleState (trainerA, trainerB, speedTieWinner) {
	this.trainerA = trainerA;
	this.trainerB = trainerB;

	this.trainerA.id = "trainerA";
	this.trainerB.id = "trainerB";

	this.fieldState = "normal";

	// this.speedTieWinner = (Math.random() > 0.5) ? "trainerA" : "trainerB";
	this.speedTieWinner = speedTieWinner;

	// this.trainerA.switchPokemon(0);
	// this.trainerB.switchPokemon(0);
	updatePokemonUI(this.trainerA);
	updatePokemonUI(this.trainerB);

	this.phase = "";

	populatePokemonSwitchUI(this.getControlledTrainer());
};

function handleBattleInitData (battleData) {
	var teamAPokemon = battleData.teamA.map(importPokemon);
	var teamBPokemon = battleData.teamB.map(importPokemon);

	var trainerAControl = battleData.myTrainer === "trainerA";
	var trainerBControl = battleData.myTrainer === "trainerB";

	var newTrainerA = new Trainer("Trainer A", teamAPokemon, trainerAControl);
	var newTrainerB = new Trainer("Trainer B", teamBPokemon, trainerBControl);

	curBattleState = new BattleState(newTrainerA, newTrainerB, battleData.speedTie);

	updateTrainerSides(curBattleState);

	// Start the battle!
	nav.go(["battle_view"], "app");

	curBattleState.setPhase("force_switch_pokemon");
}

BattleState.prototype.setPhase = function (phaseName) {
	if (phaseName === "force_switch_pokemon") {
		if (this.getControlledTrainer().mustSwitch) {
			nav.go(["choose_action", "choose_pokemon"], "battle_ui");
		} else {
			nav.go(["wait_for_opponent"], "battle_ui");
			var controlledTrainer = this.getControlledTrainer();
			controlledTrainer.chooseAction(WAIT_ACTION, {}, controlledTrainer.id);
		}
	} else if (phaseName === "handle_turn") {
		nav.go(["text_box"], "battle_ui");
	} else if (phaseName === "handle_force_switch_pokemon") {
		nav.go(["text_box"], "battle_ui");
	} else if (phaseName === "choose_action") {
		nav.go(["choose_action", "choose_category"], "battle_ui");
	}
	
	this.phase = phaseName;
}

BattleState.prototype.getControlledTrainer = function () {
	if (this.trainerA.controlled) {
		return this.trainerA;
	} else if (this.trainerB.controlled) {
		return this.trainerB;
	}
}

BattleState.prototype.getOpponentTrainer = function () {
	if (this.trainerA.controlled) {
		return this.trainerB;
	} else if (this.trainerB.controlled) {
		return this.trainerA;
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

BattleState.prototype.getTrainerFromPokemon = function (pokemonObj) {
	if (this.trainerA.pokemon.indexOf(pokemonObj) >= 0) {
		return this.trainerA;
	} else if (this.trainerB.pokemon.indexOf(pokemonObj) >= 0) {
		return this.trainerB;
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

	this.setPhase("handle_turn");
	handleNextAnimation();

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

	this.setPhase("handle_force_switch_pokemon");
	handleNextAnimation();

	// updateUI(this);
}

var testPokemon1 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu A");
var testPokemon2 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu B");
var tempTeam = [testPokemon1, testPokemon2];

var curBattleState;

function main () {

	initUI();

	initNetplay();

	// nav.go(["enter_nickname"], "app");
	enterTeamBuilderUI();

}



