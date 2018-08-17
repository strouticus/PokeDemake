var resizeTimer;

var moveButtonEls;
var pokemonSwitchEls;

function initUI () {
	nav.getContexts();

	moveButtonEls = $(".ui_scene .pokemon_move_buttons .pokemon_move_button");
	pokemonSwitchEls = $(".ui_scene .pokemon_switch_buttons .pokemon_switch_button");

	$("body").on("mousedown", ".touchable", function(e) {
		$(this).addClass("touched");
		setTimeout(function() {
			$(this).removeClass("touched");
		}.bind(this), 800);
	})

	$("body").on("click", ".pokemon_move_button", function (e) {
		// var buttonTrainer = $(this).closest("[data-trainer]").data("trainer");
		var buttonMoveID = $(this).data("move-id");
		// curBattleState[buttonTrainer].chooseAction(MOVE_ACTION, {moveID: buttonMoveID});
		curBattleState.getControlledTrainer().chooseAction(MOVE_ACTION, {moveID: buttonMoveID});
	})

	$("body").on("click", ".pokemon_switch_button", function (e) {
		// var buttonTrainer = $(this).closest("[data-trainer]").data("trainer");
		// var buttonTrainerObj = curBattleState[buttonTrainer];
		var buttonTrainerObj = curBattleState.getControlledTrainer();
		var newPokemonIndex = $(this).data("switch-index") * 1;
		if (newPokemonIndex !== buttonTrainerObj.activePokemonIndex && buttonTrainerObj.pokemon[newPokemonIndex].alive) {
			buttonTrainerObj.chooseAction(SWITCH_ACTION, {newPokemonIndex: newPokemonIndex});
		}
	})

	$("body").on("click", ".slideout_toggle", function (e) {
		$(this).closest(".pokemon_info_box_container").toggleClass("show_slideout");
	})

	$("body").on("click", "[data-js-nav]", function (e) {
		var thisContext = $(this).data("js-nav-context");
		if (!thisContext) {
			thisContext = $(this).closest("[data-nav-context]").data("nav-context");
		}
		nav.go($(this).data("js-nav"), thisContext);
	})

	$(window).on("resize", function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function() {
			resize(3);
		}, 25);
	});



    resize(3);

    nav.go(["battle_view"], "app");
    nav.go(["choose_action"], "battle_ui");
}

var bh;
var bw;
var fontSize;
function resize (count) {
	resizeTimer = setTimeout(function() {
		if (count > 0) {
			resize(count - 1);
		}
	}, 100);

	bh = $("#body").height();
	bw = $("#body").width();
	var ws = bw/1536;
	var hs = bh/1080;
	var ss = ws < hs ? ws : hs;

	fontSize = ss*100;

	$("html").css("font-size", fontSize + "px");
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
	trainerSideEl.find(".pokemon_atk .stat_num").empty().append(trainerPokemon.stats.atk);
	trainerSideEl.find(".pokemon_atk .stat_bar").css("width", (trainerPokemon.stats.atk * 0.15) + "rem");
	trainerSideEl.find(".pokemon_def .stat_num").empty().append(trainerPokemon.stats.def);
	trainerSideEl.find(".pokemon_def .stat_bar").css("width", (trainerPokemon.stats.def * 0.15) + "rem");
	trainerSideEl.find(".pokemon_spd .stat_num").empty().append(trainerPokemon.stats.spd);
	trainerSideEl.find(".pokemon_spd .stat_bar").css("width", (trainerPokemon.stats.spd * 0.15) + "rem");

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

function updatePokemonUI (trainerObj) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerObj.id + "']");
	var trainerPokemon = trainerObj.activePokemon;

	trainerSideEl.find(".pokemon_name").empty().append(trainerPokemon.nickname);
	updatePokemonHPUI(trainerObj);
	updatePokemonStatsUI(trainerObj);

	if (trainerObj.controlled) {
		updatePokemonMovesUI(trainerObj);
	}
}

function updatePokemonHPUI (trainerObj) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerObj.id + "']");
	var trainerPokemon = trainerObj.activePokemon;

	var hpPct = trainerPokemon.curHP / trainerPokemon.stats.hp;
	trainerSideEl.find(".pokemon_hp_inner").css({
		"transform": "scaleX(" + hpPct + ")",
	});
	trainerSideEl.find(".pokemon_hp_num").empty().append("" + trainerPokemon.curHP + " / " + trainerPokemon.stats.hp);
}

function updatePokemonStatsUI (trainerObj) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerObj.id + "']");
	var trainerPokemon = trainerObj.activePokemon;

	trainerSideEl.find(".pokemon_atk .stat_num").empty().append(trainerPokemon.stats.atk);
	trainerSideEl.find(".pokemon_atk .stat_bar").css("width", (trainerPokemon.stats.atk * 0.15) + "rem");
	trainerSideEl.find(".pokemon_def .stat_num").empty().append(trainerPokemon.stats.def);
	trainerSideEl.find(".pokemon_def .stat_bar").css("width", (trainerPokemon.stats.def * 0.15) + "rem");
	trainerSideEl.find(".pokemon_spd .stat_num").empty().append(trainerPokemon.stats.spd);
	trainerSideEl.find(".pokemon_spd .stat_bar").css("width", (trainerPokemon.stats.spd * 0.15) + "rem");
}

function updatePokemonMovesUI (trainerObj) {
	var trainerPokemon = trainerObj.activePokemon;

	for (var i = 0; i < trainerPokemon.moves.length; i++) {
		var moveButtonEl = moveButtonEls.eq(i);
		moveButtonEl.data("move-id", trainerPokemon.moves[i]);
		moveButtonEl.find(".pokemon_move_name_text").empty().append(moveInfo[trainerPokemon.moves[i]].displayName);
	}
}

function populatePokemonSwitchUI (trainerObj) {
	for (var i = 0; i < 6; i++) {
		var buttonEnabled = true;
		var pokemonButtonEl = pokemonSwitchEls.eq(i);
		var pokemonButtonElText = pokemonButtonEl.find(".pokemon_switch_name_text");
		pokemonButtonElText.empty();
		if (trainerObj.pokemon[i]) {
			pokemonButtonElText.append(trainerObj.pokemon[i].nickname);
		}
	}

	updatePokemonSwitchUI(trainerObj);
}

function updatePokemonSwitchUI (trainerObj) {
	for (var i = 0; i < 6; i++) {
		var buttonEnabled = true;
		var pokemonButtonEl = pokemonSwitchEls.eq(i);
		if (trainerObj.pokemon[i]) {
			if (!trainerObj.pokemon[i].alive) {
				buttonEnabled = false;
			}
		} else {
			buttonEnabled = false;
		}

		if (buttonEnabled) {
			pokemonButtonEl.removeClass("disabled");
		} else {
			pokemonButtonEl.addClass("disabled");
		}
	}
}



function before_drawing_view (views, context) {
	if (context === "battle_ui") {
		if (views.indexOf("choose_pokemon") >= 0) {
			updatePokemonSwitchUI(curBattleState.getControlledTrainer());
		}
	}
}