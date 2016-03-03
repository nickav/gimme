var assert = require('assert');
var nodemock = require('nodemock');

var env = require('./helpers/env');
var app = require('../lib/index');
var Carbon = require('../lib/carbon');
var MockConnection = require('./helpers/MockConnection');

describe('carbon should', function() {
  it('copy the file when none exists', function(done) {
    var env1 = env.create('1', {'getme': 'getme'});
    var env2 = env.create('2');

    // TODO: don't hardcode port number
    app.initServer('localhost', 2323, env1, function(server) {
      console.log(server.socket.address());
      server.writeFile = function() {
        throw new Error('Sender should not write over its own file.');
      };
    });
    app.initClient('localhost', 2323, env2, function(client) {
      client.writeFile = function() {
        done();
      };
    });
  });

  it('not overwrite existing files', function(done) {
    var env1 = env.create('3', {'dontget': 'hi'});
    var env2 = env.create('4', {'dontget': 'hi'});
    
    var server = new MockConnection.Server();
    var client = new MockConnection.Client().connect(server);

    var sender = new Carbon(server, env1);
    var reciever = new Carbon(client, env2);
    reciever.writeFile = function() {
      console.log('reciever write file');
       // make sure sender doesn't write file immediately after
      setTimeout(0, done);
    };
    sender.writeFile = function() {
      throw new Error('Sender should not write over its own file.');
    };
  });

  afterEach(env.destroy);
});

