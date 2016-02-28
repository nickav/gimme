var chokidar = require('chokidar');
var gitignore = require('./gitignore-parser');
var fs = require('fs');
var colors = require('colors');
var getDirName = require('path').dirname;
var mkdirp = require('mkdirp');

var Request = require('./request');

/**
  * Watches for file changes and sends the diff over over the network.
  */
var Carbon = function(socket, directory) {
	if (directory.endsWith('/')) directory = directory.slice(0, -1); // remove trailing slash

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
};

Carbon.prototype.init = function () {
	// for simplicity, we only track files (and reconstruct their directories when writing them)
	var self = this;
var lock =false;
	this.watcher
		.on('add', path => {
			var filename = path.substring(self.directory.length + 1);
			console.log(`File ${path} has been added`);
			fs.readFile(path, function (err, data) {
				if (err) {
					console.log('error: ' + err);
				}
				var request = Request.create(Request.methods.compare_files, data.toString());
				self.socket.write(request.json());
				//writeFile(self.directory + '/.carbon/' + filename, request.data);
				
			});
		})
		.on('change', path => {
			console.log(`File ${path} has been changed`);
		})
		.on('unlink', path => {
			console.log(`File ${path} has been removed`);
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
		data.toString().trim().split(Request.delimeter).forEach(function(e) {
			var request	= Request.parse(e);
			if (request) self.processRequest(request);
		});
	});
};

Carbon.prototype.processRequest = function(request) {
	console.log("hello");
	if (request.method == Request.methods.compare_files) {
		console.log(colors.white('processRequest: ' + request.data));
	}
};

/** Writes the file (and directories) if the file doesn't exist. */
function writeFile(path, contents, cb) {
  mkdirp(getDirName(path), function (err) {
    if (err) return cb(err);

    fs.writeFile(path, contents, cb);
  });
}

module.exports = Carbon;

