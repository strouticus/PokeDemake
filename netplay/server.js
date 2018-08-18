// server.js
// Server code for netplay

const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8100 });

const crypto = require("crypto");

console.log("The Server is Running.");

var roomList = [];

function findRoomByID (roomID) {
	return roomList.find(function (room) {
		return (room.ID === roomID);
	});
}

var userList = [];

function findUserByID (userID) {
	return userList.find(function (user) {
		return (user.ID === userID);
	});
}

function Room (hostUser) {
	this.ID = crypto.randomBytes(16).toString("hex");
	this.hostUser = hostUser;
	hostUser.room = this;
	this.guestUser = undefined;
	this.waitingForGuest = true;
	roomList.push(this);

	this.hostTeam = undefined;
	this.guestTeam = undefined;
	this.waitingToStart = false;
}

Room.prototype.destroy = function () {
	roomList.splice(roomList.indexOf(this), 1);
	sendAllUsersRoomList();
}

Room.prototype.addGuest = function(guestUser) {
	this.guestUser = guestUser;
	this.guestUser.room = this;
	this.waitingForGuest = false;
	this.startBattle();
}

Room.prototype.startBattle = function() {
	this.hostUser.requestTeam();
	this.guestUser.requestTeam();
	this.waitingToStart = true;
}

Room.prototype.checkBothTeams = function () {
	if (this.hostUser.teamData !== undefined && this.guestUser.teamData !== undefined) {
		this.hostTeam = this.hostUser.teamData;
		this.guestTeam = this.guestUser.teamData;

		// Coinflip for speed ties
		var speedTie = (Math.random() > 0.5) ? "trainerA" : "trainerB";

		this.hostUser.sendBattleInitData(this.hostTeam, this.guestTeam, "trainerA", speedTie);
		this.guestUser.sendBattleInitData(this.hostTeam, this.guestTeam, "trainerB", speedTie);
	}
}

function User (ws) {
	this.ID = crypto.randomBytes(16).toString("hex");
	this.ws = ws;
	this.room = undefined;
	this.nickname = "Noname";
	userList.push(this);
	this.teamData = undefined;
}

User.prototype.disconnect = function () {
	userList.splice(userList.indexOf(this), 1);
	if (this.room !== undefined && this.room.hostUser === this) {
		this.room.destroy();
	}
}

User.prototype.sendData = function (type, data) {
	var stringData = JSON.stringify({type: type, data: data});
	this.ws.send(stringData);
}

User.prototype.sendRoomList = function () {
	var roomListData = generateRoomList();
	this.sendData("roomList", roomListData);
}

User.prototype.joinRoom = function (roomID) {
	var room = findRoomByID(roomID);
	if (room !== undefined) {
		if (room.hostUser !== this && room.waitingForGuest) {
			room.addGuest(this);
		}
	}
}

User.prototype.requestTeam = function () {
	this.teamData = undefined;
	this.sendData("requestTeam", "");
}

User.prototype.setTeamData = function (data) {
	this.teamData = data;
	this.room.checkBothTeams();
}

User.prototype.sendBattleInitData = function(teamA, teamB, myTrainer, speedTie) {
	this.sendData("battleInitData", {
		teamA: teamA,
		teamB: teamB,
		myTrainer: myTrainer,
		speedTie: speedTie,
	});
}


function sendAllUsersRoomList () {
	userList.map(function (user) {
		user.sendRoomList();
	});
}

wss.on("connection", function connection (ws) {

	var newUser = new User(ws);



	ws.on("message", function incoming (message) {
		var mData = JSON.parse(message);
		handleMessageData(newUser, mData.type, mData.data);
	});

	ws.on("close", function close () {
		newUser.disconnect();
	});
});

function handleMessageData (user, type, data) {
	if (type === "setNickname") {
		user.nickname = data;
	}
	if (type === "getRoomList") {
		user.sendRoomList();
	}
	if (type === "createRoom") {
		if (user.room === undefined) {
			var newRoom = new Room(user);
			sendAllUsersRoomList();
		}
	}
	if (type === "joinRoom") {
		user.joinRoom(data);
	}
	if (type === "teamData") {
		user.setTeamData(data);
	}
}

function generateRoomList () {
	return roomList.filter(function (room) {
		return room.waitingForGuest;
	}).map(function (room) {
		console.log("Room host nickname")
		console.log(room.hostUser.nickname)
		return {roomID: room.ID, hostNickname: room.hostUser.nickname};
	});
}
