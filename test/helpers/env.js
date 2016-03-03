var rimraf = require('rimraf');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

// sync helper functions for creating and destorying directories

const ENV_PREFIX = __dirname + '/../tmp';
module.exports = {
  /**
   * Builds an env directory for testing where env the environment name
     * and files is a map of filename => content.
   * @return the path to env
   *     env.create('1', {'file.txt': 'hello', 'folder/file.txt': 'hi'});
   */
  create: function(env, files) {
    var prefix = path.resolve(ENV_PREFIX + '/' + env);
    mkdirp.sync(prefix);
    for (var name in files) {
      var file = prefix + '/' + name;
      writeFileSync(file, files[name]);
    }

    return prefix;
  },
  /** Recursively removes the test folder. Use with after or afterEach */
  destroy: function() {
    rimraf.sync(path.resolve(ENV_PREFIX));
  },
}

// helpers

/** Writes the file (and any directories needed). */
function writeFileSync(file, contents, cb) {
  mkdirp.sync(path.dirname(file));
  fs.writeFileSync(file, contents);
};
