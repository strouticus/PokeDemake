// server.js
// Server code for netplay

const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 5000 });

wss.on('connection', function connection(ws) {
	ws.on('message', function incoming(message) {
		console.log('received: %s', message);

		ws.send('response message');
	});

	ws.send('something');
});
