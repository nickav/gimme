var chokidar = require('chokidar');
var gitignore = require('gitignore-parser');
var fs = require('fs');

/**
  * Watches for file changes and sends the diff over over the network.
  */
var Carbon = function(conn) {
	// create ignore pattern from gitignore
	var patterns = gitignore.parse(fs.readFileSync('.gitignore', 'utf8'));
	patterns = patterns[0]; // positive matches
	patterns.push('\.git');
	patterns.push('^\.$');
	this.patterns = patterns; // TODO: update patterns when modifying .gitignore

	// instance variables
	this.conn = conn;

	this.watcher = chokidar.watch('.', {
		ignored: patterns,
		//awaitWriteFinish: true
	});

	this.ready = false;

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
		.on('error', error => console.log(`Watcher error: ${error}`))
		.on('ready', () => {
			console.log('Initial scan complete. Ready for changes');
			this.ready = true;
		})
	;
};

module.exports = Carbon;

