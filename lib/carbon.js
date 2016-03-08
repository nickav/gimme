var chokidar = require('chokidar');
var gitignore = require('./gitignore-parser');
var fs = require('fs');
var colors = require('colors');
var path = require('path');
var mkdirp = require('mkdirp');
var jsdiff = require('diff');

var Request = require('./request');

/**
  * Watches for file changes and sends the diff over over the network.
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
    this.watcher = chokidar.watch(directory, {
      ignored: function(string) {
        var pattern;
        string = string.substring(directory.length + 1); // remove directory from file
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
  this.socket = socket;
  this.ready = false;
  this.files = [];
  this.requests = [];
  this.directory = directory;
  this.ignore = {}; // list of files to ignore
  this.changes = [];
};

Carbon.prototype.init = function () {
  // for simplicity, we only track files (and reconstruct their directories when writing them)
  console.log(colors.yellow('Syncing ' + this.directory));
  var self = this;
  this.watcher
    .on('add', file => {
      if (self.willSend(Request.methods.add_file, file)) {
        console.log(`File ${file} has been added`);
      }
    })
    .on('change', file => {
      if (!self.willSend(Request.methods.compare_file, file)) {
        return;
      }

      // if we've got a recent change to this file, we need to merge the changes
      var relfile = this.relpath(file);
      for (var i=0,n=this.changes.length; i<n; i++) {
        if (this.changes[i].data.filename == relfile) {      
          break;
        }
      }
      if (i<n) {
        var request = this.changes[i];
        this.changes.splice(i);
        // run diff
        console.log('merge needed on file ' + request.data.filename);
      }
    })
    .on('unlink', file => {
      console.log(`File ${file} has been removed`);
    })
    .on('error', error => {
      console.log(colors.red(`chokidar error: ${error}`));
    })
    .on('ready', () => {
      console.log('Initial scan complete. Ready for changes');
      this.ready = true;
    })
  ;

  this.socket.on('data', function(data) {
    // we might have recieved multiple requests at once
    var delim = Request.delimeter;
    data.toString().trim(delim).split(delim).forEach(function(e) {
      var request = Request.parse(e);
      if (request) self.processRequest(request);
    });
  });
};

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

    // create backup
    //self.copyFile(data.filename, '.carbon/' + data.filename);
  });

  return true;
}

Carbon.prototype.processRequest = function(request) {
  console.log(colors.blue('Process Request: ' + request.method + ' ' + request.data.filename));
  var self = this;
  var data = request.data;

  if (request.method == Request.methods.add_file) {
    fs.stat(this.abspath(data.filename), function (err, stat) {
      if (!err && stat.isFile()) return; // don't overwrite existing files

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
};

/** The method and file will be ignored once on the next file watch update. */
Carbon.prototype.ignoreOnce = function(method, file) {
  if (!this.ignore[method]) {
    this.ignore[method] = [];
  }
  this.ignore[method].push(this.abspath(file));
}

Carbon.prototype.copyFile = function(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(this.abspath(source));
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
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

