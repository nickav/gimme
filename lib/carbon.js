var chokidar = require('chokidar');
var gitignore = require('./vendor/gitignore-parser');
var fs = require('fs');
var colors = require('colors');
var path = require('path');
var mkdirp = require('mkdirp');
var jsdiff = require('diff');

var Request = require('./request');
var merge = require('./merge');

/**
  * Watches for file changes and sends the diff over over the network.
  * @param socket    - the connection to a client
  * @param directory - the directory to sync
  */
var Carbon = function(socket, directory) {
  directory = resolvePath(directory);

  // create ignore pattern from gitignore (if one exists)
  // TODO: a more stable solution is to use git check-ignore
  fs.readFile(directory + '/.gitignore', 'utf8', (err, data) => {
    var patterns = [];
    if (!err) {
      patterns = gitignore.parse(data);
      patterns = patterns[0]; // positive matches
      patterns.push(/\.git/);
    }
    patterns.push(/\.carbon/);
    patterns.push(/\.swp/); // vim swap files
    patterns.push(/\.DS_Store/); // Mac garbage 
    // TODO: update patterns when modifying .gitignore
    this.patterns = patterns;

    // create file watcher
    var self = this;
    this.watcher = chokidar.watch(directory, {
      ignored: function(string) {
        var pattern;
        string = self.relpath(string); // remove directory from file path
        for (var i=0,n=patterns.length; i<n; i++) {
          pattern = patterns[i];
          if (pattern.test(string)) {
            return true;
          }
        }
      },
    });

    // initialize listeners
    this.init();
  });

  // instance variables

  // connection to other client/server
  this.socket = socket;

  // chokidar has finished inital sweep
  this.ready = false;

  // the directory we're watching
  this.directory = directory;

  // list of files to ignore
  this.ignore = {};

  // for tracking what files need to be merged
  this.changes = [];

  // carbon directory (with trailing slash)
  this.appdir = '.carbon/';
}

/** Setup. Should only be called once per instance. */
Carbon.prototype.init = function () {
  // for simplicity, we only track files (and reconstruct their directories when writing them)
  console.log(colors.yellow('Syncing ' + this.directory));

  // create carbon working directory
  mkdirp(this.abspath(this.appdir), function (err, made) {
    if (err) console.log('mkdirp err: ' + err);
  });

  this.watcher
    .on('add', file => {
      if (this.willSend(Request.methods.add_file, file)) {
        console.log(`File ${file} has been added`);
      }
    })
    .on('change', file => {
      if (!this.willSend(Request.methods.compare_file, file)) {
        return;
      }

      // if we've got a recent change to this file, we need to merge the changes
      var relfile = this.relpath(file);
      for (var i=0,n=this.changes.length; i<n; i++) {
        if (this.changes[i].data.filename == relfile) {      
          var request = this.changes[i];
          this.merge(request);
          this.changes.splice(i);
          break;
        }
      }
    })
    .on('unlink', file => {
      console.log(`File ${file} has been removed`);
    })
    .on('error', error => {
      console.log(colors.red(`chokidar error: ${error}`));
    })
    .on('ready', () => {
      console.log('Initial scan complete. Polling for changes...');
      this.ready = true;
    })
  ;

  var self = this;
  this.socket.on('data', function(data) {
    // we might have recieved multiple requests at once
    var delim = Request.delimeter;
    data.toString().trim(delim).split(delim).forEach(function(e) {
      var request = Request.parse(e);
      if (request) self.processRequest(request);
    });
  });
}

/** Executes a merge operation for the given request. */
Carbon.prototype.merge = function(request) {
  var filename = request.data.filename;
  var theirs = request.data.contents;
  console.log('merge file ' + request.data.filename);

  var self = this;
  fs.readFile(filename, function(err, mine) {
    if (err) console.log(colors.red('error reading mine'));
    fs.readFile(self.appdir + filename, function(err, base) {
      if (err) console.log(colors.red('error reading base'));

      var mergedContents = merge.threeWay(mine.toString(), base.toString(), theirs);
      fs.writeFile(filename, mergedContents, function(err) {
        if (err) console.log(colors.red('error writing merged file'));

        // flush changes
        fs.writeFile(self.appdir + filename, mergedContents);
      });
    });
  });
}

/** Returns true if we are sending a request, skipping files we've just modified. */
Carbon.prototype.willSend = function(method, file) {
  // skip ignored files we just modified
  var ignored = this.ignore[method];
  if (ignored) {
    var index = ignored.indexOf(file);
    if (index >= 0) {
      this.ignore[method].splice(index);
      return false;
    }
  }
  
  var self = this;
  var filename = self.relpath(file);
  fs.readFile(file, function (err, data) {
    if (err) {
      console.log('error: ' + err);
      return;
    }
    
    // send request
    var request = new Request(method, {
      filename: filename,
      contents: data.toString(),
    });
    self.socket.write(request.json());

    // create backup of the original file
    self.copyFile(filename, self.appdir + filename);
  });

  return true;
}

/** When we recieve a request, do the thing Julie. */
Carbon.prototype.processRequest = function(request) {
  console.log(colors.blue('Process Request: ' + request.method + ' ' + request.data.filename));
  var self = this;
  var data = request.data;

  if (request.method == Request.methods.add_file) {
    fs.stat(this.abspath(data.filename), function (err, stat) {
      if (!err && stat.isFile()) {
        return; // don't overwrite existing files
      }

      self.writeFile(data.filename, data.contents, function(err) {
        if (err) {
          //console.log(colors.red('processRequest error: ' + err));
          return;
        }
        console.log(colors.white(`File ${data.filename} written.`));
      });
      self.ignoreOnce(request.method, data.filename);
    })
  }
  else if (request.method == Request.methods.compare_file) {
    this.changes.push(request);
    // greedily write the file
    this.writeFile(data.filename, data.contents, function(err) {
      if (err) return;
      self.ignoreOnce(request.method, data.filename);
    });
  }
}

/** The method and file will be ignored once on the next file watch update. */
Carbon.prototype.ignoreOnce = function(method, file) {
  if (!this.ignore[method]) {
    this.ignore[method] = [];
  }
  this.ignore[method].push(this.abspath(file));
}

/** Stops watching the directory. */
Carbon.prototype.close = function() {
  this.watcher.close();
}

/** Copies a file from source to target filename. */
Carbon.prototype.copyFile = function(source, target, cb) {
  cb = cb || function() {};
  var cbCalled = false;

  var rd = fs.createReadStream(this.abspath(source));
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(this.abspath(target));
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

/** returns the absolute path for the relative file. */
Carbon.prototype.abspath = function(file) {
  return this.directory + '/' + file
}

/** returns the relative path for the absolute file path. opposite of abspath */
Carbon.prototype.relpath = function(file) {
  var dir = this.directory;
  return (file.indexOf(dir) == 0 ? file.substring(dir.length + 1) : file);
}

/** Writes the file (and any needed directories). */
Carbon.prototype.writeFile = function(relfile, contents, cb) {
  var file = this.abspath(relfile)
  mkdirp(path.dirname(file), function (err, made) {
    if (err) return cb(err);
    fs.writeFile(file, contents, cb);
  });
}

/** Resolves directory path. */
function resolvePath(str) {
  if (str.substr(0, 2) === '~/') {
    str = (process.env.HOME || process.env.HOMEPATH || process.env.HOMEDIR || process.cwd()) + str.substr(1);
  }
  if (str.endsWith('/')) str = str.slice(0, -1); // remove trailing slash
  return path.resolve(str);
}

module.exports = Carbon;

