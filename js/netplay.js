// netplay.js
// Client code for netplay

var ws = undefined;
var connected = false;

function initNetplay () {
	var wsAddr = undefined;
	if (location.href.indexOf("localhost") >= 0) {
		wsAddr = "ws://localhost:8100";
	} else {
		wsAddr = "wss://bine.nfshost.com/PokeDemake/";
	}
	ws = new WebSocket(wsAddr);

	ws.addEventListener("message", function incoming (message) {
		var mData = JSON.parse(message.data);
		handleMessageData(mData.type, mData.data);
	});

	ws.addEventListener("open", function connection (event) {
		connected = true;
		sendData("getRoomList", "");

		if (curNickname) {
			sendData("setNickname", curNickname);
		}
	});
}

function sendData (type, data) {
	var stringData = JSON.stringify({type: type, data: data});
	ws.send(stringData);
}

// Messages from server

function handleMessageData (type, data) {
	if (type === "roomList") {
		populateRoomList(data);
	}
	if (type === "requestTeam") {
		sendTeamData();
	}
	if (type === "battleInitData") {
		handleBattleInitData(data);
	}
	if (type === "otherActionData") {
		handleOtherActionData(data);
	}
}

// Messages to server

function createRoom () {
	if (connected) {
		sendData("createRoom", "");
	}
}

function joinRoom (roomID) {
	if (connected) {
		sendData("joinRoom", roomID);
	}
}

function sendTeamData () {
	if (connected) {
		var pokemonArray = [];
		for (var i = 0; i < clientTeams[curSelectedTeam].length; i++) {
			if (clientTeams[curSelectedTeam][i]) {
				var curPokemonInfo = clientTeams[curSelectedTeam][i];
				pokemonArray.push(new Pokemon(curPokemonInfo.species, curPokemonInfo.specialization, curPokemonInfo.moves));
			}
		}
		var teamData = pokemonArray.map(function (pokemon) {
			return pokemon.export();
		});
		sendData("teamData", teamData);
	}
}

function sendActionData (actionType, actionInfo, trainerID) {
	if (connected) {
		var actionData = {
			actionType: actionType,
			actionInfo: actionInfo,
			trainerID: trainerID,
		}
		sendData("actionData", actionData);
	}
}
