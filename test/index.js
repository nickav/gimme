var assert = require('assert');
var env = require('./helpers/env');
var carbon = require('../index');

describe('TODO', function() {
	it('add tests', function() {
		assert.equal(true, false);
	});

	it('env', function() {
		var env1 = env.create('1', {'getme': 'hello', '/file': 'hi'});
		var env2 = env.create('2', {'test': 'hello', 'folder/file': 'hi'});
	});

	after(env.destroy);
});

