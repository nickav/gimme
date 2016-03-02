var EventEmitter = require('events');
var util   = require('util');
/**
 * Simple Mock Connection between a server and client(s).
 *
 * Usage:
 *		var server = new MockConnection.Server();
 *		var client = new MockConnection.Client().connect(server);
 */
function MockServer() {
	EventEmitter.call(this);

	this.clients = [];

	this.write = function(data) {
		this.emit('write', data);
	};

	this.connect = function(client) {
		this.addListener('write', function(data) {
			client.emit('data', data);
		});
		client.connect(this);
		this.clients.push(client);
		return this;
	};
};
util.inherits(MockServer, EventEmitter);

function MockClient(server) {
	EventEmitter.call(this);

	this.server = false;
	this.connect = function(server) {
		if (this.server) return;

		this.server = server;
		server.connect(this);
		return this;
	};

	this.write = function(data) {
		if (this.server) this.server.emit('data', data);
	};
};
util.inherits(MockClient, EventEmitter);

module.exports = {
	Server: MockServer,
	Client: MockClient,
};

/*var events = require('events');
var client = new events.EventEmitter();
var server = new events.EventEmitter();

client.write = function(data) {
	server.emit('data', data);
};
server.write = function(data) {
	client.emit('data', data);
};

client.on('data', function(data) { console.log('client got data ' + data); });

server.write('hi');*/
