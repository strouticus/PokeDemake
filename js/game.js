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
	if (defender.hasEffect("hidden")) {
		new Animation("drawText", "But it missed!");
	} else if (defender.hasEffect("protected")) {
		new Animation("drawText", "" + defender.nickname + " protected itself!");
	} else {
		var isStab = (attacker.type === type);
		var moveEffectiveness = (typeInfo[type][defender.type]);
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

}

function Pokemon (species, specialization, moves, nickname) {
	this.species = species;
	this.info = pokemonInfo[this.species];
	this.nickname = nickname || this.info.displayName;

	this.alive = true;

	this.type = this.info.type;

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

	this.lockInNextMove = undefined;
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

Pokemon.prototype.addEffect = function (effectName) {
	if (this.effects.indexOf(effectName) === -1) {
		this.effects.push(effectName);
		var effectInfo = effectsInfo[effectName];
		if (typeof effectInfo.initFunc === "function") {
			effectInfo.initFunc(this);
		}
	}
}

Pokemon.prototype.hasEffect = function (effectName) {
	return (this.effects.indexOf(effectName) >= 0);
}

Pokemon.prototype.removeEffect = function (effectName) {
	var effectIndex = this.effects.indexOf(effectName);
	if (effectIndex >= 0) {
		this.effects.splice(effectIndex, 1);
		if (typeof effectsInfo[effectName].removeFunc === "function") {
			effectsInfo[effectName].removeFunc(this);
		}
	}
}

Pokemon.prototype.removeNegativeEffects = function () {
	for (var i = this.effects.length - 1; i >= 0; i--) {
		if (effectsInfo[this.effects[i]].negativeEffect) {
			this.removeEffect(this.effects[i]);
		}
	}
}

Pokemon.prototype.removeSwitchEffects = function () {
	for (var i = this.effects.length - 1; i >= 0; i--) {
		if (effectsInfo[this.effects[i]].removeOnSwitch) {
			this.removeEffect(this.effects[i]);
		}
	}
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
	var displayedProtectMessage = false;
	for (var statName in statAdj) {
		if (statAdj[statName] < 0 && this.hasEffect("protected")) {
			if (!displayedProtectMessage) {
				new Animation("drawText", "" + this.nickname + " protected itself!");
				displayedProtectMessage = true;
			}
		} else {
			this.stats[statName] += statAdj[statName];
			new Animation("updateStats", {trainerObj: ownerTrainer, curAtk: this.stats.atk, curDef: this.stats.def, curSpd: this.stats.spd});
			var raisedOrLowered = ((statAdj[statName] >= 0) ? "raised" : "lowered");
			new Animation("drawText", "" + this.nickname + "'s " + statName.toUpperCase() + " was " + raisedOrLowered + " by " + statAdj[statName] + "!");
		}
	}
}

Pokemon.prototype.resetStats = function () {
	this.stats = {
		hp: this.info.stats.hp,
		atk: this.info.stats.atk,
		def: this.info.stats.def,
		spd: this.info.stats.spd,
	}

	for (var statName in this.specialization) {
		this.stats[statName] += this.specialization[statName];
	}
}

Pokemon.prototype.removeStatBoosts = function () {
	for (var statName in this.stats) {
		var statDiff = this.stats[statName] - (this.info.stats[statName] + (this.specialization[statName] || 0));
		if (statDiff > 0) {
			this.stats[statName] = this.info.stats[statName] + (this.specialization[statName] || 0);
		}
	}
}

Pokemon.prototype.useMove = function (moveID, defender) {
	if (!this.alive) {
		return;
	}

	if (!moveInfo[moveID].noDisplayMoveName) {
		new Animation("drawText", "" + this.nickname + " used " + moveInfo[moveID].displayName + "!");
	}

	moveInfo[moveID].moveFunc(this, defender);
}

Pokemon.prototype.lockInMove = function (nextMoveName) {
	this.lockInNextMove = nextMoveName;
}

Pokemon.prototype.handleTurnEnd = function () {
	if (this.alive) {
		// Run through effects, and run any handleTurnEnd functions there
		for (var i = this.effects.length - 1; i >= 0; i--) {
			if (typeof effectsInfo[this.effects[i]].turnEndFunc === "function") {
				effectsInfo[this.effects[i]].turnEndFunc(this);
			}
		}
	}

	if (!this.alive) {
		new Animation("drawText", "" + this.nickname + " has fainted!");
		new Animation("recallPokemon", {trainerObj: curBattleState.getTrainerFromPokemon(this)});
	}
}

Pokemon.prototype.getTrainer = function () {
	return curBattleState.getTrainerFromPokemon(this);
}


function Trainer (nickname, pokemonArray, userControl) {
	this.id = undefined;
	this.nickname = nickname;
	this.pokemon = pokemonArray;
	this.activePokemonIndex = undefined;
	this.activePokemon = undefined;
	this.chosenAction = undefined;

	this.mustSwitch = true;

	this.effects = [];

	this.controlled = userControl;

	this.lastUsedMove = undefined;

	this.invertTempoCounter = 0;
	this.barrierCounter = 0;
}

Trainer.prototype.switchPokemon = function (newPokemonID) {
	var prevNickname;
	var prevWasAlive = false;
	if (this.activePokemon) {
		prevNickname = this.activePokemon.nickname;
		if (this.activePokemon.alive) {
			prevWasAlive = true;
		}
		this.activePokemon.removeSwitchEffects();
	}

	this.activePokemonIndex = newPokemonID;
	this.activePokemon = this.pokemon[newPokemonID];

	this.activePokemon.resetStats();

	// updatePokemonUI(this);

	if (prevNickname && prevWasAlive) {
		new Animation("drawText", "Come back, " + prevNickname + "!");
		new Animation("recallPokemon", {trainerObj: this});
	}
	new Animation("drawText", "Go! " + this.activePokemon.nickname + "!");
	new Animation("updatePokemon", {trainerObj: this, forceHPNum: this.activePokemon.curHP});

	for (var i = this.effects.length - 1; i >= 0; i--) {
		if (typeof this.effects[i].switchInFunc === "function") {
			this.effects[i].switchInFunc(this);
		}
	}
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

	if (actionType === MOVE_ACTION) {
		this.lastUsedMove = actionInfo.moveID;
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

Trainer.prototype.handleTurnEnd = function () {
	this.activePokemon.handleTurnEnd();

	for (var i = this.effects.length - 1; i >= 0; i--) {
		if (typeof effectsInfo[this.effects[i]].turnEndFunc === "function") {
			effectsInfo[this.effects[i]].turnEndFunc(this);
		}
	}
}

Trainer.prototype.addEffect = function (effectName) {
	if (this.effects.indexOf(effectName) === -1) {
		this.effects.push(effectName);
		var effectInfo = effectsInfo[effectName];
		if (typeof effectInfo.initFunc === "function") {
			effectInfo.initFunc(this);
		}
	}
}

Trainer.prototype.hasEffect = function (effectName) {
	return (this.effects.indexOf(effectName) >= 0);
}

Trainer.prototype.removeEffect = function (effectName) {
	var effectIndex = this.effects.indexOf(effectName);
	if (effectIndex >= 0) {
		this.effects.splice(effectIndex, 1);
		if (typeof effectsInfo[effectName].removeFunc === "function") {
			effectsInfo[effectName].removeFunc(this);
		}
	}
}

Trainer.prototype.removeAllEffects = function () {
	this.effects = [];
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
		var controlledTrainer = this.getControlledTrainer();
		if (controlledTrainer.activePokemon.lockInNextMove) {
			var storeLastMove = controlledTrainer.lastUsedMove;
			controlledTrainer.chooseAction(MOVE_ACTION, {moveID: controlledTrainer.activePokemon.lockInNextMove}, controlledTrainer.id);
			controlledTrainer.activePokemon.lockInNextMove = false;
			controlledTrainer.lastUsedMove = storeLastMove;
		}
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
			var invertedSpeed = this.trainerA.hasEffect("invert_tempo");
			if (invertedSpeed) {
				var swap = trainerASpeed;
				trainerASpeed = trainerBSpeed;
				trainerBSpeed = swap;
			}
			if (trainerASpeed > trainerBSpeed) {
				trainerAFirst = true;
			} else if (trainerASpeed < trainerBSpeed) {
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
	// this.trainerA.activePokemon.handleTurnEnd();
	// this.trainerB.activePokemon.handleTurnEnd();

	this.trainerA.handleTurnEnd();
	this.trainerB.handleTurnEnd();

	if (this.trainerA.invertTempoCounter >= 6) {
		new Animation("drawText", "Tempo has returned to normal!");
		this.trainerA.removeEffect("invert_tempo");
		this.trainerB.removeEffect("invert_tempo");
	}

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


function checkLocalStorage () {
	var storedTeams = localStorage.getItem("pokedemake__stored_teams");
	if (storedTeams) {
		clientTeams = JSON.parse(storedTeams);
		var storedSelectedTeam = localStorage.getItem("pokedemake__selected_team");
		if (storedSelectedTeam) {
			curSelectedTeam = storedSelectedTeam;
		} else {
			curSelectedTeam = Object.keys(clientTeams)[0];
		}
	}

	var storedNickname = localStorage.getItem("pokedemake__nickname");
	if (storedNickname) {
		updateNickname(storedNickname);
	}
}

function updateLocalStorageTeams () {
	localStorage.setItem("pokedemake__stored_teams", JSON.stringify(clientTeams));
}
function updateLocalStorageSelectedTeam () {
	localStorage.setItem("pokedemake__selected_team", curSelectedTeam);
}
function updateLocalStorageNickname (newNickname) {
	localStorage.setItem("pokedemake__nickname", newNickname);
}

// var testPokemon1 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu A");
// var testPokemon2 = new Pokemon("testA", {atk: 1}, ["strong_atk_A", "strong_atk_B", "atk_boost", "big_strong_atk_A"], "Pikachu B");
// var tempTeam = [testPokemon1, testPokemon2];

var curBattleState;

function main () {

	initUI();

	initNetplay();

	checkLocalStorage();

	if (curNickname) {
		nav.go(["netplay_lobby"], "app");
	} else {
		nav.go(["enter_nickname"], "app");
	}

	// enterTeamBuilderUI();

}



