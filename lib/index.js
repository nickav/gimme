var net = require('net');
var colors = require('colors');
var Carbon = require('./carbon.js');

module.exports = {
	initClient: function(address, port, directory) {
		// create client
		var socket = new net.Socket();
		socket.connect(port, address, function() {
			console.log(colors.green('Successfully connected!'));

			_init(socket, directory);
		});
	},
	initServer: function(address, port, directory) {
		// create server
		var server = net.createServer(function(socket) {
			// new client joined

			_init(socket, directory);
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
function _init(socket, directory) {
	socket.name = socket.remoteAddress + ":" + socket.remotePort;
	socket.write("Welcome " + socket.name);

	// incoming data from clients
	socket.on('data', function(data) {
		console.log('recieved ' + data + ' from ' + socket.name);
	});

	socket.on('close', function() {
		console.log('client left ' + socket.name);
	});
};
