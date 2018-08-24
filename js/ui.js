var resizeTimer;

var moveButtonEls;
var pokemonSwitchEls;
var pokemonSwitchBackEl;

var uiTextboxEl;

var nicknameInputEl;

var nicknameEl;

var pokemonListEl;
var teamPreviewEl;
var pokemonEditEl;

var movesListEl;

var roomListEl;

var teamNameEl;
var teamSelectDropdownEl;

var enterTeamNamePromptEl;

function initUI () {
	nav.getContexts();

	closeSideEl = $(".battle_scene .battle_side.close_side");
	farSideEl = $(".battle_scene .battle_side.far_side");
	moveButtonEls = $(".ui_scene .pokemon_move_buttons .pokemon_move_button");
	pokemonSwitchEls = $(".ui_scene .pokemon_switch_buttons .pokemon_switch_button");
	pokemonSwitchBackEl = $(".ui_scene [data-view='choose_pokemon'] .menu_back");
	uiTextboxEl = $(".ui_scene .text_box_text_area");
	roomListEl = $(".room_list");
	nicknameInputEl = $(".nickname_entry_input");
	nicknameEl = $(".player_info_container .nickname");
	pokemonListEl = $(".team_builder_container .pokemon_list_container");
	teamPreviewEl = $(".team_builder_container .team_preview_windows");
	pokemonEditEl = $(".team_builder_container .edit_pokemon_container");
	movesListEl = $(".moves_list_container");
	teamNameEl = $(".team_name_entry_input");
	teamSelectDropdownEl = $(".team_select_dropdown");
	enterTeamNamePromptEl = $(".enter_team_name_prompt");

	$("body").on("mousedown", ".touchable", function(e) {
		$(this).addClass("touched");
		setTimeout(function() {
			$(this).removeClass("touched");
		}.bind(this), 800);
	});

	$("body").on("click", ".pokemon_move_button", function (e) {
		var buttonMoveID = $(this).data("move-id");
		var buttonTrainerObj = curBattleState.getControlledTrainer();
		buttonTrainerObj.chooseAction(MOVE_ACTION, {moveID: buttonMoveID}, buttonTrainerObj.id);
	});

	$("body").on("click", ".pokemon_switch_button", function (e) {
		var buttonTrainerObj = curBattleState.getControlledTrainer();
		var newPokemonIndex = $(this).data("switch-index") * 1;
		if (newPokemonIndex !== buttonTrainerObj.activePokemonIndex && buttonTrainerObj.pokemon[newPokemonIndex].alive) {
			buttonTrainerObj.chooseAction(SWITCH_ACTION, {newPokemonIndex: newPokemonIndex}, buttonTrainerObj.id);
		}
	});

	$("body").on("click", ".slideout_toggle", function (e) {
		$(this).closest(".pokemon_info_box_container").toggleClass("show_slideout");
	});

	$("body").on("click", ".update_nickname", function (e) {
		updateNickname(nicknameInputEl.val());
	});

	$("body").on("click", "[data-js-nav]", function (e) {
		var thisContext = $(this).data("js-nav-context");
		if (!thisContext) {
			thisContext = $(this).closest("[data-nav-context]").data("nav-context");
		}
		nav.go($(this).data("js-nav"), thisContext);
	});

	$("body").on("click", "[data-js-close-context]", function (e) {
		var thisContext = $(this).data("js-close-context");
		if (!thisContext) {
			thisContext = $(this).closest("[data-nav-context]").data("nav-context");
		}
		nav.closeContext(thisContext);
	});

	$("body").on("click", ".make_room", function (e) {
		createRoom();
	});

	$("body").on("click", ".room_list_option", function (e) {
		joinRoom($(this).data("room-id"));
	});

	$("body").on("click", ".team_preview_windows .pokemon_preview_window", function (e) {
		editTeamPokemon($(this).data("pokemon"));
	});

	$("body").on("click", ".pokemon_list_container .pokemon_option", function (e) {
		addPokemonToTeam($(this).data("pokemon"));
	});

	$("body").on("click", ".edit_pokemon_container .stats_container .specialize_button", function (e) {
		setPokemonSpecialization($(this).closest("[data-stat]").data("stat"));
	});

	$("body").on("click", ".add_pokemon_button", function (e) {
		teamPreviewEl.find(".selected").removeClass("selected");
		nav.go(["empty_screen"], "team_builder_info");
	});

	$("body").on("click", ".remove_pokemon_button", function (e) {
		teamPreviewEl.find(".selected").removeClass("selected");
		teamToEdit[editingIndex] = undefined;
		updatePokemonPreview(editingIndex);
		nav.go(["empty_screen"], "team_builder_info");
	});

	$("body").on("click", ".moves_container .move_button .move_name", function (e) {
		var moveButtonEl = $(this).closest(".move_button");
		moveIndexToEdit = moveButtonEl.data("move") * 1;
		nav.go(["edit_pokemon", "moves_list"], "team_builder_info");
	});

	$("body").on("click", ".moves_list_container .move_list_option", function (e) {
		teamToEdit[editingIndex].moves[moveIndexToEdit] = $(this).data("move");
		nav.go(["edit_pokemon", "current_moves"], "team_builder_info");
	});

	$("body").on("click", ".save_team", function (e) {
		saveTeam();
		nav.go(["netplay_lobby"], "app");
		nav.closeContext("enter_team_name");
	});

	$("body").on("click", ".team_edit_button.new_team", function (e) {
		enterTeamBuilderUI();
	});

	$("body").on("input", ".team_select_dropdown", function (e) {
		console.info("selecting " + $(this).val());
		curSelectedTeam = $(this).val();
		updateLocalStorageSelectedTeam();
	});

	$("body").on("click", ".team_edit_button.edit_team", function (e) {
		if (curSelectedTeam) {
			enterTeamBuilderUI(curSelectedTeam);
		}
	})


	$(window).on("resize", function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function() {
			resize(3);
		}, 25);
	});


	populatePokemonListUI();



    resize(3);
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

	if (fontSize < 33) {
		fontSize = 33;
	}

	if (bh > bw) {
		$("body").addClass("portrait").removeClass("landscape");
	} else {
		$("body").addClass("landscape").removeClass("portrait");
	}

	$("html").css("font-size", fontSize + "px");
}


var curNickname = "";
function updateNickname (newNickname) {
	curNickname = newNickname;
	if (connected) {
		sendData("setNickname", newNickname);
	}
	updateLocalStorageNickname(newNickname);
}

function updateTrainerSides (battleState) {
	if (battleState.trainerA.controlled) {
		closeSideEl.data("trainer", "trainerA");
		farSideEl.data("trainer", "trainerB");
	} else if (battleState.trainerB.controlled) {
		closeSideEl.data("trainer", "trainerB");
		farSideEl.data("trainer", "trainerA");
	}
}

function updatePokemonUI (trainerObj, forceHPNum) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerObj.id + "']");
	var trainerPokemon = trainerObj.activePokemon;

	if (trainerPokemon && trainerPokemon.alive) {
		trainerSideEl.find(".pokemon_info_box_container").removeClass("fainted");
		trainerSideEl.find(".pokemon_name").empty().append(trainerPokemon.nickname);
		trainerSideEl.find(".pokemon_type").data("type", trainerPokemon.type).empty().append(typeInfo[trainerPokemon.type].displayName);
		updatePokemonHPUI(trainerObj, forceHPNum);
		updatePokemonStatsUI(trainerObj);

		if (trainerObj.controlled) {
			updatePokemonMovesUI(trainerObj);
		}
	} else {
		trainerSideEl.find(".pokemon_info_box_container").addClass("fainted");
	}

}

function updatePokemonHPUI (trainerObj, forceHPNum) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerObj.id + "']");
	var trainerPokemon = trainerObj.activePokemon;

	var hpCurVal = trainerPokemon.curHP;
	if (forceHPNum !== undefined) {
		hpCurVal = forceHPNum;
	}

	var hpPct = hpCurVal / trainerPokemon.stats.hp;
	trainerSideEl.find(".pokemon_hp_inner").css({
		"transform": "scaleX(" + hpPct + ")",
	});
	trainerSideEl.find(".pokemon_hp_num").empty().append("" + hpCurVal + " / " + trainerPokemon.stats.hp);
}

function updatePokemonStatsUI (trainerObj, curAtk, curDef, curSpd) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerObj.id + "']");
	var trainerPokemon = trainerObj.activePokemon;
	if (curAtk === undefined) {
		curAtk = trainerPokemon.stats.atk;
	}
	if (curDef === undefined) {
		curDef = trainerPokemon.stats.def;
	}
	if (curSpd === undefined) {
		curSpd = trainerPokemon.stats.spd;
	}

	trainerSideEl.find(".pokemon_atk .stat_num").empty().append(curAtk);
	trainerSideEl.find(".pokemon_atk .stat_bar").css("width", (curAtk * 0.15) + "rem");
	trainerSideEl.find(".pokemon_def .stat_num").empty().append(curDef);
	trainerSideEl.find(".pokemon_def .stat_bar").css("width", (curDef * 0.15) + "rem");
	trainerSideEl.find(".pokemon_spd .stat_num").empty().append(curSpd);
	trainerSideEl.find(".pokemon_spd .stat_bar").css("width", (curSpd * 0.15) + "rem");
}

function updatePokemonMovesUI (trainerObj) {
	var trainerPokemon = trainerObj.activePokemon;

	for (var i = 0; i < trainerPokemon.moves.length; i++) {
		var moveButtonEl = moveButtonEls.eq(i);
		if (trainerPokemon.moves[i]) {
			moveButtonEl.removeClass("disabled");
			var thisMoveInfo = moveInfo[trainerPokemon.moves[i]];
			moveButtonEl.data("move-id", trainerPokemon.moves[i]);
			moveButtonEl.find(".pokemon_move_name_text").empty().append(thisMoveInfo.displayName);
			moveButtonEl.find(".move_type_container").data("type", thisMoveInfo.type);
			moveButtonEl.find(".type_name").empty().append(typeInfo[thisMoveInfo.type].displayName);
			if (thisMoveInfo.bp) {
				moveButtonEl.find(".stat_section.pow").removeClass("disabled");
				moveButtonEl.find(".stat_num.pow").empty().append("<div>" + thisMoveInfo.bp + "</div>");
				if (thisMoveInfo.type === trainerPokemon.type) {
					moveButtonEl.find(".stat_num.pow").append("<div class='stab_bonus'>+2</div>");
				}
			} else {
				moveButtonEl.find(".stat_section.pow").addClass("disabled");
			}

			if (thisMoveInfo.priority !== undefined && thisMoveInfo.priority !== 0) {
				moveButtonEl.find(".stat_section.prio").removeClass("disabled");
				moveButtonEl.find(".stat_num.prio").empty().append(thisMoveInfo.priority);
			} else {
				moveButtonEl.find(".stat_section.prio").addClass("disabled");
			}

			moveButtonEl.find(".move_description").empty().append(thisMoveInfo.description);

		} else {
			moveButtonEl.addClass("disabled");
		}
	}

	updatePokemonMovesEffectiveness(trainerObj);
}

function updatePokemonMovesEffectiveness (trainerObj) {
	var trainerPokemon = trainerObj.activePokemon;

	for (var i = 0; i < trainerPokemon.moves.length; i++) {
		var moveButtonEl = moveButtonEls.eq(i);
		if (trainerPokemon.moves[i]) {
			moveButtonEl.removeClass("disabled");
			var thisMoveInfo = moveInfo[trainerPokemon.moves[i]];

			var effectiveness = typeInfo[thisMoveInfo.type][curBattleState.getOtherTrainer(trainerObj.id).activePokemon.type];
			if (!thisMoveInfo.bp) {
				effectiveness = EFFECTIVE_NEUTRAL;
			}
			if (effectiveness === EFFECTIVE_WEAK) {
				moveButtonEl.find(".multiplier_container").data("effectiveness", "weak").empty().append("x0.5");
			} else if (effectiveness === EFFECTIVE_SUPER) {
				moveButtonEl.find(".multiplier_container").data("effectiveness", "super").empty().append("x2");
			} else {
				moveButtonEl.find(".multiplier_container").data("effectiveness", "hide")
			}

			if ((trainerPokemon.hasEffect("double_jeopardy") && trainerPokemon.moves[i] === trainerObj.lastUsedMove) || (trainerPokemon.hasEffect("lure") && this.moveInfo.moveType === MOVETYPE_SUPPORT)) {
				moveButtonEl.addClass("locked");
			} else {
				moveButtonEl.removeClass("locked");
			}

		} else {
			moveButtonEl.addClass("disabled");
		}
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

	if (trainerObj.mustSwitch) {
		pokemonSwitchBackEl.addClass("disabled");
	} else {
		pokemonSwitchBackEl.removeClass("disabled");
	}
}

var textCharDelay = 17;
var textEndDelay = 1000;

var textToDraw = "";
var textDrawIndex = 0;
var textDrawTimeout;
function drawText (newText) {
	clearTextboxText();
	textToDraw = newText;
	textDrawIndex = 0;
	drawCharacter();
}

function drawCharacter () {
	var uiTextboxActualEl = uiTextboxEl[0];
	uiTextboxActualEl.innerHTML = uiTextboxActualEl.innerHTML + textToDraw[textDrawIndex];
	textDrawIndex += 1;
	if (textDrawIndex < textToDraw.length) {
		textDrawTimeout = setTimeout(function(){
			drawCharacter();
		}, textCharDelay)
	} else {
		animationTimeout = setTimeout(function(){
			handleNextAnimation();
		}, textEndDelay);
	}
}

function clearTextboxText () {
	uiTextboxEl.empty();
}


var animationQueue = [];

var animationTimeout;

function Animation (animType, animInfo) {
	this.animType = animType;
	this.animInfo = animInfo;

	animationQueue.push(this);
}

Animation.prototype.execute = function () {
	if (this.animType === "drawText") {
		drawText(this.animInfo);
		if (LOGGING >= 3) {
			console.info(this.animInfo);
		}
	} else if (this.animType === "updateHP") {
		updatePokemonHPUI(this.animInfo.trainerObj, this.animInfo.forceHPNum);
		animationTimeout = setTimeout(function(){
			handleNextAnimation();
		}, 750);
	} else if (this.animType === "updatePokemon") {
		updatePokemonUI(this.animInfo.trainerObj, this.animInfo.forceHPNum);
		animationTimeout = setTimeout(function(){
			handleNextAnimation();
		}, 750);
	} else if (this.animType === "recallPokemon") {
		var trainerSideEl = $(".battle_side[data-trainer='" + this.animInfo.trainerObj.id + "']");
		trainerSideEl.find(".pokemon_info_box_container").addClass("fainted");
		animationTimeout = setTimeout(function(){
			handleNextAnimation();
		}, 750);
	} else if (this.animType === "updateStats") {
		updatePokemonStatsUI(this.animInfo.trainerObj, this.animInfo.curAtk, this.animInfo.curDef, this.animInfo.curSpd);
		handleNextAnimation();
	}
}

function handleNextAnimation () {
	var nextAnimation = animationQueue.shift();
	if (nextAnimation) {
		nextAnimation.execute();
	} else {
		endAnimationQueue();
	}
}

function endAnimationQueue () {
	if (curBattleState.phase === "handle_turn") {
		if (curBattleState.trainerA.mustSwitch || curBattleState.trainerB.mustSwitch) {
			curBattleState.setPhase("force_switch_pokemon");
		} else {
			curBattleState.setPhase("choose_action");
		}
	} else if (curBattleState.phase === "handle_force_switch_pokemon") {
		curBattleState.setPhase("choose_action");
	}

}



function populateRoomList (roomData) {
	roomListEl.empty();
	roomData.map(function (roomInfo) {
		var newRoomEl = $("<div class='room_list_option touchable large' data-room-id='" + roomInfo.roomID + "'>" + roomInfo.hostNickname + "</div>")
		roomListEl.append(newRoomEl);
	});
}


var teamToEdit = [];
var editingIndex;
var curSelectedTeam;

function enterTeamBuilderUI (curTeamNameToEdit) {
	var teamArrToEdit = [];
	if (!curTeamNameToEdit) {
		teamArrToEdit = [undefined, undefined, undefined, undefined, undefined, undefined];
		curTeamNameToEdit = "";
	} else {
		teamArrToEdit = clientTeams[curTeamNameToEdit];
	}
	teamToEdit = teamArrToEdit;
	teamNameToEdit = curTeamNameToEdit;

	for (var i = 0; i < 6; i++) {
		updatePokemonPreview(i);
	}

	nav.go(["team_builder"], "app");
	nav.go(["empty_screen"], "team_builder_info");
}

function populatePokemonListUI () {
	for (var speciesName in pokemonInfo) {
		var pokeInfo = pokemonInfo[speciesName];
		var newListOption = $('' + 
			'<div class="pokemon_option touchable large" data-pokemon="' + speciesName + '">' +
				'<div class="pokemon_picture_container">' +
					'<div class="pokemon_picture" style=""></div>' +
				'</div>' +
				'<div class="pokemon_name">' + pokeInfo.displayName + '</div>' +
				'<div class="type_icon_container" data-type="' + pokeInfo.type + '">' +
					'<div class="type_icon"></div>' +
					'<div class="type_name">' + typeInfo[pokeInfo.type].displayName + '</div>' +
				'</div>' +
			'</div>');
		pokemonListEl.append(newListOption);
	};
}


function editTeamPokemon (pokemonIndex) {
	var pokeInfo = teamToEdit[pokemonIndex];
	editingIndex = pokemonIndex;
	teamPreviewEl.find(".selected").removeClass("selected");
	teamPreviewEl.find("[data-pokemon='" + pokemonIndex + "']").addClass("selected");
	if (pokeInfo) {
		updatePokemonEditUI(pokeInfo);
		nav.go(["edit_pokemon"], "team_builder_info");
	} else {
		nav.go(["pokemon_list"], "team_builder_info");
	}
}

function updatePokemonPreview (index) {
	// debugger;
	var pokeInfo = teamToEdit[index];
	var previewEl = teamPreviewEl.find("[data-pokemon='" + index + "']");
	if (pokeInfo) {
		previewEl.find(".pokemon_name_text").empty().append(pokemonInfo[pokeInfo.species].displayName);
		previewEl.find(".type_icon_window").data("type", pokemonInfo[pokeInfo.species].type);
	} else {
		previewEl.find(".pokemon_name_text").empty().append("Click to add");
		previewEl.find(".type_icon_window").data("type", undefined);
	}
}

function addPokemonToTeam (pokemonSpecies) {
	var newPokemonInfo = {
		species: pokemonSpecies,
		specialization: {},
		moves: [undefined, undefined, undefined, undefined],
	}
	teamToEdit[editingIndex] = newPokemonInfo;
	updatePokemonEditUI(newPokemonInfo);
	updatePokemonPreview(editingIndex);
	nav.go(["edit_pokemon"], "team_builder_info");
}

function updatePokemonEditUI (pokeInfo) {
	var speciesInfo = pokemonInfo[pokeInfo.species];
	pokemonEditEl.find(".pokemon_name").empty().append(speciesInfo.displayName);
	pokemonEditEl.find(".pokemon_flavor_text").empty().append(speciesInfo.flavor);
	// TODO: Set bg img of portrait
	pokemonEditEl.find(".top_row .type_icon_container").data("type", speciesInfo.type);
	pokemonEditEl.find(".top_row .type_name").empty().append(typeInfo[speciesInfo.type].displayName);

	updatePokemonEditMovesUI(pokeInfo);
	updatePokemonEditStatsUI(pokeInfo);

	buildMoveListUI(speciesInfo.moves);
}

function updatePokemonEditMovesUI (pokeInfo) {
	var moveButtonsEls = pokemonEditEl.find(".moves_buttons .move_button");
	for (var i = 0; i < pokeInfo.moves.length; i++) {
		var curMoveID = pokeInfo.moves[i];
		var curMoveButtonEl = moveButtonsEls.eq(i);
		curMoveButtonEl.find(".move_name").empty();
		curMoveButtonEl.find(".type_name").empty();
		curMoveButtonEl.find(".move_type_container").data("type", undefined);

		if (curMoveID) {
			curMoveButtonEl.removeClass("empty");
			curMoveButtonEl.find(".move_name").append(moveInfo[curMoveID].displayName);
			curMoveButtonEl.find(".type_name").append(typeInfo[moveInfo[curMoveID].type].displayName);
			curMoveButtonEl.find(".move_type_container").data("type", moveInfo[curMoveID].type);
		} else {
			curMoveButtonEl.addClass("empty");
		}
	}
}

function updatePokemonEditStatsUI (pokeInfo) {
	var pokemonStats = pokemonInfo[pokeInfo.species].stats;
	for (var statName in pokemonStats) {
		var curStatRow = pokemonEditEl.find(".stat_row[data-stat='" + statName + "']");
		var statDivisor = 9;
		if (statName === "hp") {
			statDivisor = 16;
		}
		var statBarLength = Math.min(pokemonStats[statName] / statDivisor, 1) * 100;
		curStatRow.find(".stat_bar").css("width", statBarLength + "%");
		if (pokeInfo.specialization[statName]) {
			var statBarExtraLength = Math.min(pokeInfo.specialization[statName] / statDivisor, 1) * 100;
			// if (statName === "hp") {
			// 	statBarExtraLength /= 2;
			// }
			curStatRow.find(".stat_bar_extra").css("width", statBarExtraLength + "%");
			curStatRow.find(".specialize_button").addClass("active");
		} else {
			curStatRow.find(".stat_bar_extra").css("width", "0");
			curStatRow.find(".specialize_button").removeClass("active");
		}
		var newStatNum = pokemonStats[statName] + ((pokeInfo.specialization[statName]) ? pokeInfo.specialization[statName] : 0);
		curStatRow.find(".stat_num").empty().append(newStatNum);
	}
}

function setPokemonSpecialization (statName) {
	teamToEdit[editingIndex].specialization = {};
	if (statName === "hp") {
		teamToEdit[editingIndex].specialization[statName] = 2;
	} else {
		teamToEdit[editingIndex].specialization[statName] = 1;
	}
	updatePokemonEditStatsUI(teamToEdit[editingIndex]);
}

var moveIndexToEdit;

function buildMoveListUI (moveNameList) {
	movesListEl.empty();
	for (var i = 0; i < moveNameList.length; i++) {
		var newMoveEl = createMoveListElement(moveNameList[i]);
		movesListEl.append(newMoveEl);
	}
}

function createMoveListElement (moveName) {
	var newMoveInfo = moveInfo[moveName];
	var powSection = "";
	if (newMoveInfo.bp) {
		powSection = '<div class="stat_section pow">' +
			'<div class="stat_header pow">POW</div>' +
			'<div class="stat_num pow">' + newMoveInfo.bp + '</div>' +
		'</div>';
	}
	var prioSection = "";
	if (newMoveInfo.priority !== undefined && newMoveInfo.priority !== 0) {
		prioSection = '<div class="stat_section prio">' +
			'<div class="stat_header prio">PRIO</div>' +
			'<div class="stat_num prio">' + newMoveInfo.priority + '</div>' +
		'</div>';
	}
	var newMoveEl = $('<div class="move_list_option touchable large" data-move="' + moveName + '">' +
						'<div class="top_area">' +
							'<div class="move_type_container" data-type="' + newMoveInfo.type + '"">' +
								'<div class="type_icon"></div>' +
								'<div class="type_name">' + typeInfo[newMoveInfo.type].displayName + '</div>' +
							'</div>' +
							'<div class="move_title">' + newMoveInfo.displayName + '</div>' +
							'<div class="stats">' +
								prioSection +
								powSection +
							'</div>' +
						'</div>' +
						'<div class="lower_area">' +
							'<div class="move_description">' + newMoveInfo.description + '</div>' +
						'</div>' +
						'<div class="selected_border"></div>' +
					'</div>');

	return newMoveEl;
}

function saveTeam () {
	var newTeamName = teamNameEl.val();
	curSelectedTeam = newTeamName;
	clientTeams[newTeamName] = JSON.parse(JSON.stringify(teamToEdit));
	updateLocalStorageTeams();
	updateLocalStorageSelectedTeam();
}

function updateTeamListDropdown () {
	teamSelectDropdownEl.empty();
	for (var teamName in clientTeams) {
		teamSelectDropdownEl.append($("<option value='" + teamName + "'>" + teamName + "</option>"));
	}
	teamSelectDropdownEl.val(curSelectedTeam);
}


function before_drawing_view (views, context) {
	if (context === "battle_ui") {
		if (views.indexOf("choose_pokemon") >= 0) {
			updatePokemonSwitchUI(curBattleState.getControlledTrainer());
		} else if (views.indexOf("choose_move") >= 0) {
			updatePokemonMovesEffectiveness(curBattleState.getControlledTrainer());
		}
	}

	if (context === "app") {
		if (views.indexOf("enter_nickname") >= 0) {
			nicknameInputEl.val(curNickname);
		}

		if (views.indexOf("netplay_lobby") >= 0) {
			nicknameEl.empty().append(curNickname);
			updateTeamListDropdown();
		}
	}

	if (context === "team_builder_info") {
		if (views.indexOf("current_moves") >= 0) {
			updatePokemonEditMovesUI(teamToEdit[editingIndex]);
		} else if (views.indexOf("moves_list") >= 0) {
			movesListEl.find(".selected").removeClass("selected");
			if (teamToEdit[editingIndex].moves[moveIndexToEdit]) {
				movesListEl.find("[data-move='" + teamToEdit[editingIndex].moves[moveIndexToEdit] + "']").addClass("selected");
			}
		}
	}

	if (context === "enter_team_name") {
		if (views.indexOf("popup_active") >= 0) {
			teamNameEl.val(teamNameToEdit);
		}
	}
}