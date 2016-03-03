var assert = require('assert');
var nodemock = require('nodemock');
var fs = require('fs')

var env = require('./helpers/env');
var app = require('../lib/index');
var Carbon = require('../lib/carbon');
var MockConnection = require('./helpers/MockConnection');
var helpers = require('./helpers/index');

describe('carbon should', function() {
  it('copy the file when none exists', function(done) {
    var env1 = env.create({'getme': 'getme'});
    var env2 = env.create();

    helpers.getPort(function (port) {
      app.initServer('localhost', port, env1, function(server) {
        server.writeFile = function() {
          throw new Error('Sender should not write over its own file.');
        };
      });
      app.initClient('localhost', port, env2, function(client) {
        client.writeFile = function() {
          setTimeout(done, 0);
        };
      });
    });
  });

  it('not overwrite existing files', function(done) {
    var carbon = helpers.build({'dontget': 'hi'}, {'dontget': 'hi'});

    carbon[0].writeFile = function() {
      throw new Error('Reciever should not write over its own file.');
    };
    carbon[1].writeFile = function() {
      throw new Error('Sender should not write over its own file.');
    };

    helpers.after(carbon[1], 'processRequest', done)
  });

  it('preserve merge conflicts', function(done) {
    var expected = 'hello world\n\nhi'
    var carbon = helpers.build({'test': 'hello world\n\ntest'}, {'test': expected})

    helpers.after(carbon[1], 'processRequest', function() {
      var contents = fs.readFileSync(this.directory + '/test')
      assert.equal(contents, expected)
      done() 
    })
  })

  afterEach(env.destroy);
});

