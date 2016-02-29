var carbon = require('../index');
var assert = require('assert');
var rimraf = require('rimraf');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

describe('TODO', function() {
	it('add tests', function() {
		assert.equal(true, false);
	});

	it('env', function() {
		createEnv('1', {'test': 'hello', 'folder/file': 'hi'});
	});

	after(destroyEnv);
});

// sync helper functions for creating and destorying directories

const ENV_PREFIX = __dirname + '/tmp';
/**
 * Builds a directory for testing where env the environment name and files is a map of filename => content.
 * All files are created inside the directory env.
 * @return the path to env
 */
function createEnv(env, files) {
	var prefix = ENV_PREFIX + '/' + env + '/';
	for (var name in files) {
		var file = prefix + name;
		writeFileSync(file, files[name]);
	}

	return prefix;
};

function destroyEnv() {
	rimraf.sync(ENV_PREFIX);
};

/** Writes the file (and any directories needed). */
function writeFileSync(file, contents, cb) {
	mkdirp.sync(path.dirname(file));
	fs.writeFileSync(file, contents);
};
