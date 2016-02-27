var chokidar = require('chokidar');
var gitignore = require('./gitignore-parser');
var fs = require('fs');
var Request = require('./request');

/**
  * Watches for file changes and sends the diff over over the network.
  */
var Carbon = function(socket, directory) {
	// TODO: use directory / figure out why chokidar doesn't work with directories other than '.' and the gitignore
	// create ignore pattern from gitignore
	var patterns = gitignore.parse(fs.readFileSync('.gitignore', 'utf8'));
	patterns = patterns[0]; // positive matches
	patterns.push('\.git');
	this.patterns = patterns; // TODO: update patterns when modifying .gitignore

	// instance variables
	this.socket = socket;
	this.ready = false;
	this.files = [];
	this.requests = [];

	// create file watcher
	this.watcher = chokidar.watch('.', {
		ignored: patterns,
	});

	this.init();
};

Carbon.prototype.init = function () {
	this.watcher
		.on('add', path => {
			console.log(`File ${path} has been added`);
			fs.readFile(path, function (err, data) {
				if (err) {
					console.log('error: ' + err);
				}
				// jibberish in iTerm
				//console.log(data.toString());
			});
		})
		.on('change', path => console.log(`File ${path} has been changed`))
		.on('unlink', path => console.log(`File ${path} has been removed`))
		.on('addDir', path => console.log(`Directory ${path} has been added`))
		.on('unlinkDir', path => console.log(`Directory ${path} has been removed`))
		.on('error', error => console.log(colors.red(`Watcher error: ${error}`)))
		.on('ready', () => {
			console.log('Initial scan complete. Ready for changes');
			console.log(this.patterns);
			this.ready = true;
		})
	;

	this.socket.on('data', function(data) {
		var request = Request.parse(data);
		if (!data) {
			console.log(colors.red('Invalid request: ' + data));
			return;
		}

		this.requests.push(request);
		this.processRequest(request);
	});
};

Carbon.prototype.processRequest(request) {
	if (request.method == Request.methods.compare_files) {
		request.data.files.forEach(function(e) {
			
		});
	}
};

module.exports = Carbon;

