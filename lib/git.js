var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

// exec used for small output (under 200k), spawn should be used for large outputs (over 200k)

var cmd = 'git diff';
exec(cmd, function(error, stdout, stderr) {
	// command output is in stdout
});
