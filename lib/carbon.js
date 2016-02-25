var chokidar = require('chokidar');
var gitignore = require('gitignore-parser');
var fs = require('fs');

// create ignore pattern from gitignore
var patterns = gitignore.parse(fs.readFileSync('.gitignore', 'utf8'));
patterns = patterns[0]; // positive matches
patterns.push('\.git');
patterns.push('^\.$');

var watcher = chokidar.watch('.', {
	ignored: patterns,
	//awaitWriteFinish: true
});

watcher
	.on('add', path => console.log(`File ${path} has been added`))
	.on('change', path => console.log(`File ${path} has been changed`))
	.on('unlink', path => console.log(`File ${path} has been removed`));

// More possible events:
watcher
	.on('addDir', path => console.log(`Directory ${path} has been added`))
	.on('unlinkDir', path => console.log(`Directory ${path} has been removed`))
	.on('error', error => console.log(`Watcher error: ${error}`))
	.on('ready', () => console.log('Initial scan complete. Ready for changes'))
	.on('raw', (event, path, details) => {
		//console.log('Raw event info:', event, path, details);
	});
