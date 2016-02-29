var net = require('net');
var colors = require('colors');
var Carbon = require('./carbon.js');

module.exports = {
	initClient: function(address, port, directory) {
		// create client
		var socket = new net.Socket();
		socket.connect(port, address, function() {
			// successfully connected
			socket.client = true;

			_init(socket, directory);
		});

		socket.on('error', function(e) {
			console.log(colors.red(e));
		});
	},
	initServer: function(address, port, directory) {
		// create server
		var server = net.createServer(function(socket) {
			// new client joined
			socket.client = false;

			_init(socket, directory);
		});

		server.on('error', function(e) {
			console.log(colors.red(e));
		});

		server.listen(port, address, function() {
			// server started
			// get ip address
			require('dns').lookup(require('os').hostname(), function (err, add, fam) {
				console.log(`Server is running on ${add}:${port}`);
			});
		});
	},
};

// private functions

/** Initializes connection on a socket. */
function _init(socket, directory) {
	socket.name = socket.remoteAddress + ":" + socket.remotePort;

	console.log(colors.green(`Connected to ${(socket.client ? 'server' : 'client')} ${socket.name}!`));

	var carbon = new Carbon(socket, directory);

	socket.on('close', function() {
		console.log(colors.green('Connection closed ' + socket.name));
	});
};
