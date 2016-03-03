var rimraf = require('rimraf');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

// sync helper functions for creating and destorying directories

const ENV_PREFIX = __dirname + '/../tmp';
var env = 0;
module.exports = {
  /**
   * Builds an env directory for testing where files is a map of filename => content.
   * @return the path to env
   *     env.create({'file.txt': 'hello', 'folder/file.txt': 'hi'});
   */
  create: function(files) {
    var prefix = path.resolve(ENV_PREFIX + '/' + (++env));
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
  /** Builds two Carbon instances from the file maps. */
  build: function(files1, files2) {
    var env1 = create(files1);
    var env2 = create(file2);

    var server = new MockConnection.Server();
    var client = new MockConnection.Client().connect(server);
    return [new Carbon(server, env1), new Carbon(client, env2)];
  }
}

// helpers

/** Writes the file (and any directories needed). */
function writeFileSync(file, contents, cb) {
  mkdirp.sync(path.dirname(file));
  fs.writeFileSync(file, contents);
};
