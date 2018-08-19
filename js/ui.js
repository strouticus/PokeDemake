var resizeTimer;

var moveButtonEls;
var pokemonSwitchEls;
var pokemonSwitchBackEl;

var uiTextboxEl;

var roomListEl;

function initUI () {
	nav.getContexts();

	moveButtonEls = $(".ui_scene .pokemon_move_buttons .pokemon_move_button");
	pokemonSwitchEls = $(".ui_scene .pokemon_switch_buttons .pokemon_switch_button");
	pokemonSwitchBackEl = $(".ui_scene [data-view='choose_pokemon'] .menu_back");
	uiTextboxEl = $(".ui_scene .text_box_text_area");
	roomListEl = $(".room_list");

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

	$("body").on("click", "[data-js-nav]", function (e) {
		var thisContext = $(this).data("js-nav-context");
		if (!thisContext) {
			thisContext = $(this).closest("[data-nav-context]").data("nav-context");
		}
		nav.go($(this).data("js-nav"), thisContext);
	});

	$("body").on("click", ".make_room", function (e) {
		createRoom();
	});

	$("body").on("click", ".room_list_option", function (e) {
		joinRoom($(this).data("room-id"));
	});

	$(window).on("resize", function() {
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function() {
			resize(3);
		}, 25);
	});



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

	$("html").css("font-size", fontSize + "px");
}



function updatePokemonUI (trainerObj, forceHPNum) {
	var trainerSideEl = $(".battle_side[data-trainer='" + trainerObj.id + "']");
	var trainerPokemon = trainerObj.activePokemon;

	if (trainerPokemon && trainerPokemon.alive) {
		trainerSideEl.find(".pokemon_info_box_container").removeClass("fainted");
		trainerSideEl.find(".pokemon_name").empty().append(trainerPokemon.nickname);
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
		updatePokemonHPUI(this.animInfo.trainerObj);
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
		updatePokemonStatsUI(this.animInfo.trainerObj);
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
		var newRoomEl = $("<div class='room_list_option' data-room-id='" + roomInfo.roomID + "'>" + roomInfo.hostNickname + "</div>")
		roomListEl.append(newRoomEl);
	});
}



function before_drawing_view (views, context) {
	if (context === "battle_ui") {
		if (views.indexOf("choose_pokemon") >= 0) {
			updatePokemonSwitchUI(curBattleState.getControlledTrainer());
		}
	}
}