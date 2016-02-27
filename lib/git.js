var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

// exec used for small output (under 200k), spawn should be used for large outputs (over 200k)

var cmd = 'git diff';
exec(cmd, function(error, stdout, stderr) {
	// command output is in stdout
});

function gitInDir(directory, cmd) {
	directory = directory || '.';
	// ensure directory ends with .git
	if (!directory.endsWith('.git')) {
		var end = (directory.endsWith('/') ? '.git' : '/.git');
		directory += end;
	}
	return "git --git-dir=" + directory + " " + cmd;
};

module.exports = {
	/** get files that are being tracked by git (relative to directory). */
	getTrackedFiles: function(directory, callback) {
		var cmd = gitInDir(directory, "ls-tree -r HEAD --name-only");
		exec(cmd, function(error, stdout, stderr) {
			if (error) {
				console.log('Error in getTrackedFiles: ' + stderr);
				return;
			}
			
			// split stdout by spaces
			var files = stdout.trim().split('\n');
			callback(files);
		});
	},
	// says whether or not the patch will fail
};
