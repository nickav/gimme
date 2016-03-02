var chokidar = require('chokidar');
var gitignore = require('./gitignore-parser');
var fs = require('fs');
var colors = require('colors');
var path = require('path');
var mkdirp = require('mkdirp');

var Request = require('./request');

/**
  * Watches for file changes and sends the diff over over the network.
  */
var Carbon = function(socket, directory) {
	directory = resolvePath(directory);
	console.log(directory);

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
	this.ignoreOnce = []; // list of files to ignore
};

Carbon.prototype.init = function () {
	// for simplicity, we only track files (and reconstruct their directories when writing them)
	var self = this;
	this.watcher
		.on('add', file => {
			// temporarily ignore added files recieved over add_file
			var index = this.ignoreOnce.indexOf(file);
			if (index >= 0) {
				this.ignoreOnce.splice(index);
				return;
			}

			var filename = file.substring(self.directory.length + 1);
			console.log(`File ${file} has been added`);
			fs.readFile(file, function (err, data) {
				if (err) {
					console.log('error: ' + err);
					return;
				}
				
				// send request
				var request = new Request(Request.methods.add_file, {
					filename: filename,
					contents: data.toString(),
				});
				self.socket.write(request.json());
			});
		})
		.on('change', file => {
			console.log(`File ${file} has been changed`);
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
			var request	= Request.parse(e);
			if (request) self.processRequest(request);
		});
	});
};

Carbon.prototype.processRequest = function(request) {
	console.log(this.directory);
	console.log(colors.blue('Carbon Process Request: ' + request.method + ' ' + request.data.filename));
	if (request.method == Request.methods.add_file) {
		var data = request.data;
		//var stat = fs.stat(this.directory + '/' + data.file);
		//console.log(stat);
		//return;
		this.writeFile(data.filename, data.contents, function(err) {
			if (err) {
				console.log(colors.red(err));
				return;
			}
			console.log(colors.white(`File ${data.filename} written.`));
		});
	}
};

/** Writes the file (and any needed directories). */
Carbon.prototype.writeFile = function(file, contents, cb) {
	file = this.directory + '/' + file; // set path to the current directory
	this.ignoreOnce.push(file);
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

