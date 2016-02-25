var net = require('net');

net.createServer(function(socket) {
	socket.name = socket.remoteAddress + ":" + socket.remotePort;
	socket.write("Welcome " + socket.name + "\n");

	// incoming data from clients
	socket.on('data', function(data) {
		console.log('recieved ' + data + ' from ' + socket.name);
	});

	// remove the client when it leaves
	socket.on('end', function() {
		
	});
}).listen(1337, '127.0.0.1');
