function initUI () {
	$("body").on("click", ".pokemon_move_button", function (e) {
		var buttonTrainer = $(this).closest("[data-trainer]").data("trainer");
		var buttonMoveID = $(this).data("move-id");
		curBattleState[buttonTrainer].chooseAction(MOVE_ACTION, {moveID: buttonMoveID});
	})

	$("body").on("click", ".pokemon_switch_button", function (e) {
		var buttonTrainer = $(this).closest("[data-trainer]").data("trainer");
		var buttonTrainerObj = curBattleState[buttonTrainer];
		var newPokemonIndex = $(this).data("switch-index") * 1;
		if (newPokemonIndex !== buttonTrainerObj.activePokemonIndex && buttonTrainerObj.pokemon[newPokemonIndex].alive) {
			buttonTrainerObj.chooseAction(SWITCH_ACTION, {newPokemonIndex: newPokemonIndex});
		}
	})
}

function updateUI (battleState) {
	updateTrainerSideUI("trainerA", battleState.trainerA);
	updateTrainerSideUI("trainerB", battleState.trainerB);
}

function updateTrainerSideUI (trainerID, trainerObj) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerID + "']");
	var trainerPokemon = trainerObj.activePokemon;

	trainerSideEl.find(".pokemon_name").empty().append(trainerPokemon.nickname);
	var hpPct = trainerPokemon.curHP / trainerPokemon.stats.hp;
	trainerSideEl.find(".pokemon_hp_inner").css({
		"transform": "scaleX(" + hpPct + ")",
	});
	trainerSideEl.find(".pokemon_hp_num").empty().append("" + trainerPokemon.curHP + " / " + trainerPokemon.stats.hp);
	trainerSideEl.find(".pokemon_atk").empty().append("ATK: " + trainerPokemon.stats.atk);
	trainerSideEl.find(".pokemon_def").empty().append("DEF: " + trainerPokemon.stats.def);
	trainerSideEl.find(".pokemon_spd").empty().append("SPD: " + trainerPokemon.stats.spd);

	var moveButtons = trainerSideEl.find(".pokemon_moves .pokemon_move_button");
	for (var i = 0; i < trainerPokemon.moves.length; i++) {
		var moveButtonEl = moveButtons.eq(i);
		moveButtonEl.data("move-id", trainerPokemon.moves[i]);
		moveButtonEl.find(".pokemon_move_name_text").empty().append(moveInfo[trainerPokemon.moves[i]].displayName);
	}

	var pokemonButtons = trainerSideEl.find(".pokemon_switch_button");
	for (var i = 0; i < trainerObj.pokemon.length; i++) {
		var pokemonButtonEl = pokemonButtons.eq(i);
		pokemonButtonEl.find(".switch_text").empty().append(trainerObj.pokemon[i].nickname);
		if (trainerObj.pokemon[i].alive) {
			pokemonButtonEl.removeClass("disabled");
		} else {
			pokemonButtonEl.addClass("disabled");
		}
	}

}